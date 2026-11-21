[![CodeQL](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/github-code-scanning/codeql)
[![Test](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/test.yml/badge.svg)](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/test.yml)
[![Deploy](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/deploy.yml)

### Resume

The current resume is at [d-g-h.github.io](https://d-g-h.github.io/). Its content
comes from the summary, experience, skills, and education files in `src/data/`.
The old `/p/`, `/t/`, and `/resumes/` page links open the current resume.

Use those source files as context when drafting tailored versions with AI. Save
company submissions and working files in the ignored `private/` directory or
another private location. GitHub Pages publishes files under `public/`.

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
The active application serves the resume.
