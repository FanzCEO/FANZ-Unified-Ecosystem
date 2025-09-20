/**
 * @name Unsafe financial operations
 * @description Financial operations without proper authorization or validation
 * @kind problem
 * @problem.severity error
 * @security-severity 8.5
 * @precision high
 * @id fanz/unsafe-financial-operations
 * @tags security
 *       finance
 *       authorization
 *       fanz/financial-security
 */

import javascript

class FinancialOperation extends DataFlow::CallNode {
  FinancialOperation() {
    // Payment processing operations
    this.getCalleeName() = ["processPayment", "refundPayment", "transferFunds", 
                           "withdrawFunds", "createPayout", "updateBalance",
                           "chargeCustomer", "capturePayment", "voidTransaction"] or
    // Database operations on financial tables
    exists(DataFlow::CallNode dbCall |
      dbCall.getCalleeName() = ["query", "execute", "update", "insert", "delete"] and
      dbCall.getArgument(0).getStringValue().regexpMatch("(?i).*(payment|transaction|balance|wallet|payout|earning).*") and
      this = dbCall
    ) or
    // API calls to payment services
    exists(string url |
      this.getArgument(_).getStringValue() = url and
      url.regexpMatch(".*(payment|charge|refund|transfer|payout).*")
    )
  }
  
  string getOperationType() {
    if this.getCalleeName().regexpMatch(".*[Pp]ayment.*")
    then result = "Payment processing"
    else if this.getCalleeName().regexpMatch(".*[Bb]alance.*")
    then result = "Balance modification"
    else if this.getCalleeName().regexpMatch(".*[Pp]ayout.*")
    then result = "Payout operation"
    else result = "Financial database operation"
  }
}

class AuthorizationCheck extends DataFlow::CallNode {
  AuthorizationCheck() {
    // Authorization middleware or functions
    this.getCalleeName() = ["authorize", "checkAuth", "requireAuth", "validateUser", 
                           "checkPermissions", "hasRole", "isAuthorized",
                           "requireRole", "requirePermission", "authenticateToken"] or
    // JWT verification
    this.getCalleeName() = ["verify", "decode"] and
    this.getArgument(_).getStringValue().matches("*jwt*") or
    // Session checks
    exists(DataFlow::PropRead session |
      session.getPropertyName() = ["user", "userId", "authenticated"] and
      DataFlow::localFlow(session, this.getAnArgument())
    )
  }
}

class ValidationCheck extends DataFlow::CallNode {
  ValidationCheck() {
    // Amount validation
    this.getCalleeName() = ["validateAmount", "checkAmount", "parseAmount", 
                           "validateCurrency", "checkMinimum", "checkMaximum"] or
    // Input validation
    this.getCalleeName() = ["validate", "sanitize", "parse", "safeParse"] or
    // Financial validation patterns
    exists(DataFlow::CallNode call |
      call.getCalleeName() = ["match", "test"] and
      call.getArgument(0).getStringValue().regexpMatch(".*amount.*|.*currency.*|.*price.*") and
      this = call
    )
  }
}

class TwoFactorCheck extends DataFlow::CallNode {
  TwoFactorCheck() {
    this.getCalleeName() = ["verify2FA", "checkTwoFactor", "validateOTP", 
                           "verifyTOTP", "checkSecondFactor"] or
    // Check for 2FA property access
    exists(DataFlow::PropRead prop |
      prop.getPropertyName() = ["twoFactorEnabled", "mfaEnabled", "requiresMFA"] and
      DataFlow::localFlow(prop, this.getAnArgument())
    )
  }
}

predicate isInAuthorizedContext(DataFlow::Node node) {
  // Check if the financial operation is performed after authorization
  exists(AuthorizationCheck auth |
    auth.getEnclosingFunction() = node.getEnclosingFunction() and
    auth.getStartLine() < node.getStartLine()
  ) or
  // Check for middleware authorization
  exists(DataFlow::CallNode middleware |
    middleware.getCalleeName() = ["use", "all", "get", "post", "put", "delete"] and
    exists(DataFlow::CallNode auth |
      auth instanceof AuthorizationCheck and
      DataFlow::localFlow(auth, middleware.getAnArgument())
    ) and
    middleware.getEnclosingFunction() = node.getEnclosingFunction()
  )
}

predicate isInValidatedContext(DataFlow::Node node) {
  exists(ValidationCheck validation |
    validation.getEnclosingFunction() = node.getEnclosingFunction() and
    validation.getStartLine() < node.getStartLine()
  )
}

predicate requires2FA(FinancialOperation op) {
  // High-value operations should require 2FA
  op.getCalleeName() = ["transferFunds", "withdrawFunds", "createPayout", "processRefund"] or
  // Operations with large amounts
  exists(DataFlow::Node amount |
    DataFlow::localFlow(amount, op.getAnArgument()) and
    exists(DataFlow::CallNode comparison |
      comparison.getCalleeName() = ["gt", "gte", "greaterThan"] and
      comparison.getArgument(0).getIntValue() > 1000 and
      DataFlow::localFlow(amount, comparison.getReceiver())
    )
  )
}

predicate hasIdempotencyKey(FinancialOperation op) {
  exists(DataFlow::PropRead prop |
    prop.getPropertyName() = ["idempotencyKey", "requestId", "transactionId"] and
    DataFlow::localFlow(prop, op.getAnArgument())
  )
}

from FinancialOperation op
where 
  not op.getFile().getRelativePath().matches("%test%") and
  not op.getFile().getRelativePath().matches("%spec%") and
  (
    // Missing authorization
    not isInAuthorizedContext(op) or
    // Missing validation for financial amounts
    not isInValidatedContext(op) or
    // Missing 2FA for high-risk operations
    (requires2FA(op) and not exists(TwoFactorCheck twofa |
      twofa.getEnclosingFunction() = op.getEnclosingFunction() and
      twofa.getStartLine() < op.getStartLine()
    )) or
    // Missing idempotency for critical operations
    (op.getCalleeName() = ["processPayment", "transferFunds", "createPayout"] and 
     not hasIdempotencyKey(op))
  )
select op, 
  "Unsafe financial operation: " + op.getOperationType() + " (" + op.getCalleeName() + ") " +
  "is missing proper security controls (authorization, validation, 2FA, or idempotency)."