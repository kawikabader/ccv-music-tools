# CCV Music Tools

A monorepo of music-related tools and applications managed with pnpm.

## Packages

* **[@ccv-music-tools/roster](./packages/roster)** - Team roster management application

## Live Deployment

* **Main Site**: [https://ccvmusic.tools](https://ccvmusic.tools) - Landing page
* **Roster App**: [https://ccvmusic.tools/roster](https://ccvmusic.tools/roster) - Team roster application

## Getting Started

### Prerequisites

* Node.js >= 22.0.0 (LTS)
* pnpm >= 10.0.0

### Installation

```bash
# Install pnpm globally if you haven't already
npm install -g pnpm

# Install all dependencies
pnpm install
```

### Development

```bash
# Run all packages in development mode
pnpm dev

# Run specific package (roster)
pnpm roster:dev

# Build all packages
pnpm build

# Run tests for all packages
pnpm test

# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code in all packages
pnpm format
```

### Package-specific Commands

You can run commands in specific packages using pnpm filters:

```bash
# Run roster in development mode
pnpm --filter @ccv-music-tools/roster dev

# Build only the roster package
pnpm --filter @ccv-music-tools/roster build

# Test only the roster package
pnpm --filter @ccv-music-tools/roster test
```

## Deployment

The monorepo automatically deploys to GitHub Pages with a custom domain:

* **Automatic**: Push to `main` branch triggers GitHub Actions deployment
* **Manual**: Use `workflow_dispatch` in GitHub Actions to trigger deployment
* **Local Build**: `pnpm deploy:local` to test the deployment structure locally

### Custom Domain Setup

The repository is configured to deploy to `ccvmusic.tools` :
* Root domain (`ccvmusic.tools`) shows a blank landing page
* Roster app is available at `ccvmusic.tools/roster`
* CNAME file configures the custom domain
* GitHub Pages is set to use the custom domain

## Monorepo Structure

```
ccv-music-tools/
├── packages/
│   └── roster/           # Team roster application
├── package.json          # Root package.json with workspace scripts
├── pnpm-workspace.yaml   # pnpm workspace configuration
└── README.md            # This file
```

## Adding New Packages

1. Create a new directory under `packages/`
2. Add a `package.json` with name `@ccv-music-tools/package-name`
3. The package will automatically be included in the workspace

## Scripts

* `pnpm dev` - Start development for the default package (roster)
* `pnpm build` - Build all packages
* `pnpm test` - Run tests for all packages
* `pnpm lint` - Lint all packages
* `pnpm format` - Format code in all packages
* `pnpm clean` - Clean all node_modules and build artifacts
* `pnpm roster:*` - Package-specific commands for the roster app

## License

MIT
