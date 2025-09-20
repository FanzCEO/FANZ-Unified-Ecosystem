/**
 * @name Hardcoded secrets and credentials
 * @description Detects hardcoded passwords, API keys, and other sensitive information
 * @kind problem
 * @problem.severity error
 * @security-severity 9.0
 * @precision high
 * @id fanz/hardcoded-secrets
 * @tags security
 *       external/cwe/cwe-798
 *       fanz/credential-security
 */

import javascript

class SensitiveStringLiteral extends StringLiteral {
  SensitiveStringLiteral() {
    // API keys and tokens
    this.getValue().regexpMatch("(?i).*(api[_-]?key|access[_-]?token|secret[_-]?key).*") or
    // Database credentials
    this.getValue().regexpMatch("(?i).*(password|passwd|pwd|secret).*") or
    // JWT secrets
    this.getValue().regexpMatch("(?i).*jwt[_-]?(secret|key).*") or
    // OAuth credentials
    this.getValue().regexpMatch("(?i).*(client[_-]?secret|consumer[_-]?secret).*") or
    // Encryption keys
    this.getValue().regexpMatch("(?i).*(private[_-]?key|encryption[_-]?key).*") or
    // Payment processor keys
    this.getValue().regexpMatch("(?i).*(stripe|paypal|square)[_-]?(key|secret).*") or
    // High entropy strings that could be secrets
    (this.getValue().length() > 20 and 
     this.getValue().regexpMatch("[A-Za-z0-9+/=]{20,}") and
     not this.getValue().regexpMatch(".*[\\s\\.].*"))
  }
  
  string getSecretType() {
    if this.getValue().regexpMatch("(?i).*api[_-]?key.*")
    then result = "API key"
    else if this.getValue().regexpMatch("(?i).*password.*")
    then result = "Password"
    else if this.getValue().regexpMatch("(?i).*jwt.*")
    then result = "JWT secret"
    else if this.getValue().regexpMatch("(?i).*secret.*")
    then result = "Secret key"
    else if this.getValue().regexpMatch("(?i).*(stripe|paypal|square).*")
    then result = "Payment processor credential"
    else result = "Potential secret"
  }
}

class SensitiveAssignment extends AssignExpr {
  SensitiveAssignment() {
    exists(Identifier lhs |
      lhs = this.getLeft() and
      (
        lhs.getName().regexpMatch("(?i).*(api[_-]?key|secret|password|token|private[_-]?key).*") or
        lhs.getName().regexpMatch("(?i).*(jwt[_-]?secret|client[_-]?secret|auth[_-]?token).*")
      )
    ) and
    this.getRight() instanceof SensitiveStringLiteral
  }
  
  string getVariableName() {
    result = this.getLeft().(Identifier).getName()
  }
}

class SensitivePropertyAssignment extends Property {
  SensitivePropertyAssignment() {
    this.getName().regexpMatch("(?i).*(api[_-]?key|secret|password|token|private[_-]?key).*") and
    this.getValue() instanceof SensitiveStringLiteral
  }
  
  string getPropertyName() {
    result = this.getName()
  }
}

predicate isInTestOrConfigFile(ASTNode node) {
  node.getFile().getRelativePath().matches("%test%") or
  node.getFile().getRelativePath().matches("%spec%") or
  node.getFile().getRelativePath().matches("%example%") or
  node.getFile().getRelativePath().matches("%demo%") or
  node.getFile().getRelativePath().matches("%.env.example%") or
  node.getFile().getRelativePath().matches("%config/test%")
}

predicate isPlaceholderValue(StringLiteral str) {
  str.getValue().regexpMatch("(?i).*(your[_-]?|enter[_-]?|replace[_-]?|placeholder).*") or
  str.getValue().regexpMatch("(?i).*(example|test|demo|sample).*") or
  str.getValue().regexpMatch(".*\\[.*\\].*") or
  str.getValue().regexpMatch(".*<.*>.*") or
  str.getValue().regexpMatch(".*\\{\\{.*\\}\\}.*") or
  str.getValue() = "change-me" or
  str.getValue() = "secret" or
  str.getValue() = "password" or
  str.getValue().length() < 8
}

predicate isEnvironmentVariableUsage(ASTNode node) {
  // Check if it's used with process.env
  exists(PropAccess env |
    env.getBase().(PropAccess).getBase().(Identifier).getName() = "process" and
    env.getBase().(PropAccess).getPropertyName() = "env" and
    node.getParent*() = env
  ) or
  // Check if it's in a dotenv config
  exists(CallExpr call |
    call.getCallee().(PropAccess).getPropertyName() = "config" and
    call.getCallee().(PropAccess).getBase().(Identifier).getName() = "dotenv" and
    node.getParent*() = call
  )
}

from SensitiveStringLiteral secret
where 
  not isInTestOrConfigFile(secret) and
  not isPlaceholderValue(secret) and
  not isEnvironmentVariableUsage(secret) and
  // Exclude very short strings
  secret.getValue().length() > 8 and
  // Exclude common non-secrets
  not secret.getValue().regexpMatch("(?i).*(localhost|127\\.0\\.0\\.1|example\\.com).*") and
  // Exclude documentation strings
  not exists(Comment c | 
    c.getLocation().getStartLine() = secret.getLocation().getStartLine()
  )
select secret, 
  "Hardcoded " + secret.getSecretType() + " detected: '" + 
  (if secret.getValue().length() > 20 
   then secret.getValue().prefix(20) + "..." 
   else secret.getValue()) + 
  "'. Use environment variables or a secure credential store instead."