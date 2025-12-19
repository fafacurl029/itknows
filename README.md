# IT Infrastructure L2 Knowledge Base (Cloud-ready, Postgres, Docker)

A modern, login-first knowledge base for IT Infrastructure teams (L1/L2/L3) with:
- Secure authentication (JWT in HttpOnly cookie)
- RBAC (ADMIN / APPROVER / CONTRIBUTOR / READER)
- Spaces & Collections
- Articles (Markdown) with templates
- Draft/Published workflow + version history + restore
- Comments
- Basic search
- Audit trail
- Cloud-ready deployment with Postgres

## Quick start (Docker)
1) Install Docker Desktop
2) From the project root:

```bash
cp .env.example .env
docker compose up --build
```

3) Open:
- App: http://localhost:8080

4) First-time setup:
- Visit http://localhost:8080/setup
- Create the first ADMIN account (only available when there are 0 users)

## Environment variables
Copy `.env.example` to `.env` and update:

- `DATABASE_URL` (Postgres connection string)
- `JWT_SECRET` (long random string)
- `APP_ORIGIN` (public URL, e.g. http://localhost:8080)

## Database migrations
Migrations run automatically on container start:
- `prisma migrate deploy`

If you run locally without Docker:

```bash
npm install
npm -w apps/server run db:migrate
npm -w apps/server run db:seed
npm run dev
```

## Deploy to cloud (one-container approach)
This repo builds a **single web container** that serves:
- React frontend (static)
- Express API (`/api/*`)
…and connects to your Postgres.

### Render
A `render.yaml` is included as a starting point. Create a new **Blueprint** in Render and select this repo.
Ensure `DATABASE_URL` is connected to the Render Postgres instance.

### Other clouds (Fly.io, DigitalOcean, AWS)
- Build the Docker image from the root `Dockerfile`
- Provide `DATABASE_URL`, `JWT_SECRET`, `APP_ORIGIN`
- Run the container on port **8080**

## Roles
- **ADMIN**: user management + everything
- **APPROVER**: publish / change status, edit
- **CONTRIBUTOR**: create/edit drafts
- **READER**: read/search/comment

## Security notes (MVP)
- JWT stored in HttpOnly cookie (mitigates token theft via JS)
- Auth rate-limited endpoints
- RBAC enforced on API routes
- Audit events recorded for key actions

## Project structure
- `apps/server` Express + Prisma + Postgres
- `apps/web` React + Tailwind UI
- Root Dockerfile builds web then server and serves everything from one container
