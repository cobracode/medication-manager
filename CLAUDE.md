# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a medication tracking application built as a monorepo using SST v3. The app allows users to manage medication schedules for care recipients with OIDC authentication.

## Architecture

The project follows a monorepo structure with npm workspaces:

- **`packages/core/`** - Shared TypeScript modules and utilities
- **`packages/functions/`** - AWS Lambda functions (API backend)
- **`packages/web/`** - Next.js frontend application (React SSR with Tailwind CSS)
- **`packages/scripts/`** - Administrative scripts using SST shell
- **`infra/`** - Infrastructure definitions (API Gateway, MySQL, S3, VPC)

## Tech Stack

- **Infrastructure**: SST v3 (AWS API Gateway, Lambda, RDS MySQL)
- **Backend**: TypeScript Lambda functions
- **Frontend**: Next.js 15 with React 19, Tailwind CSS v4
- **Authentication**: OIDC (using `oidc-client-ts` and `react-oidc-context`)
- **Database**: MySQL on AWS RDS
- **Testing**: Vitest for core package

## Development Commands

### Root Level
```bash
npm install                    # Install all workspace dependencies
npx sst deploy                # Deploy to AWS
npx sst dev                   # Start local development mode
npx sst remove                # Remove deployed resources
```

### Core Package (packages/core/)
```bash
npm run test                  # Run Vitest tests via sst shell
```

### Web Package (packages/web/)
```bash
npm run dev                   # Next.js dev server with Turbopack
npm run build                 # Build Next.js application
npm run start                 # Start production server
npm run lint                  # Run Next.js linting
```

### Scripts Package (packages/scripts/)
```bash
npm run shell                 # Run scripts with sst shell tsx
```

## Key Infrastructure Components

- **API**: Function URL-enabled Lambda (infra/api.ts:3)
- **Database**: MySQL with VPC configuration (infra/db.ts:3)
- **Storage**: S3 bucket for assets (infra/storage.ts)
- **Web App**: Next.js deployed via SST (sst.config.ts:23)

## Development Notes

- The project uses TypeScript with ES modules throughout
- All packages reference SST types via `sst-env.d.ts`
- Core package exports are configured for internal workspace imports using `@medication-manager/core/*`
- Authentication callback route is implemented in `packages/web/src/app/api/callback/route.tsx`
- Development database credentials are hardcoded for local development (db.ts:6-8)

## Data Model Requirements

From the README, the application needs to support:
- User authentication and management
- Care recipients with relationships
- Medications with schedules
- Daily/weekly dose recurrence patterns
- Marking medications as inactive (no deletion)