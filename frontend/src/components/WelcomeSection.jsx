import { useUser } from "@clerk/clerk-react";
import { ArrowRightIcon, SparklesIcon, ZapIcon } from "lucide-react";

function WelcomeSection({ onCreateSession }) {
  const { user } = useUser();

  return (
    <div className="welcome-section">
      <div className="welcome-container">
        <div className="welcome-content">
          
          {/* LEFT */}
          <div className="welcome-text">
            <div className="welcome-header">
              <div className="icon-badge-lg">
                <SparklesIcon className="icon-lg" />
              </div>
              <h1 className="welcome-title">
                Welcome back, {user?.firstName || "there"}
              </h1>
            </div>

            <p className="welcome-subtitle">
              Ready to level up your coding skills?
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={onCreateSession}
            className="btn-create-session"
          >
            <div className="btn-content">
              <ZapIcon className="icon-md" />
              <span>Create Session</span>
              <ArrowRightIcon className="icon-sm arrow-icon" />
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}


export default WelcomeSection;
