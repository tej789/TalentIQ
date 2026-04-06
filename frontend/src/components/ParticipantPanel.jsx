import { useState, useEffect } from "react";
import {
  UsersIcon,
  XIcon,
  ShieldCheckIcon,
  ShieldIcon,
  MonitorIcon,
  UserMinusIcon,
  CrownIcon,
  PenLineIcon,
  EyeIcon,
  LinkIcon,
  CheckIcon,
  CircleIcon,
  WifiIcon,
} from "lucide-react";

/**
 * ParticipantPanel – premium slide-in panel showing all participants
 * with host controls, permission management, and invite link.
 */
function ParticipantPanel({
  isOpen,
  onClose,
  session,
  connectedUsers = {},
  permissions = {},
  isHost,
  onGrantEdit,
  onRevokeEdit,
  onGrantScreenShare,
  onKick,
  currentUserId,
}) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      setIsAnimating(false);
      const t = setTimeout(() => setIsVisible(false), 280);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const participants = session?.participants || [];
  const host = session?.host;

  const totalOnline = Object.keys(connectedUsers).length || (1 + participants.length);
  const maxParts = session?.maxParticipants || 5;
  const slotsLeft = maxParts - (participants.length + 1);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`pp-backdrop ${isAnimating ? "pp-backdrop-visible" : ""}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`pp-panel ${isAnimating ? "pp-panel-open" : ""}`}>
        {/* Header */}
        <div className="pp-header">
          <div className="pp-header-left">
            <div className="pp-header-icon">
              <UsersIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="pp-header-title">Participants</h3>
              <div className="pp-header-meta">
                <span className="pp-online-dot" />
                <span>{totalOnline} online</span>
                <span className="pp-meta-sep">·</span>
                <span>{slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft !== 1 ? "s" : ""} left` : "Full"}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="pp-close-btn" title="Close">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Invite Banner */}
        <div className="pp-invite-section">
          <button onClick={handleCopyLink} className="pp-invite-btn">
            {linkCopied ? (
              <>
                <CheckIcon className="w-4 h-4" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" />
                <span>Copy Invite Link</span>
              </>
            )}
          </button>
        </div>

        {/* Main List */}
        <div className="pp-list">
          {/* Host Section */}
          <div className="pp-section-label">
            <CrownIcon className="w-3 h-3 text-yellow-400" />
            <span>Host</span>
          </div>

          {host && (
            <div className="pp-card pp-card-host">
              <div className="pp-card-main">
                <div className="pp-avatar pp-avatar-host">
                  {host.profileImage ? (
                    <img src={host.profileImage} alt={host.name} />
                  ) : (
                    <span className="pp-avatar-letter">
                      {host.name?.[0]?.toUpperCase() || "H"}
                    </span>
                  )}
                  <span className="pp-status-dot pp-status-online" />
                </div>
                <div className="pp-user-info">
                  <div className="pp-user-name">
                    <span>{host.name}</span>
                    <CrownIcon className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <span className="pp-user-role pp-role-host">Session Host</span>
                </div>
              </div>
            </div>
          )}

          {/* Participants Section */}
          {participants.length > 0 && (
            <div className="pp-section-label" style={{ marginTop: "16px" }}>
              <UsersIcon className="w-3 h-3" />
              <span>Participants ({participants.length})</span>
            </div>
          )}

          {participants.map((p, idx) => {
            const user = p.user;
            if (!user) return null;
            const userId = user._id || user;
            const userPerms = permissions[userId] || permissions[user.clerkId] || {};
            const hasEdit = p.canEdit || userPerms.canEdit;
            const hasScreenShare = p.canScreenShare || userPerms.canScreenShare;

            const isOnline = Object.values(connectedUsers).some(
              (cu) => cu.userId === user.clerkId || cu.userId === userId.toString()
            );

            return (
              <div
                key={userId}
                className="pp-card"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="pp-card-main">
                  {/* Avatar */}
                  <div className="pp-avatar">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.name} />
                    ) : (
                      <span className="pp-avatar-letter">
                        {user.name?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                    <span className={`pp-status-dot ${isOnline ? "pp-status-online" : "pp-status-offline"}`} />
                  </div>

                  {/* Info */}
                  <div className="pp-user-info">
                    <span className="pp-user-name-solo">{user.name}</span>
                    <div className="pp-badges">
                      {hasEdit ? (
                        <span className="pp-badge pp-badge-edit">
                          <PenLineIcon className="w-2.5 h-2.5" />
                          Can Edit
                        </span>
                      ) : (
                        <span className="pp-badge pp-badge-view">
                          <EyeIcon className="w-2.5 h-2.5" />
                          View Only
                        </span>
                      )}
                      {hasScreenShare && (
                        <span className="pp-badge pp-badge-screen">
                          <MonitorIcon className="w-2.5 h-2.5" />
                          Screen
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Host Controls */}
                {isHost && (
                  <div className="pp-controls">
                    <button
                      onClick={() => hasEdit ? onRevokeEdit(userId) : onGrantEdit(userId)}
                      className={`pp-ctrl-btn ${hasEdit ? "pp-ctrl-active-green" : ""}`}
                      title={hasEdit ? "Revoke edit access" : "Grant edit access"}
                    >
                      {hasEdit ? (
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldIcon className="w-3.5 h-3.5" />
                      )}
                      <span>{hasEdit ? "Editing" : "Grant Edit"}</span>
                    </button>

                    <button
                      onClick={() => onGrantScreenShare(userId)}
                      className={`pp-ctrl-icon-btn ${hasScreenShare ? "pp-ctrl-active-blue" : ""}`}
                      title={hasScreenShare ? "Screen share granted" : "Grant screen share"}
                    >
                      <MonitorIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Remove ${user.name} from this session?`)) {
                          onKick(userId);
                        }
                      }}
                      className="pp-ctrl-icon-btn pp-ctrl-danger"
                      title="Remove participant"
                    >
                      <UserMinusIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {participants.length === 0 && (
            <div className="pp-empty">
              <div className="pp-empty-icon">
                <UsersIcon className="w-8 h-8" />
              </div>
              <p className="pp-empty-title">No one here yet</p>
              <p className="pp-empty-desc">
                Share the invite link so others can join and collaborate
              </p>
              <button onClick={handleCopyLink} className="pp-empty-action">
                <LinkIcon className="w-3.5 h-3.5" />
                Copy Invite Link
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pp-footer">
          <WifiIcon className="w-3 h-3" />
          <span>{totalOnline} connected · {participants.length + 1}/{maxParts} joined</span>
        </div>
      </div>
    </>
  );
}

export default ParticipantPanel;
