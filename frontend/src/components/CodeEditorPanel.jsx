import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Loader2Icon, PlayIcon, Save, Cloud, CloudOff } from "lucide-react";
import { LANGUAGE_CONFIG } from "../data/problems";
import { useTheme } from "../context/ThemeContext";
import { useMonacoModels } from "../hooks/useMonacoModels";

function CodeEditorPanel({
  selectedLanguage,
  code,
  isRunning,
  isSaving,
  isAutoSaving,
  lastSaved,
  onLanguageChange,
  onCodeChange,
  onRunCode,
  onSubmitCode,
  // New props for multi-language support
  allLanguageCode = {}, // { javascript: "code", python: "code", java: "code" }
}) {
  const { isDark } = useTheme();
  const editorRef = useRef(null);
  
  // Initialize Monaco multi-model manager
  const {
    initializeMonaco,
    switchLanguage,
    updateModelCode,
    getModelCode,
    disposeAllModels,
  } = useMonacoModels();

  // Track if models have been initialized
  const modelsInitializedRef = useRef(false);

  // Safely get language config with a JavaScript fallback
  const getLangConfig = (langKey) => {
    if (!langKey) return LANGUAGE_CONFIG.javascript;
    return LANGUAGE_CONFIG[langKey] || LANGUAGE_CONFIG.javascript;
  };

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diff = Math.floor((now - lastSaved) / 1000);
    
    if (diff < 5) return "Just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastSaved.toLocaleTimeString();
  };

  /**
   * Handle editor mount - initialize Monaco and create models
   */
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Initialize multi-model system
    initializeMonaco(editor, monaco);

    // Define custom themes
    monaco.editor.defineTheme('talent-iq-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'C678DD' },
        { token: 'string', foreground: '98C379' },
        { token: 'number', foreground: 'D19A66' },
        { token: 'comment', foreground: '5C6370', fontStyle: 'italic' },
        { token: 'type', foreground: 'E5C07B' },
        { token: 'function', foreground: '61AFEF' },
        { token: 'variable', foreground: 'E06C75' },
      ],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#ABB2BF',
        'editor.lineHighlightBackground': '#0D0D0D',
        'editor.selectionBackground': '#264F78',
        'editorCursor.foreground': '#528BFF',
        'editorLineNumber.foreground': '#495162',
        'editorLineNumber.activeForeground': '#737373',
        'editor.inactiveSelectionBackground': '#3A3D41',
      }
    });

    monaco.editor.defineTheme('talent-iq-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0000FF' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'type', foreground: '267F99' },
        { token: 'function', foreground: '795E26' },
        { token: 'variable', foreground: '001080' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#F0F0F0',
        'editor.selectionBackground': '#ADD6FF',
        'editorCursor.foreground': '#000000',
        'editorLineNumber.foreground': '#237893',
        'editorLineNumber.activeForeground': '#0B216F',
      }
    });

    // Create models for all languages with their respective code
    // This happens once when editor mounts
    Object.keys(LANGUAGE_CONFIG).forEach(lang => {
      const langConfig = getLangConfig(lang);
      const langCode = allLanguageCode[lang] || code || "";
      updateModelCode(lang, langConfig.monacoLang, langCode);
    });

    // Switch to the selected language (with safe fallback)
    const initialLangConfig = getLangConfig(selectedLanguage);
    switchLanguage(selectedLanguage || "javascript", initialLangConfig.monacoLang, code);

    modelsInitializedRef.current = true;

    // Listen to content changes and propagate to parent
    editor.onDidChangeModelContent(() => {
      const currentCode = editor.getValue();
      onCodeChange?.(currentCode);
    });
  };

  /**
   * Handle language change from dropdown
   */
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    const langConfig = getLangConfig(newLanguage);
    
    // Get code for this language (from allLanguageCode or empty)
    const languageCode = allLanguageCode[newLanguage] || "";
    
    // Switch to the new language model
    switchLanguage(newLanguage, langConfig.monacoLang, languageCode);
    
    // Notify parent component
    onLanguageChange?.(e);
  };

  /**
   * Update model code when external code changes (e.g., loading from server)
   * Only update the current language model
   */
  useEffect(() => {
    if (!modelsInitializedRef.current) return;
    
    const currentModelCode = getModelCode(selectedLanguage || "javascript");
    
    // Only update if code is different (prevents infinite loops)
    if (currentModelCode !== code) {
      const langConfig = getLangConfig(selectedLanguage);
      updateModelCode(selectedLanguage || "javascript", langConfig.monacoLang, code);
    }
  }, [code, selectedLanguage]);

  /**
   * Cleanup: dispose all models when component unmounts
   */
  useEffect(() => {
    return () => {
      disposeAllModels();
    };
  }, [disposeAllModels]);

  return (
    <div className="code-editor-panel">
      <div className="editor-toolbar">
        <div className="editor-controls">
          <img
            src={getLangConfig(selectedLanguage).icon}
            alt={getLangConfig(selectedLanguage).name}
            className="language-icon"
          />
          <select 
            className="language-selector" 
            value={selectedLanguage} 
            onChange={handleLanguageChange}
          >
            {Object.entries(LANGUAGE_CONFIG).map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="editor-actions">
          {/* Auto-save status indicator */}
          <div className="auto-save-status" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginRight: '12px'
          }}>
            {isAutoSaving ? (
              <>
                <Loader2Icon size={14} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                <span>Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Cloud size={14} style={{ color: 'var(--accent-primary)' }} />
                <span>Saved</span>
              </>
            ) : (
              <>
                <CloudOff size={14} />
                <span>Not saved</span>
              </>
            )}
          </div>

          <button 
            className="run-code-btn" 
            disabled={isRunning || isSaving} 
            onClick={onRunCode}
          >
            {isRunning ? (
              <>
                <Loader2Icon className="btn-icon animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayIcon className="btn-icon" />
                Run Code
              </>
            )}
          </button>

          {onSubmitCode && (
            <button 
              className="submit-code-btn" 
              disabled={isRunning || isSaving} 
              onClick={onSubmitCode}
            >
              {isSaving ? (
                <>
                  <Loader2Icon className="btn-icon animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="btn-icon" />
                  Submit
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="editor-container">
        <Editor
          height="100%"
          defaultLanguage={getLangConfig(selectedLanguage).monacoLang}
          defaultValue=""
          theme={isDark ? "talent-iq-dark" : "talent-iq-light"}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            minimap: { enabled: false },
            fontFamily: 'Consolas, "Courier New", monospace',
            padding: { top: 16, bottom: 16 },
            lineHeight: 20,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
        />
      </div>
    </div>
  );
}
export default CodeEditorPanel;
