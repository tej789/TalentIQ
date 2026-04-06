import { getDifficultyBadgeClass } from "../lib/utils";

function ProblemDescription({ problem, currentProblemId, onProblemChange, allProblems, isSolved }) {
  return (
    <div className="problem-description-container">
      {/* HEADER SECTION */}
      <div className="problem-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 className="problem-title">{problem.title}</h1>
          {isSolved && (
            <span style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ✓ Solved
            </span>
          )}
        </div>
        <div className="problem-meta">
          <span className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}>
            {problem.difficulty}
          </span>
          <span className="problem-tags">{problem.category}</span>
        </div>
      </div>

      <div className="problem-content">
        {/* Problem selector */}
        <div className="problem-selector">
          <select
            className="problem-select"
            value={currentProblemId}
            onChange={(e) => onProblemChange(e.target.value)}
          >
            {allProblems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} - {p.difficulty}
              </option>
            ))}
          </select>
        </div>

        {/* DESCRIPTION SECTION */}
        <div className="problem-section">
          <div className="problem-text">
            <p>{typeof problem.description === 'string' ? problem.description : problem.description?.text}</p>
            {problem.description?.notes?.map((note, idx) => (
              <p key={idx}>{note}</p>
            ))}
          </div>
        </div>

        {/* EXAMPLES SECTION */}
        {problem.examples && problem.examples.length > 0 && (
          <div className="problem-section">
            <h2 className="section-title">Examples</h2>
            <div className="examples-container">
              {problem.examples.map((example, idx) => (
                <div key={idx} className="example-item">
                  <div className="example-header">Example {idx + 1}:</div>
                  <div className="example-code">
                    <div className="code-line">
                      <span className="code-label">Input:</span>
                      <span className="code-value">{example.input}</span>
                    </div>
                    <div className="code-line">
                      <span className="code-label">Output:</span>
                      <span className="code-value">{example.output}</span>
                    </div>
                    {example.explanation && (
                      <div className="code-line explanation">
                        <span className="code-label">Explanation:</span>
                        <span className="code-value">{example.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONSTRAINTS */}
        {problem.constraints && problem.constraints.length > 0 && (
          <div className="problem-section">
            <h2 className="section-title">Constraints</h2>
            <ul className="constraints-list">
              {problem.constraints.map((constraint, idx) => (
                <li key={idx}>{constraint}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemDescription;
