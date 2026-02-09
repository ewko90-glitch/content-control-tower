# Content Control Tower (MVP)

Minimalny, wielotenantowy MVP do planowania, generowania, akceptacji i publikacji treści do WordPressa. LinkedIn jest przygotowany jako placeholder (model i UI).

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + Postgres
- NextAuth (Credentials) + RBAC
- Docker Compose (Postgres)
- Redis (placeholder, opcjonalnie)

## Architektura (MVP)
- **Multi-tenant**: wszystkie dane są powiązane z `workspaceId`.
- **RBAC**: OWNER, EDITOR, APPROVER.
- **Audit log**: create/update/status_change/approve/reject/schedule/publish_attempt.
- **Security**: bcrypt dla haseł, AES-256-GCM dla WordPress app passwords.

## Start локально

```bash
npm install
cp .env.example .env
# Wygeneruj bezpieczny klucz szyfrowania (32 bajty base64)
# np. openssl rand -base64 32
#
# NEXTAUTH_SECRET możesz wygenerować np.:
# openssl rand -base64 32

docker compose up -d
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Aplikacja startuje pod `http://localhost:3000`.

## Konto demo (seed)
- email: `owner@example.com`
- hasło: `Password123!`

## Debug / healthcheck
- Health: `GET /api/health`
- Prisma Studio: `npx prisma studio`
- Logi DB: `docker compose logs -f postgres`

## Najważniejsze ścieżki
- `/login`, `/register`
- `/workspaces` (create/list/switch)
- `/domains` (WordPress domains + sitemap)
- `/content` (draft → generate → approval → schedule/publish)
- `/calendar` (weekly list)
- `/inbox` (notifications)

## Uwagi
- LinkedIn: tylko placeholder (type + UI), bez publikacji.
- Publikacja do WP wymaga statusu `APPROVED`.
- W przypadku braku sitemap.xml możliwe jest ręczne wklejenie URL.
