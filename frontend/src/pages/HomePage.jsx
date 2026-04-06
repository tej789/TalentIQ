import { Link } from "react-router";
import {
  ArrowRightIcon,
  CheckIcon,
  Code2Icon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
  ZapIcon,
} from "lucide-react";
import { SignInButton } from "@clerk/clerk-react";

function HomePage() {
  return (
    <div className="bg-root">
      {/* NAVBAR */}
      <nav className="bg-surface/80 backdrop-blur-md border-b border-accent-primary/20 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          {/* LOGO */}
          <Link
            to={"/"}
            className="flex items-center gap-3 hover:scale-105 transition-transform duration-200"
          >
            <div className="size-10 rounded-lg bg-accent-primary flex items-center justify-center shadow-md">
              <SparklesIcon className="size-6 text-text-primary" />
            </div>

            <div className="flex flex-col">
              <span className="font-semibold text-xl text-text-primary font-mono tracking-wider">
                Talent IQ
              </span>
              <span className="text-xs text-text-secondary font-medium -mt-1">Code Together</span>
            </div>
          </Link>

          {/* AUTH BTN */}
          <SignInButton mode="modal">
            <button className="group px-6 py-3 bg-accent-primary hover:bg-accent-hover rounded-lg text-text-primary font-semibold text-sm shadow-md transition-all duration-200 hover:scale-105 flex items-center gap-2">
              <span>Get Started</span>
              <ArrowRightIcon className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </SignInButton>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT CONTENT */}
          <div className="space-y-8">
            <div className="bg-accent-soft text-accent-primary px-3 py-1 rounded-md text-sm font-medium inline-flex items-center gap-2">
              <ZapIcon className="size-4" />
              Real-time Collaboration
            </div>

            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight">
              <span className="text-text-primary">
                Code Together,
              </span>
              <br />
              <span className="text-text-primary">Learn Together</span>
            </h1>

            <p className="text-lg text-text-secondary leading-relaxed max-w-xl">
              The ultimate platform for collaborative coding interviews and pair programming.
              Connect face-to-face, code in real-time, and ace your technical interviews.
            </p>

            {/* FEATURE PILLS */}
            <div className="flex flex-wrap gap-3">
              <div className="border border-accent-primary/20 text-text-secondary px-3 py-1 rounded-md text-sm font-medium inline-flex items-center gap-2">
                <CheckIcon className="size-4 text-green-400" />
                Live Video Chat
              </div>
              <div className="border border-accent-primary/20 text-text-secondary px-3 py-1 rounded-md text-sm font-medium inline-flex items-center gap-2">
                <CheckIcon className="size-4 text-green-400" />
                Code Editor
              </div>
              <div className="border border-accent-primary/20 text-text-secondary px-3 py-1 rounded-md text-sm font-medium inline-flex items-center gap-2">
                <CheckIcon className="size-4 text-green-400" />
                Multi-Language
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <SignInButton mode="modal">
                <button className="bg-accent-primary hover:bg-accent-hover text-text-primary px-6 py-3 rounded-lg font-semibold text-sm shadow-md transition-colors inline-flex items-center gap-2">
                  Start Coding Now
                  <ArrowRightIcon className="size-5" />
                </button>
              </SignInButton>

              <button className="border border-accent-primary text-accent-primary hover:bg-accent-soft px-6 py-3 rounded-lg font-semibold text-sm transition-colors inline-flex items-center gap-2">
                <VideoIcon className="size-5" />
                Watch Demo
              </button>
            </div>

            {/* STATS */}
            <div className="bg-surface border border-border-subtle rounded-lg p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-accent-primary font-semibold text-2xl">10K+</div>
                <div className="text-text-secondary text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-accent-primary font-semibold text-2xl">50K+</div>
                <div className="text-text-secondary text-sm">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-accent-primary font-semibold text-2xl">99.9%</div>
                <div className="text-text-secondary text-sm">Uptime</div>
              </div>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <img
            src="/hero.png"
            alt="CodeCollab Platform"
            className="w-full h-auto rounded-lg shadow-md border border-border-subtle"
          />
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold mb-4">
            Everything You Need to <span className="text-accent-primary font-mono">Succeed</span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Powerful features designed to make your coding interviews seamless and productive
          </p>
        </div>

        {/* FEATURES GRID */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-surface border border-border-subtle rounded-lg p-6 text-center">
            <div className="size-16 bg-accent-soft rounded-lg flex items-center justify-center mb-4 mx-auto">
              <VideoIcon className="size-8 text-accent-primary" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2">HD Video Call</h3>
            <p className="text-text-secondary">
              Crystal clear video and audio for seamless communication during interviews
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-surface border border-border-subtle rounded-lg p-6 text-center">
            <div className="size-16 bg-accent-soft rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Code2Icon className="size-8 text-accent-primary" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2">Live Code Editor</h3>
            <p className="text-text-secondary">
              Collaborate in real-time with syntax highlighting and multiple language support
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-surface border border-border-subtle rounded-lg p-6 text-center">
            <div className="size-16 bg-accent-soft rounded-lg flex items-center justify-center mb-4 mx-auto">
              <UsersIcon className="size-8 text-accent-primary" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2">Easy Collaboration</h3>
            <p className="text-text-secondary">
              Share your screen, discuss solutions, and learn from each other in real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default HomePage;
