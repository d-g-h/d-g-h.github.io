# Archived logistics tools

Archived on November 3, 2026, after recording the work in the master career catalog
at `src/data/labors.json`. These snapshots preserve the source, tests, dependency
lockfiles, and build configuration for the barcode/QR, route, staging, dispatch-wave,
dock-door (including DD rules), and floorplan work.

## Source snapshots

| Archive                   | Source commit                              | Contents                                                                                                                          |
| ------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch-source.tar.gz`  | `61829ae8b6ecc27801855cea3ccd627a47068202` | Complete tracked source before retirement, including `/b` batch QR codes and `/q` route/staging and dock-door tools.              |
| `floorplan-source.tar.gz` | `cee4a325c5980b78bb45322e7551d1d9f041d8a5` | Complete tracked source immediately before `6c4b1fd` removed the original `/d` and `/d/floor` implementation on February 2, 2026. |

Each archive is a source snapshot of its own application version. The dispatch
snapshot uses TanStack Start; the older floorplan snapshot uses Next.js. Keeping
their original manifests and lockfiles preserves the context needed to recover
either implementation. The archives contain committed files only, without Git
history, local environment files, private resumes, browser storage, or build output.
The career catalog updates made during retirement are in the active repository.

`manifest.json` records the source commits, archive SHA-256 checksums, file counts,
and exact paths removed from the active application. Before removal, every retired
file was compared byte for byte with the dispatch archive. Every file in both
archives was also compared with its source Git blob.

## Capabilities and resume evidence

The five logistics bullets in the consulting experience describe these implemented
features without claiming deployment scale or measured business outcomes:

- Route/staging and QR workflows: `dispatch/components/Qr/`,
  `dispatch/lib/utils/routeKey.ts`, and `dispatch/lib/utils/waveToMinutes.ts`.
- Dock-door assignment, arrival/departure logs, editable records, and tab-separated
  clipboard export: `dispatch/components/Qr/index.tsx` and `store.ts`.
- QR batches of up to 100 tracking identifiers, validation, persisted completion
  state, and responsive scanning layouts: `dispatch/components/BatchQr/`,
  `dispatch/lib/utils/batchTbas.ts`, and their tests.
- Floorplan editing with pointer placement, overlap checks, door insertion, and
  JSON import/export: `floorplan/components/FloorSlotBuilder/`,
  `floorplan/components/FloorPlanBuilder/`, and `floorplan/components/FloorPlanGenerator/`.
- Automatic route-to-staging assignments and persisted manual overrides:
  `floorplan/lib/utils/mapRoutesToFloorAssignments.ts`,
  `floorplan/lib/utils/applyFloorRouteOverrides.ts`,
  `floorplan/components/RouteFloorPreview/`, and their tests.
- Original dock-door state and DD rule configuration:
  `floorplan/components/Doors/store.ts` and `floorplan/lib/utils/ddDoorRules.ts`.

## Inspect or recover

From the repository root, list the files without extracting them:

```sh
tar -tzf archive/logistics-tools/dispatch-source.tar.gz
tar -tzf archive/logistics-tools/floorplan-source.tar.gz
```

Extract into a separate directory outside this repository so the archived routes
and tests do not enter the active build:

```sh
mkdir -p /tmp/logistics-tools-recovery
tar -xzf archive/logistics-tools/dispatch-source.tar.gz -C /tmp/logistics-tools-recovery
tar -xzf archive/logistics-tools/floorplan-source.tar.gz -C /tmp/logistics-tools-recovery
```

The extracted `dispatch/` and `floorplan/` directories are independent source
trees. Use their own package manifests and lockfiles when restoring them. Archives
preserve source; successful execution still depends on compatible runtimes and
available dependencies. Git history also retains both source commits.

## Active application after retirement

The portfolio/resume routes `/`, `/p`, and `/t` remain, with a static resume index
at `/resumes/`. `/b` and `/q` are retired
and use the application's existing not-found behavior. Shared QR generation stays
because the resume header still uses it. Zustand is removed from runtime
dependencies; it remains in the skills catalog as prior experience.

Existing browser data is untouched. To preserve personal operational records,
export the `qr-store` and `batch-tba-qr-state` localStorage values from the original
site's browser separately; those records are not source files and are not in these
archives.
