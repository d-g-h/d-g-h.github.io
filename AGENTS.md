# Repository Guidelines

## Project Structure & Module Organization
- `src/routes/`: TanStack Router file routes; add route metadata and loaders here.
- `src/`: Application entrypoints, router setup, generated route tree, and public env access.
- `components/`: Reusable UI parts; keep component-specific styles close by or import from `styles/`.
- `lib/`: Utilities (formatters, data helpers); prefer pure functions with clear inputs/outputs.
- `styles/`: Global CSS and shared design tokens.
- `public/`: Static assets served as-is; `dist/` holds build artifacts; `coverage/` holds test reports.
- `__tests__/`: Vitest + Testing Library unit/snapshot tests with `__snapshots__/` for stored snapshots.

## Build, Test, and Development Commands
- `npm run dev` — Vite dev server.
- `npm run build` — Production build for deployment.
- `npm test` — Vitest in watch mode for rapid feedback.
- `npm run test:ci` — Vitest in CI mode with coverage; append `-- -u` to refresh snapshots.
- `npm run lint` — Biome linting; `npm run format` auto-formats code.

## Coding Style & Naming Conventions
- TypeScript-first. Prefer functional components and hooks.
- Biome enforces formatting: 2-space indent, 100-char line width, double quotes, trailing commas, semicolons.
- Use `const` and `import type` when possible; avoid `any` (warned) and unused vars.
- Components/hooks use `PascalCase`; utilities `camelCase`; tests follow `*.test.tsx` / `*.test.ts` near related modules.

## Testing Guidelines
- Frameworks: Vitest + `@testing-library/react` with jsdom environment.
- Place unit tests in `__tests__` mirroring module names; snapshots live in `__tests__/__snapshots__/`.
- Aim for coverage by exercising new branches in `test:ci`; include accessibility and DOM assertions for UI changes.

## Commit & Pull Request Guidelines
- Match history: short, imperative messages, often emoji-prefixed (e.g., `🛠️ add util`).
- Keep commits focused; add bodies when behavior changes or migrations need context.
- PRs should describe scope, link issues, and note environment/ops impacts; attach screenshots for UI tweaks.
- Ensure `lint`, `build`, and `test:ci` pass before requesting review; pushes to `main` trigger deploy workflow.

## Architecture & Configuration Notes
- TanStack Start on Vite with React 19; keep routes in `src/routes` and client state in Zustand when needed.
- Public client env vars use the `VITE_*` prefix; avoid committing secrets or tokens in code or tests.
