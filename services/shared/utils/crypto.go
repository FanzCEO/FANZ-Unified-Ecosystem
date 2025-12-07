package utils

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/hmac"
    "crypto/rand"
    "crypto/sha256"
    "crypto/subtle"
    "encoding/base64"
    "encoding/hex"
    "errors"
    "io"

    "golang.org/x/crypto/bcrypt"
    "golang.org/x/crypto/scrypt"
)

var (
    ErrInvalidCiphertext = errors.New("invalid ciphertext")
    ErrInvalidKey        = errors.New("invalid key")
    ErrInvalidMAC        = errors.New("invalid MAC")
)

// Password hashing using bcrypt
func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    return string(bytes), err
}

func CheckPassword(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}

// AES-256-GCM encryption
type AESEncryption struct {
    key []byte
}

func NewAESEncryption(key string) (*AESEncryption, error) {
    keyBytes := []byte(key)
    if len(keyBytes) != 32 {
        // Derive a 32-byte key using scrypt
        derivedKey, err := scrypt.Key(keyBytes, []byte("fanzos-salt"), 32768, 8, 1, 32)
        if err != nil {
            return nil, err
        }
        keyBytes = derivedKey
    }
    
    return &AESEncryption{key: keyBytes}, nil
}

func (a *AESEncryption) Encrypt(plaintext string) (string, error) {
    block, err := aes.NewCipher(a.key)
    if err != nil {
        return "", err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }

    nonce := make([]byte, gcm.NonceSize())
    if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
        return "", err
    }

    ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
    return base64.URLEncoding.EncodeToString(ciphertext), nil
}

func (a *AESEncryption) Decrypt(ciphertext string) (string, error) {
    data, err := base64.URLEncoding.DecodeString(ciphertext)
    if err != nil {
        return "", err
    }

    block, err := aes.NewCipher(a.key)
    if err != nil {
        return "", err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }

    nonceSize := gcm.NonceSize()
    if len(data) < nonceSize {
        return "", ErrInvalidCiphertext
    }

    nonce, ciphertextBytes := data[:nonceSize], data[nonceSize:]
    plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
    if err != nil {
        return "", err
    }

    return string(plaintext), nil
}

// HMAC-SHA256 for message authentication
type HMACAuth struct {
    key []byte
}

func NewHMACAuth(key string) *HMACAuth {
    return &HMACAuth{key: []byte(key)}
}

func (h *HMACAuth) Sign(message string) string {
    mac := hmac.New(sha256.New, h.key)
    mac.Write([]byte(message))
    return hex.EncodeToString(mac.Sum(nil))
}

func (h *HMACAuth) Verify(message, signature string) bool {
    expectedSignature := h.Sign(message)
    return subtle.ConstantTimeCompare([]byte(signature), []byte(expectedSignature)) == 1
}

// Secure random string generation
func GenerateRandomString(length int) (string, error) {
    bytes := make([]byte, length)
    if _, err := rand.Read(bytes); err != nil {
        return "", err
    }
    return base64.URLEncoding.EncodeToString(bytes)[:length], nil
}

func GenerateRandomHex(length int) (string, error) {
    bytes := make([]byte, length/2)
    if _, err := rand.Read(bytes); err != nil {
        return "", err
    }
    return hex.EncodeToString(bytes), nil
}

// Generate API keys
func GenerateAPIKey() (string, error) {
    return GenerateRandomHex(64)
}

// Generate session tokens
func GenerateSessionToken() (string, error) {
    return GenerateRandomString(64)
}

// Generate verification codes
func GenerateVerificationCode(length int) (string, error) {
    const charset = "0123456789"
    bytes := make([]byte, length)
    if _, err := rand.Read(bytes); err != nil {
        return "", err
    }
    
    for i, b := range bytes {
        bytes[i] = charset[b%byte(len(charset))]
    }
    return string(bytes), nil
}

// Secure file encryption for uploaded content
type FileEncryption struct {
    aes  *AESEncryption
    hmac *HMACAuth
}

func NewFileEncryption(encryptionKey, hmacKey string) (*FileEncryption, error) {
    aesEnc, err := NewAESEncryption(encryptionKey)
    if err != nil {
        return nil, err
    }
    
    hmacAuth := NewHMACAuth(hmacKey)
    
    return &FileEncryption{
        aes:  aesEnc,
        hmac: hmacAuth,
    }, nil
}

func (f *FileEncryption) EncryptFile(data []byte) ([]byte, error) {
    // Encrypt the data
    encryptedData, err := f.aes.Encrypt(string(data))
    if err != nil {
        return nil, err
    }
    
    // Generate HMAC
    signature := f.hmac.Sign(encryptedData)
    
    // Combine encrypted data and signature
    result := []byte(encryptedData + "." + signature)
    return result, nil
}

func (f *FileEncryption) DecryptFile(data []byte) ([]byte, error) {
    // Split encrypted data and signature
    parts := string(data)
    lastDot := len(parts) - 65 // 64 chars for signature + 1 for dot
    if lastDot < 0 {
        return nil, ErrInvalidCiphertext
    }
    
    encryptedData := parts[:lastDot]
    signature := parts[lastDot+1:]
    
    // Verify HMAC
    if !f.hmac.Verify(encryptedData, signature) {
        return nil, ErrInvalidMAC
    }
    
    // Decrypt the data
    decryptedData, err := f.aes.Decrypt(encryptedData)
    if err != nil {
        return nil, err
    }
    
    return []byte(decryptedData), nil
}

// PII encryption for sensitive user data
type PIIEncryption struct {
    encryption *AESEncryption
}

func NewPIIEncryption(key string) (*PIIEncryption, error) {
    aesEnc, err := NewAESEncryption(key)
    if err != nil {
        return nil, err
    }
    
    return &PIIEncryption{encryption: aesEnc}, nil
}

func (p *PIIEncryption) EncryptPII(data string) (string, error) {
    if data == "" {
        return "", nil
    }
    return p.encryption.Encrypt(data)
}

func (p *PIIEncryption) DecryptPII(encryptedData string) (string, error) {
    if encryptedData == "" {
        return "", nil
    }
    return p.encryption.Decrypt(encryptedData)
}

// Hash-based message authentication for webhooks
func GenerateWebhookSignature(payload []byte, secret string) string {
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(payload)
    return hex.EncodeToString(mac.Sum(nil))
}

func VerifyWebhookSignature(payload []byte, signature, secret string) bool {
    expectedSignature := GenerateWebhookSignature(payload, secret)
    return subtle.ConstantTimeCompare([]byte(signature), []byte(expectedSignature)) == 1
}

// Content fingerprinting for duplicate detection
func GenerateContentFingerprint(content []byte) string {
    hash := sha256.Sum256(content)
    return hex.EncodeToString(hash[:])
}

// Password strength validation
type PasswordStrength int

const (
    Weak PasswordStrength = iota
    Fair
    Good
    Strong
    VeryStrong
)

func (ps PasswordStrength) String() string {
    switch ps {
    case Weak:
        return "weak"
    case Fair:
        return "fair"
    case Good:
        return "good"
    case Strong:
        return "strong"
    case VeryStrong:
        return "very_strong"
    default:
        return "unknown"
    }
}

func CheckPasswordStrength(password string) PasswordStrength {
    score := 0
    
    // Length check
    if len(password) >= 8 {
        score++
    }
    if len(password) >= 12 {
        score++
    }
    
    // Character type checks
    hasLower := false
    hasUpper := false
    hasDigit := false
    hasSpecial := false
    
    for _, char := range password {
        switch {
        case char >= 'a' && char <= 'z':
            hasLower = true
        case char >= 'A' && char <= 'Z':
            hasUpper = true
        case char >= '0' && char <= '9':
            hasDigit = true
        default:
            hasSpecial = true
        }
    }
    
    if hasLower {
        score++
    }
    if hasUpper {
        score++
    }
    if hasDigit {
        score++
    }
    if hasSpecial {
        score++
    }
    
    // Return strength based on score
    switch {
    case score <= 2:
        return Weak
    case score == 3:
        return Fair
    case score == 4:
        return Good
    case score == 5:
        return Strong
    default:
        return VeryStrong
    }
}

// Secure comparison for preventing timing attacks
func SecureCompare(a, b string) bool {
    return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}

// Key derivation for different purposes
func DeriveKey(masterKey, salt, info string, length int) ([]byte, error) {
    return scrypt.Key([]byte(masterKey), []byte(salt+info), 32768, 8, 1, length)
}

// Generate encryption keys for different services
func GenerateServiceKeys(masterKey string) map[string]string {
    keys := make(map[string]string)
    
    services := []string{
        "user_pii",
        "payment_data",
        "content_encryption",
        "message_encryption",
        "session_encryption",
    }
    
    for _, service := range services {
        derivedKey, err := DeriveKey(masterKey, "fanzos", service, 32)
        if err != nil {
            continue
        }
        keys[service] = hex.EncodeToString(derivedKey)
    }
    
    return keys
}

// Secure deletion of sensitive data in memory
func SecureWipe(data []byte) {
    for i := range data {
        data[i] = 0
    }
}

func SecureWipeString(s *string) {
    if s != nil {
        b := []byte(*s)
        SecureWipe(b)
        *s = ""
    }
}
