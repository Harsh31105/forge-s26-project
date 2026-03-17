# Contributing to forge-s26-project

Thank you for contributing! This document explains the conventions and processes to follow.

---

## Conventional Commits

All commit messages **must** follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This is enforced automatically by `commitlint` on every PR.

### Format

```
<type>(<optional scope>): <short description>

[optional body]

[optional footer(s)]
```

### Allowed Types

| Type       | When to use                                            |
|------------|--------------------------------------------------------|
| `feat`     | A new feature                                         |
| `fix`      | A bug fix                                             |
| `docs`     | Documentation changes only                           |
| `style`    | Formatting changes (no logic change)                 |
| `refactor` | Code refactoring (no new feature or bug fix)         |
| `test`     | Adding or updating tests                              |
| `chore`    | Maintenance tasks (dependency updates, tooling, etc.) |
| `ci`       | CI/CD configuration changes                          |
| `perf`     | Performance improvements                             |
| `build`    | Changes affecting the build system                   |
| `revert`   | Reverting a previous commit                          |

### Examples

```
feat(auth): add Google OAuth login flow
fix(reviews): handle null professor ID gracefully
docs: update API specification for reviews endpoint
chore(deps): bump express from 4.18 to 5.2
```

---

## Pull Request Process

1. **Branch naming** — use a descriptive prefix: `feat/`, `fix/`, `chore/`, `docs/`, etc.
   - Example: `feat/prof-review-endpoint`

2. **Open a PR against `main`** and fill in the PR template completely.

3. **All CI checks must pass** before merging:
   - MegaLinter (lint)
   - TypeScript typecheck
   - Unit tests
   - Docker image builds
   - Commitlint
   - Secret scan
   - Dependency audit
   - Changeset check (unless the PR title starts with `chore:` or `docs:`)

4. **Request a review** from at least one teammate who is familiar with the area you changed.

5. **Squash and merge** is the preferred merge strategy to keep the commit history clean.

### Backend PRs

If you are writing backend code, please include a screenshot of your endpoint(s) working through
manual testing (Postman, etc.). Include the URL and parameters used so they are easy to replicate.

### Frontend PRs

If you are writing frontend code, please include a screenshot or screen recording of your updates.

---

## Running Tests Locally

### Backend

```bash
cd backend

# Install dependencies
npm ci

# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (useful during development)
npm run test:watch
```

Tests require a running PostgreSQL instance. The test suite uses Testcontainers to spin one up
automatically — make sure Docker is running locally before running tests.

### Frontend

```bash
cd frontend

# Install dependencies
npm ci

# Build (catches type errors)
npm run build

# Lint
npm run lint
```

---

## Environment Setup

1. Copy the example env file and fill in real values:

   ```bash
   cp .env.example .env
   ```

2. See `.env.example` for descriptions of each variable.

3. Validate your configuration:

   ```bash
   cd backend
   npx ts-node scripts/validate-env.ts
   ```

---

## Changeset Workflow

This project uses [Changesets](https://github.com/changesets/changesets) to track notable changes
across releases.

### When is a changeset required?

A changeset is required for any PR that introduces a user-visible change — new features, bug fixes,
behaviour changes, or deprecations. It is **not** required for `chore:` or `docs:` PRs.

### Creating a changeset

```bash
# From the repo root
npx changeset
```

Follow the interactive prompts to:
1. Select the packages affected (backend and/or frontend).
2. Choose the bump type: `major`, `minor`, or `patch`.
3. Write a short summary of the change.

This creates a new file in `.changeset/`. Commit it alongside your code changes.

### Releasing

Maintainers run `npx changeset version` to apply all pending changesets and bump versions, then
merge the resulting release PR.

---

## Review Process

Once a pull request has been submitted, mark your project lead as a reviewer. If other team members
have worked on sections of the code you edited, request their review as well.

**Tip:** You can open a *draft PR* to run CI checks before officially submitting for review.

If your pull request is not approved, the reviewer will leave suggestions for changes. Once changes
are made, ask for a re-review. If more discussion is needed, reach out through Slack.

---

## Code Style

- **Backend** — TypeScript strict mode. Run `npm run lint` and `npm run lint:fix` inside `backend/`.
- **Frontend** — Next.js / ESLint. Run `npm run lint` inside `frontend/`.
- Format code consistently; MegaLinter will catch common style violations in CI.
