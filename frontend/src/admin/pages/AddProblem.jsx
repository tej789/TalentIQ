import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Trash2, Save } from "lucide-react";
import { createProblem } from "../../api/admin";
import toast from "react-hot-toast";

const AddProblem = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    category: "Algorithms",
    constraints: [""],
    examples: [{ input: "", output: "", explanation: "" }],
    testCases: [{ input: "", expectedOutput: "", isHidden: false }],
    starterCode: {
      javascript: "",
      python: "",
      java: "",
    },
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle starter code changes
  const handleStarterCodeChange = (lang, value) => {
    setFormData((prev) => ({
      ...prev,
      starterCode: { ...prev.starterCode, [lang]: value },
    }));
  };

  // Handle constraint changes
  const handleConstraintChange = (index, value) => {
    const newConstraints = [...formData.constraints];
    newConstraints[index] = value;
    setFormData((prev) => ({ ...prev, constraints: newConstraints }));
  };

  const addConstraint = () => {
    setFormData((prev) => ({
      ...prev,
      constraints: [...prev.constraints, ""],
    }));
  };

  const removeConstraint = (index) => {
    setFormData((prev) => ({
      ...prev,
      constraints: prev.constraints.filter((_, i) => i !== index),
    }));
  };

  // Handle example changes
  const handleExampleChange = (index, field, value) => {
    const newExamples = [...formData.examples];
    newExamples[index][field] = value;
    setFormData((prev) => ({ ...prev, examples: newExamples }));
  };

  const addExample = () => {
    setFormData((prev) => ({
      ...prev,
      examples: [...prev.examples, { input: "", output: "", explanation: "" }],
    }));
  };

  const removeExample = (index) => {
    setFormData((prev) => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index),
    }));
  };

  // Handle test case changes
  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index][field] = value;
    setFormData((prev) => ({ ...prev, testCases: newTestCases }));
  };

  const addTestCase = () => {
    setFormData((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: "", expectedOutput: "", isHidden: false }],
    }));
  };

  const removeTestCase = (index) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description) {
      toast.error("Title and description are required");
      return;
    }

    if (formData.testCases.length === 0) {
      toast.error("At least one test case is required");
      return;
    }

    // Filter out empty constraints
    const cleanedData = {
      ...formData,
      constraints: formData.constraints.filter((c) => c.trim() !== ""),
    };

    try {
      setLoading(true);
      await createProblem(cleanedData);
      toast.success("Problem created successfully!");
      navigate("/admin/problems");
    } catch (error) {
      console.error("Error creating problem:", error);
      toast.error(error.response?.data?.message || "Failed to create problem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-add-problem">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Add New Problem</h1>
        <button onClick={() => navigate("/admin/problems")} className="btn-secondary">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        {/* Basic Info */}
        <div className="form-section">
          <h3 className="form-section-title">Basic Information</h3>

          <div className="form-group">
            <label>Problem Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Two Sum"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Difficulty *</label>
              <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Arrays, Strings"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Describe the problem..."
              required
            />
          </div>
        </div>

        {/* Constraints */}
        <div className="form-section">
          <div className="form-section-header">
            <h3 className="form-section-title">Constraints</h3>
            <button type="button" onClick={addConstraint} className="btn-icon">
              <Plus size={18} /> Add Constraint
            </button>
          </div>

          {formData.constraints.map((constraint, index) => (
            <div key={index} className="form-array-item">
              <input
                type="text"
                value={constraint}
                onChange={(e) => handleConstraintChange(index, e.target.value)}
                placeholder="e.g., 1 <= nums.length <= 10^4"
              />
              {formData.constraints.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeConstraint(index)}
                  className="btn-remove"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Examples */}
        <div className="form-section">
          <div className="form-section-header">
            <h3 className="form-section-title">Examples</h3>
            <button type="button" onClick={addExample} className="btn-icon">
              <Plus size={18} /> Add Example
            </button>
          </div>

          {formData.examples.map((example, index) => (
            <div key={index} className="form-example-card">
              <div className="form-example-header">
                <h4>Example {index + 1}</h4>
                {formData.examples.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExample(index)}
                    className="btn-remove"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Input</label>
                <textarea
                  value={example.input}
                  onChange={(e) => handleExampleChange(index, "input", e.target.value)}
                  rows={2}
                  placeholder="e.g., nums = [2,7,11,15], target = 9"
                />
              </div>

              <div className="form-group">
                <label>Output</label>
                <textarea
                  value={example.output}
                  onChange={(e) => handleExampleChange(index, "output", e.target.value)}
                  rows={2}
                  placeholder="e.g., [0,1]"
                />
              </div>

              <div className="form-group">
                <label>Explanation (optional)</label>
                <textarea
                  value={example.explanation}
                  onChange={(e) => handleExampleChange(index, "explanation", e.target.value)}
                  rows={2}
                  placeholder="Explain why this is the answer..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Test Cases */}
        <div className="form-section">
          <div className="form-section-header">
            <h3 className="form-section-title">Test Cases *</h3>
            <button type="button" onClick={addTestCase} className="btn-icon">
              <Plus size={18} /> Add Test Case
            </button>
          </div>

          {formData.testCases.map((testCase, index) => (
            <div key={index} className="form-testcase-card">
              <div className="form-testcase-header">
                <h4>Test Case {index + 1}</h4>
                <div className="form-testcase-actions">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={testCase.isHidden}
                      onChange={(e) =>
                        handleTestCaseChange(index, "isHidden", e.target.checked)
                      }
                    />
                    <span>Hidden</span>
                  </label>
                  {formData.testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="btn-remove"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Input</label>
                  <textarea
                    value={testCase.input}
                    onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
                    rows={3}
                    placeholder="Provide test input (one value per line)"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Expected Output</label>
                  <textarea
                    value={testCase.expectedOutput}
                    onChange={(e) =>
                      handleTestCaseChange(index, "expectedOutput", e.target.value)
                    }
                    rows={3}
                    placeholder="Expected output for this test case"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Starter Code */}
        <div className="form-section">
          <h3 className="form-section-title">Starter Code</h3>

          <div className="form-group">
            <label>JavaScript</label>
            <textarea
              value={formData.starterCode.javascript}
              onChange={(e) => handleStarterCodeChange("javascript", e.target.value)}
              rows={4}
              placeholder="function twoSum(nums, target) {&#10;  // your code here&#10;}"
              className="code-textarea"
            />
          </div>

          <div className="form-group">
            <label>Python</label>
            <textarea
              value={formData.starterCode.python}
              onChange={(e) => handleStarterCodeChange("python", e.target.value)}
              rows={4}
              placeholder="def two_sum(nums, target):&#10;    # your code here"
              className="code-textarea"
            />
          </div>

          <div className="form-group">
            <label>Java</label>
            <textarea
              value={formData.starterCode.java}
              onChange={(e) => handleStarterCodeChange("java", e.target.value)}
              rows={4}
              placeholder="public int[] twoSum(int[] nums, int target) {&#10;    // your code here&#10;}"
              className="code-textarea"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save size={18} />
            {loading ? "Creating..." : "Create Problem"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProblem;
