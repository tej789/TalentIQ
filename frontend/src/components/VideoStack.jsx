import { useState, useMemo, memo, useRef, useCallback, useEffect } from "react";
import {
  useCallStateHooks,
  ParticipantView,
  CallControls,
  CallingState,
  SpeakerLayout,
} from "@stream-io/video-react-sdk";
import {
  Loader2Icon,
  UsersIcon,
  MaximizeIcon,
  MinimizeIcon,
  GridIcon,
  MonitorIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhoneIcon,
  ChevronUpIcon,
  Maximize2Icon,
  Minimize2Icon,
} from "lucide-react";
import { useNavigate } from "react-router";

import "@stream-io/video-react-sdk/dist/css/styles.css";

function VideoStack({ isFloating = false, isHost = false, screenShareExpanded = false, onToggleScreenShareExpand }) {
  const navigate = useNavigate();
  const { useCallCallingState, useParticipantCount, useRemoteParticipants, useLocalParticipant, useHasOngoingScreenShare } =
    useCallStateHooks();

  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const remoteParticipants = useRemoteParticipants();
  const localParticipant = useLocalParticipant();
  const hasOngoingScreenShare = useHasOngoingScreenShare();

  const [viewMode, setViewMode] = useState("stack"); // 'stack' | 'gallery' | 'focused'
  const [focusedId, setFocusedId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Combine local + remote, host (local) first — stable reference
  // Deduplicate by userId so the same user in multiple tabs only shows once.
  const allParticipants = useMemo(() => {
    const raw = [];
    if (localParticipant) raw.push(localParticipant);
    if (remoteParticipants) raw.push(...remoteParticipants);
    const seen = new Map();
    for (const p of raw) {
      const uid = p.userId;
      // Keep the local participant entry if there's a duplicate,
      // otherwise keep the latest (last) entry for each userId.
      if (!seen.has(uid) || p === localParticipant) {
        seen.set(uid, p);
      }
    }
    return Array.from(seen.values());
  }, [localParticipant, remoteParticipants]);

  // Use deduplicated count for display
  const uniqueParticipantCount = allParticipants.length;

  // Thumbnail scroll refs and state
  const thumbScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollArrows = useCallback(() => {
    const el = thumbScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = thumbScrollRef.current;
    if (!el || viewMode !== "focused") return;
    updateScrollArrows();
    el.addEventListener("scroll", updateScrollArrows, { passive: true });
    const ro = new ResizeObserver(updateScrollArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollArrows);
      ro.disconnect();
    };
  }, [viewMode, focusedId, allParticipants.length, updateScrollArrows]);

  const scrollThumbs = useCallback((direction) => {
    const el = thumbScrollRef.current;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  }, []);

  // Draggable call controls
  const controlsRef = useRef(null);
  const containerRef = useRef(null);
  const [controlsPos, setControlsPos] = useState({ x: null, y: null });
  const [controlsMinimized, setControlsMinimized] = useState(false);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onControlsMouseDown = useCallback((e) => {
    // Don't drag if clicking a button/icon inside controls
    if (e.target.closest('button, [role="button"], svg')) return;
    e.preventDefault();
    isDragging.current = true;
    hasDragged.current = false;
    const rect = controlsRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const onMouseMove = (e) => {
      if (!isDragging.current || !containerRef.current || !controlsRef.current) return;
      hasDragged.current = true;
      const container = containerRef.current.getBoundingClientRect();
      const ctrl = controlsRef.current;
      const ctrlW = ctrl.offsetWidth;
      const ctrlH = ctrl.offsetHeight;
      let newX = e.clientX - container.left - dragOffset.current.x;
      let newY = e.clientY - container.top - dragOffset.current.y;
      // Clamp within container
      newX = Math.max(0, Math.min(newX, container.width - ctrlW));
      newY = Math.max(0, Math.min(newY, container.height - ctrlH));
      setControlsPos({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  // Touch support for dragging
  const onControlsTouchStart = useCallback((e) => {
    if (e.target.closest('button, [role="button"], svg')) return;
    isDragging.current = true;
    hasDragged.current = false;
    const touch = e.touches[0];
    const rect = controlsRef.current.getBoundingClientRect();
    dragOffset.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };

    const onTouchMove = (e) => {
      if (!isDragging.current || !containerRef.current || !controlsRef.current) return;
      hasDragged.current = true;
      const touch = e.touches[0];
      const container = containerRef.current.getBoundingClientRect();
      const ctrl = controlsRef.current;
      const ctrlW = ctrl.offsetWidth;
      const ctrlH = ctrl.offsetHeight;
      let newX = touch.clientX - container.left - dragOffset.current.x;
      let newY = touch.clientY - container.top - dragOffset.current.y;
      newX = Math.max(0, Math.min(newX, container.width - ctrlW));
      newY = Math.max(0, Math.min(newY, container.height - ctrlH));
      setControlsPos({ x: newX, y: newY });
    };

    const onTouchEnd = () => {
      isDragging.current = false;
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }, []);

  // Use the SDK's reactive screen share detection
  const isScreenSharing = hasOngoingScreenShare;

  // Auto-collapse expanded screen share when sharing stops
  useEffect(() => {
    if (!isScreenSharing && screenShareExpanded && onToggleScreenShareExpand) {
      onToggleScreenShareExpand();
    }
  }, [isScreenSharing]);

  const focusedParticipant = focusedId
    ? allParticipants.find((p) => p.sessionId === focusedId)
    : null;

  // Compute grid columns based on participant count
  const getGridCols = (count, fullscreen = false) => {
    if (fullscreen) {
      if (count <= 1) return "1fr";
      if (count <= 4) return "1fr 1fr";
      if (count <= 9) return "1fr 1fr 1fr";
      return "1fr 1fr 1fr 1fr";
    }
    if (count <= 2) return "1fr";
    if (count <= 4) return "1fr 1fr";
    return "1fr 1fr 1fr";
  };

  if (callingState === CallingState.JOINING || callingState === CallingState.IDLE) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2Icon className="w-8 h-8 mx-auto animate-spin text-accent-primary mb-3" />
          <p className="text-sm text-text-secondary">Joining call...</p>
        </div>
      </div>
    );
  }

  if (callingState === CallingState.LEFT || callingState === CallingState.RECONNECTING_FAILED) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-text-secondary">Call ended</p>
        </div>
      </div>
    );
  }

  // Floating overlay mode (used during screen share)
  if (isFloating) {
    return (
      <div className="video-stack-floating">
        {allParticipants.slice(0, 4).map((participant, index) => (
          <div
            key={participant.sessionId}
            className="video-floating-circle"
            style={{ zIndex: 10 - index }}
            title={participant.name || "Participant"}
          >
            <ParticipantView
              participant={participant}
              VideoPlaceholder={null}
              muteAudio={participant === localParticipant}
            />
          </div>
        ))}
        {allParticipants.length > 4 && (
          <div className="video-floating-circle video-floating-more">
            +{allParticipants.length - 4}
          </div>
        )}
      </div>
    );
  }

  /* ========== FULLSCREEN MODE ========== */
  if (isFullscreen) {
    return (
      <div className={`video-fullscreen-overlay str-video ${isHost ? 'video-stack-is-host' : ''}`}>
        {/* Fullscreen header */}
        <div className="video-fullscreen-header">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-accent-primary" />
            <span className="text-sm font-medium text-text-primary">
              {uniqueParticipantCount} {uniqueParticipantCount === 1 ? "participant" : "participants"}
            </span>
            {isScreenSharing && (
              <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                <MonitorIcon className="w-3 h-3" />
                Screen sharing
              </span>
            )}
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="video-fullscreen-close"
            title="Exit fullscreen"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {isScreenSharing ? (
          /* Fullscreen screen share layout */
          <div className="video-fs-screenshare">
            <div className="video-fs-screenshare-main">
              <SpeakerLayout />
            </div>
            {allParticipants.length > 0 && (
              <div className="video-fs-screenshare-sidebar">
                <div className="video-fs-sidebar-label">
                  <UsersIcon className="w-3 h-3" />
                  <span>Participants</span>
                </div>
                <div className="video-fs-sidebar-list">
                  {allParticipants.map((participant) => (
                    <div
                      key={participant.sessionId}
                      className="video-fs-sidebar-item"
                      title={participant.name || "Participant"}
                    >
                      <ParticipantView
                        participant={participant}
                        muteAudio={participant === localParticipant}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Fullscreen gallery grid with scroll */
          <div className="video-fullscreen-grid-wrapper">
            <div
              className="video-fullscreen-grid"
              style={{ gridTemplateColumns: getGridCols(allParticipants.length, true) }}
            >
              {allParticipants.map((participant) => (
                <div
                  key={participant.sessionId}
                  className="video-gallery-item"
                >
                  <ParticipantView
                    participant={participant}
                    muteAudio={participant === localParticipant}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Centered call controls */}
        <div className="video-fullscreen-controls">
          <CallControls onLeave={() => { setIsFullscreen(false); navigate("/dashboard"); }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`video-stack-container str-video ${isHost ? 'video-stack-is-host' : ''}`} ref={containerRef}>
      {/* Header with controls */}
      <div className="video-stack-header">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-accent-primary" />
          <span className="text-sm font-medium text-text-primary">
            {uniqueParticipantCount} {uniqueParticipantCount === 1 ? "participant" : "participants"}
          </span>
          {isScreenSharing && (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              <MonitorIcon className="w-3 h-3" />
              Screen sharing
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode(viewMode === "gallery" ? "stack" : "gallery")}
            className="p-1.5 rounded-md hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
            title={viewMode === "gallery" ? "Stack view" : "Gallery view"}
          >
            {viewMode === "gallery" ? (
              <MinimizeIcon className="w-4 h-4" />
            ) : (
              <GridIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 rounded-md hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
            title="Expand to fullscreen"
          >
            <MaximizeIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video content */}
      <div className="video-stack-content">
        {isScreenSharing ? (
          /* Screen share active — SpeakerLayout handles screen share display */
          <div className="video-screenshare-wrapper">
            <SpeakerLayout />
            {onToggleScreenShareExpand && (
              <button
                onClick={onToggleScreenShareExpand}
                className="video-screenshare-expand-btn"
                title={screenShareExpanded ? "Collapse screen share" : "Expand screen share to full view"}
              >
                {screenShareExpanded ? (
                  <><Minimize2Icon className="w-4 h-4" /><span>Collapse</span></>
                ) : (
                  <><Maximize2Icon className="w-4 h-4" /><span>Expand</span></>
                )}
              </button>
            )}
          </div>
        ) : viewMode === "focused" && focusedParticipant ? (
          /* Focused single participant — main video + bottom thumbnail strip */
          <div className="video-focused">
            <div className="video-focused-main">
              <ParticipantView
                participant={focusedParticipant}
                muteAudio={focusedParticipant === localParticipant}
              />
              <button
                onClick={() => { setFocusedId(null); setViewMode("stack"); }}
                className="video-focused-close"
                title="Back to stack view"
              >
                <MinimizeIcon className="w-4 h-4" />
              </button>
            </div>
            {/* Bottom thumbnail strip with arrows */}
            {allParticipants.filter((p) => p.sessionId !== focusedId).length > 0 && (
              <div className="video-focused-thumb-bar">
                {canScrollLeft && (
                  <button
                    className="video-thumb-arrow video-thumb-arrow-left"
                    onClick={() => scrollThumbs("left")}
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                )}
                <div className="video-focused-thumbnails" ref={thumbScrollRef}>
                  {allParticipants
                    .filter((p) => p.sessionId !== focusedId)
                    .map((p) => (
                      <div
                        key={p.sessionId}
                        className="video-focused-thumb"
                        onClick={() => setFocusedId(p.sessionId)}
                        title={p.name || "Participant"}
                      >
                        <ParticipantView participant={p} muteAudio={p === localParticipant} />
                      </div>
                    ))}
                </div>
                {canScrollRight && (
                  <button
                    className="video-thumb-arrow video-thumb-arrow-right"
                    onClick={() => scrollThumbs("right")}
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : viewMode === "gallery" ? (
          /* Gallery grid */
          <div className="video-gallery-scroll-wrapper">
            <div
              className="video-gallery"
              style={{ gridTemplateColumns: getGridCols(allParticipants.length) }}
            >
              {allParticipants.map((participant) => (
                <div
                  key={participant.sessionId}
                  className="video-gallery-item"
                  onClick={() => {
                    setFocusedId(participant.sessionId);
                    setViewMode("focused");
                  }}
                >
                  <ParticipantView
                    participant={participant}
                    muteAudio={participant === localParticipant}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Stack view — show only local participant's own video */
          <div className="video-stack-self">
            {localParticipant && (
              <div className="video-stack-self-view">
                <ParticipantView
                  participant={localParticipant}
                  muteAudio={true}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call controls — draggable & minimizable */}
      {controlsMinimized ? (
        <div
          className="video-stack-controls-mini"
          ref={controlsRef}
          onMouseDown={onControlsMouseDown}
          onTouchStart={onControlsTouchStart}
          style={
            controlsPos.x !== null
              ? {
                  left: controlsPos.x,
                  top: controlsPos.y,
                  bottom: 'auto',
                  right: 'auto',
                  transform: 'none',
                }
              : {}
          }
        >
          <button
            className="video-controls-mini-btn"
            onClick={() => setControlsMinimized(false)}
            title="Show call controls"
          >
            <ChevronUpIcon className="w-4 h-4" />
            <PhoneIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className="video-stack-controls video-stack-controls-draggable"
          ref={controlsRef}
          onMouseDown={onControlsMouseDown}
          onTouchStart={onControlsTouchStart}
          style={
            controlsPos.x !== null
              ? {
                  left: controlsPos.x,
                  top: controlsPos.y,
                  bottom: 'auto',
                  right: 'auto',
                  transform: 'none',
                }
              : {}
          }
        >
          <div className="video-controls-drag-handle" title="Drag to reposition">
            <span className="video-controls-drag-dots">⠿</span>
          </div>
          <CallControls onLeave={() => navigate("/dashboard")} />
          <button
            className="video-controls-minimize-btn"
            onClick={() => setControlsMinimized(true)}
            title="Minimize controls"
          >
            <MinimizeIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(VideoStack);
