import { useState, useEffect, useRef } from "react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { initializeStreamClient, disconnectStreamClient } from "../lib/stream";
import { sessionApi } from "../api/sessions";

function useStreamClient(session, loadingSession, isHost, isParticipant) {
  const [streamClient, setStreamClient] = useState(null);
  const [call, setCall] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isInitializingCall, setIsInitializingCall] = useState(true);

  // Use refs to avoid re-running the effect when session object reference changes
  const callIdRef = useRef(null);
  const statusRef = useRef(null);
  const initializedRef = useRef(false);
  const cleanupRef = useRef(null);

  // Extract stable values
  const callId = session?.callId;
  const sessionStatus = session?.status;
  const canJoin = (isHost || isParticipant) && sessionStatus !== "completed";

  useEffect(() => {
    // Only init once per callId — skip if already initialized for this call
    if (!callId || loadingSession || !canJoin) return;
    if (initializedRef.current && callIdRef.current === callId) return;

    callIdRef.current = callId;
    initializedRef.current = true;

    let videoCall = null;
    let chatClientInstance = null;
    let cancelled = false;

    const initCall = async () => {
      try {
        const { token, userId, userName, userImage } = await sessionApi.getStreamToken(callId);
        if (cancelled) return;

        const client = await initializeStreamClient(
          { id: userId, name: userName, image: userImage },
          token
        );
        if (cancelled) return;

        setStreamClient(client);

        videoCall = client.call("default", callId);
        await videoCall.join({ create: true });
        if (cancelled) return;

        // Disable camera and mic after joining to avoid permission errors
        try { await videoCall.camera.disable(); } catch (e) {}
        try { await videoCall.microphone.disable(); } catch (e) {}

        setCall(videoCall);

        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        chatClientInstance = StreamChat.getInstance(apiKey);

        await chatClientInstance.connectUser(
          { id: userId, name: userName, image: userImage },
          token
        );
        if (cancelled) return;

        setChatClient(chatClientInstance);

        // The backend already ensured channel membership via getStreamToken,
        // so this should succeed. Retry once in case of propagation delay.
        const chatChannel = chatClientInstance.channel("messaging", callId);
        try {
          await chatChannel.watch();
          if (!cancelled) setChannel(chatChannel);
        } catch (watchErr) {
          console.warn("Chat channel watch failed, retrying in 2s:", watchErr.message);
          await new Promise((r) => setTimeout(r, 2000));
          if (cancelled) return;
          try {
            await chatChannel.watch();
            if (!cancelled) setChannel(chatChannel);
          } catch (retryErr) {
            console.error("Could not join chat channel — chat will be unavailable", retryErr.message);
          }
        }
        if (cancelled) return;
      } catch (error) {
        if (!cancelled) {
          toast.error("Failed to join video call");
          console.error("Error init call", error);
        }
      } finally {
        if (!cancelled) setIsInitializingCall(false);
      }
    };

    initCall();

    // Store cleanup for unmount
    cleanupRef.current = async () => {
      cancelled = true;
      try {
        if (videoCall) await videoCall.leave();
        if (chatClientInstance) await chatClientInstance.disconnectUser();
        await disconnectStreamClient();
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    };

    return () => {
      // Only cleanup on actual unmount, not dep changes
    };
  }, [callId, loadingSession, canJoin]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      initializedRef.current = false;
      callIdRef.current = null;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  return {
    streamClient,
    call,
    chatClient,
    channel,
    isInitializingCall,
  };
}

export default useStreamClient;
