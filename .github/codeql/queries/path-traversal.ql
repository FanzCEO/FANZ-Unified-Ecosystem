/**
 * @name Path traversal vulnerability
 * @description User input used in file paths without proper validation
 * @kind path-problem
 * @problem.severity error
 * @security-severity 8.0
 * @precision high
 * @id fanz/path-traversal
 * @tags security
 *       external/cwe/cwe-22
 *       fanz/file-security
 */

import javascript
import DataFlow::PathGraph

class UserPathInput extends DataFlow::SourceNode {
  UserPathInput() {
    // Request parameters that could contain paths
    exists(DataFlow::PropRead prop |
      prop.getBase().(DataFlow::ParameterNode).getName() = "req" and
      prop.getPropertyName() = ["query", "params", "body"] and
      this = prop
    ) or
    // File upload paths
    exists(DataFlow::PropRead file |
      file.getPropertyName() = ["filename", "originalname", "path"] and
      this = file
    ) or
    // URL pathname
    exists(DataFlow::PropRead url |
      url.getPropertyName() = "pathname" and
      this = url
    )
  }
}

class FileSystemSink extends DataFlow::SinkNode {
  FileSystemSink() {
    // Node.js fs methods
    exists(DataFlow::CallNode call |
      call.getReceiver().getALocalSource().asExpr().(Identifier).getName() = "fs" and
      call.getCalleeName() = ["readFile", "readFileSync", "writeFile", "writeFileSync", 
                              "unlink", "unlinkSync", "stat", "statSync", "access", 
                              "accessSync", "createReadStream", "createWriteStream"] and
      this = call.getArgument(0)
    ) or
    // Path joining operations with user input
    exists(DataFlow::CallNode call |
      call.getCalleeName() = ["join", "resolve"] and
      call.getReceiver().getALocalSource().asExpr().(Identifier).getName() = "path" and
      this = call.getAnArgument()
    ) or
    // Express static serving
    exists(DataFlow::CallNode call |
      call.getCalleeName() = "static" and
      this = call.getArgument(0)
    ) or
    // File serving middleware
    exists(DataFlow::CallNode call |
      call.getCalleeName() = ["sendFile", "download"] and
      this = call.getArgument(0)
    )
  }
  
  string getOperationType() {
    if exists(DataFlow::CallNode call |
      call.getReceiver().getALocalSource().asExpr().(Identifier).getName() = "fs" and
      call.getArgument(0) = this
    )
    then result = "File system operation"
    else if exists(DataFlow::CallNode call |
      call.getCalleeName() = ["join", "resolve"] and
      call.getAnArgument() = this
    )
    then result = "Path construction"
    else result = "File serving"
  }
}

class PathTraversalConfiguration extends TaintTracking::Configuration {
  PathTraversalConfiguration() { this = "PathTraversal" }

  override predicate isSource(DataFlow::Node source) {
    source instanceof UserPathInput
  }

  override predicate isSink(DataFlow::Node sink) {
    sink instanceof FileSystemSink
  }

  override predicate isSanitizer(DataFlow::Node node) {
    // Path sanitization functions
    exists(DataFlow::CallNode call |
      call.getCalleeName() = ["normalize", "resolve", "basename"] and
      call.getReceiver().getALocalSource().asExpr().(Identifier).getName() = "path" and
      call.getAnArgument() = node
    ) or
    // Manual sanitization patterns
    exists(DataFlow::CallNode call |
      call.getCalleeName() = ["replace", "replaceAll"] and
      call.getArgument(0).getStringValue().regexpMatch(".*(\\.\\.|/|\\\\).*") and
      call.getAnArgument() = node
    ) or
    // Whitelist validation
    exists(DataFlow::CallNode call |
      call.getCalleeName() = ["match", "test"] and
      call.getReceiver().asExpr().(RegExpLiteral).getValue().regexpMatch("\\^[a-zA-Z0-9_\\-\\.]+\\$") and
      DataFlow::localFlow(node, call.getReceiver())
    ) or
    // Safe path construction with explicit allowlist
    exists(DataFlow::CallNode call |
      call.getCalleeName() = "join" and
      call.getArgument(0).getStringValue().matches("/var/app/uploads") and
      call.getAnArgument() = node
    )
  }
  
  override predicate isAdditionalTaintStep(DataFlow::Node pred, DataFlow::Node succ) {
    // String concatenation for paths
    exists(AddExpr add |
      pred.asExpr() = add.getAnOperand() and
      succ.asExpr() = add
    ) or
    // Template literal construction
    exists(TemplateLiteral tl |
      pred = tl.getAnElement().flow() and
      succ.asExpr() = tl
    ) or
    // Path manipulation that doesn't sanitize
    exists(DataFlow::CallNode call |
      call.getCalleeName() = ["replace", "substring", "slice"] and
      not call.getArgument(0).getStringValue().regexpMatch(".*(\\.\\.|/|\\\\).*") and
      pred = call.getReceiver() and
      succ = call
    )
  }
}

predicate containsTraversalPattern(DataFlow::Node node) {
  exists(StringLiteral str |
    DataFlow::localFlow(node, DataFlow::valueNode(str)) and
    str.getValue().regexpMatch(".*(\\.\\.[\\/\\\\]|[\\/\\\\]\\.\\.|\\.\\.[\\/\\\\]\\.\\.).*")
  )
}

from PathTraversalConfiguration config, DataFlow::PathNode source, DataFlow::PathNode sink
where 
  config.hasFlowPath(source, sink) and
  not source.getNode().getFile().getRelativePath().matches("%test%") and
  not source.getNode().getFile().getRelativePath().matches("%spec%") and
  // Additional check for actual traversal patterns
  (containsTraversalPattern(source.getNode()) or 
   not exists(DataFlow::CallNode sanitize |
     sanitize.getCalleeName() = ["basename", "normalize"] and
     DataFlow::localFlowStep*(source.getNode(), sanitize.getReceiver())
   ))
select sink.getNode(), source, sink,
  "Path traversal vulnerability: User input from $@ flows to " + sink.getNode().(FileSystemSink).getOperationType() + " without proper sanitization.",
  source.getNode(), "this source"