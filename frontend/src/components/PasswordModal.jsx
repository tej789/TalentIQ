import { useState } from "react";
import { LockIcon, Loader2Icon, XIcon } from "lucide-react";

function PasswordModal({ isOpen, onClose, onSubmit, isLoading, error, sessionName }) {
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-container">
        <div className="modal-content" style={{ maxWidth: "400px" }}>
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-primary/10 rounded-lg">
                <LockIcon className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <h2 className="modal-title" style={{ marginBottom: "2px" }}>Session Password</h2>
                <p className="text-sm text-text-secondary">
                  {sessionName ? `Enter password for "${sessionName}"` : "This session requires a password"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-bg-hover rounded-md text-text-secondary">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-select"
                placeholder="Enter session password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={!password || isLoading} className="btn-primary">
                {isLoading ? (
                  <>
                    <Loader2Icon className="icon-sm animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Join Session"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default PasswordModal;
