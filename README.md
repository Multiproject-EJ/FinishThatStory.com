# FinishThatStory.com Development Plan

This document is a living roadmap for building the FinishThatStory.com platform. Use the checkboxes to track progress and update the status notes as features are completed.

## Platform Vision

FinishThatStory.com is evolving into a progressive web app that blends on-demand streaming, audio-first storytelling sessions, collaborative screenwriting rooms, and comic creation tools into a single seamless experience. The goal is to let fans flow effortlessly between listening, co-writing, and visual world-building without leaving the browser, while keeping the interface fast and installable on any device.

The FinishThatStory.com courses act as an on-ramp, graduating storytellers straight into the platform with skill paths, project templates, and challenges that unlock workspace access. StudioOrganize.com powers the planning and production backbone—supplying calendars, asset pipelines, and workflow automation that syncs directly with the creative sessions inside FinishThatStory.com so teams stay aligned from pitch to publication.

### Success criteria for the platform vision

- **Smooth playback and performance:** Adaptive streaming, offline-ready audio, and responsive navigation that keeps immersive sessions glitch-free.
- **Creator-first tooling:** Real-time collaboration, script-to-comic pipelines, and asset management that reduce friction for storytellers joining from the course funnel.
- **Community engagement metrics:** Built-in analytics that track participation, retention, and contribution health to steer future product phases.

## Quick start

1. Copy environment variables: `cp .env.example .env.local` and provide your Supabase credentials.
2. Install dependencies: `npm install`.
3. Start the development server: `npm run dev` (visit http://localhost:3000 and choose a locale path such as `/en`).

## Legend

- [x] ✅ Done
- [ ] ⬜ Not started
- [ ] 🟡 In progress / partially complete

## Phase 0 — Project Foundations

- [x] ✅ **Repository readiness**
  - Initialize the chosen framework (Next.js or SvelteKit) with PWA capabilities.
  - Configure ESLint, Prettier, and Tailwind CSS.
  - Integrate `i18next` or `next-intl` for multi-language support scaffolding.
  - Install and configure Supabase client SDK.
  - Prepare CI/CD workflow (GitHub + Vercel/Netlify) with automatic lint/test gates.
    _Status notes:_
  - ✅ Next.js App Router project scaffolded with Tailwind CSS 4, a PWA manifest, and `next-pwa` configuration.
  - ✅ ESLint flat config extended with Prettier (including Tailwind CSS plugin) and npm scripts for linting, formatting, and type-checking.
  - ✅ `next-intl` wired with middleware, locale-aware layouts, and starter copy for English and Spanish.
  - ✅ Supabase client helper created with environment variable guardrails plus `.env.example` for onboarding.
  - ✅ GitHub Actions workflow enforces `npm run lint` and `npm run type-check` on pushes and pull requests.
- [x] ✅ **Architecture documentation**
  - Document directory structure, coding conventions, and deployment flow.
  - Add ADRs (Architecture Decision Records) for major tech selections.
    _Status notes:_
  - ✅ Added `docs/architecture.md` with stack overview, conventions, and deployment workflow.
  - ✅ Logged ADR 0001 capturing the decision to build on Next.js App Router.

## Phase 1 — Authentication & User Profiles

- [x] ✅ **Supabase Auth configuration**
  - Enable email/password and social providers.
  - Implement signup, login, logout, and session persistence in the client.
  - Set up protected routes and context/provider for auth state.
    _Status notes:_
  - ✅ Added client-side Supabase auth provider with session persistence, sign-in and sign-up flows, header sign-out controls, and Google/GitHub OAuth buttons.
  - ✅ Introduced a `ProtectedRoute` guard, redirect-aware auth links, and a localized account dashboard to enforce client-side route protection.
- [x] ✅ **User profile management**
  - Create `UserProfile` table (username, avatar, bio, language).
  - Implement profile edit and view UI.
  - Apply RLS policies to restrict edits to the owner.
    _Status notes:_
  - ✅ Added Supabase DDL with RLS and onboarding trigger in `docs/supabase/user-profile.sql` to provision the `UserProfile` table.
  - ✅ Account dashboard now loads and saves profile data with live preview, validation helpers, and Supabase integration.
  - ✅ English and Spanish copy extended for the new management workflow.

## Phase 2 — Core Storytelling Data Model

- [x] ✅ **Database schema**
  - Create tables: `stories`, `chapters`, `comments`, `likes`, `followers`, `story_contributions`.
  - Establish foreign keys, indexes, and RLS policies.
  - Seed database with sample data for testing.
    _Status notes:_
  - ✅ Added `docs/supabase/story-data-model.sql` defining normalized tables, triggers, RLS policies, indexes, and sample seed rows for core storytelling entities.
- [x] ✅ **Supabase integration layer**
  - Build server-side functions/hooks for CRUD operations.
  - Add Zod or similar validation for inputs.
  - Write integration tests for data operations.
    _Status notes:_
  - ✅ Added `src/lib/storyData.ts` encapsulating Supabase CRUD helpers for stories, chapters, comments, likes, follows, and
    contributions with Zod-powered validation and normalization.
  - ✅ Introduced Vitest-based integration tests in `tests/storyData.test.ts` using mocked PostgREST builders to verify filtering,
    publishing logic, and guardrails.

## Phase 3 — UI/UX & Navigation

- [ ] 🟡 **Global layout and navigation**
  - Implement responsive navigation with language switcher and auth controls.
  - Add dark mode toggle and ensure RTL compatibility.
  - Create shared components (buttons, forms, carousels).
    _Status notes:_
  - 🟡 Header includes responsive navigation with locale switcher, theme toggle, and placeholder auth actions. Mobile drawer and desktop layout now consistent with app gradient shell.
  - 🆕 Navigation highlights the new story composer workspace so builders can jump directly into content creation flows.
  - 🆕 Device-adaptive layouts now plan for a widescreen theater mode on desktop and a swipe-driven feed for mobile so navigation patterns flex with each device class.
- [ ] 🟡 **Core pages**
  - Homepage with trending/new/categories carousels.
  - Story detail page showing chapters, stats, and community interactions.
  - Reader view optimized for text/audio/video/interactive media.
  - Profile page with creator details, followers, and support links.
  - Editor/submit page supporting uploads or embeds for all content types.
    _Status notes:_
  - 🟡 Homepage now showcases trending and newly released story modules with localized placeholder data, discovery categories, and community rituals to guide future implementation.
  - 🆕 Marketing index at `/` (with `/en` fallback) now uses a static two-tab layout (Course vs. PLAY) so the sales page is immediately visible on FinishThatStory.com while the interactive lab continues iterating behind its own tab.
  - 🆕 Story detail page for "Stellar Symphony" renders demo Supabase-like data with chapters, engagement stats, collaborators, and contribution prompts at `/[locale]/stories/stellar-symphony` while automatically using live Supabase data when configured.
  - 🆕 Reader route at `/[locale]/stories/[slug]/read/[chapterId]` presents an immersive text + audio experience with Supabase-ready chapter media, ambient cues, and demo fallbacks that align with the database schema.
  - 🆕 Creator profile showcase at `/[locale]/profiles/novaquill` highlights Supabase-ready user data, live stats, story highlights, and support links with intelligent demo fallbacks that mirror the Supabase schema.
  - 🆕 Story composer workspace at `/[locale]/stories/create` walks through Supabase-aligned metadata, chapter authoring, and media attachments with graceful demo persistence.
  - 🆕 Multi-format discovery now features roadmap placeholders for video playlist rails, serialized audio book and podcast queues, interactive comic canvases, and screenplay workspace navigation hubs to reinforce format-specific browsing.
  - 🆕 Cross-format carousels tie together flagship story formats so fans can jump between text, audio, video, and interactive chapters from any landing page.
  - 🆕 Media-specific detail pages outline unique metadata needs (episode lists, waveform previews, panel grids, script acts) to ensure each format receives bespoke storytelling treatment.
  - 🟡 Creator dashboards backlog now captures upcoming action items: end-to-end upload pipelines with progress states, format-aware template pickers, and StudioOrganize sync affordances for production scheduling.

## Phase 4 — Community & Collaboration

- [ ] 🟡 **Engagement features**
  - Implement likes, comments, and follow interactions.
  - Add moderation tools (report, delete, or flag content).
  - Surface activity feeds and notifications.
    _Status notes:_
  - 🆕 Story engagement bar on detail pages toggles Supabase-backed likes and follows with demo fallbacks that mirror `StoryLike` and `UserFollow` tables when Supabase credentials are absent.
  - 🆕 Community comment composer on story detail pages now supports Supabase-ready submissions with chapter targeting, demo alias fallbacks that mirror the `Comment` table schema, and live preview of discussion metadata.
- [ ] 🟡 **Story continuation workflow**
  - Enable “Finish That Story” contribution chains.
  - Provide UI for requesting and accepting contributions.
  - Display contribution history on story pages.
    _Status notes:_
  - 🆕 Story contribution panel now surfaces live submission timelines with a Supabase-aware form, including demo storage fallbacks that mirror the `StoryContribution` table for offline development.

## Phase 5 — Internationalization & Accessibility

- [ ] ⬜ **Language support**
  - Localize UI strings (`en.json`, `es.json`, etc.).
  - Auto-detect browser language on first visit and respect user preference.
  - Store preferred language in `UserProfile` and sync with UI.
    _Status notes:_
- [ ] ⬜ **Accessibility audit**
  - Ensure color contrast, keyboard navigation, and ARIA labels.
  - Provide captions/transcripts for audio/video where applicable.
  - Conduct screen reader smoke tests.
    _Status notes:_

## Phase 6 — AI-Assisted Authoring (Optional)

- [ ] ⬜ **AI suggestion engine**
  - Integrate StudioOrganize or OpenAI API via Supabase Edge Functions.
  - Add “Finish This” button with genre/tone/format options.
  - Display AI-generated suggestions with acceptance/edit options.
    _Status notes:_

## Phase 7 — Mobile & PWA Enhancements

- [ ] 🟡 **PWA configuration**
  - Configure `manifest.json` and service worker (Next PWA or Vite plugin).
  - Support offline reading for text chapters.
  - Provide install prompts and app icons.
    _Status notes:_
  - 🆕 Service worker now precaches story navigation, fonts, and audio with an `_offline` fallback page plus install shortcuts tailored to the storytelling flows.
  - 🆕 Reader offline cache mirrors Supabase chapter payloads in local storage so demo data seamlessly upgrades once Supabase credentials are provided.
- [ ] ⬜ **Responsive experience**
  - Optimize layouts for mobile and tablets.
  - Ensure media players adapt to screen sizes and orientations.
  - Add touch-friendly controls and gestures.
    _Status notes:_

## Phase 8 — Media Handling & Storage

- [ ] ⬜ **Supabase Storage integration**
  - Set up buckets for cover images, audio, and video assets.
  - Enforce upload restrictions and ownership-based access policies.
  - Provide progress indicators and post-upload validation.
    _Status notes:_
- [ ] ⬜ **Media processing pipeline**
  - Generate thumbnails, waveforms, or transcoded variants where needed.
  - Handle external embeds (YouTube/Vimeo) gracefully.
  - Implement caching/CDN strategies for media delivery.
    _Status notes:_

## Phase 9 — Monetization & Analytics

- [ ] ⬜ **Support tools**
  - Integrate donation links (Patreon/Ko-fi) and optional Stripe payments.
  - Allow creators to configure funding goals and progress indicators.
  - Expose support metrics on profile and story pages.
    _Status notes:_
- [ ] ⬜ **Analytics & SEO**
  - Add per-story SEO metadata, sitemap, and robots.txt.
  - Configure analytics (Plausible/PostHog) with privacy considerations.
  - Monitor key metrics (DAU, story completions, language distribution).
    _Status notes:_

## Phase 10 — Launch Readiness

- [ ] ⬜ **Quality assurance**
  - Perform end-to-end testing across devices and browsers.
  - Conduct content moderation review and finalize guidelines.
  - Run final performance and security audits.
    _Status notes:_
- [ ] ⬜ **Go-live checklist**
  - Prepare release notes and marketing materials.
  - Ensure backup/rollback procedures are documented.
  - Tag v1.0.0 release and monitor post-launch metrics.
    _Status notes:_

---

### Daily Standup Template

- **Yesterday:** …
- **Today:** …
- **Blockers:** …

Update this plan as milestones are reached or requirements evolve.
