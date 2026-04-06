import { useRef, useCallback } from 'react';

/**
 * Custom hook for managing separate Monaco Editor models per language
 * 
 * WHY THIS IS NEEDED:
 * - Monaco Editor's undo/redo stack is tied to the MODEL, not the editor instance
 * - Using editor.updateOptions({ language }) switches language but keeps the same model
 * - This causes undo history to leak between languages
 * - Switching tabs can show wrong code or undo to previous language's code
 * 
 * SOLUTION:
 * - Create separate monaco.editor.createModel() for each language
 * - Use editor.setModel() when switching languages
 * - Each model maintains its own:
 *   - Content (code)
 *   - Undo/redo stack (completely independent)
 *   - View state (cursor position, scroll position)
 * 
 * @returns {Object} Hook methods for model management
 */
export function useMonacoModels() {
  // Store Monaco instance reference
  const monacoRef = useRef(null);
  
  // Store editor instance reference
  const editorRef = useRef(null);
  
  // Store all models: { javascript: model, python: model, java: model }
  const modelsRef = useRef({});
  
  // Store view states: { javascript: viewState, python: viewState, java: viewState }
  const viewStatesRef = useRef({});
  
  // Track current language
  const currentLanguageRef = useRef(null);

  /**
   * Initialize the Monaco environment
   * Call this from onMount callback of Monaco Editor
   */
  const initializeMonaco = useCallback((editor, monaco) => {
    monacoRef.current = monaco;
    editorRef.current = editor;
    
    console.log('✅ Monaco initialized with multi-model support');
  }, []);

  /**
   * Create or get a model for a specific language
   * Models are created lazily (only when needed)
   */
  const getOrCreateModel = useCallback((language, monacoLang, initialCode = '') => {
    if (!monacoRef.current) {
      console.warn('Monaco not initialized yet');
      return null;
    }

    // If model already exists, return it
    if (modelsRef.current[language]) {
      return modelsRef.current[language];
    }

    // Create new model for this language
    const model = monacoRef.current.editor.createModel(
      initialCode,
      monacoLang
    );

    modelsRef.current[language] = model;
    console.log(`📝 Created new model for ${language}`);
    
    return model;
  }, []);

  /**
   * Switch to a different language
   * This is the KEY function that prevents undo stack leaking
   * 
   * @param {string} language - The language key (javascript, python, java)
   * @param {string} monacoLang - Monaco language identifier (javascript, python, java)
   * @param {string} code - Initial code for this language (if model doesn't exist)
   */
  const switchLanguage = useCallback((language, monacoLang, code = '') => {
    if (!editorRef.current || !monacoRef.current) {
      console.warn('Editor not ready for language switch');
      return;
    }

    // Save current view state before switching
    if (currentLanguageRef.current) {
      const currentViewState = editorRef.current.saveViewState();
      viewStatesRef.current[currentLanguageRef.current] = currentViewState;
      console.log(`💾 Saved view state for ${currentLanguageRef.current}`);
    }

    // Get or create model for target language
    const model = getOrCreateModel(language, monacoLang, code);
    
    if (!model) {
      console.error('Failed to get/create model');
      return;
    }

    // Switch the editor to use this model
    editorRef.current.setModel(model);
    console.log(`🔄 Switched to ${language} model`);

    // Restore saved view state (cursor position, scroll position)
    const savedViewState = viewStatesRef.current[language];
    if (savedViewState) {
      editorRef.current.restoreViewState(savedViewState);
      console.log(`📍 Restored view state for ${language}`);
    } else {
      // No saved state, move cursor to end
      const lineCount = model.getLineCount();
      editorRef.current.setPosition({ lineNumber: lineCount, column: 1 });
    }

    // Focus the editor
    editorRef.current.focus();
    
    // Update current language tracker
    currentLanguageRef.current = language;
  }, [getOrCreateModel]);

  /**
   * Update code in a specific language's model
   * Call this when loading saved code from server
   */
  const updateModelCode = useCallback((language, monacoLang, newCode) => {
    const model = getOrCreateModel(language, monacoLang, newCode);
    
    if (!model) return;

    // Only update if code is different (prevents unnecessary undo entries)
    if (model.getValue() !== newCode) {
      // Push edit operation that can be undone
      model.pushEditOperations(
        [],
        [{
          range: model.getFullModelRange(),
          text: newCode
        }],
        () => null
      );
      console.log(`📝 Updated code for ${language}`);
    }
  }, [getOrCreateModel]);

  /**
   * Get current code from a specific language model
   */
  const getModelCode = useCallback((language) => {
    const model = modelsRef.current[language];
    return model ? model.getValue() : '';
  }, []);

  /**
   * Get code for all languages
   * Useful for saving all code at once
   */
  const getAllCode = useCallback(() => {
    const allCode = {};
    for (const [language, model] of Object.entries(modelsRef.current)) {
      allCode[language] = model.getValue();
    }
    return allCode;
  }, []);

  /**
   * Clear undo stack for a specific language
   * Useful after loading saved code to prevent undoing to blank state
   */
  const clearUndoStack = useCallback((language) => {
    const model = modelsRef.current[language];
    if (model) {
      // Clear both undo and redo stacks
      model.pushEditOperations([], [], () => null);
      console.log(`🗑️ Cleared undo stack for ${language}`);
    }
  }, []);

  /**
   * Dispose all models when component unmounts
   * Prevents memory leaks
   */
  const disposeAllModels = useCallback(() => {
    for (const [language, model] of Object.entries(modelsRef.current)) {
      model.dispose();
      console.log(`🗑️ Disposed model for ${language}`);
    }
    modelsRef.current = {};
    viewStatesRef.current = {};
    currentLanguageRef.current = null;
  }, []);

  return {
    initializeMonaco,
    switchLanguage,
    updateModelCode,
    getModelCode,
    getAllCode,
    clearUndoStack,
    disposeAllModels,
    currentLanguage: currentLanguageRef.current,
  };
}
