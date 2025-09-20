/**
 * @name SQL injection vulnerability
 * @description User input directly used in SQL queries without parameterization
 * @kind path-problem
 * @problem.severity error
 * @security-severity 9.0
 * @precision high
 * @id fanz/sql-injection
 * @tags security
 *       external/cwe/cwe-89
 *       fanz/database-security
 */

import javascript
import DataFlow::PathGraph

class UserInput extends DataFlow::SourceNode {
  UserInput() {
    // Express request data
    exists(DataFlow::PropRead prop |
      prop.getBase().(DataFlow::ParameterNode).getName() = "req" and
      prop.getPropertyName() = ["query", "params", "body"] and
      this = prop
    ) or
    // Environment variables (potential user input)
    exists(DataFlow::PropRead env |
      env.getBase().getALocalSource().asExpr().(Identifier).getName() = "process" and
      env.getPropertyName() = "env" and
      this = env
    ) or
    // URL parameters
    exists(DataFlow::CallNode call |
      call.getCalleeName() = ["URLSearchParams", "parseUrl"] and
      this = call
    )
  }
}

class SqlQuery extends DataFlow::SinkNode {
  SqlQuery() {
    // Direct SQL execution
    exists(DataFlow::CallNode call |
      call.getReceiver().getALocalSource().hasUnderlyingType("Database") or
      call.getCalleeName() = ["query", "execute", "run", "all", "get", "each"] and
      this = call.getArgument(0)
    ) or
    // Template literals with SQL keywords
    exists(TemplateLiteral tl |
      tl.getRawValue().regexpMatch("(?i).*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER).*") and
      this.asExpr() = tl
    ) or
    // String concatenation with SQL
    exists(AddExpr add |
      exists(StringLiteral str |
        str = add.getAnOperand() and
        str.getValue().regexpMatch("(?i).*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER).*")
      ) and
      this.asExpr() = add
    )
  }
  
  string getSqlContext() {
    if exists(DataFlow::CallNode call | call.getArgument(0) = this)
    then result = "Database query method"
    else if this.asExpr() instanceof TemplateLiteral
    then result = "Template literal with SQL"
    else result = "String concatenation"
  }
}

class SqlInjectionConfiguration extends TaintTracking::Configuration {
  SqlInjectionConfiguration() { this = "SqlInjection" }

  override predicate isSource(DataFlow::Node source) {
    source instanceof UserInput
  }

  override predicate isSink(DataFlow::Node sink) {
    sink instanceof SqlQuery
  }

  override predicate isSanitizer(DataFlow::Node node) {
    // Parameterized query usage
    exists(DataFlow::CallNode call |
      call.getCalleeName() = ["prepare", "prepared", "parameterize"] and
      call.getAnArgument() = node
    ) or
    // ORM methods (usually safe)
    exists(DataFlow::CallNode call |
      call.getReceiver().getALocalSource().hasUnderlyingType("QueryBuilder") and
      call.getCalleeName() = ["where", "select", "insert", "update", "delete"] and
      call.getAnArgument() = node
    ) or
    // Validation/sanitization
    exists(DataFlow::CallNode call |
      call.getCalleeName() = ["escape", "sanitize", "validate", "parseInt", "parseFloat"] and
      call.getAnArgument() = node
    )
  }
  
  override predicate isAdditionalTaintStep(DataFlow::Node pred, DataFlow::Node succ) {
    // String interpolation
    exists(TemplateLiteral tl |
      pred = tl.getAnElement().flow() and
      succ.asExpr() = tl
    ) or
    // String concatenation
    exists(AddExpr add |
      pred.asExpr() = add.getAnOperand() and
      succ.asExpr() = add
    )
  }
}

from SqlInjectionConfiguration config, DataFlow::PathNode source, DataFlow::PathNode sink
where 
  config.hasFlowPath(source, sink) and
  not source.getNode().getFile().getRelativePath().matches("%test%") and
  not source.getNode().getFile().getRelativePath().matches("%spec%")
select sink.getNode(), source, sink,
  "SQL injection vulnerability: User input from $@ flows to " + sink.getNode().(SqlQuery).getSqlContext() + " without proper sanitization.",
  source.getNode(), "this source"