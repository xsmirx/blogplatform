# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Educational blog platform backend (Express 5 + TypeScript + MongoDB). The assignment changes per lesson — the current specification is always in `src/openAPI/api.json`. Architecture and patterns vary intentionally as the user explores different approaches.

## Commands

- **Build:** `pnpm build` (compiles to `dist/`)
- **Dev:** run `pnpm watch` and `pnpm dev` in separate terminals (watch compiles TS, dev runs nodemon on `dist/index.js`)
- **Lint:** `pnpm lint` (ESLint with autofix)
- **Format:** `pnpm format` (Prettier)
- **Run all tests:** `pnpm jest` (runs sequentially with `jest -i`)
- **Run single test:** `pnpm jest -- --testPathPattern=<pattern>` (e.g. `pnpm jest -- --testPathPattern=auth`)

## Environment Variables

Required in `.env`: `MONGO_URL`, `MONGO_DB_NAME`, `AC_TOKEN_SECRET`, `AC_TOKEN_TIME`, `EMAIL_ADDRESS`, `EMAIL_PASSWORD`. Optional: `HOST` (default `0.0.0.0`), `PORT` (default `3000`).

## Architecture Notes

- **Entry point:** `src/index.ts` bootstraps DB connection then starts Express. `src/setup-app.ts` registers all routes and the global error handler.
- **Modules:** `src/modules/` — each domain module (blog, post, comment, user, auth, testing) has its own router, handlers, service, repository, validators, and types. Some modules (user, auth) have deeper subdirectory structure (`api/`, `domain/`, `infrastructure/`).
- **Database:** MongoDB native driver (not Mongoose). Singleton `databaseConnection` in `src/bd/mongo.db.ts` exposes typed collections. Collections defined in `src/bd/collections.ts`.
- **Auth:** Basic auth for super-admin operations (hardcoded `admin:qwerty` default), JWT bearer tokens for user auth. `BcryptService` for password hashing, `JwtService` for token generation/verification.
- **Result pattern:** Services return `Result<T>` objects with `ResultStatus` enum instead of throwing — maps to HTTP status via `resultCodeToHttpException`. Legacy error-throwing approach (custom error classes + global `errorHandler`) also exists.
- **Validation:** `express-validator` middleware per field, collected via `inputValidationResultMiddleware`.
- **Tests:** Integration tests using `supertest` against the Express app, connecting to a local MongoDB (`blogplatform-test` DB). Each test suite resets data via `DELETE /testing/all-data`.
