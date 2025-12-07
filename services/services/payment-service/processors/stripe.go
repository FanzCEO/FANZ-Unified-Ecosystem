package processors

import (
    "fmt"
    "log"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/stripe/stripe-go/v76"
    "github.com/stripe/stripe-go/v76/customer"
    "github.com/stripe/stripe-go/v76/paymentintent"
    "github.com/stripe/stripe-go/v76/paymentmethod"
    "github.com/stripe/stripe-go/v76/price"
    "github.com/stripe/stripe-go/v76/refund"
    "github.com/stripe/stripe-go/v76/subscription"
    "github.com/stripe/stripe-go/v76/webhook"

    "github.com/fanzos/shared/config"
    "github.com/fanzos/shared/database"
    "github.com/fanzos/shared/models"
)

type StripeProcessor struct {
    config *config.Config
    db     *database.Database
}

func NewStripeProcessor(cfg *config.Config) *StripeProcessor {
    stripe.Key = cfg.StripeSecretKey
    return &StripeProcessor{
        config: cfg,
    }
}

func (s *StripeProcessor) AddPaymentMethod(userID uuid.UUID, token, paymentType string) (*models.PaymentMethod, error) {
    // Get or create Stripe customer
    customerID, err := s.getOrCreateCustomer(userID)
    if err != nil {
        return nil, fmt.Errorf("failed to get customer: %v", err)
    }

    // Attach payment method to customer
    params := &stripe.PaymentMethodAttachParams{
        Customer: stripe.String(customerID),
    }
    
    pm, err := paymentmethod.Attach(token, params)
    if err != nil {
        return nil, fmt.Errorf("failed to attach payment method: %v", err)
    }

    // Create payment method record
    paymentMethod := &models.PaymentMethod{
        UserID:      userID,
        Type:        paymentType,
        Processor:   "stripe",
        ProcessorID: &pm.ID,
        LastFour:    &pm.Card.Last4,
        Brand:       (*string)(&pm.Card.Brand),
        IsVerified:  true,
    }

    if pm.Card.ExpMonth != 0 && pm.Card.ExpYear != 0 {
        _ = fmt.Sprintf("%d-%02d-01", pm.Card.ExpYear, pm.Card.ExpMonth)
    }

    if err := database.DB.Create(paymentMethod).Error; err != nil {
        return nil, fmt.Errorf("failed to save payment method: %v", err)
    }

    return paymentMethod, nil
}

func (s *StripeProcessor) DeletePaymentMethod(processorID *string) error {
    if processorID == nil {
        return fmt.Errorf("processor ID is required")
    }

    _, err := paymentmethod.Detach(*processorID, nil)
    if err != nil {
        return fmt.Errorf("failed to detach payment method: %v", err)
    }

    return nil
}

func (s *StripeProcessor) VerifyPaymentMethod(processorID *string) error {
    if processorID == nil {
        return fmt.Errorf("processor ID is required")
    }

    // Stripe payment methods are automatically verified when added
    // Additional verification can be done through SetupIntents if needed
    return nil
}

func (s *StripeProcessor) CreatePaymentIntent(userID uuid.UUID, amount float64, currency string) (string, error) {
    // Get or create customer
    customerID, err := s.getOrCreateCustomer(userID)
    if err != nil {
        return "", fmt.Errorf("failed to get customer: %v", err)
    }

    // Convert amount to cents
    amountCents := int64(amount * 100)

    params := &stripe.PaymentIntentParams{
        Amount:   stripe.Int64(amountCents),
        Currency: stripe.String(currency),
        Customer: stripe.String(customerID),
        Metadata: map[string]string{
            "user_id": userID.String(),
        },
    }

    pi, err := paymentintent.New(params)
    if err != nil {
        return "", fmt.Errorf("failed to create payment intent: %v", err)
    }

    return pi.ClientSecret, nil
}

func (s *StripeProcessor) ConfirmPayment(userID uuid.UUID, paymentIntentID string) error {
    pi, err := paymentintent.Get(paymentIntentID, nil)
    if err != nil {
        return fmt.Errorf("failed to get payment intent: %v", err)
    }

    if pi.Status != stripe.PaymentIntentStatusSucceeded {
        return fmt.Errorf("payment not successful: %s", pi.Status)
    }

    // Payment is confirmed, handle success
    return nil
}

func (s *StripeProcessor) ProcessPayment(transaction *models.Transaction, paymentMethod *models.PaymentMethod) error {
    if paymentMethod.ProcessorID == nil {
        return fmt.Errorf("payment method processor ID is required")
    }

    // Get customer
    customerID, err := s.getOrCreateCustomer(transaction.UserID)
    if err != nil {
        return fmt.Errorf("failed to get customer: %v", err)
    }

    // Convert amount to cents
    amountCents := int64(transaction.Amount * 100)

    params := &stripe.PaymentIntentParams{
        Amount:        stripe.Int64(amountCents),
        Currency:      stripe.String(transaction.Currency),
        Customer:      stripe.String(customerID),
        PaymentMethod: paymentMethod.ProcessorID,
        Confirm:       stripe.Bool(true),
        Metadata: map[string]string{
            "transaction_id": transaction.ID.String(),
            "user_id":       transaction.UserID.String(),
        },
    }

    pi, err := paymentintent.New(params)
    if err != nil {
        return fmt.Errorf("failed to process payment: %v", err)
    }

    if pi.Status != stripe.PaymentIntentStatusSucceeded {
        return fmt.Errorf("payment failed: %s", pi.Status)
    }

    // Update transaction with Stripe payment intent ID
    transaction.ProcessorTransactionID = &pi.ID
    return nil
}

func (s *StripeProcessor) ProcessDeposit(userID uuid.UUID, amount float64, currency string, paymentMethod *models.PaymentMethod) (*models.Transaction, error) {
    // Create transaction record
    transaction := &models.Transaction{
        UserID:      userID,
        Type:        models.TransactionDeposit,
        Amount:      amount,
        Currency:    currency,
        Status:      "pending",
        Description: &[]string{"Wallet deposit"}[0],
        Processor:   &[]string{"stripe"}[0],
    }

    if err := database.DB.Create(transaction).Error; err != nil {
        return nil, fmt.Errorf("failed to create transaction: %v", err)
    }

    // Process payment
    if err := s.ProcessPayment(transaction, paymentMethod); err != nil {
        transaction.Status = "failed"
        database.DB.Save(transaction)
        return nil, err
    }

    // Update transaction and user wallet
    transaction.Status = "completed"
    database.DB.Save(transaction)

    // Add to user wallet
    var user models.User
    if err := database.DB.First(&user, userID).Error; err == nil {
        user.AddToWallet(amount)
        database.DB.Save(&user)
    }

    return transaction, nil
}

func (s *StripeProcessor) ProcessRefund(transaction *models.Transaction, reason string) error {
    if transaction.ProcessorTransactionID == nil {
        return fmt.Errorf("no processor transaction ID found")
    }

    // Convert amount to cents
    amountCents := int64(transaction.Amount * 100)

    params := &stripe.RefundParams{
        PaymentIntent: transaction.ProcessorTransactionID,
        Amount:        stripe.Int64(amountCents),
        Reason:        stripe.String("requested_by_customer"),
        Metadata: map[string]string{
            "transaction_id": transaction.ID.String(),
            "reason":        reason,
        },
    }

    _, err := refund.New(params)
    if err != nil {
        return fmt.Errorf("failed to process refund: %v", err)
    }

    // Update transaction status
    transaction.Status = "refunded"
    database.DB.Save(transaction)

    return nil
}

func (s *StripeProcessor) CreateSubscription(fanID, creatorID uuid.UUID, price float64, billingCycle string, paymentMethod *models.PaymentMethod) (string, error) {
    // Get or create customer
    customerID, err := s.getOrCreateCustomer(fanID)
    if err != nil {
        return "", fmt.Errorf("failed to get customer: %v", err)
    }

    // Create or get price object
    priceID, err := s.getOrCreatePrice(price, billingCycle)
    if err != nil {
        return "", fmt.Errorf("failed to get price: %v", err)
    }

    params := &stripe.SubscriptionParams{
        Customer: stripe.String(customerID),
        Items: []*stripe.SubscriptionItemsParams{
            {
                Price: stripe.String(priceID),
            },
        },
        DefaultPaymentMethod: paymentMethod.ProcessorID,
        Metadata: map[string]string{
            "fan_id":     fanID.String(),
            "creator_id": creatorID.String(),
        },
    }

    sub, err := subscription.New(params)
    if err != nil {
        return "", fmt.Errorf("failed to create subscription: %v", err)
    }

    return sub.ID, nil
}

func (s *StripeProcessor) UpdateSubscription(subscriptionID string, price *float64, billingCycle *string) error {
    if price == nil && billingCycle == nil {
        return nil // Nothing to update
    }

    sub, err := subscription.Get(subscriptionID, nil)
    if err != nil {
        return fmt.Errorf("failed to get subscription: %v", err)
    }

    if price != nil && billingCycle != nil {
        // Create new price and update subscription
        priceID, err := s.getOrCreatePrice(*price, *billingCycle)
        if err != nil {
            return fmt.Errorf("failed to get price: %v", err)
        }

        params := &stripe.SubscriptionParams{
            Items: []*stripe.SubscriptionItemsParams{
                {
                    ID:    stripe.String(sub.Items.Data[0].ID),
                    Price: stripe.String(priceID),
                },
            },
        }

        _, err = subscription.Update(subscriptionID, params)
        if err != nil {
            return fmt.Errorf("failed to update subscription: %v", err)
        }
    }

    return nil
}

func (s *StripeProcessor) CancelSubscription(subscriptionID string, cancelNow bool) error {
    var params *stripe.SubscriptionParams

    if cancelNow {
        params = &stripe.SubscriptionParams{
            CancelAt: stripe.Int64(0), // Cancel immediately
        }
    } else {
        params = &stripe.SubscriptionParams{
            CancelAtPeriodEnd: stripe.Bool(true),
        }
    }

    _, err := subscription.Update(subscriptionID, params)
    if err != nil {
        return fmt.Errorf("failed to cancel subscription: %v", err)
    }

    return nil
}

func (s *StripeProcessor) ReactivateSubscription(subscriptionID string) error {
    params := &stripe.SubscriptionParams{
        CancelAtPeriodEnd: stripe.Bool(false),
    }

    _, err := subscription.Update(subscriptionID, params)
    if err != nil {
        return fmt.Errorf("failed to reactivate subscription: %v", err)
    }

    return nil
}

func (s *StripeProcessor) HandleWebhook(c *gin.Context) {
    payload, err := c.GetRawData()
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
        return
    }

    sigHeader := c.GetHeader("Stripe-Signature")
    event, err := webhook.ConstructEvent(payload, sigHeader, s.config.StripeWebhookSecret)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature"})
        return
    }

    switch event.Type {
    case "payment_intent.succeeded":
        s.handlePaymentSucceeded(event.Data.Object)
    case "payment_intent.payment_failed":
        s.handlePaymentFailed(event.Data.Object)
    case "invoice.payment_succeeded":
        s.handleInvoicePaymentSucceeded(event.Data.Object)
    case "customer.subscription.updated":
        s.handleSubscriptionUpdated(event.Data.Object)
    case "customer.subscription.deleted":
        s.handleSubscriptionDeleted(event.Data.Object)
    default:
        log.Printf("Unhandled event type: %s", event.Type)
    }

    c.JSON(http.StatusOK, gin.H{"received": true})
}

// Helper functions

func (s *StripeProcessor) getOrCreateCustomer(userID uuid.UUID) (string, error) {
    // Check if customer already exists in our database
    var user models.User
    if err := database.DB.First(&user, userID).Error; err != nil {
        return "", fmt.Errorf("user not found: %v", err)
    }

    // Check if user has Stripe customer ID in metadata
    if customerID, exists := user.Settings["stripe_customer_id"]; exists {
        if strCustomerID, ok := customerID.(string); ok {
            return strCustomerID, nil
        }
    }

    // Create new Stripe customer
    params := &stripe.CustomerParams{
        Email: user.Email,
        Name:  user.DisplayName,
        Metadata: map[string]string{
            "user_id": userID.String(),
        },
    }

    customer, err := customer.New(params)
    if err != nil {
        return "", fmt.Errorf("failed to create customer: %v", err)
    }

    // Save customer ID to user settings
    if user.Settings == nil {
        user.Settings = make(map[string]interface{})
    }
    user.Settings["stripe_customer_id"] = customer.ID
    database.DB.Save(&user)

    return customer.ID, nil
}

func (s *StripeProcessor) getOrCreatePrice(amount float64, interval string) (string, error) {
    // Convert amount to cents
    unitAmount := int64(amount * 100)

    // Create price ID key for caching
    priceKey := fmt.Sprintf("price_%d_%s", unitAmount, interval)

    // In production, you might want to cache price IDs or store them in database
    // For now, create a new price each time
    params := &stripe.PriceParams{
        Currency:   stripe.String("usd"),
        UnitAmount: stripe.Int64(unitAmount),
        ProductData: &stripe.PriceProductDataParams{
            Name: stripe.String("Subscription"),
        },
        Recurring: &stripe.PriceRecurringParams{
            Interval: stripe.String(interval),
        },
        Metadata: map[string]string{
            "price_key": priceKey,
        },
    }

    price, err := price.New(params)
    if err != nil {
        return "", fmt.Errorf("failed to create price: %v", err)
    }

    return price.ID, nil
}

func (s *StripeProcessor) handlePaymentSucceeded(obj map[string]interface{}) {
    if paymentIntentID, ok := obj["id"].(string); ok {
        // Update transaction status
        var transaction models.Transaction
        if err := database.DB.Where("processor_transaction_id = ?", paymentIntentID).
            First(&transaction).Error; err == nil {
            transaction.Status = "completed"
            transaction.MarkAsProcessed()
            database.DB.Save(&transaction)
        }
    }
}

func (s *StripeProcessor) handlePaymentFailed(obj map[string]interface{}) {
    if paymentIntentID, ok := obj["id"].(string); ok {
        // Update transaction status
        var transaction models.Transaction
        if err := database.DB.Where("processor_transaction_id = ?", paymentIntentID).
            First(&transaction).Error; err == nil {
            transaction.Status = "failed"
            if lastError, exists := obj["last_payment_error"]; exists {
                transaction.Metadata["error"] = lastError
            }
            database.DB.Save(&transaction)
        }
    }
}

func (s *StripeProcessor) handleInvoicePaymentSucceeded(obj map[string]interface{}) {
    if subscriptionID, ok := obj["subscription"].(string); ok {
        // Handle subscription payment success
        var subscription models.Subscription
        if err := database.DB.Where("stripe_subscription_id = ?", subscriptionID).
            First(&subscription).Error; err == nil {
            // Extend subscription period, create transaction, etc.
            log.Printf("Subscription payment succeeded for subscription: %s", subscription.ID)
        }
    }
}

func (s *StripeProcessor) handleSubscriptionUpdated(obj map[string]interface{}) {
    if subscriptionID, ok := obj["id"].(string); ok {
        // Update subscription in database
        var subscription models.Subscription
        if err := database.DB.Where("stripe_subscription_id = ?", subscriptionID).
            First(&subscription).Error; err == nil {
            // Update subscription details from Stripe
            if status, exists := obj["status"].(string); exists {
                subscription.Status = status
                database.DB.Save(&subscription)
            }
        }
    }
}

func (s *StripeProcessor) handleSubscriptionDeleted(obj map[string]interface{}) {
    if subscriptionID, ok := obj["id"].(string); ok {
        // Mark subscription as cancelled
        var subscription models.Subscription
        if err := database.DB.Where("stripe_subscription_id = ?", subscriptionID).
            First(&subscription).Error; err == nil {
            subscription.Cancel()
            database.DB.Save(&subscription)
        }
    }
}
