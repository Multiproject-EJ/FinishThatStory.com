"use client";

import { useRef, useState } from "react";

type TabKey = "course" | "play";

type FlowStepKey = "brainboard" | "seasonmapper" | "tone" | "conflict" | "scene" | "build";

const flowData: Record<FlowStepKey, { title: string; body: string; meta: string }> = {
  brainboard: {
    title: "1. Brain Board & Keywords",
    body: "We start playful: sticky-map for plot, emotion, character. Goal: get everything out.",
    meta: "Output: idea clusters • Time: 5–10 min",
  },
  seasonmapper: {
    title: "2. Season / Episodes",
    body: "Name S1, add episodes, spread reveals for better flow.",
    meta: "Output: season lane • Time: 10–15 min",
  },
  tone: {
    title: "3. Emotion & Tone Dial",
    body: "Pick the emotional spine so it feels like the same show.",
    meta: "Output: tone plan • Time: 5–7 min",
  },
  conflict: {
    title: "4. Conflict / Stakes Builder",
    body: "Antagonist, obstacle, twist, reveal — add friction.",
    meta: "Output: conflict cards • Time: 5–10 min",
  },
  scene: {
    title: "5. Scene Machine",
    body: "Run Setup → Trouble → Turn → Payoff for 3–5 scenes.",
    meta: "Output: scene beats • Time: 10–12 min",
  },
  build: {
    title: "6. Build in hub",
    body: "Send everything to StudioOrganize tools (Storyboard, Character Studio, Script).",
    meta: "Output: storyboard-ready data",
  },
};

const flowSteps: { key: FlowStepKey; label: string }[] = [
  { key: "brainboard", label: "1. Brain board" },
  { key: "seasonmapper", label: "2. Season / Episodes" },
  { key: "tone", label: "3. Tone dial" },
  { key: "conflict", label: "4. Conflict" },
  { key: "scene", label: "5. Scene machine" },
  { key: "build", label: "6. Build in hub" },
];

export default function HomePage({ params }: { params: { locale: string } }) {
  void params;
  const [activeTab, setActiveTab] = useState<TabKey>("course");
  const [selectedStep, setSelectedStep] = useState<FlowStepKey | null>(null);
  const outlineRef = useRef<HTMLElement | null>(null);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  const handleScrollToOutline = () => {
    outlineRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentDetail = selectedStep ? flowData[selectedStep] : null;

  return (
    <>
      <style>{`
        :root {
          --bg: #f3f4f6;
          --card: #ffffff;
          --ink: #0f172a;
          --muted: #6b7280;
          --accent: #2563eb;
          --accent-soft: rgba(37, 99, 235, 0.1);
          --radius: 16px;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: radial-gradient(circle at top, #ffffff 0%, #edf2ff 40%, #f3f4f6 100%);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: var(--ink);
          line-height: 1.5;
        }
        header.site-header {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(15,23,42,0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.55rem 1rem;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .brand {
          font-weight: 700;
          font-size: 1rem;
        }
        .tabs {
          display: flex;
          gap: 0.5rem;
        }
        .tab-btn {
          background: rgba(15,23,42,0.03);
          border: 1px solid transparent;
          border-radius: 999px;
          padding: 0.35rem 0.8rem 0.43rem;
          font-size: 0.78rem;
          color: #475569;
          cursor: pointer;
        }
        .tab-btn.active {
          background: rgba(37,99,235,0.12);
          border-color: rgba(37,99,235,0.35);
          color: #1d4ed8;
          font-weight: 600;
        }
        main.page {
          max-width: 1080px;
          margin: 0 auto;
          padding: 1.5rem 1rem 2.5rem;
        }

        /* COURSE VIEW (sales page) */
        #course-view { display: block; }
        #play-view { display: none; }

        .hero {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(15,23,42,0.02);
          border-radius: 20px;
          padding: 1.5rem 1.5rem 1.2rem;
          margin-bottom: 1.3rem;
          display: flex;
          gap: 1.3rem;
          flex-wrap: wrap;
          justify-content: space-between;
        }
        .hero-left {
          max-width: 560px;
        }
        .hero h1 {
          margin: 0 0 0.45rem;
          font-size: clamp(1.6rem, 3.5vw, 2.1rem);
        }
        .hero p {
          margin: 0.3rem 0 0.7rem;
          color: var(--muted);
        }
        .hero-cta {
          display: flex;
          gap: 0.55rem;
          flex-wrap: wrap;
        }
        .btn-primary {
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 0.4rem 1.05rem;
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
        }
        .btn-light {
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(148,163,184,0.35);
          border-radius: 999px;
          padding: 0.4rem 0.85rem;
          font-size: 0.78rem;
          cursor: pointer;
        }

        .section { margin-bottom: 1.25rem; }
        .section h2 {
          margin-bottom: 0.4rem;
          font-size: 1.05rem;
        }
        .muted {
          color: var(--muted);
          font-size: 0.78rem;
        }

        .outline-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 1rem;
        }
        .phase-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.03);
          padding: 0.8rem;
        }
        .phase-label {
          font-size: 0.6rem;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 0.06em;
          margin-bottom: 0.15rem;
        }
        .phase-card h3 { margin: 0 0 0.4rem; font-size: 0.88rem; }
        .module-list { display: grid; gap: 0.3rem; }
        .module-item {
          background: rgba(37,99,235,0.02);
          border-radius: 12px;
          padding: 0.25rem 0.4rem 0.3rem;
        }
        .module-item-title { font-size: 0.73rem; font-weight: 600; }
        .module-item p { margin: 0.18rem 0 0; font-size: 0.65rem; color: #6b7280; }

        /* Flowchart */
        .flowchart-wrap {
          background: #ffffff;
          border-radius: 16px;
          border: 1px dashed rgba(148,163,184,0.5);
          padding: 0.7rem 0.6rem 0.5rem;
        }
        .flowchart { display: flex; flex-wrap: wrap; gap: 0.3rem; align-items: center; }
        .flow-node {
          background: #eef2ff;
          border: 1px solid rgba(37,99,235,0.2);
          border-radius: 12px;
          padding: 0.28rem 0.6rem;
          font-size: 0.7rem;
          cursor: pointer;
          transition: transform 0.08s ease-out;
        }
        .flow-node:hover { transform: translateY(-1px); }
        .flow-arrow { font-size: 0.7rem; color: #94a3b8; }
        .flow-detail {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(148,163,184,0.2);
          border-radius: 12px;
          padding: 0.5rem 0.55rem 0.4rem;
          margin-top: 0.4rem;
          display: none;
        }
        .flow-detail.active { display: block; }
        .flow-detail-title { font-size: 0.7rem; font-weight: 600; }
        .flow-detail-body { font-size: 0.66rem; color: #4b5563; }
        .flow-detail-meta { font-size: 0.6rem; color: #94a3b8; margin-top: 0.2rem; }

        /* PLAY VIEW */
        #play-view {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(15,23,42,0.02);
          border-radius: 20px;
          padding: 1.1rem 1rem 1.1rem;
        }
        .play-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 0.7rem;
          margin-top: 0.9rem;
        }
        .play-card {
          background: #ffffff;
          border: 1px solid rgba(15,23,42,0.03);
          border-radius: 14px;
          padding: 0.6rem;
        }
        .play-card h3 {
          margin: 0 0 0.35rem;
          font-size: 0.78rem;
        }
        .play-card p {
          margin: 0;
          font-size: 0.66rem;
          color: #6b7280;
        }

        footer.site-footer {
          text-align: center;
          padding: 1rem 0 1.4rem;
          color: #94a3b8;
          font-size: 0.68rem;
        }

        @media (max-width: 660px) {
          .hero { flex-direction: column; }
          .flowchart { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <header className="site-header">
        <div className="brand">FinishThatStory.com</div>
        <div className="tabs">
          <button
            type="button"
            className={`tab-btn${activeTab === "course" ? "active" : ""}`}
            onClick={() => handleTabChange("course")}
            aria-pressed={activeTab === "course"}
            aria-controls="course-view"
          >
            Course
          </button>
          <button
            type="button"
            className={`tab-btn${activeTab === "play" ? "active" : ""}`}
            onClick={() => handleTabChange("play")}
            aria-pressed={activeTab === "play"}
            aria-controls="play-view"
          >
            PLAY
          </button>
        </div>
      </header>

      <main className="page">
        <section
          id="course-view"
          aria-label="Course"
          style={{ display: activeTab === "course" ? "block" : "none" }}
        >
          <div className="hero">
            <div className="hero-left">
              <h1>Story Studio — Idea to Structured Season</h1>
              <p>
                Playful, gamified prewriting → clear seasons → ready for your StudioOrganize tools.
              </p>
              <div className="hero-cta">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => alert("Connect to enroll / Stripe / Supabase")}
                >
                  Start this track
                </button>
                <button type="button" className="btn-light" onClick={handleScrollToOutline}>
                  View outline
                </button>
              </div>
            </div>
            <div>
              <p style={{ fontSize: "0.7rem", color: "#6b7280" }}>
                Includes: 5 idea mini-apps, 3 structure modules, 3 production handoffs.
              </p>
            </div>
          </div>

          <section className="section" aria-labelledby="course-who">
            <h2 id="course-who">Who this is for</h2>
            <p className="muted">
              Writers, indie animators, episodic storytellers, comics creators, and anyone who wants
              to build a show-like story universe.
            </p>
          </section>

          <section
            className="section"
            id="course-outline"
            aria-labelledby="outline"
            ref={outlineRef}
          >
            <h2 id="outline">Course outline</h2>
            <p className="muted">
              3 phases. Start with Idea Games, then shape it, then export to your existing creative
              hub.
            </p>

            <div className="outline-grid">
              <article className="phase-card">
                <div className="phase-label">Phase 1</div>
                <h3>Idea Games</h3>
                <p className="muted" style={{ marginBottom: "0.4rem" }}>
                  Gamified, visual, with music.
                </p>
                <div className="module-list">
                  <div className="module-item">
                    <div className="module-item-title">1. Brain Board & Keywords</div>
                    <p>Drop plot, emotions, characters.</p>
                  </div>
                  <div className="module-item">
                    <div className="module-item-title">2. Season / Episode Mapper</div>
                    <p>See the big picture.</p>
                  </div>
                  <div className="module-item">
                    <div className="module-item-title">3. Emotion & Tone Dial</div>
                    <p>Keep it one show.</p>
                  </div>
                  <div className="module-item">
                    <div className="module-item-title">4. Conflict / Stakes</div>
                    <p>Add friction.</p>
                  </div>
                  <div className="module-item">
                    <div className="module-item-title">5. Scene Machine</div>
                    <p>Test 3–5 scenes.</p>
                  </div>
                </div>
              </article>

              <article className="phase-card">
                <div className="phase-label">Phase 2</div>
                <h3>Structure & Delivery</h3>
                <p className="muted" style={{ marginBottom: "0.4rem" }}>
                  Turn playful output into a season plan.
                </p>
                <div className="module-list">
                  <div className="module-item">
                    <div className="module-item-title">6. Season pacing</div>
                    <p>Balance reveals.</p>
                  </div>
                  <div className="module-item">
                    <div className="module-item-title">7. Episode construction</div>
                    <p>Cold opening, B-stories.</p>
                  </div>
                  <div className="module-item">
                    <div className="module-item-title">8. Scene-to-board handoff</div>
                    <p>Export beats.</p>
                  </div>
                </div>
              </article>

              <article className="phase-card">
                <div className="phase-label">Phase 3</div>
                <h3>Production / Integrations</h3>
                <p className="muted" style={{ marginBottom: "0.4rem" }}>
                  Connect to your tools.
                </p>
                <div className="module-list">
                  <div className="module-item">
                    <div className="module-item-title">9. Storyboard Pro</div>
                    <p>Visualize scenes.</p>
                  </div>
                  <div className="module-item">
                    <div className="module-item-title">10. Character Studio</div>
                    <p>Link characters.</p>
                  </div>
                  <div className="module-item">
                    <div className="module-item-title">11. Script / Writing</div>
                    <p>Finish dialog.</p>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="section" aria-labelledby="flow">
            <h2 id="flow">How it flows</h2>
            <div className="flowchart-wrap">
              <div className="flowchart" id="flowchart-nodes">
                {flowSteps.map((step, index) => (
                  <div key={step.key} className="flowchart-step">
                    <button
                      type="button"
                      className="flow-node"
                      onClick={() => setSelectedStep(step.key)}
                    >
                      {step.label}
                    </button>
                    {index < flowSteps.length - 1 && <span className="flow-arrow">→</span>}
                  </div>
                ))}
              </div>
              <div className={`flow-detail${currentDetail ? "active" : ""}`} id="flow-detail-box">
                <div className="flow-detail-title">
                  {currentDetail ? currentDetail.title : "Click a step to see what happens."}
                </div>
                <div className="flow-detail-body">
                  {currentDetail
                    ? currentDetail.body
                    : "This is where we explain each phase of the course."}
                </div>
                <div className="flow-detail-meta">
                  {currentDetail ? currentDetail.meta : "FinishThatStory.com • Story track"}
                </div>
              </div>
            </div>
          </section>

          <section className="section" aria-label="CTA">
            <div className="hero-cta">
              <button
                type="button"
                className="btn-primary"
                onClick={() => alert("Connect to enroll / Stripe / Supabase")}
              >
                Enroll now
              </button>
              <button
                type="button"
                className="btn-light"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Back to top
              </button>
            </div>
          </section>
        </section>

        <section
          id="play-view"
          aria-label="Play"
          style={{ display: activeTab === "play" ? "block" : "none" }}
        >
          <h2>Story PLAY Lab (WIP)</h2>
          <p className="muted">
            This area is for the interactive / generative tools. We’re building it step by step — do
            not mix it with the course page.
          </p>
          <div className="play-grid">
            <article className="play-card">
              <h3>Story Prompt Mixer</h3>
              <p>Combine character + place + conflict.</p>
            </article>
            <article className="play-card">
              <h3>Scene Card Generator</h3>
              <p>Get a beat, a mood, and a twist.</p>
            </article>
            <article className="play-card">
              <h3>Character Collider</h3>
              <p>Force 2 characters into 1 scene.</p>
            </article>
            <article className="play-card">
              <h3>Import from StudioOrganize</h3>
              <p>Pull in characters / episodes from your other site.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="site-footer">FinishThatStory.com — creative storytelling hub</footer>
    </>
  );
}
