# d-g-h.co
[![CodeQL](https://github.com/d-g-h/d-g-h.github.com/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/d-g-h/d-g-h.github.com/actions/workflows/codeql-analysis.yml)
[![Node.js CI](https://github.com/d-g-h/d-g-h.github.com/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/d-g-h/d-g-h.github.com/actions/workflows/node.js.yml)
[![pages-build-deployment](https://github.com/d-g-h/d-g-h.github.com/actions/workflows/pages/pages-build-deployment/badge.svg?branch=gh-pages)](https://github.com/d-g-h/d-g-h.github.com/actions/workflows/pages/pages-build-deployment)
## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run dev
```

### Compiles, minifies, exports build for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Deploy
```
git checkout gh-pages
git rebase -i HEAD~2 #fixup commit into 'deploy'
```
