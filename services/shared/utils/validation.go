package utils

import (
    "errors"
    "fmt"
    "net/mail"
    "regexp"
    "strings"
    "time"
    "unicode"

    "github.com/go-playground/validator/v10"
)

var (
    // Common validation errors
    ErrInvalidEmail    = errors.New("invalid email address")
    ErrInvalidPhone    = errors.New("invalid phone number")
    ErrInvalidUsername = errors.New("invalid username")
    ErrInvalidURL      = errors.New("invalid URL")
    ErrUnderAge        = errors.New("user must be at least 18 years old")
    ErrWeakPassword    = errors.New("password does not meet security requirements")
)

// Validator instance
var validate *validator.Validate

func init() {
    validate = validator.New()
    
    // Register custom validators
    validate.RegisterValidation("username", ValidateUsername)
    validate.RegisterValidation("password", ValidatePassword)
    validate.RegisterValidation("adult_age", ValidateAdultAge)
    validate.RegisterValidation("phone", ValidatePhoneNumber)
    validate.RegisterValidation("slug", ValidateSlug)
    validate.RegisterValidation("hashtag", ValidateHashtag)
    validate.RegisterValidation("media_url", ValidateMediaURL)
    validate.RegisterValidation("price", ValidatePrice)
}

// Get validator instance
func GetValidator() *validator.Validate {
    return validate
}

// Email validation
func ValidateEmail(email string) error {
    if email == "" {
        return ErrInvalidEmail
    }
    
    _, err := mail.ParseAddress(email)
    if err != nil {
        return ErrInvalidEmail
    }
    
    // Additional checks for adult content platform
    domain := strings.ToLower(email[strings.LastIndex(email, "@")+1:])
    
    // Block common temporary email services
    blockedDomains := []string{
        "10minutemail.com",
        "tempmail.org",
        "guerrillamail.com",
        "mailinator.com",
        "yopmail.com",
    }
    
    for _, blocked := range blockedDomains {
        if domain == blocked {
            return errors.New("temporary email addresses are not allowed")
        }
    }
    
    return nil
}

// Username validation for Fanz OS
func ValidateUsername(fl validator.FieldLevel) bool {
    username := fl.Field().String()
    return IsValidUsername(username)
}

func IsValidUsername(username string) bool {
    if len(username) < 3 || len(username) > 50 {
        return false
    }
    
    // Must start with letter or underscore
    if !unicode.IsLetter(rune(username[0])) && username[0] != '_' {
        return false
    }
    
    // Can contain letters, numbers, underscores, hyphens
    validUsernameRegex := regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_-]*$`)
    if !validUsernameRegex.MatchString(username) {
        return false
    }
    
    // Block reserved usernames
    reserved := []string{
        "admin", "api", "www", "ftp", "mail", "email", "support", "help",
        "info", "root", "user", "test", "demo", "null", "undefined",
        "fanzos", "creator", "fan", "model", "moderator", "system",
    }
    
    for _, res := range reserved {
        if strings.EqualFold(username, res) {
            return false
        }
    }
    
    return true
}

// Password validation
func ValidatePassword(fl validator.FieldLevel) bool {
    password := fl.Field().String()
    return IsValidPassword(password)
}

func IsValidPassword(password string) bool {
    if len(password) < 8 {
        return false
    }
    
    if len(password) > 128 {
        return false
    }
    
    // Must contain at least one uppercase, lowercase, digit, and special character
    hasUpper := false
    hasLower := false
    hasDigit := false
    hasSpecial := false
    
    for _, char := range password {
        switch {
        case unicode.IsUpper(char):
            hasUpper = true
        case unicode.IsLower(char):
            hasLower = true
        case unicode.IsDigit(char):
            hasDigit = true
        case unicode.IsPunct(char) || unicode.IsSymbol(char):
            hasSpecial = true
        }
    }
    
    return hasUpper && hasLower && hasDigit && hasSpecial
}

// Age validation for adult content platform
func ValidateAdultAge(fl validator.FieldLevel) bool {
    birthDate := fl.Field().Interface().(time.Time)
    return IsAdultAge(birthDate)
}

func IsAdultAge(birthDate time.Time) bool {
    now := time.Now()
    age := now.Year() - birthDate.Year()
    
    // Adjust if birthday hasn't occurred this year
    if now.Month() < birthDate.Month() || 
       (now.Month() == birthDate.Month() && now.Day() < birthDate.Day()) {
        age--
    }
    
    return age >= 18
}

// Phone number validation
func ValidatePhoneNumber(fl validator.FieldLevel) bool {
    phone := fl.Field().String()
    return IsValidPhoneNumber(phone)
}

func IsValidPhoneNumber(phone string) bool {
    // Remove common formatting characters
    cleaned := regexp.MustCompile(`[^\d+]`).ReplaceAllString(phone, "")
    
    // Basic international phone number validation
    // Must start with + or digit, be 7-15 digits long
    phoneRegex := regexp.MustCompile(`^(\+?\d{7,15})$`)
    return phoneRegex.MatchString(cleaned)
}

// URL validation for media and profile links
func ValidateURL(url string) error {
    if url == "" {
        return nil // Allow empty URLs
    }
    
    // Basic URL pattern validation
    urlRegex := regexp.MustCompile(`^https?://[^\s/$.?#].[^\s]*$`)
    if !urlRegex.MatchString(url) {
        return ErrInvalidURL
    }
    
    // Block potentially malicious URLs
    lower := strings.ToLower(url)
    if strings.Contains(lower, "javascript:") ||
       strings.Contains(lower, "data:") ||
       strings.Contains(lower, "vbscript:") {
        return errors.New("potentially malicious URL")
    }
    
    return nil
}

// Slug validation for SEO-friendly URLs
func ValidateSlug(fl validator.FieldLevel) bool {
    slug := fl.Field().String()
    return IsValidSlug(slug)
}

func IsValidSlug(slug string) bool {
    if len(slug) == 0 || len(slug) > 100 {
        return false
    }
    
    slugRegex := regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
    return slugRegex.MatchString(slug)
}

// Hashtag validation
func ValidateHashtag(fl validator.FieldLevel) bool {
    hashtag := fl.Field().String()
    return IsValidHashtag(hashtag)
}

func IsValidHashtag(hashtag string) bool {
    if len(hashtag) < 1 || len(hashtag) > 100 {
        return false
    }
    
    // Remove # if present
    if hashtag[0] == '#' {
        hashtag = hashtag[1:]
    }
    
    // Can contain letters, numbers, underscores
    hashtagRegex := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
    return hashtagRegex.MatchString(hashtag)
}

// Media URL validation
func ValidateMediaURL(fl validator.FieldLevel) bool {
    url := fl.Field().String()
    return IsValidMediaURL(url)
}

func IsValidMediaURL(url string) bool {
    if err := ValidateURL(url); err != nil {
        return false
    }
    
    // Check for supported media extensions
    supportedExtensions := []string{
        ".jpg", ".jpeg", ".png", ".gif", ".webp",
        ".mp4", ".mov", ".avi", ".webm", ".m4v",
        ".mp3", ".wav", ".ogg", ".m4a",
    }
    
    lower := strings.ToLower(url)
    for _, ext := range supportedExtensions {
        if strings.Contains(lower, ext) {
            return true
        }
    }
    
    return false
}

// Price validation for PPV content
func ValidatePrice(fl validator.FieldLevel) bool {
    price := fl.Field().Float()
    return IsValidPrice(price)
}

func IsValidPrice(price float64) bool {
    return price >= 0 && price <= 10000 // Max $10,000
}

// Content validation
func ValidateContent(content string, maxLength int) error {
    if len(content) > maxLength {
        return fmt.Errorf("content exceeds maximum length of %d characters", maxLength)
    }
    
    // Check for prohibited content
    prohibited := []string{
        "underage", "minor", "child", "kid", "teen",
        "rape", "non-consensual", "forced",
    }
    
    lower := strings.ToLower(content)
    for _, term := range prohibited {
        if strings.Contains(lower, term) {
            return errors.New("content contains prohibited terms")
        }
    }
    
    return nil
}

// Bio validation
func ValidateBio(bio string) error {
    return ValidateContent(bio, 500)
}

// Post content validation
func ValidatePostContent(content string) error {
    return ValidateContent(content, 10000)
}

// Message validation
func ValidateMessage(message string) error {
    if message == "" {
        return errors.New("message cannot be empty")
    }
    return ValidateContent(message, 2000)
}

// Display name validation
func ValidateDisplayName(name string) error {
    if len(name) < 1 || len(name) > 100 {
        return errors.New("display name must be between 1 and 100 characters")
    }
    
    // Check for inappropriate characters
    for _, char := range name {
        if char < 32 || char == 127 { // Control characters
            return errors.New("display name contains invalid characters")
        }
    }
    
    return nil
}

// Validation helper for request structs
type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
    Value   interface{} `json:"value,omitempty"`
}

func ValidateStruct(s interface{}) []ValidationError {
    var errors []ValidationError
    
    err := validate.Struct(s)
    if err != nil {
        for _, err := range err.(validator.ValidationErrors) {
            var message string
            
            switch err.Tag() {
            case "required":
                message = "This field is required"
            case "email":
                message = "Invalid email address"
            case "min":
                message = fmt.Sprintf("Minimum length is %s", err.Param())
            case "max":
                message = fmt.Sprintf("Maximum length is %s", err.Param())
            case "username":
                message = "Invalid username format"
            case "password":
                message = "Password must be at least 8 characters with uppercase, lowercase, digit, and special character"
            case "adult_age":
                message = "Must be at least 18 years old"
            case "phone":
                message = "Invalid phone number"
            default:
                message = fmt.Sprintf("Validation failed for %s", err.Tag())
            }
            
            errors = append(errors, ValidationError{
                Field:   err.Field(),
                Message: message,
                Value:   err.Value(),
            })
        }
    }
    
    return errors
}

// File validation
func ValidateFileType(filename string, allowedTypes []string) error {
    if filename == "" {
        return errors.New("filename cannot be empty")
    }
    
    ext := strings.ToLower(filename[strings.LastIndex(filename, "."):])
    
    for _, allowed := range allowedTypes {
        if ext == strings.ToLower(allowed) {
            return nil
        }
    }
    
    return fmt.Errorf("file type %s is not allowed", ext)
}

func ValidateImageFile(filename string) error {
    allowedTypes := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
    return ValidateFileType(filename, allowedTypes)
}

func ValidateVideoFile(filename string) error {
    allowedTypes := []string{".mp4", ".mov", ".avi", ".webm", ".m4v"}
    return ValidateFileType(filename, allowedTypes)
}

func ValidateAudioFile(filename string) error {
    allowedTypes := []string{".mp3", ".wav", ".ogg", ".m4a"}
    return ValidateFileType(filename, allowedTypes)
}

// File size validation
func ValidateFileSize(size int64, maxSize int64) error {
    if size > maxSize {
        return fmt.Errorf("file size %d bytes exceeds maximum allowed size %d bytes", size, maxSize)
    }
    return nil
}

// Sanitization functions
func SanitizeUsername(username string) string {
    // Remove non-alphanumeric characters except underscore and hyphen
    reg := regexp.MustCompile(`[^a-zA-Z0-9_-]`)
    sanitized := reg.ReplaceAllString(username, "")
    
    // Ensure it starts with letter or underscore
    if len(sanitized) > 0 && !unicode.IsLetter(rune(sanitized[0])) && sanitized[0] != '_' {
        sanitized = "_" + sanitized
    }
    
    // Truncate if too long
    if len(sanitized) > 50 {
        sanitized = sanitized[:50]
    }
    
    return sanitized
}

func SanitizeDisplayName(name string) string {
    // Remove control characters and trim whitespace
    var result strings.Builder
    for _, char := range name {
        if char >= 32 && char != 127 {
            result.WriteRune(char)
        }
    }
    return strings.TrimSpace(result.String())
}

func SanitizeContent(content string) string {
    // Basic content sanitization - remove potentially harmful content
    content = strings.TrimSpace(content)
    
    // Remove excessive whitespace
    spaceRegex := regexp.MustCompile(`\s+`)
    content = spaceRegex.ReplaceAllString(content, " ")
    
    return content
}

// IP address validation
func ValidateIPAddress(ip string) bool {
    ipRegex := regexp.MustCompile(`^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$`)
    return ipRegex.MatchString(ip)
}

// Credit card validation (basic Luhn algorithm)
func ValidateCreditCard(number string) bool {
    // Remove spaces and hyphens
    number = regexp.MustCompile(`[\s-]`).ReplaceAllString(number, "")
    
    // Check if all digits
    if !regexp.MustCompile(`^\d+$`).MatchString(number) {
        return false
    }
    
    // Luhn algorithm
    sum := 0
    alternate := false
    
    for i := len(number) - 1; i >= 0; i-- {
        digit := int(number[i] - '0')
        
        if alternate {
            digit *= 2
            if digit > 9 {
                digit = digit%10 + digit/10
            }
        }
        
        sum += digit
        alternate = !alternate
    }
    
    return sum%10 == 0
}
