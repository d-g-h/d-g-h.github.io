[![Analysis](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/analysis.yml/badge.svg)](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/analysis.yml)
[![Deploy Next.js site to Pages](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/nextjs.yml/badge.svg)](https://github.com/d-g-h/d-g-h.github.io/actions/workflows/nextjs.yml)

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

prod

```
npm run build
```

lint

```
npm run lint
```

### Deploy

Push to the main branch to trigger `.github/workflows/nextjs.yml`

### API

```sh
curl -s https://d-g-h.github.io/labors.json     | jq
curl -s http://localhost:3000/labors.json       | jq
curl -s https://d-g-h.github.io/educations.json | jq
curl -s http://localhost:3000/educations.json   | jq
```
