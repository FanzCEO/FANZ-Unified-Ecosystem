package handlers

import (
    "bufio"
    "net/http"
    "os"
    "path/filepath"
    "regexp"
    "strconv"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
)

type TodoItem struct {
    ID        int    `json:"id"`
    Text      string `json:"text"`
    File      string `json:"file"`
    Line      int    `json:"line"`
    Service   string `json:"service"`
    Completed bool   `json:"completed"`
    Priority  string `json:"priority"`
    CreatedAt string `json:"createdAt"`
}

type TodoHandler struct {
    todos []TodoItem
}

func NewTodoHandler() *TodoHandler {
    return &TodoHandler{
        todos: []TodoItem{},
    }
}

// ScanTodos scans the codebase for TODO comments
func (h *TodoHandler) ScanTodos(c *gin.Context) {
    todos, err := h.ScanCodebaseForTodos()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan todos"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"todos": todos})
}

// ToggleTodo toggles the completion status of a TODO
func (h *TodoHandler) ToggleTodo(c *gin.Context) {
    _, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid todo ID"})
        return
    }

    // In a real implementation, this would update a database
    // For now, we'll just return success
    c.JSON(http.StatusOK, gin.H{"message": "Todo status toggled successfully"})
}

func (h *TodoHandler) ScanCodebaseForTodos() ([]TodoItem, error) {
    var todos []TodoItem
    id := 1

    // Define the root directory to scan (go back to services from current directory)
    servicesDir := "../../services"
    
    // Pattern to match TODO comments
    todoPattern := regexp.MustCompile(`(?i)//\s*TODO:?\s*(.+)`)

    err := filepath.Walk(servicesDir, func(path string, info os.FileInfo, err error) error {
        if err != nil {
            return nil // Continue scanning even if we can't access a file
        }

        // Only scan Go files
        if !strings.HasSuffix(info.Name(), ".go") {
            return nil
        }

        // Skip vendor directories
        if strings.Contains(path, "vendor/") {
            return nil
        }

        file, err := os.Open(path)
        if err != nil {
            return nil // Continue scanning
        }
        defer file.Close()

        scanner := bufio.NewScanner(file)
        lineNumber := 0

        for scanner.Scan() {
            lineNumber++
            line := scanner.Text()

            if matches := todoPattern.FindStringSubmatch(line); len(matches) > 1 {
                relativePath := strings.TrimPrefix(path, "../../")
                service := h.extractServiceName(relativePath)
                priority := h.determinePriority(matches[1])

                todo := TodoItem{
                    ID:        id,
                    Text:      strings.TrimSpace(matches[1]),
                    File:      relativePath,
                    Line:      lineNumber,
                    Service:   service,
                    Completed: false,
                    Priority:  priority,
                    CreatedAt: time.Now().AddDate(0, 0, -id).Format(time.RFC3339), // Mock creation date
                }

                todos = append(todos, todo)
                id++
            }
        }

        return nil
    })

    if err != nil {
        return nil, err
    }

    return todos, nil
}

func (h *TodoHandler) extractServiceName(filePath string) string {
    parts := strings.Split(filePath, "/")
    if len(parts) >= 2 && parts[0] == "services" {
        return parts[1]
    }
    return "unknown"
}

func (h *TodoHandler) determinePriority(todoText string) string {
    text := strings.ToLower(todoText)
    
    // High priority keywords
    if strings.Contains(text, "security") || 
       strings.Contains(text, "encryption") || 
       strings.Contains(text, "auth") ||
       strings.Contains(text, "payment") ||
       strings.Contains(text, "critical") ||
       strings.Contains(text, "urgent") {
        return "high"
    }
    
    // Medium priority keywords
    if strings.Contains(text, "implement") ||
       strings.Contains(text, "add") ||
       strings.Contains(text, "feature") ||
       strings.Contains(text, "email") ||
       strings.Contains(text, "notification") {
        return "medium"
    }
    
    // Default to low priority
    return "low"
}