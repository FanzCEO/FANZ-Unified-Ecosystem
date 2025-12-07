package database

import (
    "context"
    "fmt"
    "log"
    "time"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
    "github.com/redis/go-redis/v9"
)

var (
    DB    *gorm.DB
    Redis *redis.Client
)

type Database struct {
    DB    *gorm.DB
    Redis *redis.Client
}

func Initialize(databaseURL, redisURL string) (*Database, error) {
    // Initialize PostgreSQL
    db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
        NowFunc: func() time.Time {
            return time.Now().UTC()
        },
    })
    if err != nil {
        return nil, fmt.Errorf("failed to connect to database: %w", err)
    }

    // Configure connection pool
    sqlDB, err := db.DB()
    if err != nil {
        return nil, fmt.Errorf("failed to get sql.DB: %w", err)
    }

    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)
    sqlDB.SetConnMaxLifetime(time.Hour)

    // Initialize Redis
    opt, err := redis.ParseURL(redisURL)
    if err != nil {
        return nil, fmt.Errorf("failed to parse redis URL: %w", err)
    }

    rdb := redis.NewClient(opt)
    
    // Test Redis connection with retry
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    var redisErr error
    for i := 0; i < 3; i++ {
        if redisErr = rdb.Ping(ctx).Err(); redisErr == nil {
            break
        }
        log.Printf("Redis connection attempt %d failed: %v", i+1, redisErr)
        time.Sleep(time.Second * 2)
    }
    
    if redisErr != nil {
        log.Printf("Warning: Redis is not available, some features may not work: %v", redisErr)
        // For development, allow the app to start without Redis
        rdb = nil
    }

    // Set global variables
    DB = db
    Redis = rdb

    log.Println("Database connections initialized successfully")
    
    return &Database{
        DB:    db,
        Redis: rdb,
    }, nil
}

func (d *Database) Close() error {
    if d.Redis != nil {
        if err := d.Redis.Close(); err != nil {
            log.Printf("Error closing Redis connection: %v", err)
        }
    }
    
    if d.DB != nil {
        sqlDB, err := d.DB.DB()
        if err != nil {
            return err
        }
        return sqlDB.Close()
    }
    
    return nil
}

// Health check function
func (d *Database) HealthCheck(ctx context.Context) error {
    // Check PostgreSQL
    sqlDB, err := d.DB.DB()
    if err != nil {
        return fmt.Errorf("failed to get sql.DB: %w", err)
    }
    
    if err := sqlDB.PingContext(ctx); err != nil {
        return fmt.Errorf("postgresql health check failed: %w", err)
    }
    
    // Check Redis
    if err := d.Redis.Ping(ctx).Err(); err != nil {
        return fmt.Errorf("redis health check failed: %w", err)
    }
    
    return nil
}

// Cache helpers
func SetCache(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
    return Redis.Set(ctx, key, value, expiration).Err()
}

func GetCache(ctx context.Context, key string) (string, error) {
    return Redis.Get(ctx, key).Result()
}

func DeleteCache(ctx context.Context, key string) error {
    return Redis.Del(ctx, key).Err()
}

func ExistsCache(ctx context.Context, key string) (bool, error) {
    count, err := Redis.Exists(ctx, key).Result()
    return count > 0, err
}
