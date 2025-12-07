package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/fanzos/shared/config"
    "github.com/fanzos/shared/database"
    "github.com/fanzos/shared/auth"
    "github.com/fanzos/shared/middleware"
    "github.com/fanzos/payment-service/handlers"
    "github.com/fanzos/payment-service/processors"
)

func main() {
    // Load configuration
    cfg := config.Load()
    
    // Set Gin mode
    if cfg.Environment == "production" {
        gin.SetMode(gin.ReleaseMode)
    }

    // Initialize database connections
    db, err := database.Initialize(cfg.DatabaseURL, cfg.RedisURL)
    if err != nil {
        log.Fatalf("Failed to initialize database: %v", err)
    }
    defer db.Close()

    // Initialize payment processors
    stripeProcessor := processors.NewStripeProcessor(cfg)
    ccbillProcessor := processors.NewCCBillProcessor(cfg)

    // Initialize JWT manager
    jwtManager := auth.NewJWTManager(cfg.JWTSecret, "fanzos-payment-service")

    // Initialize handlers
    paymentsHandler := handlers.NewPaymentsHandler(db, cfg, stripeProcessor, ccbillProcessor)
    subscriptionsHandler := handlers.NewSubscriptionsHandler(db, cfg, stripeProcessor, ccbillProcessor)

    // Initialize middleware
    authMiddleware := middleware.NewAuthMiddleware(jwtManager)

    // Create Gin router
    router := gin.New()
    router.Use(gin.Logger())
    router.Use(gin.Recovery())
    router.Use(middleware.RequestID())
    router.Use(middleware.SecurityHeaders())

    // Health check
    router.GET("/health", func(c *gin.Context) {
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()
        
        if err := db.HealthCheck(ctx); err != nil {
            c.JSON(http.StatusServiceUnavailable, gin.H{
                "status": "unhealthy",
                "service": "payment-service",
                "error": err.Error(),
            })
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "status": "healthy",
            "service": "payment-service",
            "timestamp": time.Now().UTC(),
        })
    })

    // Payment methods
    paymentMethods := router.Group("/methods")
    paymentMethods.Use(authMiddleware.RequireAuth())
    {
        paymentMethods.GET("", paymentsHandler.GetPaymentMethods)
        paymentMethods.POST("", paymentsHandler.AddPaymentMethod)
        paymentMethods.PUT("/:id", paymentsHandler.UpdatePaymentMethod)
        paymentMethods.DELETE("/:id", paymentsHandler.DeletePaymentMethod)
        paymentMethods.POST("/:id/verify", paymentsHandler.VerifyPaymentMethod)
        paymentMethods.POST("/:id/set-default", paymentsHandler.SetDefaultPaymentMethod)
    }

    // Subscriptions
    subscriptions := router.Group("/subscriptions")
    subscriptions.Use(authMiddleware.RequireAuth())
    {
        subscriptions.GET("", subscriptionsHandler.GetSubscriptions)
        subscriptions.POST("/create/:creatorId", subscriptionsHandler.CreateSubscription)
        subscriptions.GET("/:id", subscriptionsHandler.GetSubscription)
        subscriptions.PUT("/:id", subscriptionsHandler.UpdateSubscription)
        subscriptions.DELETE("/:id", subscriptionsHandler.CancelSubscription)
        subscriptions.POST("/:id/reactivate", subscriptionsHandler.ReactivateSubscription)
        subscriptions.GET("/:id/status", subscriptionsHandler.GetSubscriptionStatus)
    }

    // Transactions
    transactions := router.Group("/transactions")
    transactions.Use(authMiddleware.RequireAuth())
    {
        transactions.GET("", paymentsHandler.GetTransactions)
        transactions.GET("/:id", paymentsHandler.GetTransaction)
        transactions.POST("/tip", paymentsHandler.SendTip)
        transactions.POST("/purchase", paymentsHandler.PurchaseContent)
        transactions.POST("/wallet/deposit", paymentsHandler.DepositToWallet)
        transactions.POST("/refund/:id", paymentsHandler.RefundTransaction)
    }

    // Withdrawals (creators only)
    withdrawals := router.Group("/withdrawals")
    withdrawals.Use(authMiddleware.RequireAuth())
    withdrawals.Use(authMiddleware.RequireCreator())
    {
        withdrawals.GET("", paymentsHandler.GetWithdrawals)
        withdrawals.POST("", paymentsHandler.RequestWithdrawal)
        withdrawals.GET("/:id", paymentsHandler.GetWithdrawal)
        withdrawals.POST("/:id/cancel", paymentsHandler.CancelWithdrawal)
    }

    // Earnings (creators only)
    earnings := router.Group("/earnings")
    earnings.Use(authMiddleware.RequireAuth())
    earnings.Use(authMiddleware.RequireCreator())
    {
        earnings.GET("", paymentsHandler.GetEarnings)
        earnings.GET("/breakdown", paymentsHandler.GetEarningsBreakdown)
        earnings.GET("/analytics", paymentsHandler.GetEarningsAnalytics)
    }

    // Webhooks (public endpoints)
    webhooks := router.Group("/webhooks")
    {
        webhooks.POST("/stripe", paymentsHandler.StripeWebhook)
        webhooks.POST("/ccbill", paymentsHandler.CCBillWebhook)
        webhooks.POST("/nowpayments", paymentsHandler.NowPaymentsWebhook)
    }

    // Payment processor endpoints
    processors := router.Group("/processors")
    processors.Use(authMiddleware.RequireAuth())
    {
        processors.GET("/stripe/client-secret", paymentsHandler.GetStripeClientSecret)
        processors.POST("/stripe/confirm-payment", paymentsHandler.ConfirmStripePayment)
        processors.GET("/ccbill/form-url", paymentsHandler.GetCCBillFormURL)
        processors.GET("/nowpayments/currencies", paymentsHandler.GetCryptoCurrencies)
        processors.POST("/nowpayments/invoice", paymentsHandler.CreateCryptoInvoice)
    }

    // Create HTTP server
    server := &http.Server{
        Addr:    "0.0.0.0:8003",
        Handler: router,
        
        ReadTimeout:       30 * time.Second,
        WriteTimeout:      30 * time.Second,
        ReadHeaderTimeout: 10 * time.Second,
        IdleTimeout:       120 * time.Second,
        MaxHeaderBytes:    1 << 20,
    }

    // Start server
    go func() {
        log.Printf("Payment Service starting on port 8003")
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Failed to start server: %v", err)
        }
    }()

    // Graceful shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Shutting down Payment Service...")

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Fatalf("Server forced to shutdown: %v", err)
    }

    log.Println("Payment Service shut down complete")
}
