import { WebSocketServer } from "ws";
import * as Y from "yjs";
import { ENV } from "./env.js";

/**
 * Yjs collaboration documents store.
 * Map<roomName, Y.Doc>
 *
 * Each room corresponds to a session. The Y.Doc holds a Y.Text named "monaco"
 * that the clients bind to their Monaco editor via y-monaco.
 */
const docs = new Map();

function getYDoc(roomName) {
  if (!docs.has(roomName)) {
    const doc = new Y.Doc();
    docs.set(roomName, doc);
  }
  return docs.get(roomName);
}

/**
 * Attach a lightweight Yjs WebSocket server to the existing HTTP server.
 * Clients connect to ws://<host>:<port>/yjs?room=<sessionId>
 *
 * This is a minimal Yjs sync server (sync protocol v1).
 * It keeps a Y.Doc per room in memory and syncs binary updates to all
 * connected clients. No database persistence — the existing Socket.IO
 * periodic save still handles that.
 */
export function initializeYjsServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgrade manually so we don't conflict with Socket.IO
  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    // Only handle /yjs path — let Socket.IO handle /socket.io
    if (url.pathname === "/yjs") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
    // Don't destroy the socket for other paths (Socket.IO needs /socket.io)
  });

  wss.on("connection", (ws, request) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const room = url.searchParams.get("room");

    if (!room) {
      ws.close(1008, "Missing room parameter");
      return;
    }

    const doc = getYDoc(room);

    // Track connections per room for cleanup
    if (!doc._wsClients) doc._wsClients = new Set();
    doc._wsClients.add(ws);

    console.log(`📝 Yjs client connected to room: ${room} (${doc._wsClients.size} clients)`);

    // Send full doc state to the newly connected client
    const stateVector = Y.encodeStateVector(doc);
    const diff = Y.encodeStateAsUpdate(doc);

    // Protocol: first byte is message type
    // 0 = sync step 1 (state vector), 1 = sync step 2 (update), 2 = update
    const syncStep2 = new Uint8Array(diff.length + 1);
    syncStep2[0] = 1; // sync step 2
    syncStep2.set(diff, 1);
    ws.send(syncStep2);

    // Listen for updates from this client
    ws.on("message", (data) => {
      try {
        const message = new Uint8Array(data);
        const msgType = message[0];
        const payload = message.slice(1);

        if (msgType === 0) {
          // Sync step 1: client sends state vector, we respond with missing updates
          const update = Y.encodeStateAsUpdate(doc, payload);
          const response = new Uint8Array(update.length + 1);
          response[0] = 1; // sync step 2
          response.set(update, 1);
          ws.send(response);
        } else if (msgType === 1 || msgType === 2) {
          // Sync step 2 or incremental update: apply to doc
          // Use ws as origin so the broadcast handler skips the sender
          Y.applyUpdate(doc, payload, ws);
        }
      } catch (err) {
        console.error("Yjs message error:", err);
      }
    });

    // When doc is updated (from any source), broadcast to all other clients in the room
    const updateHandler = (update, origin) => {
      if (origin === ws) return; // Don't echo back to sender
      const message = new Uint8Array(update.length + 1);
      message[0] = 2; // incremental update
      message.set(update, 1);
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    };
    doc.on("update", updateHandler);

    ws.on("close", () => {
      doc.off("update", updateHandler);
      doc._wsClients.delete(ws);
      console.log(`📝 Yjs client disconnected from room: ${room} (${doc._wsClients.size} clients)`);

      // Clean up empty rooms after a delay
      if (doc._wsClients.size === 0) {
        setTimeout(() => {
          if (doc._wsClients && doc._wsClients.size === 0) {
            docs.delete(room);
            doc.destroy();
            console.log(`📝 Yjs room cleaned up: ${room}`);
          }
        }, 30000);
      }
    });

    ws.on("error", (err) => {
      console.error(`Yjs WebSocket error in room ${room}:`, err.message);
    });
  });

  console.log("📝 Yjs WebSocket server initialized on /yjs path");
  return wss;
}

/**
 * Get the current text content from a Yjs room (for periodic saves).
 * Returns null if room doesn't exist.
 */
export function getYjsRoomText(roomName) {
  const doc = docs.get(roomName);
  if (!doc) return null;
  return doc.getText("monaco").toString();
}
