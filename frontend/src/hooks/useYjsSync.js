import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";

/**
 * Hook that binds a Yjs document to a Monaco editor for real-time CRDT sync.
 *
 * @param {string} roomId - Session ID used as the Yjs room name
 * @param {object|null} editorInstance - Monaco editor instance (from onMount)
 * @param {object|null} monacoInstance - Monaco namespace (from onMount)
 * @param {boolean} enabled - Whether sync should be active
 * @param {string} initialCode - Starter code to seed into an empty Yjs doc
 * @returns {{ isYjsConnected: boolean, yText: Y.Text|null }}
 */
export function useYjsSync(roomId, editorInstance, monacoInstance, enabled = true, initialCode = "") {
  const docRef = useRef(null);
  const wsRef = useRef(null);
  const bindingRef = useRef(null);
  const [isYjsConnected, setIsYjsConnected] = useState(false);
  const reconnectTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const initialSyncDoneRef = useRef(false);
  const seedTimerRef = useRef(null);

  // Keep editor instance ref current for use in replaceAllContent
  const editorRef = useRef(editorInstance);
  editorRef.current = editorInstance;

  // Keep initialCode fresh via ref so the effect doesn't re-run on every keystroke
  const initialCodeRef = useRef(initialCode);
  initialCodeRef.current = initialCode;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!roomId || !editorInstance || !monacoInstance || !enabled) return;

    // Create Yjs document
    const doc = new Y.Doc();
    docRef.current = doc;
    const yText = doc.getText("monaco");
    initialSyncDoneRef.current = false;

    // Connect WebSocket to Yjs server
    function connect() {
      if (!mountedRef.current) return;

      // Clean up previous connection's update handler to prevent leaks
      if (wsRef.current && wsRef.current._updateHandler) {
        doc.off("update", wsRef.current._updateHandler);
      }

      // Reset sync flag so reconnect can re-establish binding if needed
      initialSyncDoneRef.current = false;

      const isDev = import.meta.env.DEV;
      const apiUrl = import.meta.env.VITE_API_URL;
      let wsUrl;

      if (isDev) {
        // In dev, Vite proxies /yjs to the backend
        const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${proto}//${window.location.host}/yjs?room=${roomId}`;
      } else {
        // In production, connect directly to backend
        const baseUrl = apiUrl ? apiUrl.replace("/api", "").replace("http", "ws") : "";
        wsUrl = `${baseUrl}/yjs?room=${roomId}`;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log("📝 Yjs WebSocket connected for room:", roomId);
        setIsYjsConnected(true);

        // Send sync step 1: our state vector
        const sv = Y.encodeStateVector(doc);
        const msg = new Uint8Array(sv.length + 1);
        msg[0] = 0; // sync step 1
        msg.set(sv, 1);
        ws.send(msg);
      };

      ws.onmessage = (event) => {
        try {
          const data = new Uint8Array(event.data);
          const msgType = data[0];
          const payload = data.slice(1);

          if (msgType === 1 || msgType === 2) {
            Y.applyUpdate(doc, payload, "remote");
          }

          // After the first sync step 2 from server:
          // 1. Create MonacoBinding immediately so incoming content renders
          // 2. Delay seeding starter code to avoid duplicates when multiple
          //    clients connect simultaneously to a fresh room
          if (msgType === 1 && !initialSyncDoneRef.current) {
            initialSyncDoneRef.current = true;

            // Create the Monaco binding FIRST so any existing/incoming content displays
            if (!bindingRef.current && editorInstance) {
              bindingRef.current = new MonacoBinding(
                yText,
                editorInstance.getModel(),
                new Set([editorInstance])
              );
            }

            // Delay seeding to let remote state arrive (prevents duplicate
            // starter code when host + participant connect at nearly the same time)
            if (seedTimerRef.current) clearTimeout(seedTimerRef.current);
            seedTimerRef.current = setTimeout(() => {
              if (!mountedRef.current) return;
              // Only seed if the doc is still empty after remote syncs have settled
              if (yText.length === 0 && initialCodeRef.current) {
                doc.transact(() => {
                  if (yText.length === 0) {
                    yText.insert(0, initialCodeRef.current);
                  }
                });
              }
            }, 500);
          }
        } catch (err) {
          console.error("Yjs message processing error:", err);
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        console.log("📝 Yjs WebSocket disconnected for room:", roomId);
        setIsYjsConnected(false);

        // Reconnect after 2 seconds
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connect();
          }
        }, 2000);
      };

      ws.onerror = (err) => {
        console.error("Yjs WebSocket error:", err);
        ws.close();
      };

      // Listen for local doc updates and send to server
      const updateHandler = (update, origin) => {
        // Only send updates originated locally (not from WebSocket/remote)
        if (origin === "remote" || origin === "ws" || origin === ws) return;
        if (ws.readyState === WebSocket.OPEN) {
          const msg = new Uint8Array(update.length + 1);
          msg[0] = 2; // incremental update
          msg.set(update, 1);
          ws.send(msg);
        }
      };
      doc.on("update", updateHandler);

      // Store cleanup ref
      ws._updateHandler = updateHandler;
    }

    connect();

    // NOTE: MonacoBinding is created inside onmessage after the first sync,
    // so the binding sees the seeded starter code (not an empty doc).

    return () => {
      // Cleanup
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      if (seedTimerRef.current) {
        clearTimeout(seedTimerRef.current);
      }

      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }

      if (wsRef.current) {
        const ws = wsRef.current;
        if (ws._updateHandler) {
          doc.off("update", ws._updateHandler);
        }
        ws.onclose = null; // prevent reconnect on intentional close
        ws.close();
        wsRef.current = null;
      }

      doc.destroy();
      docRef.current = null;
      setIsYjsConnected(false);
    };
  }, [roomId, editorInstance, monacoInstance, enabled]);

  /**
   * Atomically replace all content in the Yjs document.
   * Used when switching languages to set new starter code.
   * This propagates to all connected clients via CRDT sync.
   *
   * To avoid MonacoBinding delta-processing bugs that leave trailing
   * characters (extra brackets) after delete+insert, we:
   *   1. Destroy the MonacoBinding
   *   2. Replace Y.Text content (for CRDT sync to other clients)
   *   3. Set the Monaco model value directly (for immediate local display)
   *   4. Re-create the MonacoBinding (for continued real-time sync)
   */
  const replaceAllContent = useCallback((newContent) => {
    const doc = docRef.current;
    if (!doc) return;
    const yText = doc.getText("monaco");
    const editor = editorRef.current;

    // 1. Destroy MonacoBinding to prevent any feedback loops
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    // 2. Replace Y.Text content atomically (syncs to all CRDT clients)
    doc.transact(() => {
      if (yText.length > 0) {
        yText.delete(0, yText.length);
      }
      if (newContent) {
        yText.insert(0, newContent);
      }
    });

    // 3. Set Monaco model value directly (instant local display, no delta issues)
    if (editor) {
      const model = editor.getModel();
      if (model) {
        model.setValue(newContent || "");
      }
    }

    // 4. Re-create MonacoBinding for continued real-time sync
    if (editor && editor.getModel()) {
      bindingRef.current = new MonacoBinding(
        yText,
        editor.getModel(),
        new Set([editor])
      );
    }
  }, []);

  /**
   * Get the current content of the Yjs document.
   * Returns the authoritative text (not the React state which may be stale).
   */
  const getContent = useCallback(() => {
    const doc = docRef.current;
    if (!doc) return "";
    return doc.getText("monaco").toString();
  }, []);

  return {
    isYjsConnected,
    yText: docRef.current?.getText("monaco") || null,
    replaceAllContent,
    getContent,
  };
}
