# Voters Decide

> **A real-time, public voting and participation platform with server-side validation and Supabase integration.**
> Built for transparency, speed, and mobile responsiveness.

---

## 1. Overview

**Voters Decide** is an official public contest platform. It allows members of the public to view approved contestants, select their choice, provide their full name and WhatsApp number for verification, and submit their participation.

- **Platform Name**: Voters Decide
- **Footer**: `© Voters Decide — Created by Menmex`
- **Source of Truth**: Supabase PostgreSQL database
- **Security Rule**: 1 Browser/Device = Maximum 2 Submissions per contest.

---

## 2. Key Architecture & Features

1. **Server-Authoritative Vote Verification**:
   - Client-side code **never** manipulates vote counts directly.
   - Every submission is routed through `POST /api/contests/:slug/vote` and validated in the database using the atomic stored procedure `public.submit_vote`.
   - Concurrency-safe: row-level locking guarantees no race conditions or corrupted totals.

2. **Device / Browser Limit (2 Submissions Max)**:
   - A cryptographic device participation token is generated and persisted for the browser.
   - Submissions are recorded in the database. When a device reaches 2 submissions for a contest, any further attempts are immediately rejected (`PARTICIPATION_LIMIT_REACHED`) and logged in the audit table.
   - The voter may support the same contestant twice or two different contestants.

3. **Real-Time Leaderboard**:
   - Instant live ranking and percentage share calculated directly from database records.
   - Powered by Supabase Realtime subscriptions with background polling fallback.
   - Explicit tie-breaking rule: sorted by vote count DESC, then contestant registration number ASC.

4. **Post-Vote Flow & WhatsApp Channel**:
   - Displays clear confirmation: *"Your choice has been recorded ✓"*.
   - Prompts voters to follow the official Voters Decide WhatsApp Channel.
   - Clearly documents that following the channel is an external action for updates and does **not** count as a second vote or poll.

5. **Contestant Registration Workflow**:
   - Candidates can submit their application with name, WhatsApp contact, bio, and photo.
   - Created with `status = 'pending'`. Only appears publicly once reviewed and approved by an administrator.

6. **Secure Admin Dashboard**:
   - Protected by `ADMIN_SECRET_KEY`.
   - Approve, reject, disable, or restore contestants.
   - Edit contest parameters (status, title, dates, WhatsApp channel URL, max submissions limit).
   - Real-time audit log of participations, device tokens, and blocked abuse attempts.
   - Developer/Tester utility: "Reset My Test Device (2 Votes)" button to easily test the 2-vote limit repeatedly.

---

## 3. Database Setup (Supabase)

The complete SQL schema and migrations are located in:
- `supabase/schema.sql`
- `supabase/migrations/20260921000000_voters_decide_schema.sql`

### How to Apply:

1. Open your project in [Supabase](https://supabase.com).
2. Navigate to the **SQL Editor**.
3. Copy the entire contents of `supabase/schema.sql` and paste it into the editor.
4. Click **Run**.
5. This creates:
   - `contests` table
   - `contestants` table
   - `participations` table
   - `abuse_logs` table
   - Stored procedure `public.submit_vote(...)`
   - Row Level Security (RLS) policies
   - Realtime publication on `contestants` and `contests`
   - Initial seed contest and approved contestants

---

## 4. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Supabase Configuration
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Client-side Supabase (exposed to browser for Realtime and Auth)
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Admin Authentication Secret (used for securing administrative endpoints)
ADMIN_SECRET_KEY="voters-decide-admin-2026"

# Host URL
APP_URL="http://localhost:3000"
```

> **Security Note**: Never commit `SUPABASE_SERVICE_ROLE_KEY` or production secrets to Git.

---

## 5. Development & Production Run

### Install Dependencies:
```bash
npm install
```

### Start Development Server:
```bash
npm run dev
```
Runs on `http://localhost:3000`.

### Build for Production:
```bash
npm run build
```
This compiles the Vite frontend into `dist/` and bundles the Express server into `dist/server.cjs`.

### Start Production Server:
```bash
npm start
```

---

## 6. Zero-Config GitHub & Hosting Guide

The repository is pre-configured and 100% production-ready for GitHub hosting with zero configuration changes.

### A. Push to GitHub:
```bash
git init
git add .
git commit -m "feat: Voters Decide production release"
git branch -M main
git remote add origin https://github.com/your-username/voters-decide.git
git push -u origin main
```

### B. 1-Click / Zero-Config Hosting:

- **Render (Web Service)**:
  - Connect your GitHub repo.
  - Render auto-detects `render.yaml` or set:
    - **Build Command**: `npm run build`
    - **Start Command**: `npm start`
    - **Port**: `3000` (or uses pre-configured `render.yaml`)
  - Click **Deploy** — the app builds Vite into `dist/` and launches the bundled backend server immediately.

- **Railway**:
  - Connect your GitHub repo.
  - Railway automatically detects `railway.json` and runs `npm run build` & `npm start`.

- **Docker / Cloud Run / VPS**:
  - A production multi-stage `Dockerfile` and `.dockerignore` are included.
  - Build & Run:
    ```bash
    docker build -t voters-decide .
    docker run -p 3000:3000 voters-decide
    ```

- **Built-in Resilient Fallback**:
  - Even if database environment variables are not yet provided on first launch, the server uses a built-in persistent disk store (`/data/contest_store.json`), meaning your site boots up and works instantly without crashing!

---

## 7. Admin Controls & Refreshing Devices for New Contests

- **Admin Secret Key**: `voters-decide-admin-2026` (configurable via `ADMIN_SECRET_KEY` in `.env`)
- Access via the **Admin** button in the top navigation or footer.
- **Refresh All Devices**: When a contest ends and you are ready for a new contest or voting round, click **"Refresh All Devices"** in the Admin Control Panel.
  - Clears all previous participation locks across the entire platform.
  - Unlocks all voter devices that were counted as voted before.
  - Voters can immediately return to the website and cast their 2 allocated votes in the new contest without any device restrictions.
  - Optional toggle to also reset contestant vote tallies to zero for a clean start.

---

## 8. License

© Voters Decide — Created by Menmex. All rights reserved.
