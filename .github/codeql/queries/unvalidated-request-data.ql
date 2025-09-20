/**
 * @name Unvalidated request data usage
 * @description Direct usage of req.query, req.params, or req.body without validation
 * @kind problem
 * @problem.severity warning
 * @security-severity 7.5
 * @precision high
 * @id fanz/unvalidated-request-data
 * @tags security
 *       external/cwe/cwe-20
 *       fanz/input-validation
 */

import javascript

class RequestObject extends DataFlow::SourceNode {
  RequestObject() {
    // Match Express request objects
    exists(Parameter p |
      p.getName() = "req" and
      this = DataFlow::parameterNode(p)
    )
  }
}

class UnsafeRequestProperty extends DataFlow::PropRead {
  UnsafeRequestProperty() {
    exists(RequestObject req |
      this.getBase() = req and
      this.getPropertyName() = ["query", "params", "body"]
    )
  }
  
  string getPropertyType() {
    result = this.getPropertyName()
  }
}

class ValidationFunction extends DataFlow::CallNode {
  ValidationFunction() {
    // Match common validation patterns
    exists(string name | 
      name = ["validate", "validateQuery", "validateParams", "validateBody", "parse", "safeParse"] and
      this.getCalleeName() = name
    ) or
    // Match zod validation
    this.getReceiver().(DataFlow::PropRead).getPropertyName() = ["parse", "safeParse", "parseAsync"]
  }
}

predicate isInValidatedContext(DataFlow::Node node) {
  // Check if the node is used within a validation context
  exists(ValidationFunction validate |
    DataFlow::localFlow(node, validate.getAnArgument())
  ) or
  // Check if it's used after validation middleware
  exists(DataFlow::CallNode middleware |
    middleware.getCalleeName() = ["validateQuery", "validateParams", "validateBody"] and
    node.getEnclosingFunction() = middleware.getEnclosingFunction()
  )
}

predicate isInTestFile(DataFlow::Node node) {
  node.getFile().getRelativePath().matches("%test%") or
  node.getFile().getRelativePath().matches("%spec%") or
  node.getFile().getRelativePath().matches("%/__tests__/%")
}

from UnsafeRequestProperty usage
where 
  not isInValidatedContext(usage) and
  not isInTestFile(usage) and
  // Exclude if it's immediately validated
  not exists(ValidationFunction validate |
    DataFlow::localFlow(usage, validate.getAnArgument()) and
    validate.getStartLine() - usage.getStartLine() <= 3
  )
select usage, 
  "Direct usage of req." + usage.getPropertyType() + " without validation detected. " +
  "Use validation middleware or zod schemas to validate input before processing."