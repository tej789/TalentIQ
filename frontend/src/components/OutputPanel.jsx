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
        style={{
          padding: '12px 16px',
          marginBottom: '8px',
          borderRadius: '8px',
          backgroundColor: isPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${isPassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          {isPassed ? (
            <CheckCircle size={18} style={{ color: '#10b981' }} />
          ) : hasError ? (
            <AlertCircle size={18} style={{ color: '#ef4444' }} />
          ) : (
            <XCircle size={18} style={{ color: '#ef4444' }} />
          )}
          <span style={{ 
            fontWeight: '600', 
            color: isPassed ? '#10b981' : '#ef4444',
            fontSize: '14px'
          }}>
            Test Case {result.testCase}
          </span>
          <span style={{
            marginLeft: 'auto',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: isPassed ? '#10b981' : '#ef4444',
            color: 'white'
          }}>
            {isPassed ? 'Passed' : hasError ? result.errorType?.toUpperCase() || 'ERROR' : 'Failed'}
          </span>
        </div>
        
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Input:</span>
            <code style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              padding: '2px 6px', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {result.input}
            </code>
          </div>
          
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Expected:</span>
            <code style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              padding: '2px 6px', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#10b981'
            }}>
              {result.expectedOutput}
            </code>
          </div>
          
          {!hasError && (
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Output:</span>
              <code style={{ 
                backgroundColor: 'var(--bg-tertiary)', 
                padding: '2px 6px', 
                borderRadius: '4px',
                fontSize: '12px',
                color: isPassed ? '#10b981' : '#ef4444'
              }}>
                {result.userOutput}
              </code>
            </div>
          )}
          
          {hasError && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              borderRadius: '4px',
              color: '#ef4444',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
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
      <div style={{
        padding: '16px',
        marginBottom: '16px',
        borderRadius: '8px',
        backgroundColor: isAccepted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        border: `2px solid ${isAccepted ? '#10b981' : '#ef4444'}`,
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px',
          marginBottom: '8px'
        }}>
          {isAccepted ? (
            <CheckCircle size={24} style={{ color: '#10b981' }} />
          ) : output.verdict === 'Time Limit Exceeded' ? (
            <Clock size={24} style={{ color: '#ef4444' }} />
          ) : output.verdict === 'Compilation Error' ? (
            <Code size={24} style={{ color: '#ef4444' }} />
          ) : (
            <XCircle size={24} style={{ color: '#ef4444' }} />
          )}
          <span style={{ 
            fontSize: '20px', 
            fontWeight: '700',
            color: isAccepted ? '#10b981' : '#ef4444'
          }}>
            {output.verdict}
          </span>
        </div>
        
        <div style={{ 
          fontSize: '14px', 
          color: 'var(--text-secondary)'
        }}>
          {output.passedCount}/{output.totalCount} test cases passed
        </div>
        
        {/* Show failed test case details */}
        {output.failedTestCase && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '6px',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Failed on Test Case {output.failedTestCase.testCaseNumber}:
            </div>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Input: </span>
              <code style={{ color: 'var(--text-primary)' }}>{output.failedTestCase.input}</code>
            </div>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Expected: </span>
              <code style={{ color: '#10b981' }}>{output.failedTestCase.expectedOutput}</code>
            </div>
            {output.failedTestCase.userOutput && (
              <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Your Output: </span>
                <code style={{ color: '#ef4444' }}>{output.failedTestCase.userOutput}</code>
              </div>
            )}
            {output.failedTestCase.error && (
              <div style={{ 
                marginTop: '8px',
                padding: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '4px',
                color: '#ef4444',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                {output.failedTestCase.error}
              </div>
            )}
          </div>
        )}
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
