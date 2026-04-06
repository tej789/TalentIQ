import { UsersIcon, PlusIcon } from "lucide-react";

/**
 * ParticipantBar – Compact inline bar showing stacked participant avatars.
 * Sits inside the session toolbar. Clicking it opens the full ParticipantPanel.
 */
function ParticipantBar({
  session,
  connectedUsers = {},
  onOpenPanel,
}) {
  const host = session?.host;
  const participants = session?.participants || [];
  const maxParts = session?.maxParticipants || 5;

  // Build a display list: host first, then participants
  const avatarList = [];
  if (host) {
    avatarList.push({
      id: host._id || host.clerkId || "host",
      name: host.name || "Host",
      image: host.profileImage,
      isHost: true,
      isOnline: true, // host is always online while session is active
    });
  }

  participants.forEach((p) => {
    const user = p.user;
    if (!user) return;
    const userId = user._id || user;
    const isOnline = Object.values(connectedUsers).some(
      (cu) => cu.userId === user.clerkId || cu.userId === userId?.toString()
    );
    avatarList.push({
      id: userId,
      name: user.name || "User",
      image: user.profileImage,
      isHost: false,
      isOnline,
    });
  });

  const onlineCount = Object.keys(connectedUsers).length || avatarList.filter(a => a.isOnline).length;
  const totalCount = avatarList.length;
  const showAvatars = avatarList.slice(0, 4); // Show max 4 stacked
  const extraCount = totalCount - showAvatars.length;

  return (
    <div className="participant-bar" onClick={onOpenPanel} title="View all participants">
      {/* Stacked Avatars */}
      <div className="participant-bar-avatars">
        {showAvatars.map((item, idx) => (
          <div
            key={item.id}
            className="participant-bar-avatar"
            style={{ zIndex: showAvatars.length - idx }}
          >
            {item.image ? (
              <img src={item.image} alt={item.name} />
            ) : (
              <span className="participant-bar-avatar-fallback">
                {item.name?.[0]?.toUpperCase() || "?"}
              </span>
            )}
            <span
              className={`participant-bar-dot ${item.isOnline ? "online" : "offline"}`}
            />
          </div>
        ))}

        {extraCount > 0 && (
          <div className="participant-bar-avatar participant-bar-avatar-extra" style={{ zIndex: 0 }}>
            <span className="participant-bar-avatar-fallback">+{extraCount}</span>
          </div>
        )}
      </div>

      {/* Count Badge */}
      <div className="participant-bar-info">
        <span className="participant-bar-count">
          {onlineCount}<span className="participant-bar-separator">/</span>{maxParts}
        </span>
      </div>

      {/* Open Panel Button (square icon) */}
      <button
        className="participant-bar-btn"
        onClick={(e) => {
          e.stopPropagation();
          onOpenPanel();
        }}
        title="Show all participants"
      >
        <UsersIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default ParticipantBar;
