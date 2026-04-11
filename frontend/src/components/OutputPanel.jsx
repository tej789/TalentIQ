import { CheckCircle, XCircle, AlertCircle, Clock, Code } from "lucide-react";

function OutputPanel({ output }) {
  // Render individual test case result
  const renderTestCase = (result, index) => {
    const isPassed = result.passed;
    const hasError = result.error;
    
    return (
      <div 
        key={index} 
        className={`test-case-result ${isPassed ? 'passed' : 'failed'}`}
      >
        <div className="test-case-header">
          {isPassed ? (
            <CheckCircle size={18} className="test-case-icon passed" />
          ) : hasError ? (
            <AlertCircle size={18} className="test-case-icon failed" />
          ) : (
            <XCircle size={18} className="test-case-icon failed" />
          )}
          <span className={`test-case-title ${isPassed ? 'passed' : 'failed'}`}>
            Test Case {result.testCase}
          </span>
          <span className={`test-case-badge ${isPassed ? 'passed' : hasError ? 'error' : 'failed'}`}>
            {isPassed ? 'Passed' : hasError ? result.errorType?.toUpperCase() || 'ERROR' : 'Failed'}
          </span>
        </div>
        
        <div className="test-case-body">
          <div className="test-case-row">
            <span className="test-case-label">Input:</span>
            <code className="test-case-code">
              {result.input}
            </code>
          </div>
          
          <div className="test-case-row">
            <span className="test-case-label">Expected:</span>
            <code className="test-case-code expected">
              {result.expectedOutput}
            </code>
          </div>
          
          {!hasError && (
            <div className="test-case-row">
              <span className="test-case-label">Output:</span>
              <code className={`test-case-code ${isPassed ? 'output-passed' : 'output-failed'}`}>
                {result.userOutput}
              </code>
            </div>
          )}
          
          {hasError && (
            <div className="test-case-error">
              {result.error}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render submission verdict (for Submit results)
  const renderVerdict = () => {
    if (!output.verdict) return null;
    
    const isAccepted = output.verdict === 'Accepted';
    
    return (
      <div className={`test-case-result ${isAccepted ? 'passed' : 'failed'}`}>
        <div className="test-case-header">
          {isAccepted ? (
            <CheckCircle size={20} className="test-case-icon passed" />
          ) : output.verdict === 'Time Limit Exceeded' ? (
            <Clock size={20} className="test-case-icon failed" />
          ) : output.verdict === 'Compilation Error' ? (
            <Code size={20} className="test-case-icon failed" />
          ) : (
            <XCircle size={20} className="test-case-icon failed" />
          )}

          <span className={`test-case-title ${isAccepted ? 'passed' : 'failed'}`}>
            {output.verdict}
          </span>

          <span className={`test-case-badge ${isAccepted ? 'passed' : 'failed'}`}>
            {isAccepted ? 'Passed' : 'Failed'}
          </span>
        </div>

        <div className="test-case-body">
          <div className="test-case-row">
            <span className="test-case-label">Summary:</span>
            <span>
              {output.passedCount}/{output.totalCount} test cases passed
            </span>
          </div>

          {/* Show failed test case details */}
          {output.failedTestCase && (
            <>
              <div className="test-case-row">
                <span className="test-case-label">Input:</span>
                <code className="test-case-code">
                  {output.failedTestCase.input}
                </code>
              </div>
              <div className="test-case-row">
                <span className="test-case-label">Expected:</span>
                <code className="test-case-code expected">
                  {output.failedTestCase.expectedOutput}
                </code>
              </div>
              {output.failedTestCase.userOutput && (
                <div className="test-case-row">
                  <span className="test-case-label">Your Output:</span>
                  <code className="test-case-code output-failed">
                    {output.failedTestCase.userOutput}
                  </code>
                </div>
              )}
              {output.failedTestCase.error && (
                <div className="test-case-error">
                  {output.failedTestCase.error}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="output-panel">
      <div className="output-header">
        <span className="output-title">Output</span>
        {output?.summary && (
          <span style={{
            marginLeft: 'auto',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: output.summary.passed === output.summary.total ? '#10b981' : '#ef4444',
            color: 'white'
          }}>
            {output.summary.passed}/{output.summary.total} Passed
          </span>
        )}
      </div>
      <div className="output-content" style={{ padding: '16px', overflowY: 'auto' }}>
        {output === null ? (
          <p className="output-placeholder">Click "Run Code" to see the output here...</p>
        ) : output.verdict ? (
          // Submit result with verdict
          renderVerdict()
        ) : output.results ? (
          // Run result with individual test cases
          <div>
            {output.results.map((result, index) => renderTestCase(result, index))}
          </div>
        ) : output.success ? (
          // Legacy format - plain success
          <pre className="output-success">{output.output}</pre>
        ) : (
          // Legacy format - error
          <div>
            {output.output && (
              <pre className="output-text">{output.output}</pre>
            )}
            {output.error && (
              <pre className="output-error">{output.error}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default OutputPanel;
