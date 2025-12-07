package processors

import (
    "crypto/md5"
    "fmt"
    "net/http"
    "net/url"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"

    "github.com/fanzos/shared/config"
    "github.com/fanzos/shared/database"
    "github.com/fanzos/shared/models"
)

type CCBillProcessor struct {
    config *config.Config
    db     *database.Database
}

func NewCCBillProcessor(cfg *config.Config) *CCBillProcessor {
    return &CCBillProcessor{
        config: cfg,
    }
}

func (c *CCBillProcessor) AddPaymentMethod(userID uuid.UUID, details map[string]interface{}) (*models.PaymentMethod, error) {
    // CCBill doesn't store payment methods directly
    // This would typically involve creating a payment form or token
    paymentMethod := &models.PaymentMethod{
        UserID:      userID,
        Type:        "card",
        Processor:   "ccbill",
        IsVerified:  false, // Will be verified when first payment is made
    }

    if err := database.DB.Create(paymentMethod).Error; err != nil {
        return nil, fmt.Errorf("failed to save payment method: %v", err)
    }

    return paymentMethod, nil
}

func (c *CCBillProcessor) ProcessPayment(transaction *models.Transaction, paymentMethod *models.PaymentMethod) error {
    // CCBill payments are typically processed through their payment forms
    // This would involve redirecting to CCBill or using their API
    
    // For now, mark as pending - actual processing happens via webhooks
    transaction.Status = "pending"
    description := "CCBill payment processing"
    transaction.Description = &description
    
    return nil
}

func (c *CCBillProcessor) ProcessDeposit(userID uuid.UUID, amount float64, currency string) (*models.Transaction, error) {
    // Create transaction record
    transaction := &models.Transaction{
        UserID:      userID,
        Type:        models.TransactionDeposit,
        Amount:      amount,
        Currency:    currency,
        Status:      "pending",
        Description: &[]string{"CCBill wallet deposit"}[0],
        Processor:   &[]string{"ccbill"}[0],
    }

    if err := database.DB.Create(transaction).Error; err != nil {
        return nil, fmt.Errorf("failed to create transaction: %v", err)
    }

    return transaction, nil
}

func (c *CCBillProcessor) ProcessRefund(transaction *models.Transaction, reason string) error {
    // CCBill refunds need to be processed through their admin interface
    // or via their API - this is a placeholder
    return fmt.Errorf("CCBill refunds must be processed manually through CCBill admin")
}

func (c *CCBillProcessor) CreateSubscription(fanID, creatorID uuid.UUID, price float64, billingCycle string) (string, error) {
    // Generate a unique subscription ID for CCBill
    subscriptionID := fmt.Sprintf("sub_%s_%s", fanID.String()[:8], time.Now().Format("20060102150405"))
    
    // In a real implementation, you would create the subscription through CCBill's API
    // For now, return the generated ID
    return subscriptionID, nil
}

func (c *CCBillProcessor) UpdateSubscription(subscriptionID string, price *float64, billingCycle *string) error {
    // CCBill subscription updates would be handled through their API
    return nil
}

func (c *CCBillProcessor) CancelSubscription(subscriptionID string) error {
    // CCBill subscription cancellation through their API
    return nil
}

func (c *CCBillProcessor) GenerateFormURL(userID uuid.UUID, amount float64, productType string) (string, error) {
    baseURL := "https://bill.ccbill.com/jpost/signup.cgi"
    
    // CCBill form parameters
    params := url.Values{}
    params.Add("clientAccnum", c.config.CCBillClientAccnum)
    params.Add("clientSubacc", c.config.CCBillClientSubacc)
    params.Add("formName", "2") // Standard form
    params.Add("allowedTypes", "1,2,3") // Credit cards, debit cards, ACH
    
    // Product details
    if productType == "subscription" {
        params.Add("formPrice", fmt.Sprintf("%.2f", amount))
        params.Add("formPeriod", "30") // 30 days
        params.Add("formRecurringPrice", fmt.Sprintf("%.2f", amount))
        params.Add("formRecurringPeriod", "30")
    } else {
        params.Add("formPrice", fmt.Sprintf("%.2f", amount))
        params.Add("formPeriod", "2") // 2 days access
    }
    
    // User details
    params.Add("customer_fname", "Customer")
    params.Add("customer_lname", "Name")
    params.Add("email", "customer@example.com")
    
    // Return URLs
    params.Add("redirectUrl", "https://fanzos.com/payment/success")
    params.Add("cancelUrl", "https://fanzos.com/payment/cancel")
    
    // Custom variables
    params.Add("x_user_id", userID.String())
    params.Add("x_product_type", productType)
    
    // Generate form digest for security
    digest := c.generateFormDigest(params)
    params.Add("formDigest", digest)
    
    return baseURL + "?" + params.Encode(), nil
}

func (c *CCBillProcessor) HandleWebhook(ctx *gin.Context) {
    // Parse CCBill webhook data
    subscriptionId := ctx.PostForm("subscriptionId")
    accountingInitialPrice := ctx.PostForm("accountingInitialPrice")
    accountingRecurringPrice := ctx.PostForm("accountingRecurringPrice")
    _ = ctx.PostForm("timestamp")
    eventType := ctx.PostForm("eventType")
    
    // Custom variables
    userID := ctx.PostForm("X-user_id")
    productType := ctx.PostForm("X-product_type")
    
    // Verify webhook authenticity
    if !c.verifyWebhook(ctx) {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook signature"})
        return
    }
    
    switch eventType {
    case "NewSaleSuccess":
        c.handleNewSale(userID, subscriptionId, accountingInitialPrice, productType)
    case "RenewalSuccess":
        c.handleRenewalSuccess(subscriptionId, accountingRecurringPrice)
    case "Cancellation":
        c.handleCancellation(subscriptionId)
    case "Chargeback":
        c.handleChargeback(subscriptionId)
    case "Refund":
        c.handleRefund(subscriptionId)
    }
    
    ctx.JSON(http.StatusOK, gin.H{"status": "received"})
}

func (c *CCBillProcessor) generateFormDigest(params url.Values) string {
    // CCBill form digest generation
    // This is a simplified version - actual implementation depends on CCBill's requirements
    hashString := fmt.Sprintf("%s%s%s%s", 
        params.Get("formPrice"),
        params.Get("formPeriod"),
        c.config.CCBillUsername,
        "salt") // Replace with actual salt
    
    hash := md5.Sum([]byte(hashString))
    return fmt.Sprintf("%x", hash)
}

func (c *CCBillProcessor) verifyWebhook(ctx *gin.Context) bool {
    // Verify CCBill webhook using their verification method
    // This typically involves checking IP ranges or signatures
    
    // For now, always return true (implement proper verification in production)
    return true
}

func (c *CCBillProcessor) handleNewSale(userID, subscriptionID, price, productType string) {
    if userID == "" {
        return
    }
    
    userUUID, err := uuid.Parse(userID)
    if err != nil {
        return
    }
    
    amount, _ := strconv.ParseFloat(price, 64)
    
    // Create transaction record
    transaction := models.Transaction{
        UserID:                 userUUID,
        Type:                   models.TransactionSubscription,
        Amount:                 amount,
        Currency:               "USD",
        Status:                 "completed",
        Description:            &[]string{"CCBill payment"}[0],
        Processor:              &[]string{"ccbill"}[0],
        ProcessorTransactionID: &subscriptionID,
        Metadata: map[string]interface{}{
            "ccbill_subscription_id": subscriptionID,
            "product_type":          productType,
        },
    }
    
    transaction.MarkAsProcessed()
    database.DB.Create(&transaction)
    
    // Update subscription if it exists
    var subscription models.Subscription
    if err := database.DB.Where("ccbill_subscription_id = ?", subscriptionID).
        First(&subscription).Error; err == nil {
        subscription.Status = "active"
        database.DB.Save(&subscription)
    }
    
    // Add to user wallet
    var user models.User
    if err := database.DB.First(&user, userUUID).Error; err == nil {
        netAmount := amount * 0.9 // 10% platform fee
        user.AddToWallet(netAmount)
        user.AddEarnings(netAmount)
        database.DB.Save(&user)
    }
}

func (c *CCBillProcessor) handleRenewalSuccess(subscriptionID, price string) {
    amount, _ := strconv.ParseFloat(price, 64)
    
    // Find subscription
    var subscription models.Subscription
    if err := database.DB.Where("ccbill_subscription_id = ?", subscriptionID).
        First(&subscription).Error; err != nil {
        return
    }
    
    // Create renewal transaction
    transaction := models.Transaction{
        UserID:                 subscription.FanID,
        Type:                   models.TransactionSubscription,
        Amount:                 amount,
        Currency:               "USD",
        Status:                 "completed",
        Description:            &[]string{"CCBill subscription renewal"}[0],
        Processor:              &[]string{"ccbill"}[0],
        ProcessorTransactionID: &subscriptionID,
        Metadata: map[string]interface{}{
            "ccbill_subscription_id": subscriptionID,
            "renewal":               true,
        },
    }
    
    transaction.MarkAsProcessed()
    database.DB.Create(&transaction)
    
    // Extend subscription period
    if subscription.BillingCycle == "monthly" {
        newEnd := time.Now().AddDate(0, 1, 0)
        subscription.CurrentPeriodEnd = &newEnd
    } else if subscription.BillingCycle == "yearly" {
        newEnd := time.Now().AddDate(1, 0, 0)
        subscription.CurrentPeriodEnd = &newEnd
    }
    
    database.DB.Save(&subscription)
    
    // Add to creator wallet
    var creator models.User
    if err := database.DB.First(&creator, subscription.CreatorID).Error; err == nil {
        netAmount := amount * 0.9 // 10% platform fee
        creator.AddToWallet(netAmount)
        creator.AddEarnings(netAmount)
        database.DB.Save(&creator)
    }
}

func (c *CCBillProcessor) handleCancellation(subscriptionID string) {
    var subscription models.Subscription
    if err := database.DB.Where("ccbill_subscription_id = ?", subscriptionID).
        First(&subscription).Error; err == nil {
        subscription.Cancel()
        database.DB.Save(&subscription)
    }
}

func (c *CCBillProcessor) handleChargeback(subscriptionID string) {
    // Handle chargeback - this might involve reversing transactions
    var transaction models.Transaction
    if err := database.DB.Where("processor_transaction_id = ?", subscriptionID).
        First(&transaction).Error; err == nil {
        
        // Create chargeback record
        chargeback := models.Chargeback{
            TransactionID:     transaction.ID,
            Amount:           transaction.Amount,
            Status:           "received",
            ReasonCode:       &[]string{"ccbill_chargeback"}[0],
            ReasonDescription: &[]string{"Chargeback received from CCBill"}[0],
        }
        
        database.DB.Create(&chargeback)
        
        // Update transaction status
        transaction.Status = "chargeback"
        database.DB.Save(&transaction)
    }
}

func (c *CCBillProcessor) handleRefund(subscriptionID string) {
    var transaction models.Transaction
    if err := database.DB.Where("processor_transaction_id = ?", subscriptionID).
        First(&transaction).Error; err == nil {
        
        // Create refund record
        refund := models.Refund{
            OriginalTransactionID: transaction.ID,
            Amount:               transaction.Amount,
            Status:               "completed",
        }
        
        database.DB.Create(&refund)
        
        // Update transaction status
        transaction.Status = "refunded"
        database.DB.Save(&transaction)
    }
}
