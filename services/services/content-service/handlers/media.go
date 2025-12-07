package handlers

import (
    "fmt"
    "net/http"
    "path/filepath"
    "strconv"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"

    "github.com/fanzos/shared/config"
    "github.com/fanzos/shared/database"
    "github.com/fanzos/shared/middleware"
    "github.com/fanzos/shared/utils"
)

type MediaHandler struct {
    db     *database.Database
    config *config.Config
}

func NewMediaHandler(db *database.Database, cfg *config.Config) *MediaHandler {
    return &MediaHandler{
        db:     db,
        config: cfg,
    }
}

type MediaUploadResponse struct {
    MediaID     uuid.UUID `json:"media_id"`
    FileName    string    `json:"file_name"`
    FileSize    int64     `json:"file_size"`
    MimeType    string    `json:"mime_type"`
    MediaURL    string    `json:"media_url"`
    ThumbnailURL *string  `json:"thumbnail_url,omitempty"`
    Duration    *int      `json:"duration,omitempty"`
    Width       *int      `json:"width,omitempty"`
    Height      *int      `json:"height,omitempty"`
    Status      string    `json:"status"`
}

type ChunkedUploadSession struct {
    ID          uuid.UUID `json:"session_id"`
    FileName    string    `json:"file_name"`
    FileSize    int64     `json:"file_size"`
    ChunkSize   int       `json:"chunk_size"`
    TotalChunks int       `json:"total_chunks"`
    UploadedChunks []int  `json:"uploaded_chunks"`
    Status      string    `json:"status"`
    ExpiresAt   time.Time `json:"expires_at"`
}

func (h *MediaHandler) UploadMedia(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    file, header, err := c.Request.FormFile("file")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "No file uploaded",
            "code":  "NO_FILE_UPLOADED",
        })
        return
    }
    defer file.Close()

    mediaType := c.PostForm("media_type") // image, video, audio
    if mediaType == "" {
        mediaType = h.detectMediaType(header.Header.Get("Content-Type"))
    }

    // Validate file type
    if err := h.validateMediaFile(header.Filename, header.Header.Get("Content-Type"), mediaType); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "INVALID_FILE_TYPE",
        })
        return
    }

    // Validate file size based on media type
    maxSize := h.getMaxFileSize(mediaType)
    if err := utils.ValidateFileSize(header.Size, maxSize); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "FILE_TOO_LARGE",
        })
        return
    }

    // Generate unique filename
    fileExt := filepath.Ext(header.Filename)
    fileName := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), fileExt)
    
    // Upload to storage (S3 or similar)
    mediaURL, err := h.uploadToStorage(file, fileName, header.Header.Get("Content-Type"))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to upload file",
            "code":  "UPLOAD_ERROR",
        })
        return
    }

    // Process media (generate thumbnails, extract metadata, etc.)
    metadata, err := h.processMedia(mediaURL, mediaType)
    if err != nil {
        // Log error but don't fail the upload
        fmt.Printf("Media processing error: %v\n", err)
    }

    // Create media record
    mediaRecord := MediaUploadResponse{
        MediaID:  uuid.New(),
        FileName: header.Filename,
        FileSize: header.Size,
        MimeType: header.Header.Get("Content-Type"),
        MediaURL: mediaURL,
        Status:   "uploaded",
    }

    if metadata != nil {
        mediaRecord.ThumbnailURL = metadata.ThumbnailURL
        mediaRecord.Duration = metadata.Duration
        mediaRecord.Width = metadata.Width
        mediaRecord.Height = metadata.Height
    }

    // Store media record in database
    // TODO: Implement media table and storage
    
    // Log upload activity
    h.logMediaActivity(claims.UserID, "media_uploaded", map[string]interface{}{
        "media_id":   mediaRecord.MediaID,
        "file_name":  header.Filename,
        "file_size":  header.Size,
        "media_type": mediaType,
    })

    c.JSON(http.StatusCreated, gin.H{
        "message": "Media uploaded successfully",
        "media":   mediaRecord,
    })
}

func (h *MediaHandler) ChunkedUpload(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)

    // Get or create upload session
    sessionID := c.PostForm("session_id")
    chunkIndex, _ := strconv.Atoi(c.PostForm("chunk_index"))
    
    var session *ChunkedUploadSession
    var err error

    if sessionID == "" {
        // Create new session
        session, err = h.createUploadSession(c, claims.UserID)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": err.Error(),
                "code":  "SESSION_CREATION_ERROR",
            })
            return
        }
    } else {
        // Load existing session
        session, err = h.getUploadSession(sessionID)
        if err != nil {
            c.JSON(http.StatusNotFound, gin.H{
                "error": "Upload session not found or expired",
                "code":  "SESSION_NOT_FOUND",
            })
            return
        }
    }

    // Get chunk data
    chunk, _, err := c.Request.FormFile("chunk")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "No chunk uploaded",
            "code":  "NO_CHUNK_UPLOADED",
        })
        return
    }
    defer chunk.Close()

    // Upload chunk to temporary storage
    chunkPath := fmt.Sprintf("chunks/%s/chunk_%d", session.ID.String(), chunkIndex)
    if err := h.uploadChunkToStorage(chunk, chunkPath); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to upload chunk",
            "code":  "CHUNK_UPLOAD_ERROR",
        })
        return
    }

    // Update session
    session.UploadedChunks = append(session.UploadedChunks, chunkIndex)
    h.updateUploadSession(session)

    // Check if all chunks are uploaded
    if len(session.UploadedChunks) >= session.TotalChunks {
        session.Status = "ready_for_assembly"
        h.updateUploadSession(session)
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Chunk uploaded successfully",
        "session": session,
    })
}

func (h *MediaHandler) CompleteChunkedUpload(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    sessionID := c.PostForm("session_id")

    session, err := h.getUploadSession(sessionID)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Upload session not found",
            "code":  "SESSION_NOT_FOUND",
        })
        return
    }

    if session.Status != "ready_for_assembly" {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Upload not ready for assembly",
            "code":  "UPLOAD_NOT_READY",
            "missing_chunks": h.getMissingChunks(session),
        })
        return
    }

    // Assemble chunks into final file
    finalMediaURL, err := h.assembleChunks(session)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to assemble chunks",
            "code":  "ASSEMBLY_ERROR",
        })
        return
    }

    // Detect media type
    mediaType := h.detectMediaType(filepath.Ext(session.FileName))

    // Process assembled media
    metadata, err := h.processMedia(finalMediaURL, mediaType)
    if err != nil {
        fmt.Printf("Media processing error: %v\n", err)
    }

    // Create final media record
    mediaRecord := MediaUploadResponse{
        MediaID:  uuid.New(),
        FileName: session.FileName,
        FileSize: session.FileSize,
        MediaURL: finalMediaURL,
        Status:   "completed",
    }

    if metadata != nil {
        mediaRecord.ThumbnailURL = metadata.ThumbnailURL
        mediaRecord.Duration = metadata.Duration
        mediaRecord.Width = metadata.Width
        mediaRecord.Height = metadata.Height
    }

    // Clean up chunks and session
    h.cleanupUploadSession(session.ID.String())

    // Log completion
    h.logMediaActivity(claims.UserID, "chunked_upload_completed", map[string]interface{}{
        "media_id":    mediaRecord.MediaID,
        "file_name":   session.FileName,
        "file_size":   session.FileSize,
        "total_chunks": session.TotalChunks,
    })

    c.JSON(http.StatusOK, gin.H{
        "message": "Upload completed successfully",
        "media":   mediaRecord,
    })
}

func (h *MediaHandler) DeleteMedia(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    mediaID := c.Param("id")

    // TODO: Implement media deletion
    // 1. Verify user owns the media or has permission
    // 2. Remove from storage
    // 3. Update database records
    // 4. Clean up any associated thumbnails/processed files

    h.logMediaActivity(claims.UserID, "media_deleted", map[string]interface{}{
        "media_id": mediaID,
    })

    c.JSON(http.StatusOK, gin.H{
        "message": "Media deleted successfully",
    })
}

func (h *MediaHandler) GetPresignedURL(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    mediaID := c.Param("id")
    action := c.DefaultQuery("action", "download") // download, view, stream

    // TODO: Verify user has access to this media
    // TODO: Generate presigned URL for S3 or equivalent

    presignedURL := fmt.Sprintf("https://cdn.fanzos.com/media/%s?token=temp_token&action=%s", 
        mediaID, action)

    // Log access
    h.logMediaActivity(claims.UserID, "media_accessed", map[string]interface{}{
        "media_id": mediaID,
        "action":   action,
    })

    c.JSON(http.StatusOK, gin.H{
        "url":        presignedURL,
        "expires_at": time.Now().Add(24 * time.Hour),
        "action":     action,
    })
}

// Helper functions

func (h *MediaHandler) detectMediaType(contentTypeOrExt string) string {
    contentTypeOrExt = strings.ToLower(contentTypeOrExt)
    
    if strings.Contains(contentTypeOrExt, "image") || 
       strings.HasSuffix(contentTypeOrExt, ".jpg") || 
       strings.HasSuffix(contentTypeOrExt, ".jpeg") || 
       strings.HasSuffix(contentTypeOrExt, ".png") || 
       strings.HasSuffix(contentTypeOrExt, ".gif") || 
       strings.HasSuffix(contentTypeOrExt, ".webp") {
        return "image"
    }
    
    if strings.Contains(contentTypeOrExt, "video") || 
       strings.HasSuffix(contentTypeOrExt, ".mp4") || 
       strings.HasSuffix(contentTypeOrExt, ".mov") || 
       strings.HasSuffix(contentTypeOrExt, ".avi") || 
       strings.HasSuffix(contentTypeOrExt, ".webm") {
        return "video"
    }
    
    if strings.Contains(contentTypeOrExt, "audio") || 
       strings.HasSuffix(contentTypeOrExt, ".mp3") || 
       strings.HasSuffix(contentTypeOrExt, ".wav") || 
       strings.HasSuffix(contentTypeOrExt, ".ogg") {
        return "audio"
    }
    
    return "unknown"
}

func (h *MediaHandler) validateMediaFile(filename, contentType, mediaType string) error {
    switch mediaType {
    case "image":
        return utils.ValidateImageFile(filename)
    case "video":
        return utils.ValidateVideoFile(filename)
    case "audio":
        return utils.ValidateAudioFile(filename)
    default:
        return fmt.Errorf("unsupported media type: %s", mediaType)
    }
}

func (h *MediaHandler) getMaxFileSize(mediaType string) int64 {
    switch mediaType {
    case "image":
        return 10 * 1024 * 1024 // 10MB
    case "video":
        return 500 * 1024 * 1024 // 500MB
    case "audio":
        return 50 * 1024 * 1024 // 50MB
    default:
        return 5 * 1024 * 1024 // 5MB
    }
}

func (h *MediaHandler) uploadToStorage(file interface{}, filename, contentType string) (string, error) {
    // TODO: Implement actual S3 or similar storage upload
    // This is a placeholder implementation
    
    mediaURL := fmt.Sprintf("https://cdn.fanzos.com/media/%s", filename)
    
    // Simulate upload process
    time.Sleep(100 * time.Millisecond)
    
    return mediaURL, nil
}

type MediaMetadata struct {
    ThumbnailURL *string `json:"thumbnail_url"`
    Duration     *int    `json:"duration"`
    Width        *int    `json:"width"`
    Height       *int    `json:"height"`
}

func (h *MediaHandler) processMedia(mediaURL, mediaType string) (*MediaMetadata, error) {
    // TODO: Implement actual media processing using FFmpeg or similar
    // This should:
    // 1. Generate thumbnails for videos and images
    // 2. Extract metadata (duration, dimensions, etc.)
    // 3. Create different quality versions
    // 4. Apply watermarks if configured
    
    metadata := &MediaMetadata{}
    
    switch mediaType {
    case "image":
        // Extract image dimensions
        width := 1920
        height := 1080
        metadata.Width = &width
        metadata.Height = &height
        
    case "video":
        // Extract video metadata and generate thumbnail
        width := 1920
        height := 1080
        duration := 120 // seconds
        thumbnailURL := strings.Replace(mediaURL, filepath.Ext(mediaURL), "_thumb.jpg", 1)
        
        metadata.Width = &width
        metadata.Height = &height
        metadata.Duration = &duration
        metadata.ThumbnailURL = &thumbnailURL
        
    case "audio":
        // Extract audio duration
        duration := 180 // seconds
        metadata.Duration = &duration
    }
    
    return metadata, nil
}

func (h *MediaHandler) createUploadSession(c *gin.Context, userID uuid.UUID) (*ChunkedUploadSession, error) {
    fileName := c.PostForm("file_name")
    fileSize, _ := strconv.ParseInt(c.PostForm("file_size"), 10, 64)
    chunkSize, _ := strconv.Atoi(c.DefaultQuery("chunk_size", "1048576")) // 1MB default
    
    if fileName == "" || fileSize == 0 {
        return nil, fmt.Errorf("file_name and file_size are required")
    }
    
    totalChunks := int((fileSize + int64(chunkSize) - 1) / int64(chunkSize))
    
    session := &ChunkedUploadSession{
        ID:             uuid.New(),
        FileName:       fileName,
        FileSize:       fileSize,
        ChunkSize:      chunkSize,
        TotalChunks:    totalChunks,
        UploadedChunks: make([]int, 0),
        Status:         "active",
        ExpiresAt:      time.Now().Add(24 * time.Hour),
    }
    
    // Store session in Redis or database
    h.storeUploadSession(session)
    
    return session, nil
}

func (h *MediaHandler) getUploadSession(sessionID string) (*ChunkedUploadSession, error) {
    // TODO: Retrieve session from Redis or database
    // This is a placeholder implementation
    
    sessionUUID, err := uuid.Parse(sessionID)
    if err != nil {
        return nil, err
    }
    
    session := &ChunkedUploadSession{
        ID:             sessionUUID,
        Status:         "active",
        UploadedChunks: make([]int, 0),
    }
    
    return session, nil
}

func (h *MediaHandler) storeUploadSession(session *ChunkedUploadSession) {
    // TODO: Store session in Redis with expiration
    // key: upload_session:{session_id}
    // value: JSON serialized session
    // expiration: session.ExpiresAt
}

func (h *MediaHandler) updateUploadSession(session *ChunkedUploadSession) {
    // TODO: Update session in storage
    h.storeUploadSession(session)
}

func (h *MediaHandler) uploadChunkToStorage(chunk interface{}, chunkPath string) error {
    // TODO: Upload chunk to temporary storage
    // This could be S3, local filesystem, or other storage
    return nil
}

func (h *MediaHandler) getMissingChunks(session *ChunkedUploadSession) []int {
    uploaded := make(map[int]bool)
    for _, chunk := range session.UploadedChunks {
        uploaded[chunk] = true
    }
    
    missing := make([]int, 0)
    for i := 0; i < session.TotalChunks; i++ {
        if !uploaded[i] {
            missing = append(missing, i)
        }
    }
    
    return missing
}

func (h *MediaHandler) assembleChunks(session *ChunkedUploadSession) (string, error) {
    // TODO: Assemble all chunks into final file
    // 1. Read chunks in order
    // 2. Concatenate into final file
    // 3. Upload to permanent storage
    // 4. Return final URL
    
    finalURL := fmt.Sprintf("https://cdn.fanzos.com/media/%s_%s", 
        session.ID.String(), session.FileName)
    
    return finalURL, nil
}

func (h *MediaHandler) cleanupUploadSession(sessionID string) {
    // TODO: Clean up temporary chunks and session data
    // 1. Delete chunk files from temporary storage
    // 2. Remove session from Redis/database
}

func (h *MediaHandler) logMediaActivity(userID uuid.UUID, action string, metadata map[string]interface{}) {
    // TODO: Log media activity to audit log
    fmt.Printf("Media activity - User: %s, Action: %s, Metadata: %+v\n", 
        userID.String(), action, metadata)
}
