# ADR 0001: Adopt Next.js App Router for FinishThatStory.com

- **Status:** Accepted
- **Date:** 2024-05-26

## Context

FinishThatStory.com requires a modern, performant framework capable of serving a rich storytelling experience with internationalization, PWA support, and deep integration with Supabase services. We evaluated React SPA tooling, SvelteKit, and Next.js (Pages and App Router).

## Decision

We selected **Next.js 15 with the App Router** as the foundation of the project.

## Consequences

- Leverages React Server Components by default for improved performance and data-fetching ergonomics.
- Built-in routing conventions simplify locale-aware URL structures when paired with `next-intl`.
- Supports incremental static regeneration, streaming, and edge rendering for future scalability needs.
- The App Router aligns cleanly with Supabase server helpers and simplifies authenticated layouts.
- Requires familiarity with server/client component boundaries and the `use client` directive for interactive components.

## Alternatives considered

1. **Next.js Pages Router** – Mature but lacks first-class server components and nested layouts needed for the storytelling experience.
2. **SvelteKit** – Excellent developer experience, but the team already has React expertise and existing UI components, reducing ramp-up time with Next.js.
3. **Remix** – Strong data-loading story, but less built-in support for internationalization and PWA tooling compared with Next.js ecosystem plugins.
