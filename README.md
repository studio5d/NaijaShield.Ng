# NaijaShield Cyber Portal

NaijaShield Cyber Portal is a cybersecurity client-management platform. The existing public website UI remains in `public/` and runs with the lightweight local `server.js`; the production-grade SaaS scaffold lives beside it in `backend/` and `frontend/`.

## What Is Included

- Public NaijaShield website with the existing dark cyber UI and portal entry buttons.
- Backend: Node.js, TypeScript, Express, Prisma, PostgreSQL, Zod, JWT access/refresh auth, HTTP-only refresh cookies, RBAC, Helmet, rate limiting, input sanitization, audit middleware, Multer PDF uploads, Pino logging, Swagger docs.
- Frontend: React, TypeScript, Vite, TailwindCSS, Axios interceptors, protected routes, auth context, dashboard shell, tables, cards, charts, and portal pages.
- DevOps: Dockerfiles, `docker-compose.yml`, GitHub Actions CI.

## Demo Accounts

- Admin: `admin@naijashield.ng` / `admin123`
- Client: `client@example.com` / `client123`

## Folder Structure

```text
backend/
  prisma/schema.prisma
  prisma/seed.ts
  src/config
  src/middleware
  src/modules/auth
  src/modules/client
  src/modules/admin
frontend/
  src/components
  src/context
  src/layouts
  src/pages
  src/services
public/
  Existing NaijaShield UI
server.js
docker-compose.yml
```

## Run Existing Local Website

```powershell
npm start
```

Open `http://127.0.0.1:5050`.

## Run Production Backend Locally

```powershell
cd backend
copy .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run dev
```

API docs: `http://localhost:5051/docs`

## Run Production Frontend Locally

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## Run With Docker

Create `backend/.env` from `backend/.env.example`, then run:

```powershell
docker compose up --build
```

The frontend runs on `http://localhost:5173` and the API runs on `http://localhost:5051`.

## Client Portal Features

- Dashboard with score, alerts, tickets, requests, reports, subscription summary, and quick actions.
- Document center for uploaded PDF reports with metadata.
- Ticket system with ticket creation, listing, detail endpoint, comments, status, priority, and attachment schema support.
- Service request center for pentesting, response, assessment, forensics, and compliance audits.
- Analytics with security score history chart and data endpoints for risk/compliance expansion.
- Company profile, team management, billing, notifications, audit logs, and knowledge base.

## Notes

This scaffold is production-oriented and ready for dependency installation, migration, and extension. Secrets must be replaced before deployment, and HTTPS should be enabled at the platform/load-balancer layer.
