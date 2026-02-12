# IT Platform — Diploma Project

## Stack

Backend:
- NestJS
- Prisma
- PostgreSQL
- JWT
- Swagger

Frontend:
- Next.js (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- TanStack Query

## Architecture

Monorepo:

apps/
  api/
  web/

## MVP Features

- Authentication (JWT)
- Roles (Customer / Contractor)
- Projects CRUD
- Bids
- Accept contractor
- Project statuses

## Git Workflow

Main branches:

- main — stable demo version
- develop — main development branch

Feature branches:

feature/epic-1-environment
feature/epic-2-database
feature/epic-3-auth
...

Commits follow Conventional Commits:

feat:
fix:
chore:
refactor:
docs:
