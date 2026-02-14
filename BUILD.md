# Building Extensity

## Prerequisites

- uglify-js
- csso-cli

```
npm install -g uglify-js csso-cli
```

## Development

### Linting

To check code quality with ESLint:

```bash
npm install  # Install dev dependencies (first time only)
npm run lint  # Check for issues
npm run lint:fix  # Auto-fix some issues
```

## Building

To build the distributable version, just run:

```
make
```
