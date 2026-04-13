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
      <main className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT CONTENT */}
          <section className="space-y-8">
            <div className="bg-accent-soft text-accent-primary px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-2 w-fit border border-accent-primary/20">
              <ZapIcon className="size-4" />
              Built for technical interviews & pair programming
            </div>

            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight text-text-primary">
              Code Together.
              <br />
              Ship Better Talent Decisions.
            </h1>

            <p className="text-lg text-text-secondary leading-relaxed max-w-xl">
              Talent IQ is a modern collaboration workspace for live coding rounds, pair
              programming sessions, and mock interviews. Meet by video, share an editor,
              and focus on problem solving instead of tools.
            </p>

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
                View product tour
              </button>
            </div>

            {/* WHO IT'S FOR */}
            <div className="grid sm:grid-cols-3 gap-3 max-w-xl">
              <div className="bg-surface border border-border-subtle rounded-lg px-3 py-3 flex items-center gap-2 text-sm">
                <UsersIcon className="size-4 text-accent-primary" />
                <span className="text-text-secondary">Hiring managers</span>
              </div>
              <div className="bg-surface border border-border-subtle rounded-lg px-3 py-3 flex items-center gap-2 text-sm">
                <Code2Icon className="size-4 text-accent-primary" />
                <span className="text-text-secondary">Engineering teams</span>
              </div>
              <div className="bg-surface border border-border-subtle rounded-lg px-3 py-3 flex items-center gap-2 text-sm">
                <SparklesIcon className="size-4 text-accent-primary" />
                <span className="text-text-secondary">Candidates & learners</span>
              </div>
            </div>
          </section>

          {/* RIGHT VISUAL: SIMPLE EDITOR PREVIEW */}
          <section className="relative">
            <div className="absolute -inset-4 bg-accent-primary/15 blur-3xl rounded-3xl pointer-events-none" />

            <div className="relative bg-gradient-to-br from-surface to-root border border-border-subtle/80 rounded-3xl shadow-xl p-6 lg:p-8 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-accent-soft flex items-center justify-center">
                    <Code2Icon className="size-5 text-accent-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-text-secondary uppercase tracking-[0.16em] font-semibold">
                      Live coding workspace
                    </p>
                    <p className="text-sm font-medium text-text-primary">Talent IQ session</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-root/80 text-text-secondary text-xs border border-border-subtle">
                  Secure · Real-time
                </span>
              </div>

              {/* Minimal code editor mock */}
              <div className="bg-root/70 border border-border-subtle rounded-2xl p-4 text-xs font-mono text-text-secondary space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-red-500/70" />
                    <span className="size-2.5 rounded-full bg-amber-400/70" />
                    <span className="size-2.5 rounded-full bg-emerald-500/70" />
                  </div>
                  <span className="text-[11px] text-text-secondary/80">problem.js</span>
                </div>
                <div className="space-y-1">
                  <p><span className="text-accent-primary">function</span> solve() &#123;</p>
                  <p className="pl-4 text-text-secondary/80">// collaborate on the solution…</p>
                  <p className="pl-4">return <span className="text-emerald-400">"pass"</span>;</p>
                  <p>&#125;</p>
                </div>
              </div>

              {/* Short capability row */}
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="bg-surface border border-border-subtle rounded-full px-3 py-1.5 flex items-center gap-2">
                  <VideoIcon className="size-4 text-accent-primary" />
                  <span className="text-text-secondary">Video built in</span>
                </div>
                <div className="bg-surface border border-border-subtle rounded-full px-3 py-1.5 flex items-center gap-2">
                  <Code2Icon className="size-4 text-accent-primary" />
                  <span className="text-text-secondary">Shared editor</span>
                </div>
                <div className="bg-surface border border-border-subtle rounded-full px-3 py-1.5 flex items-center gap-2">
                  <UsersIcon className="size-4 text-accent-primary" />
                  <span className="text-text-secondary">Multi-user sessions</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold mb-4">
            Everything You Need to <span className="text-accent-primary font-mono">Succeed</span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Powerful features designed to keep every live session smooth, focused, and fair
          </p>
        </div>

        {/* FEATURES GRID */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-surface/80 border border-border-subtle/80 rounded-2xl p-6 text-center transition-colors">
            <div className="size-16 bg-accent-soft rounded-lg flex items-center justify-center mb-4 mx-auto">
              <VideoIcon className="size-8 text-accent-primary" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2">HD Video Call</h3>
            <p className="text-text-secondary">
              Stable, low-latency audio and video that works reliably across teams and regions
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-surface/80 border border-border-subtle/80 rounded-2xl p-6 text-center transition-colors">
            <div className="size-16 bg-accent-soft rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Code2Icon className="size-8 text-accent-primary" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2">Live Code Editor</h3>
            <p className="text-text-secondary">
              Collaborate in real-time with syntax highlighting, multiple languages, and saved layouts
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-surface/80 border border-border-subtle/80 rounded-2xl p-6 text-center transition-colors">
            <div className="size-16 bg-accent-soft rounded-lg flex items-center justify-center mb-4 mx-auto">
              <UsersIcon className="size-8 text-accent-primary" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2">Easy Collaboration</h3>
            <p className="text-text-secondary">
              Chat, notes, and recording in one place so your panel and candidates stay aligned
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
export default HomePage;
