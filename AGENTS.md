# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes, with `layout.tsx` and `page.tsx` per section; add shared metadata here.
- `components/`: Reusable UI parts; keep component-specific styles close by or import from `styles/`.
- `lib/`: Utilities (formatters, data helpers); prefer pure functions with clear inputs/outputs.
- `styles/`: Global CSS and shared design tokens.
- `public/`: Static assets served as-is; `out/` holds exported build artifacts; `coverage/` holds Jest reports.
- `__tests__/`: Jest + Testing Library unit/snapshot tests with `__snapshots__/` for stored snapshots.

## Build, Test, and Development Commands
- `npm run dev` — Next.js dev server; use `npm run dev:inspect` to debug with Node inspector.
- `npm run build` — Production build for deployment.
- `npm test` — Jest in watch mode for rapid feedback.
- `npm run test:ci` — Jest in CI mode with coverage; append `-- -u` to refresh snapshots.
- `npm run lint` — Biome linting; `npm run format` auto-formats code.

## Coding Style & Naming Conventions
- TypeScript-first. Prefer functional components and hooks.
- Biome enforces formatting: 2-space indent, 100-char line width, double quotes, trailing commas, semicolons.
- Use `const` and `import type` when possible; avoid `any` (warned) and unused vars (except App Router files where disabled).
- Components/hooks use `PascalCase`; utilities `camelCase`; tests follow `*.test.tsx` / `*.test.ts` near related modules.

## Testing Guidelines
- Frameworks: Jest + `@testing-library/react` with jsdom environment.
- Place unit tests in `__tests__` mirroring module names; snapshots live in `__tests__/__snapshots__/`.
- Aim for coverage by exercising new branches in `test:ci`; include accessibility and DOM assertions for UI changes.

## Commit & Pull Request Guidelines
- Match history: short, imperative messages, often emoji-prefixed (e.g., `🛠️ add util`).
- Keep commits focused; add bodies when behavior changes or migrations need context.
- PRs should describe scope, link issues, and note environment/ops impacts; attach screenshots for UI tweaks.
- Ensure `lint`, `build`, and `test:ci` pass before requesting review; pushes to `main` trigger deploy workflow.

## Architecture & Configuration Notes
- Next.js 16 App Router with React 19; use server components by default and lift client state into Zustand when needed.
- Configure via standard Next.js env vars; avoid committing secrets or tokens in code or tests.
