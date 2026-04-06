import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";

/**
 * Hook for real-time collaborative editing within a session.
 * Manages code sync, cursor presence, and permission state.
 */
export function useCollaboration(sessionId, userId, userName, userImage, isHost) {
  const { socket, emit, on, off, isConnected } = useSocket();

  // Code state synced across all participants
  const [remoteCode, setRemoteCode] = useState("");
  const [remoteLanguage, setRemoteLanguage] = useState("javascript");

  // Per-language code map from server
  const [languageCode, setLanguageCode] = useState({});

  // Saved code for the new language from remote language change
  const [remoteSavedCode, setRemoteSavedCode] = useState(null);

  // Cursor positions of other participants
  const [cursors, setCursors] = useState({});

  // Connected users in the session
  const [connectedUsers, setConnectedUsers] = useState({});

  // Permission state
  const [canEdit, setCanEdit] = useState(isHost);
  const [permissions, setPermissions] = useState({}); // { [userId]: { canEdit, canScreenShare } }

  // Screen share state
  const [screenShareUser, setScreenShareUser] = useState(null);

  // Kicked state
  const [isKicked, setIsKicked] = useState(false);

  // Session ended state
  const [sessionEnded, setSessionEnded] = useState(false);

  // Rejected: user is already in another active session
  const [joinRejected, setJoinRejected] = useState(null); // { message, existingSessionId }

  // Debounce refs for code updates
  const codeUpdateTimerRef = useRef("");
  const lastSentCodeRef = useRef("");

  // Join the session room
  useEffect(() => {
    if (!isConnected || !sessionId || !userId) return;

    emit("session:join", {
      sessionId,
      userId,
      userName,
      userImage,
    });
  }, [isConnected, sessionId, userId, userName, userImage, emit]);

  // Listen for events
  useEffect(() => {
    if (!socket) return;

    // Receive initial state on join
    const handleState = (data) => {
      if (data.code) setRemoteCode(data.code);
      if (data.language) setRemoteLanguage(data.language);
      if (data.languageCode) setLanguageCode(data.languageCode);
      if (data.users) setConnectedUsers(data.users);
      if (data.cursors) setCursors(data.cursors);
    };

    // NOTE: Code sync is now handled by Yjs CRDT.
    // session:code_update listener removed — no longer needed for real-time sync.

    // Cursor updates from others
    const handleCursorUpdate = (data) => {
      if (data.socketId !== socket.id) {
        setCursors((prev) => ({
          ...prev,
          [data.socketId]: {
            userId: data.userId,
            userName: data.userName,
            position: data.position,
            selection: data.selection,
            color: data.color,
          },
        }));
      }
    };

    // Language change
    const handleLanguageChange = (data) => {
      setRemoteLanguage(data.language);
      // If server sent savedCode for the new language, pass it along
      if (data.savedCode !== undefined && data.savedCode !== null) {
        setRemoteSavedCode(data.savedCode);
      } else {
        setRemoteSavedCode(null);
      }
    };

    // User joined
    const handleUserJoined = (data) => {
      if (data.users) setConnectedUsers(data.users);
    };

    // User left
    const handleUserLeft = (data) => {
      if (data.users) setConnectedUsers(data.users);
      // Clean up cursor
      if (data.socketId) {
        setCursors((prev) => {
          const next = { ...prev };
          delete next[data.socketId];
          return next;
        });
      }
    };

    // Permission updates
    const handlePermissionUpdate = (data) => {
      setPermissions((prev) => ({
        ...prev,
        [data.targetUserId]: {
          ...prev[data.targetUserId],
          canEdit: data.canEdit,
        },
      }));
      // If this is about us
      if (data.targetUserId === userId) {
        setCanEdit(data.canEdit);
      }
    };

    // Screen share
    const handleScreenShareStart = (data) => {
      setScreenShareUser(data);
    };

    const handleScreenShareStop = () => {
      setScreenShareUser(null);
    };

    const handleScreenSharePermission = (data) => {
      setPermissions((prev) => ({
        ...prev,
        [data.targetUserId]: {
          ...prev[data.targetUserId],
          canScreenShare: data.canScreenShare,
        },
      }));
    };

    // Kicked
    const handleKicked = () => {
      setIsKicked(true);
    };

    // Session ended
    const handleEnded = () => {
      setSessionEnded(true);
    };

    // Rejected — user is already in a different active session
    const handleJoinRejected = (data) => {
      setJoinRejected(data);
    };

    on("session:state", handleState);
    on("session:cursor_update", handleCursorUpdate);
    on("session:language_change", handleLanguageChange);
    on("session:user_joined", handleUserJoined);
    on("session:user_left", handleUserLeft);
    on("session:permission_update", handlePermissionUpdate);
    on("session:screen_share_start", handleScreenShareStart);
    on("session:screen_share_stop", handleScreenShareStop);
    on("session:screen_share_permission", handleScreenSharePermission);
    on("session:kicked", handleKicked);
    on("session:ended", handleEnded);
    on("session:join_rejected", handleJoinRejected);

    return () => {
      off("session:state", handleState);
      off("session:cursor_update", handleCursorUpdate);
      off("session:language_change", handleLanguageChange);
      off("session:user_joined", handleUserJoined);
      off("session:user_left", handleUserLeft);
      off("session:permission_update", handlePermissionUpdate);
      off("session:screen_share_start", handleScreenShareStart);
      off("session:screen_share_stop", handleScreenShareStop);
      off("session:screen_share_permission", handleScreenSharePermission);
      off("session:kicked", handleKicked);
      off("session:ended", handleEnded);
      off("session:join_rejected", handleJoinRejected);
    };
  }, [socket, on, off, userId]);

  // ── Send code update ──
  // NOTE: Real-time code sync is now handled by Yjs CRDT.
  // This function is kept for backward compatibility but no longer
  // broadcasts full code to other clients. It only tracks the latest
  // code locally for save operations.
  const sendCodeUpdate = useCallback(
    (code) => {
      // No-op for real-time sync — Yjs handles it.
      // Just track the latest code for potential save operations.
      lastSentCodeRef.current = code;
    },
    []
  );

  // Send cursor position
  const sendCursorUpdate = useCallback(
    (position, selection) => {
      if (!isConnected || !sessionId) return;

      emit("session:cursor_update", {
        sessionId,
        userId,
        userName,
        position,
        selection,
      });
    },
    [isConnected, sessionId, userId, userName, emit]
  );

  // Send language change (includes previous language code for saving)
  const sendLanguageChange = useCallback(
    (language, previousLanguage, previousCode) => {
      if (!isConnected || !sessionId) return;

      emit("session:language_change", {
        sessionId,
        language,
        userId,
        userName,
        previousLanguage: previousLanguage || null,
        previousCode: previousCode !== undefined ? previousCode : null,
      });
    },
    [isConnected, sessionId, userId, userName, emit]
  );

  // Host: grant edit permission
  const grantEdit = useCallback(
    (targetUserId) => {
      if (!isHost) return;
      emit("session:grant_edit", { sessionId, targetUserId, hostUserId: userId });
    },
    [isHost, sessionId, userId, emit]
  );

  // Host: revoke edit permission
  const revokeEdit = useCallback(
    (targetUserId) => {
      if (!isHost) return;
      emit("session:revoke_edit", { sessionId, targetUserId, hostUserId: userId });
    },
    [isHost, sessionId, userId, emit]
  );

  // Host: kick participant
  const kickParticipant = useCallback(
    (targetUserId) => {
      if (!isHost) return;
      emit("session:kick", { sessionId, targetUserId, hostUserId: userId });
    },
    [isHost, sessionId, userId, emit]
  );

  // Host: grant screen share
  const grantScreenShare = useCallback(
    (targetUserId) => {
      if (!isHost) return;
      emit("session:grant_screen_share", { sessionId, targetUserId, hostUserId: userId });
    },
    [isHost, sessionId, userId, emit]
  );

  // Start screen share
  const startScreenShare = useCallback(() => {
    emit("session:screen_share_start", { sessionId, userId, userName });
  }, [sessionId, userId, userName, emit]);

  // Stop screen share
  const stopScreenShare = useCallback(() => {
    emit("session:screen_share_stop", { sessionId, userId });
  }, [sessionId, userId, emit]);

  // End session (host only)
  const endSessionSocket = useCallback(() => {
    if (!isHost) return;
    emit("session:end", { sessionId, hostUserId: userId });
  }, [isHost, sessionId, userId, emit]);

  // Leave session (participant only)
  const leaveSession = useCallback(() => {
    if (isHost) return;
    emit("session:leave", { sessionId, userId });
  }, [isHost, sessionId, userId, emit]);

  // Save code
  const saveCode = useCallback(() => {
    emit("session:save_code", { sessionId });
  }, [sessionId, emit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (codeUpdateTimerRef.current) {
        clearTimeout(codeUpdateTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    remoteCode,
    remoteLanguage,
    languageCode,
    remoteSavedCode,
    cursors,
    connectedUsers,
    canEdit: isHost || canEdit,
    permissions,
    screenShareUser,
    isKicked,
    sessionEnded,
    joinRejected,
    isConnected,

    // Actions
    sendCodeUpdate,
    sendCursorUpdate,
    sendLanguageChange,
    setLanguageCode,
    grantEdit,
    revokeEdit,
    kickParticipant,
    grantScreenShare,
    startScreenShare,
    stopScreenShare,
    endSessionSocket,
    leaveSession,
    saveCode,
  };
}
