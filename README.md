# NeNepOS - Student Discipline Management System

A full-stack Nuxt 4 application designed for deployment on Cloudflare Workers (Edge serverless full-stack) and Node.js environments (Docker / VPS). Distributed database persistence is powered by libSQL / Turso (SQLite Edge).

Student conduct rules and evaluation criteria follow the official 2026 - 2027 emulation standards of Chu Van An High School - Gia Nghia.

---

## Tech Stack

- Framework: Nuxt 4 (TypeScript, Vue 3)
- Runtime: Cloudflare Workers (Nitro preset `cloudflare-module` with Worker Static Assets) or Node.js server (`node-server`)
- Database: libSQL / Turso (SQLite Edge) with Drizzle ORM
- Authentication: JWT HS256 (`jose`), secure `httpOnly` session cookies
- Validation: Zod
- UI and Styling: Tailwind CSS 4 (`@tailwindcss/vite`), Reka UI, `@lucide/vue`
- Mobile and QR: `@capacitor/android`, `@capacitor/core`, `jsqr` (camera scanner), `qrcode-generator`
- Testing: Vitest

---

## Discipline and Conduct Criteria (2026 - 2027)

### 1. Punctuality and Attendance
- Excused absence: -2 points / student / session
- Unexcused absence: -10 points / student / session
- Skipping classes, flag-raising, or weekly meetings: -10 points / student / occurrence
- Arriving late: -5 points / student
- Not inside the classroom during early morning assembly: -10 points / student

### 2. Hygiene and Classroom Care
- Classroom vandalism, writing or drawing on desks/walls: -15 points / student occurrence
- Failure to arrange furniture and tools for collective activities: -15 points / class
- Missing table runner or flower vase on the teacher desk: -10 points / class
- Reprimanded by teacher due to poor cleanliness or littering: -20 points / session

### 3. Student Deportment and Behavior
- Dress code violation (missing badge, excessive makeup, wrong uniform, slippers, unkempt/dyed hair, untucked shirt for boys, earrings for boys): -10 points / student
- Eating snacks in class, sunflower seeds, chewing gum, littering school grounds: -10 points / student
- Unauthorized mobile phone use during class: -20 points / student
- Fighting, insolence, smoking, bringing alcohol: -30 points / student
- Bringing lighters, knives, scissors, or sharp objects to school: -20 points / student
- Profanity and vulgar language: -20 points / student
- Traffic and vehicle safety violations (illegal parking, missing rearview mirror, modified exhaust): -20 points / student
- Defamation or harassment on social media: -20 points / student

### 4. Classroom Property Preservation
- Damaging classroom facilities (desks, chairs, boards, curtains, doors): -20 points / student
- Leaving fans or lights on after class dismissal: -20 points
- Leaving classroom doors open after departure: -10 points

### 5. Extracurricular Activities
- Excused absence from extracurricular activities: -5 points / student / occurrence
- Unexcused absence from extracurricular activities: -10 points / student / occurrence
- Ranking lowest in competitions organized by school authorities: -20 points / class

---

## Cloudflare Workers and Turso Database Deployment

### Step 1: Create Database on Turso

1. Log in via Turso CLI or Web Console:
   ```bash
   turso auth login
   turso db create nenepos-db
   ```
2. Retrieve connection URL and authentication token:
   ```bash
   turso db show nenepos-db --url
   turso db tokens create nenepos-db
   ```

### Step 2: Apply Migrations and Seed Data

Run migrations and initialize data against your remote Turso database:

```bash
LIBSQL_URL="libsql://your-db-name.turso.io" \
LIBSQL_AUTH_TOKEN="<turso-token>" \
pnpm db:migrate

LIBSQL_URL="libsql://your-db-name.turso.io" \
LIBSQL_AUTH_TOKEN="<turso-token>" \
pnpm db:sync-rules

LIBSQL_URL="libsql://your-db-name.turso.io" \
LIBSQL_AUTH_TOKEN="<turso-token>" \
pnpm db:seed
```

Default seeded credentials:
- Administrator: `admin` / `admin123`
- Teachers: `teacher1`, `teacher2` / `teacher123`
- Discipline Board: `discipline1`..`discipline3` / `discipline123`

### Step 3: Configure Cloudflare Worker Secrets

Set remote secrets in Cloudflare Workers using Wrangler:

```bash
pnpm wrangler secret put AUTH_SECRET
pnpm wrangler secret put LIBSQL_URL
pnpm wrangler secret put LIBSQL_AUTH_TOKEN
```

### Step 4: Deploy to Cloudflare Workers

```bash
pnpm deploy:cf
```

This command executes:
1. Full-stack Nuxt build using the `cloudflare-module` preset.
2. Uploads static client assets to Cloudflare Worker Static Assets.
3. Publishes worker server handler to Cloudflare edge runtime.

---

## Local Development (Node.js and Local SQLite)

To run locally without requiring remote network resources:

```bash
pnpm install
pnpm db:reset
pnpm dev
```

The application will be available at `http://localhost:3000`.

---

## NPM Scripts Reference

| Command | Description |
|---|---|
| `pnpm dev` | Start local Nuxt development server |
| `pnpm build` / `pnpm build:cf` | Build full-stack application for Cloudflare Workers |
| `pnpm build:node` | Build application for Node.js / Docker production |
| `pnpm preview:cf` | Run local Cloudflare Workers preview using `wrangler dev` |
| `pnpm deploy:cf` | Build and deploy directly to Cloudflare Workers |
| `pnpm db:sync-rules` | Synchronize 2026-2027 conduct criteria and school metadata |
| `pnpm db:migrate` | Execute Drizzle ORM schema migrations |
| `pnpm db:seed` | Seed default users, classes, students, and sample violations |
| `pnpm db:reset` | Clear database tables and re-seed from scratch |
| `pnpm build:mobile` | Generate web assets and sync Capacitor Android project |
| `pnpm test` | Run automated test suite with Vitest |

---

## Automated Android APK Build (GitHub Actions)

The workflow `.github/workflows/build-apk.yml` packages the Android APK for mobile devices:

1. Automatic build triggers on push to `main` branch or when Git tags matching `v*` are published.
2. Manual triggers are available in the GitHub Actions tab (`workflow_dispatch`), allowing custom backend URL specification.
3. Built APK files are uploaded to GitHub Actions Artifacts and automatically attached to GitHub Releases upon tag creation.
