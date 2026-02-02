# Next.js → TanStack Start Migration Plan

## Goals
- Preserve existing routes and UI.
- Keep GitHub Pages–friendly static deploy behavior.
- Minimize behavioral regressions for QR and floor-plan tools.

## Current Snapshot (Repo)
- Next.js App Router in `app/` with routes: `/`, `/c`, `/p`, `/t`, `/q`, `/d`, `/d/floor`.
- `next/link` used in `app/d/layout.tsx` and `app/not-found.tsx`.
- `getQRCode` is used in server components (`/p`, `/t`) and reads `NEXT_PUBLIC_URL`.
- Many client-only components rely on DOM APIs and localStorage.
- JSON data is imported from `public/*.json`.
- `next.config.mjs` uses `output: "export"` (static build).

## Decisions & Constraints
1. **Rendering/hosting mode (GitHub Pages)**
   - Static output only.
   - **Chosen:** prerender all routes.
   - Fallback: use SPA mode only if prerendering fails due to DOM-only code.
2. **Routes directory**
   - Keep the current `app/` layout by configuring `routesDirectory: "app"` (and `srcDirectory` if needed).
3. **Environment variable naming**
   - Migrate `NEXT_PUBLIC_*` → `VITE_PUBLIC_*` for client usage.
4. **JSON data location**
   - Confirm whether `public/*.json` can be imported in Vite/Start.
   - If not, move JSON into a source folder (e.g. `src/data`) and update imports.
5. **404 handling**
   - Use `notFoundComponent` in the root route.

## Migration Phases

### Phase 0 — Prep
- [ ] Create a migration branch.
- [ ] Snapshot current output (run `npm run build` and keep `out/` for diffing).

### Phase 1 — Tooling & Config
- [ ] Remove Next.js and Next config files.
- [ ] Add Start + Router + Vite dependencies.
- [ ] Update `package.json` scripts to Start/Vite (`dev`, `build`, `start`) and set `"type": "module"`.
- [ ] Add `vite.config.ts` with:
  - `tanstackStart()` plugin.
  - `vite-tsconfig-paths` for `@/*` alias.
  - `routesDirectory: "app"` if we keep the current folder layout.
  - `prerender: { enabled: true }` for static output.

### Phase 2 — Router Scaffolding
- [ ] Add `router.tsx` (createRouter + routeTree). (Docs)
- [ ] Ensure `routeTree.gen.ts` is generated on first dev run. (Docs)
- [ ] Convert `app/layout.tsx` → `app/__root.tsx` using `createRootRoute`, `HeadContent`, `Scripts`, `Outlet`, and `head`. (Docs)
- [ ] Move global CSS to a `head` link via `globals.css?url`. (Docs)
- [ ] Add `notFoundComponent` in `__root.tsx` (or router default) using the old `not-found.tsx` UI. (Docs)

### Phase 3 — Route Files
- [ ] Convert each `page.tsx` to Start route files:
  - `/` → `app/index.tsx` with `createFileRoute("/")`. (Docs)
  - `/c`, `/p`, `/q`, `/t` → `app/c.tsx`, `app/p.tsx`, `app/q.tsx`, `app/t.tsx` (or `app/{route}/index.tsx` if we want directory-based indices). (Docs)
  - `/d` + `/d/floor` → `app/d.tsx` (layout-style route with `<Outlet />`) + `app/d/floor.tsx`. (Docs)
- [ ] Replace `next/link` with `@tanstack/react-router` `Link` and `to` prop. (Docs)
- [ ] Replace Next `metadata` with `head` in route definitions as needed. (Docs)

### Phase 4 — Data & Server Logic
- [ ] Move `getQRCode` usage into a Start `loader` and/or a `createServerFn` wrapper.
- [ ] For prerendering, consider **static server functions** so QR output is baked at build time.
- [ ] Update env usage:
  - Server: `process.env`.
  - Client: `import.meta.env.VITE_*`.
- [ ] Audit client-only DOM APIs (e.g. `DOMParser`, `document`, `window`) to avoid SSR crashes:
  - Add runtime guards or render only on client.
  - Consider SPA or selective SSR for `/q` and floor tools if needed.

### Phase 5 — Assets & Styling
- [ ] Ensure `globals.css` loads via root `head` link.
- [ ] Replace `app/icon.ico` with a `public/` asset + `<link rel="icon" ...>` in `head`.
- [ ] Verify JSON imports; relocate into source if Vite doesn’t bundle them from `public/`.

### Phase 6 — Build/Deploy
- [ ] Update GitHub Pages workflow to:
  - Build with Start/Vite.
  - Upload the static output directory (verify the path after first build).
- [ ] Remove Next-specific workflow steps (Next build/export).

### Phase 7 — Validation
- [ ] `npm run dev`: verify all routes render and hydration is clean.
- [ ] `npm run test` / `npm run test:ci`.
- [ ] Build output check (SSR or static).

## Route Mapping Reference
| Next App Router | TanStack Start (proposed) |
| --- | --- |
| `app/layout.tsx` | `app/__root.tsx` |
| `app/page.tsx` | `app/index.tsx` |
| `app/c/page.tsx` | `app/c.tsx` |
| `app/p/page.tsx` | `app/p.tsx` |
| `app/q/page.tsx` | `app/q.tsx` |
| `app/t/page.tsx` | `app/t.tsx` |
| `app/d/layout.tsx` + `app/d/page.tsx` | `app/d.tsx` (layout + content) |
| `app/d/floor/page.tsx` | `app/d/floor.tsx` |
| `app/not-found.tsx` | `notFoundComponent` in root route |

## Docs Pointers
- TanStack Start: Routing
- TanStack Start: Static Prerendering
- TanStack Start: Static Server Functions (experimental)
- TanStack Start: Hosting (static output dir)
