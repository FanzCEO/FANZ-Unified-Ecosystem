/**
 * @name Adult content security vulnerabilities
 * @description Detects security issues specific to adult content platforms
 * @kind problem
 * @problem.severity warning
 * @security-severity 7.0
 * @precision medium
 * @id fanz/adult-content-security
 * @tags security
 *       adult-content
 *       content-validation
 *       fanz/content-security
 */

import javascript

class AdultContentOperation extends DataFlow::CallNode {
  AdultContentOperation() {
    // Content upload/processing operations
    this.getCalleeName() = ["uploadContent", "processVideo", "processImage", 
                           "storeMedia", "publishContent", "moderateContent"] or
    // Age verification operations
    this.getCalleeName() = ["verifyAge", "checkAgeGate", "validateAge", 
                           "requireAdultConsent", "ageVerification"] or
    // Content access operations
    this.getCalleeName() = ["accessContent", "viewContent", "downloadContent",
                           "streamContent", "getMediaUrl"] or
    // Payment/subscription related to adult content
    this.getCalleeName() = ["subscribeToCreator", "purchaseContent", "tipCreator",
                           "unlockContent", "premiumAccess"]
  }
  
  string getOperationType() {
    if this.getCalleeName().regexpMatch(".*[Uu]pload.*|.*[Pp]rocess.*|.*[Ss]tore.*")
    then result = "Content processing"
    else if this.getCalleeName().regexpMatch(".*[Aa]ge.*|.*[Vv]erif.*")
    then result = "Age verification"
    else if this.getCalleeName().regexpMatch(".*[Aa]ccess.*|.*[Vv]iew.*|.*[Dd]ownload.*")
    then result = "Content access"
    else result = "Content monetization"
  }
}

class AgeVerificationCheck extends DataFlow::CallNode {
  AgeVerificationCheck() {
    this.getCalleeName() = ["verifyAge", "checkAge", "isAdult", "validateAge",
                           "requireAgeVerification", "checkAgeGate"] or
    // Check for age-related property access
    exists(DataFlow::PropRead prop |
      prop.getPropertyName() = ["age", "birthDate", "isAdult", "ageVerified"] and
      DataFlow::localFlow(prop, this.getAnArgument())
    )
  }
}

class ContentModerationCheck extends DataFlow::CallNode {
  ContentModerationCheck() {
    this.getCalleeName() = ["moderateContent", "scanContent", "validateContent",
                           "checkContentPolicy", "detectNudity", "classifyContent",
                           "aiModeration", "humanReview"] or
    // Content filtering
    this.getCalleeName() = ["filterContent", "blockContent", "flagContent"]
  }
}

class ConsentCheck extends DataFlow::CallNode {
  ConsentCheck() {
    this.getCalleeName() = ["checkConsent", "verifyConsent", "requireConsent",
                           "hasConsented", "validateConsent"] or
    // Terms acceptance
    this.getCalleeName() = ["acceptTerms", "agreeToTerms", "checkTermsAcceptance"]
  }
}

class GeolocationCheck extends DataFlow::CallNode {
  GeolocationCheck() {
    this.getCalleeName() = ["checkLocation", "verifyGeolocation", "isLegalJurisdiction",
                           "checkCountryRestrictions", "validateRegion"] or
    // IP-based location
    this.getCalleeName() = ["getCountryFromIP", "checkIPLocation", "geolocateUser"]
  }
}

predicate hasAgeVerification(DataFlow::Node node) {
  exists(AgeVerificationCheck check |
    check.getEnclosingFunction() = node.getEnclosingFunction() and
    check.getStartLine() < node.getStartLine()
  ) or
  // Check for age verification middleware
  exists(DataFlow::CallNode middleware |
    middleware.getCalleeName() = ["requireAge", "ageGate", "adultOnly"] and
    middleware.getEnclosingFunction() = node.getEnclosingFunction()
  )
}

predicate hasContentModeration(DataFlow::Node node) {
  exists(ContentModerationCheck check |
    check.getEnclosingFunction() = node.getEnclosingFunction() and
    check.getStartLine() < node.getStartLine()
  )
}

predicate hasConsentVerification(DataFlow::Node node) {
  exists(ConsentCheck check |
    check.getEnclosingFunction() = node.getEnclosingFunction() and
    check.getStartLine() < node.getStartLine()
  )
}

predicate hasGeolocationCheck(DataFlow::Node node) {
  exists(GeolocationCheck check |
    check.getEnclosingFunction() = node.getEnclosingFunction() and
    check.getStartLine() < node.getStartLine()
  )
}

predicate isContentUpload(AdultContentOperation op) {
  op.getCalleeName() = ["uploadContent", "processVideo", "processImage", "storeMedia"]
}

predicate isContentAccess(AdultContentOperation op) {
  op.getCalleeName() = ["accessContent", "viewContent", "downloadContent", "streamContent"]
}

predicate requiresStrictValidation(AdultContentOperation op) {
  // Operations that require all checks
  op.getCalleeName() = ["publishContent", "uploadContent", "accessContent", "viewContent"]
}

predicate hasWatermarkProtection(DataFlow::Node node) {
  exists(DataFlow::CallNode call |
    call.getCalleeName() = ["addWatermark", "protectContent", "embedUserInfo"] and
    call.getEnclosingFunction() = node.getEnclosingFunction()
  )
}

from AdultContentOperation op
where 
  not op.getFile().getRelativePath().matches("%test%") and
  not op.getFile().getRelativePath().matches("%spec%") and
  (
    // Content upload without proper moderation
    (isContentUpload(op) and not hasContentModeration(op)) or
    
    // Content access without age verification
    (isContentAccess(op) and not hasAgeVerification(op)) or
    
    // Missing consent verification for content operations
    (requiresStrictValidation(op) and not hasConsentVerification(op)) or
    
    // Missing geolocation checks for legal compliance
    (requiresStrictValidation(op) and not hasGeolocationCheck(op)) or
    
    // Content serving without watermark protection
    (op.getCalleeName() = ["downloadContent", "streamContent", "getMediaUrl"] and 
     not hasWatermarkProtection(op))
  )
select op, 
  "Adult content security issue in " + op.getOperationType() + " (" + op.getCalleeName() + "): " +
  "Missing required security controls (age verification, content moderation, consent, geolocation, or watermarking)."