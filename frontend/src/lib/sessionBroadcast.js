/**
 * sessionBroadcast.js
 *
 * Cross-tab session synchronisation via the BroadcastChannel API.
 *
 * When a user leaves or a host ends a session in one tab, all other tabs
 * that have the same session open must also vacate it so the user isn't
 * left "stuck" in a stale session view while the DB no longer shows them
 * as a participant.
 *
 * Usage:
 *   import { broadcastSessionLeave, broadcastSessionEnd, onSessionBroadcast } from './sessionBroadcast';
 *
 *   // Caller tab — after a successful leave/end:
 *   broadcastSessionLeave(sessionId);
 *
 *   // All tabs (including caller) — subscribe:
 *   const unsub = onSessionBroadcast((event) => {
 *     if (event.type === 'SESSION_LEFT' && event.sessionId === currentId) navigate('/dashboard');
 *     if (event.type === 'SESSION_ENDED' && event.sessionId === currentId) navigate('/dashboard');
 *   });
 *   // Call unsub() to clean up.
 */

const CHANNEL_NAME = "talentiq-session-sync";

function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null; // SSR / very old browsers
  return new BroadcastChannel(CHANNEL_NAME);
}

/** Broadcast that the current user left a session (all their other tabs should leave too). */
export function broadcastSessionLeave(sessionId) {
  const ch = getChannel();
  if (!ch) return;
  ch.postMessage({ type: "SESSION_LEFT", sessionId });
  ch.close();
}

/** Broadcast that a session was ended by the host (all participants should leave). */
export function broadcastSessionEnd(sessionId) {
  const ch = getChannel();
  if (!ch) return;
  ch.postMessage({ type: "SESSION_ENDED", sessionId });
  ch.close();
}

/**
 * Subscribe to session broadcast events.
 * Returns an unsubscribe function — call it in a useEffect cleanup.
 *
 * @param {(event: { type: string, sessionId: string }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onSessionBroadcast(handler) {
  const ch = getChannel();
  if (!ch) return () => {};

  const listener = (e) => handler(e.data);
  ch.addEventListener("message", listener);

  return () => {
    ch.removeEventListener("message", listener);
    ch.close();
  };
}
