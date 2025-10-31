# FinishThatStory.com Architecture Overview

This document summarizes the current technical architecture, conventions, and deployment flow for FinishThatStory.com. It should be updated whenever major platform decisions or structural changes occur.

## Application stack

- **Framework**: Next.js 15 (App Router) with React Server Components enabled by default.
- **Language**: TypeScript throughout the application and configuration files.
- **Styling**: Tailwind CSS v4 for utility-first styling plus CSS variables for theming.
- **Internationalization**: `next-intl` for locale-aware routing and translations.
- **Authentication & data**: Supabase client SDK, with future expansion for auth, database, and storage integrations.
- **PWA tooling**: `next-pwa` manages the service worker and PWA manifest output.

## Directory structure

```
/
├── src/
│   ├── app/                 # App Router entry point with locale-aware layouts and routes
│   ├── components/          # Shared UI primitives (navigation, buttons, theme toggle, etc.)
│   ├── i18n/                # `next-intl` configuration helpers and locale detection utilities
│   ├── lib/                 # Framework-agnostic helpers (Supabase client, analytics, etc.)
│   └── messages/            # Translation JSON files grouped by locale
├── public/                  # Static assets, icons, and PWA manifest
├── middleware.ts            # Locale negotiation and middleware guards
├── eslint.config.mjs        # Flat ESLint configuration extending the Next.js/Tailwind presets
├── prettier.config.mjs      # Prettier formatting rules including Tailwind plugin ordering
├── postcss.config.mjs       # Tailwind CSS + autoprefixer pipeline
└── tsconfig.json            # Project-wide TypeScript configuration with path aliases
```

Future features (database schema, media pipelines, etc.) should place server-only utilities under `src/lib` and co-locate feature-specific components within `src/app` route segments.

## Coding conventions

- Prefer server components in `src/app` unless client-only APIs (stateful hooks, browser APIs) are required. Mark client modules with the `"use client"` directive.
- Use TypeScript types/interfaces for props, API responses, and Supabase data models.
- Keep shared UI primitives in `src/components` and keep them presentational. Compose feature logic within route segments.
- Tailwind class names should follow the mobile-first responsive pattern and rely on design tokens defined in `globals.css`.
- Run `npm run lint`, `npm run type-check`, and `npm run format` locally before opening pull requests.
- Keep translation keys human-readable and grouped by feature in `src/messages/<locale>.json`.

## Deployment flow

1. Feature branches are opened from `main` and go through GitHub pull requests.
2. GitHub Actions run `npm run lint` and `npm run type-check` on every push to ensure baseline quality.
3. The `main` branch is deployed automatically to Vercel (preview environments can be requested from feature branches when needed).
4. Environment variables required for Supabase live in `.env.local` locally and Vercel project settings in production.

## Documentation maintenance

- Update this file whenever new directories, tooling, or conventions are introduced.
- Add new ADRs under `docs/adrs/` for high-impact architectural decisions.
- Summaries of progress belong in the root `README.md` roadmap.
