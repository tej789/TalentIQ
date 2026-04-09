import { useEffect, useRef, useCallback, memo, useState } from "react";
import Editor from "@monaco-editor/react";
import { Loader2Icon, PlayIcon, Save, Cloud, CloudOff, LockIcon, UnlockIcon } from "lucide-react";
import { LANGUAGE_CONFIG } from "../data/problems";
import { useTheme } from "../context/ThemeContext";
import { useSocket } from "../context/SocketContext";

/**
 * CollaborativeEditor wraps Monaco Editor with real-time
 * cursor presence and code sync capabilities.
 */
function CollaborativeEditor({
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
  // Collaboration props
  canEdit = true,
  cursors = {},
  onCursorUpdate,
  isHost = false,
  connectedUsers = {},
  sessionId,
}) {
  const { isDark } = useTheme();
  const { socket, emit, isConnected } = useSocket();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const [editorReady, setEditorReady] = useState(false);
  const prevLanguageRef = useRef(selectedLanguage);
  const isRemoteUpdateRef = useRef(false);

  // Keep code prop in a ref for language-change effect (avoids re-running effect on every keystroke)
  const codeRef = useRef(code);
  codeRef.current = code;

  // When language changes, replace editor content with new code for that language
  // using the controlled code prop.
  useEffect(() => {
    if (prevLanguageRef.current === selectedLanguage) return;
    prevLanguageRef.current = selectedLanguage;

    // Directly set model content for the new language
    const editor = editorRef.current;
    if (editor && typeof codeRef.current === "string") {
      const model = editor.getModel();
      if (model) {
        const previousSelection = editor.getSelection();
        const previousPosition = editor.getPosition();
        const fullRange = model.getFullModelRange();

        isRemoteUpdateRef.current = true;
        editor.executeEdits("language-change", [
          {
            range: fullRange,
            text: codeRef.current,
            forceMoveMarkers: true,
          },
        ]);
        isRemoteUpdateRef.current = false;

        if (previousSelection) {
          editor.setSelection(previousSelection);
        }
        if (previousPosition) {
          editor.setPosition(previousPosition);
        }
      }
    }
  }, [selectedLanguage, sessionId]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom themes
    monaco.editor.defineTheme("collab-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "C678DD" },
        { token: "string", foreground: "98C379" },
        { token: "number", foreground: "D19A66" },
        { token: "comment", foreground: "5C6370", fontStyle: "italic" },
        { token: "type", foreground: "E5C07B" },
        { token: "function", foreground: "61AFEF" },
        { token: "variable", foreground: "E06C75" },
      ],
      colors: {
        "editor.background": "#0A0A0A",
        "editor.foreground": "#ABB2BF",
        "editor.lineHighlightBackground": "#111111",
        "editor.selectionBackground": "#264F78",
        "editorCursor.foreground": "#528BFF",
        "editorLineNumber.foreground": "#495162",
        "editorLineNumber.activeForeground": "#737373",
      },
    });

    monaco.editor.defineTheme("collab-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "0000FF" },
        { token: "string", foreground: "A31515" },
        { token: "number", foreground: "098658" },
        { token: "comment", foreground: "008000", fontStyle: "italic" },
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#000000",
        "editor.lineHighlightBackground": "#F0F0F0",
        "editor.selectionBackground": "#ADD6FF",
      },
    });

    monaco.editor.setTheme(isDark ? "collab-dark" : "collab-light");

    // Listen for cursor changes
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorUpdate) {
        const selection = editor.getSelection();
        onCursorUpdate(
          { lineNumber: e.position.lineNumber, column: e.position.column },
          selection
            ? {
                startLineNumber: selection.startLineNumber,
                startColumn: selection.startColumn,
                endLineNumber: selection.endLineNumber,
                endColumn: selection.endColumn,
              }
            : null
        );
      }
    });

    // Listen for content changes to emit Monaco deltas and update parent code
    editor.onDidChangeModelContent((event) => {
      const model = editor.getModel();
      const newValue = model ? model.getValue() : "";

      if (isRemoteUpdateRef.current) {
        // Remote update: update local code state but do NOT emit back over socket
        onCodeChange?.(newValue);
        return;
      }

      // Local change: push new value up and emit deltas
      onCodeChange?.(newValue);

      if (!sessionId || !isConnected) return;
      const changes = event.changes || [];
      if (!changes.length) return;

      emit("session:code_delta", {
        sessionId,
        changes,
      });
    });

    setEditorReady(true);
  };

  // Update readOnly when canEdit changes (without recreating editor)
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: !canEdit });
    }
  }, [canEdit]);

  // Render remote cursors as decorations
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const newDecorations = [];

    Object.entries(cursors).forEach(([socketId, cursor]) => {
      if (!cursor.position) return;

      const { position, selection, color, userName } = cursor;

      // Cursor line decoration
      newDecorations.push({
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column + 1),
        options: {
          className: `remote-cursor`,
          hoverMessage: { value: userName || "Collaborator" },
          beforeContentClassName: `remote-cursor-marker`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });

      // Selection highlighting
      if (selection && (selection.startLineNumber !== selection.endLineNumber || selection.startColumn !== selection.endColumn)) {
        newDecorations.push({
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          options: {
            className: "remote-selection",
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      }
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [cursors]);

  // Update theme when it changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(isDark ? "collab-dark" : "collab-light");
    }
  }, [isDark]);

  // Keep Monaco model in sync with the latest code prop (including remote updates)
  useEffect(() => {
    if (!editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const currentValue = model.getValue();
    if (typeof code === "string" && code !== currentValue) {
      const editor = editorRef.current;
      const previousSelection = editor.getSelection();
      const previousPosition = editor.getPosition();
      const fullRange = model.getFullModelRange();

      isRemoteUpdateRef.current = true;
      editor.executeEdits("prop-sync", [
        {
          range: fullRange,
          text: code,
          forceMoveMarkers: true,
        },
      ]);
      isRemoteUpdateRef.current = false;

      if (previousSelection) {
        editor.setSelection(previousSelection);
      }
      if (previousPosition) {
        editor.setPosition(previousPosition);
      }
    }
  }, [code]);

  // Apply remote deltas from other collaborators using Monaco executeEdits
  useEffect(() => {
    if (!socket || !sessionId) return;

    const handleCodeDelta = (data) => {
      if (!data || data.sessionId !== sessionId) return;
      const { changes } = data;
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco || !Array.isArray(changes) || !changes.length) return;

      const model = editor.getModel();
      if (!model) return;

      const edits = changes.map((change) => {
        const { range, text } = change || {};
        if (!range) return null;
        const safeRange = new monaco.Range(
          range.startLineNumber,
          range.startColumn,
          range.endLineNumber,
          range.endColumn
        );
        return {
          range: safeRange,
          text: text ?? "",
          forceMoveMarkers: true,
        };
      }).filter(Boolean);

      if (!edits.length) return;

      isRemoteUpdateRef.current = true;
      editor.executeEdits("remote", edits);
      isRemoteUpdateRef.current = false;
    };

    socket.on("session:code_delta", handleCodeDelta);
    return () => {
      socket.off("session:code_delta", handleCodeDelta);
    };
  }, [socket, sessionId]);

  return (
    <div className="collab-editor-panel">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="editor-controls">
          <img
            src={LANGUAGE_CONFIG[selectedLanguage]?.icon}
            alt={LANGUAGE_CONFIG[selectedLanguage]?.name}
            className="language-icon"
          />
          <select
            className="language-selector"
            value={selectedLanguage}
            onChange={onLanguageChange}
            disabled={!canEdit}
          >
            {Object.entries(LANGUAGE_CONFIG).map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.name}
              </option>
            ))}
          </select>

          {/* Edit permission indicator */}
          <div className="flex items-center gap-1.5 ml-3">
            {canEdit ? (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <UnlockIcon className="w-3 h-3" />
                Can Edit
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <LockIcon className="w-3 h-3" />
                View Only
              </span>
            )}
          </div>

          {/* Connected users indicator */}
          {Object.keys(connectedUsers).length > 0 && (
            <div className="flex items-center gap-1 ml-3">
              <div className="flex -space-x-1">
                {Object.values(connectedUsers)
                  .slice(0, 3)
                  .map((u, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-bg-primary flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: u.color || "#4ECDC4" }}
                      title={u.userName}
                    >
                      {u.userName?.[0]?.toUpperCase() || "?"}
                    </div>
                  ))}
              </div>
              {Object.keys(connectedUsers).length > 3 && (
                <span className="text-[10px] text-text-muted">
                  +{Object.keys(connectedUsers).length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="editor-actions">
          {/* Auto-save status */}
          <div
            className="auto-save-status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: "var(--text-muted)",
              marginRight: "12px",
            }}
          >
            {isAutoSaving ? (
              <>
                <Loader2Icon size={14} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
                <span>Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Cloud size={14} style={{ color: "var(--accent-primary)" }} />
                <span>Saved</span>
              </>
            ) : (
              <>
                <CloudOff size={14} />
                <span>Not saved</span>
              </>
            )}
          </div>

          <button className="run-code-btn" disabled={isRunning || isSaving} onClick={onRunCode}>
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
            <button className="submit-code-btn" disabled={isRunning || isSaving} onClick={onSubmitCode}>
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

      {/* Editor */}
      <div className="editor-container">
        <Editor
          height="100%"
          language={LANGUAGE_CONFIG[selectedLanguage]?.monacoLang || "javascript"}
          defaultValue={code}
          theme={isDark ? "collab-dark" : "collab-light"}
          onMount={handleEditorDidMount}
          options={{
            readOnly: !canEdit,
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            minimap: { enabled: false },
            fontFamily: 'Consolas, "Courier New", monospace',
            padding: { top: 16, bottom: 16 },
            lineHeight: 20,
            scrollbar: {
              vertical: "visible",
              horizontal: "visible",
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            renderLineHighlight: "all",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
          }}
        />
      </div>
    </div>
  );
}

export default memo(CollaborativeEditor);
