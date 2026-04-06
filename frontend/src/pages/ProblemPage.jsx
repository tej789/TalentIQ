import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import Navbar from "../components/Navbar";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProblemDescription from "../components/ProblemDescription";
import OutputPanel from "../components/OutputPanel";
import CodeEditorPanel from "../components/CodeEditorPanel";
import { getMySubmission, submitCode as saveSubmission, getPreferredLanguage } from "../api/admin";
import { getProblemById, getAllProblems } from "../api/problems";
import { saveCodeDraft, loadCodeDraft } from "../api/code";
import { runCode as judgeRun, submitCode as judgeSubmit } from "../api/judge";
import debounce from "lodash.debounce";

import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { Loader } from "lucide-react";

function ProblemPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentProblemId, setCurrentProblemId] = useState(id || "two-sum");
  const [currentProblem, setCurrentProblem] = useState(null);
  const [allProblems, setAllProblems] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  
  // Store code for ALL languages separately (key: language, value: code)
  const [allLanguageCode, setAllLanguageCode] = useState({
    javascript: "",
    python: "",
    java: ""
  });
  
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSubmission, setSavedSubmission] = useState(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(true);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  
  // ============================================
  // AUTO-SAVE STATE & REFS
  // ============================================
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Refs to track current values for auto-save (avoids stale closures)
  const allLanguageCodeRef = useRef(allLanguageCode);
  const languageRef = useRef(selectedLanguage);
  const problemIdRef = useRef(currentProblemId);
  
  // Update refs when values change
  useEffect(() => { allLanguageCodeRef.current = allLanguageCode; }, [allLanguageCode]);
  useEffect(() => { languageRef.current = selectedLanguage; }, [selectedLanguage]);
  useEffect(() => { problemIdRef.current = currentProblemId; }, [currentProblemId]);

  // ============================================
  // AUTO-SAVE FUNCTIONS
  // ============================================
  
  /**
   * Force save - immediately saves code to server
   * Used when user clicks Run, Submit, or switches problems
   */
  const forceSave = useCallback(async () => {
    const currentCode = allLanguageCodeRef.current[languageRef.current];
    if (!currentCode || !problemIdRef.current) return;
    
    try {
      setIsAutoSaving(true);
      await saveCodeDraft(
        problemIdRef.current,
        languageRef.current,
        currentCode
      );
      setLastSaved(new Date());
      console.log("✅ Code force-saved");
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setIsAutoSaving(false);
    }
  }, []);

  /**
   * Debounced auto-save function
   * Only triggers after 1 second of inactivity (no typing)
   * This prevents excessive API calls on every keystroke
   */
  const debouncedSave = useCallback(
    debounce(async (problemId, language, codeToSave) => {
      if (!codeToSave || !problemId) return;
      
      try {
        setIsAutoSaving(true);
        await saveCodeDraft(problemId, language, codeToSave);
        setLastSaved(new Date());
        console.log("✅ Code auto-saved");
      } catch (error) {
        console.error("Auto-save failed:", error);
      } finally {
        setIsAutoSaving(false);
      }
    }, 1000), // 1 second debounce
    []
  );

  /**
   * Handle code changes from editor
   * Triggers debounced auto-save
   */
  const handleCodeChange = useCallback((newCode) => {
    // Update code for the current language only
    setAllLanguageCode(prevCode => ({
      ...prevCode,
      [languageRef.current]: newCode
    }));
    // Trigger debounced save (will only execute after 1s of no typing)
    debouncedSave(problemIdRef.current, languageRef.current, newCode);
  }, [debouncedSave]);

  /**
   * Save before page unload (browser close/refresh)
   */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Cancel debounced save and force immediate save
      debouncedSave.cancel();
      
      // Synchronous save using navigator.sendBeacon for reliability
      const currentCode = allLanguageCodeRef.current[languageRef.current];
      const data = JSON.stringify({
        problemId: problemIdRef.current,
        language: languageRef.current,
        code: currentCode,
      });
      
      navigator.sendBeacon('/api/code/save', new Blob([data], { type: 'application/json' }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [debouncedSave]);

  /**
   * Cancel debounced save and force save when switching problems
   */
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [currentProblemId, debouncedSave]);

  // Fetch all problems for dropdown (once on mount)
  useEffect(() => {
    const fetchAllProblems = async () => {
      try {
        const data = await getAllProblems();
        setAllProblems(data.problems || []);
      } catch (error) {
        console.error("Error fetching all problems:", error);
      }
    };
    fetchAllProblems();
  }, []);

  // Fetch problem data when problem ID changes
  useEffect(() => {
    fetchProblemData();
  }, [currentProblemId]);

  const fetchProblemData = async () => {
    setIsLoadingProblem(true);
    setIsLoadingSubmission(true); // Set both loading states together
    try {
      // Fetch problem details
      const { problem } = await getProblemById(currentProblemId);
      setCurrentProblem(problem);

      // Load preferred language
      try {
        const { preferredLanguage } = await getPreferredLanguage();
        setSelectedLanguage(preferredLanguage);
      } catch (error) {
        console.log("Could not load preferred language, using default");
      }
    } catch (error) {
      console.error("Error fetching problem:", error);
      toast.error("Failed to load problem");
    } finally {
      setIsLoadingProblem(false);
    }
  };

  // Load saved submission when problem loads
  useEffect(() => {
    if (currentProblem) {
      loadSavedSubmission();
    }
  }, [currentProblem, currentProblemId]);

  const loadSavedSubmission = async () => {
    if (!currentProblem) return;
    
    setIsLoadingSubmission(true);
    // Clear previous submission immediately when switching problems
    setSavedSubmission(null);
    setIsSolved(false);
    
    // Initialize with starter code for all languages
    const starterCodeForAllLangs = {
      javascript: currentProblem.starterCode?.javascript || "",
      python: currentProblem.starterCode?.python || "",
      java: currentProblem.starterCode?.java || ""
    };
    
    try {
      // First, try to load drafts for ALL languages
      let draftsLoaded = false;
      try {
        const draftResponse = await loadCodeDraft(currentProblemId);
        if (draftResponse.drafts && Object.keys(draftResponse.drafts).length > 0) {
          // We have drafts - merge them with starter code
          const drafts = draftResponse.drafts;
          const loadedCode = { ...starterCodeForAllLangs };
          let mostRecentLang = selectedLanguage;
          let mostRecentDate = null;
          
          for (const lang of Object.keys(drafts)) {
            if (drafts[lang] && drafts[lang].code) {
              loadedCode[lang] = drafts[lang].code;
              
              // Track most recently updated language
              const draftDate = new Date(drafts[lang].updatedAt);
              if (!mostRecentDate || draftDate > mostRecentDate) {
                mostRecentDate = draftDate;
                mostRecentLang = lang;
              }
            }
          }
          
          setAllLanguageCode(loadedCode);
          setSelectedLanguage(mostRecentLang);
          setLastSaved(mostRecentDate);
          draftsLoaded = true;
          console.log("📝 Loaded drafts from auto-save");
        }
      } catch (error) {
        console.log("No drafts found, checking submissions...");
      }

      // If no drafts, try to load submitted solution
      if (!draftsLoaded) {
        const response = await getMySubmission(currentProblemId);
        
        if (response.submission) {
          const submission = response.submission;
          
          // Set the submitted code for that specific language
          const loadedCode = { ...starterCodeForAllLangs };
          loadedCode[submission.language] = submission.code;
          
          setAllLanguageCode(loadedCode);
          setSelectedLanguage(submission.language);
          setSavedSubmission(submission);
          
          // Check if problem is solved (verdict is Accepted)
          if (submission.verdict === "Accepted") {
            setIsSolved(true);
          }
        } else {
          // No saved submission, use starter code
          setAllLanguageCode(starterCodeForAllLangs);
        }
      }
    } catch (error) {
      // No saved submission exists or error occurred
      console.log("No saved submission found, loading starter code");
      setAllLanguageCode(starterCodeForAllLangs);
    } finally {
      setIsLoadingSubmission(false);
    }
  };

  // update problem when URL param changes
  useEffect(() => {
    if (id) {
      setCurrentProblemId(id);
      setOutput(null);
      // Clear saved submission when switching problems
      setSavedSubmission(null);
      setIsSolved(false);
    }
  }, [id]);

  const handleLanguageChange = async (e) => {
    const newLang = e.target.value;
    
    // Force save current code before switching languages
    await forceSave();
    
    setSelectedLanguage(newLang);
    setOutput(null);
    
    // Try to load draft for the new language if not already loaded
    if (!allLanguageCode[newLang] || allLanguageCode[newLang] === "") {
      try {
        const draftResponse = await loadCodeDraft(currentProblemId, newLang);
        if (draftResponse.draft && draftResponse.draft.code) {
          setAllLanguageCode(prev => ({
            ...prev,
            [newLang]: draftResponse.draft.code
          }));
          setLastSaved(new Date(draftResponse.draft.updatedAt));
          console.log(`📝 Loaded ${newLang} draft`);
          return;
        }
      } catch (error) {
        console.log("No draft for this language");
      }
      
      // No draft - check for saved submission
      if (savedSubmission && savedSubmission.language === newLang) {
        setAllLanguageCode(prev => ({
          ...prev,
          [newLang]: savedSubmission.code
        }));
      } else {
        // Use starter code
        const starterCode = currentProblem?.starterCode?.[newLang] || "";
        setAllLanguageCode(prev => ({
          ...prev,
          [newLang]: starterCode
        }));
      }
    }
  };

  const handleProblemChange = async (newProblemId) => {
    // Force save before switching problems
    debouncedSave.cancel();
    await forceSave();
    navigate(`/problem/${newProblemId}`);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 250,
      origin: { x: 0.2, y: 0.6 },
    });

    confetti({
      particleCount: 80,
      spread: 250,
      origin: { x: 0.8, y: 0.6 },
    });
  };

  const handleRunCode = async () => {
    if (!currentProblem) {
      toast.error("Problem data not loaded yet");
      return;
    }

    // Get current language's code
    const currentCode = allLanguageCode[selectedLanguage];

    // Force save before running
    debouncedSave.cancel();
    await forceSave();

    setIsRunning(true);
    setOutput(null);

    try {
      // Use the new judge API to run against examples
      const result = await judgeRun(currentProblem._id, currentCode, selectedLanguage);
      
      // Transform result for OutputPanel
      const formattedOutput = {
        success: result.status === 'passed',
        results: result.results,
        summary: result.summary,
        // For backward compatibility with OutputPanel
        output: result.results?.map(r => 
          r.passed ? `✅ Test ${r.testCase}: Passed` : 
          r.error ? `❌ Test ${r.testCase}: ${r.error}` :
          `❌ Test ${r.testCase}: Expected ${r.expectedOutput}, got ${r.userOutput}`
        ).join('\n')
      };
      
      setOutput(formattedOutput);

      if (result.status === 'passed') {
        triggerConfetti();
        toast.success(`All ${result.summary.total} tests passed! Great job!`);
      } else if (result.status === 'error') {
        toast.error(`Error: ${result.results.find(r => r.error)?.error || 'Execution failed'}`);
      } else {
        toast.error(`${result.summary.failed} test(s) failed. Check your output!`);
      }
    } catch (error) {
      console.error("Run code error:", error);
      console.error("Error response:", error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || "Failed to run code";
      setOutput({
        success: false,
        output: errorMsg
      });
      toast.error(errorMsg);
    } finally {
      setIsRunning(false);
    }
  };

  // NEW: Handle submit code (run against hidden test cases & save to backend)
  const handleSubmitCode = async () => {
    // Get current language's code
    const currentCode = allLanguageCode[selectedLanguage];
    
    if (!currentCode.trim()) {
      toast.error("Code cannot be empty");
      return;
    }

    if (!currentProblem) {
      toast.error("Problem data not loaded yet");
      return;
    }

    // Force save before submitting
    debouncedSave.cancel();
    await forceSave();

    setIsSaving(true);

    try {
      // Use the judge API to run against ALL hidden test cases
      const result = await judgeSubmit(currentProblem._id, currentCode, selectedLanguage);
      
      // Format output for display
      const formattedOutput = {
        success: result.verdict === 'Accepted',
        verdict: result.verdict,
        passedCount: result.passedCount,
        totalCount: result.totalCount,
        failedTestCase: result.failedTestCase,
        output: result.verdict === 'Accepted' 
          ? `✅ Accepted! All ${result.totalCount} test cases passed.`
          : `❌ ${result.verdict}\n\nTest Case ${result.failedTestCase?.testCaseNumber}:\nInput: ${result.failedTestCase?.input}\nExpected: ${result.failedTestCase?.expectedOutput}\nYour Output: ${result.failedTestCase?.userOutput || 'N/A'}${result.failedTestCase?.error ? `\nError: ${result.failedTestCase.error}` : ''}`
      };
      
      setOutput(formattedOutput);

      if (result.verdict === 'Accepted') {
        setIsSolved(true);
        triggerConfetti();
        toast.success("🎉 Solution accepted!");
        
        // Also save to user's accepted submissions
        await saveSubmission(currentProblemId, {
          code: currentCode,
          language: selectedLanguage,
          verdict: "Accepted"
        });
        
        setSavedSubmission({ code: currentCode, language: selectedLanguage, verdict: "Accepted" });
      } else {
        toast.error(`${result.verdict}: ${result.passedCount}/${result.totalCount} tests passed`);
      }
    } catch (error) {
      console.error("Error submitting code:", error);
      setOutput({
        success: false,
        output: error.response?.data?.error || "Failed to submit code"
      });
      toast.error(error.response?.data?.error || "Failed to submit solution");
    } finally {
      setIsSaving(false);
    }
  };

  // Only show "Problem not found" if we're done loading and still no problem
  if (!currentProblem && !isLoadingProblem) {
    return (
      <div className="problem-page">
        <Navbar />
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 'calc(100vh - 80px)',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <p style={{ color: 'var(--text-secondary)' }}>Problem not found</p>
        </div>
      </div>
    );
  }

  // Don't render the page until we have problem data
  if (!currentProblem) {
    return null;
  }

  return (
    <div className="problem-page">
      <Navbar />

      <div className="problem-page-content">
        <PanelGroup direction="horizontal">
          {/* left panel- problem desc */}
          <Panel defaultSize={40} minSize={30}>
            <ProblemDescription
              problem={currentProblem}
              currentProblemId={currentProblemId}
              onProblemChange={handleProblemChange}
              allProblems={allProblems.map(p => ({ 
                id: p.slug || p._id, 
                title: p.title, 
                difficulty: p.difficulty 
              }))}
              isSolved={isSolved}
            />
          </Panel>

          <PanelResizeHandle className="resize-handle resize-handle-horizontal" />

          {/* right panel- code editor & output */}
          <Panel defaultSize={60} minSize={30}>
            <PanelGroup direction="vertical">
              {/* Top panel - Code editor */}
              <Panel defaultSize={70} minSize={30}>
                <CodeEditorPanel
                  selectedLanguage={selectedLanguage}
                  code={allLanguageCode[selectedLanguage] || ""}
                  allLanguageCode={allLanguageCode}
                  isRunning={isRunning}
                  isSaving={isSaving}
                  isAutoSaving={isAutoSaving}
                  lastSaved={lastSaved}
                  onLanguageChange={handleLanguageChange}
                  onCodeChange={handleCodeChange}
                  onRunCode={handleRunCode}
                  onSubmitCode={handleSubmitCode}
                />
              </Panel>

              <PanelResizeHandle className="resize-handle resize-handle-vertical" />

              {/* Bottom panel - Output Panel*/}

              <Panel defaultSize={30} minSize={30}>
                <OutputPanel output={output} />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default ProblemPage;
