package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Serve static files from the dist/public directory
	staticDir := "dist/public"
	if _, err := os.Stat(staticDir); os.IsNotExist(err) {
		// Fallback to current directory if dist/public doesn't exist
		staticDir = "."
	}

	// Create file server
	fs := http.FileServer(http.Dir(staticDir))
	
	// Handle all routes with SPA fallback
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Serve API requests to backend if they exist
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.Error(w, "API endpoint not available in Go server mode", http.StatusNotImplemented)
			return
		}

		// Check if file exists
		path := filepath.Join(staticDir, r.URL.Path)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			// File doesn't exist, serve index.html for SPA routing
			indexPath := filepath.Join(staticDir, "index.html")
			if _, err := os.Stat(indexPath); err == nil {
				http.ServeFile(w, r, indexPath)
				return
			}
		}

		// Serve the file
		fs.ServeHTTP(w, r)
	})

	// Health check endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Fanz Operating System Go Server - OK")
	})

	fmt.Printf("🚀 Fanz Operating System Go Server starting on port %s\n", port)
	fmt.Printf("📁 Serving files from: %s\n", staticDir)
	fmt.Printf("🌐 Server URL: http://localhost:%s\n", port)
	
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}