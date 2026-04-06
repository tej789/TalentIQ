import { useNavigate } from "react-router";
import { AlertTriangleIcon, ArrowRightIcon, XIcon } from "lucide-react";

/**
 * AlreadyInSessionModal
 *
 * Shown when a user tries to join or create a session while they are
 * already an active member (or host) of another session.
 *
 * Props:
 *   isOpen        – whether the modal is visible
 *   onClose       – called when user dismisses without navigating
 *   existingSessionId – _id of the session the user currently belongs to
 *   hostName      – name of the host (optional)
 *   sessionProblem – problem title (optional)
 *   role          – "HOST" | "PARTICIPANT"
 */
function AlreadyInSessionModal({
  isOpen,
  onClose,
  existingSessionId,
  hostName,
  sessionProblem,
  role,
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isHost = role === "HOST";

  const title = isHost
    ? "You're already hosting a session"
    : "You're already in a live session";

  const body = isHost
    ? "You can only host one session at a time. Please end your current session before starting a new one."
    : "You can only attend one session at a time. Please leave your current session before joining a new one.";

  const ctaLabel = isHost ? "Go to My Session" : "Go to My Session";

  const handleGoToSession = () => {
    onClose();
    if (existingSessionId) {
      navigate(`/session/${existingSessionId}`);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Card — stop propagation so clicking inside doesn't close */}
      <div
        className="bg-base-100 rounded-2xl shadow-2xl border border-warning/30 w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm btn-circle absolute top-3 right-3"
          aria-label="Close"
        >
          <XIcon className="size-4" />
        </button>

        {/* Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-warning/15 rounded-xl">
            <AlertTriangleIcon className="size-6 text-warning" />
          </div>
          <h2 className="text-lg font-bold leading-tight">{title}</h2>
        </div>

        {/* Body */}
        <p className="text-sm text-base-content/70 mb-4">{body}</p>

        {/* Session details chip */}
        {(hostName || sessionProblem) && (
          <div className="bg-base-200 rounded-xl p-3 mb-5 text-sm space-y-1">
            {sessionProblem && (
              <p>
                <span className="opacity-60">Problem: </span>
                <span className="font-semibold">{sessionProblem}</span>
              </p>
            )}
            {hostName && (
              <p>
                <span className="opacity-60">Host: </span>
                <span className="font-semibold">{hostName}</span>
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleGoToSession}
            className="btn btn-warning flex-1 gap-2"
          >
            {ctaLabel}
            <ArrowRightIcon className="size-4" />
          </button>
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Stay Here
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlreadyInSessionModal;
