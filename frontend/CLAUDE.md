# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 frontend application using the App Router, React 19, TypeScript, and Tailwind CSS 4. The project appears to be part of a larger "hoppers-htb-challenge" system and includes PostgreSQL database integration via Neon.

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Create production build
npm start            # Run production server
npm run lint         # Run ESLint to check code quality
```

## Architecture & Structure

### Database Configuration
- **Client**: PostgreSQL client configured in `src/app/lib/postgres_client.ts`
- **Connection**: Uses the `postgres` library (not pg or node-postgres)
- **SSL**: Configured with `rejectUnauthorized: false` for Neon database
- **Environment**: Connection string is read from `DATABASE_URL` environment variable

### API Routes
- **Location**: `src/app/api/` directory using Next.js App Router conventions
- **Current Routes**:
  - `/api/user` (POST) - User signup endpoint (incomplete implementation at `src/app/api/user/route.ts:19`)
- **Pattern**: API routes export HTTP method functions (GET, POST, etc.) that receive `NextRequest` and return `NextResponse`

### TypeScript Configuration
- **Target**: ES2017
- **JSX**: react-jsx (React 19 uses automatic JSX runtime)
- **Path Aliases**: `@/*` maps to `./src/*`
- **Strict Mode**: Enabled

### Next.js Configuration
- **React Compiler**: Enabled (`reactCompiler: true` in next.config.ts)
- **Version**: Next.js 16.0.1 with React 19.2.0

### Styling
- **Framework**: Tailwind CSS 4.1.16
- **PostCSS**: Configured with `@tailwindcss/postcss`
- **Fonts**: Uses Geist and Geist Mono via `next/font/google`
- **Global Styles**: `src/app/globals.css`

## Important Implementation Notes

### Database Queries
When working with PostgreSQL queries using the `postgres` library:
- Import `sql` from `@/app/lib/postgres_client`
- Use tagged template literals: `` sql`SELECT * FROM table WHERE id = ${id}` ``
- The library handles parameterization and SQL injection prevention automatically

### API Route Structure
- Use typed request bodies with TypeScript interfaces (e.g., `UserSignupRequest`)
- Always wrap logic in try-catch blocks
- Return proper HTTP status codes via `NextResponse.json()`
- Log errors to console.error for debugging

### Environment Variables
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string for Neon database

## Known Issues

- `src/app/api/user/route.ts:19` has an incomplete SQL INSERT statement that needs completion