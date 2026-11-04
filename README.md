[![CodeQL](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/github-code-scanning/codeql)
[![Test](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/test.yml/badge.svg)](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/test.yml)
[![Deploy](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/deploy.yml)

### Resumes

Resumes are static files served by this repository's existing GitHub Pages workflow.
The resume index is `/resumes/` (`https://d-g-h.github.io/resumes/` after deployment).
It links to the current career history at `/t/`, the printable history at `/p/`,
and all five saved tailored PDFs, with HTML previews where available.

```sh
npm run resume:list
# Alias:
npm run resume:links
```

Both commands print the hardcoded GitHub Pages URLs directly from `src/data/resumes.json`.
They work offline and do not call an API. URLs become available when the corresponding
files are deployed; listing them does not publish a deployment.

To add a tailored resume, put the finished PDF and optional standalone HTML in
`public/resumes/`, then add its title and paths to `src/data/resumes.json`. Files in
that directory are public on GitHub Pages. Keep drafts and personal working files
in the ignored `private/` directory. The complete career catalog remains in `src/data/`;
saved tailored versions keep their original content.

The former private resume service, database code, cloud provisioning, and API commands
have been removed. No separate server, credentials, or cloud account is needed to
list or serve these resumes. Earlier service code remains in Git history.

install

```
npm i
```

dev

```
npm run dev
```

inspect

```
npm run dev:inspect
```

test in dev

```
npm test
```

test in prod w/coverage report

```
npm run test:ci
```

test in prod w/coverage report & update snapshot

```
npm run test:ci -- -u
```

prod

```
npm run build
```

dev

```
npm run start
```

lint

```
npm run lint
```

### Deploy

Push to the main branch to trigger `.github/workflows/deploy.yml`

### Archived logistics tools

Barcode/QR, route, staging, dock-door, and floorplan tools are preserved as source
snapshots with recovery instructions in [archive/logistics-tools](archive/logistics-tools/README.md).
The active application contains the portfolio and resume routes.
