# TaskPulse — Mini Job Queue Dashboard (React + NestJS + PostgreSQL)

A full-stack **Job Queue Management Dashboard** engineered with **NestJS**, **PostgreSQL** (Supabase/Render compatible), and **React** (Vite + Tailwind CSS).

This project highlights robust **API Design**, **Domain State Machine Integrity**, **Atomic Concurrency Control (Race Condition Prevention)**, **Real-time Multi-Tab Sync (SSE)**, and **Background Job Processing Simulation**.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v18+` or `v20+` / `v22+`
- PostgreSQL Database instance (e.g. **Supabase**, Neon, Render Postgres, or local Postgres)

---

### 1. Database Setup (.env)

Copy `.env.example` to `.env` inside the `backend` folder:

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and paste your Supabase PostgreSQL connection string into `DATABASE_URL`:

```env
PORT=4000
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
NODE_ENV=development
```

> 📌 **Which string to copy from Supabase?**
> 1. Go to your **Supabase Dashboard** -> Select your Project.
> 2. Click on **Project Settings** (gear icon) -> **Database**.
> 3. Under **Connection String**, select the **URI** tab.
> 4. Choose **Transaction Pooler** (Port `6543`) or **Session Pooler** / **Direct Connection** (Port `5432`).
> 5. Copy the connection string format:
>    `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
> 6. Replace `[password]` with your database password and paste it into `backend/.env`.

---

### 2. Run Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```
The NestJS backend will start on **http://localhost:4000**.

---

### 3. Run Frontend (React + Vite + Tailwind)

In a new terminal tab:

```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## ⚡ Concurrency & State Machine Architecture

### Allowed State Transitions
```
  [pending]  --->  [running]  --->  [completed]
                               \-->  [failed]
```

- **Terminal States**: `completed` or `failed` jobs cannot transition to `running` or `pending`.
- **Direct Transitions**: Jobs cannot jump directly from `pending` to `completed` or `failed` without passing through `running`.

---

### 🧠 Answers to Engineering Edge-Case Questions (Section #3)

#### 1. Where should state transition rules be enforced?
> **Answer**: State transition rules are enforced strictly in the **Backend Domain Layer (`JobsService` & `JobStateMachine`)** as well as guarded at the database level. Frontend buttons reflect allowed actions, but backend validation guarantees total domain safety regardless of client behavior.

#### 2. What happens if someone bypasses the React application and calls the API directly?
> **Answer**: Direct API callers (via Postman/cURL) pass through NestJS `ValidationPipe` (class-validator) and `JobStateMachine.canTransition()`. If an invalid transition is attempted (e.g., `completed` → `running`), the server rejects it with a **`400 Bad Request`** and a clear error message:
> ```json
> {
>   "statusCode": 400,
>   "error": "Bad Request",
>   "message": "Invalid state transition from 'completed' to 'running'. Allowed next status(es): []"
> }
> ```

#### 3. What happens when two requests arrive at nearly the same time (Race Condition)?
> **Answer**: Suppose two browser tabs both view a job in `pending` status and both users click "Start Job" (`running`) simultaneously.
>
> To resolve this without heavy locking overhead, we use **Atomic Database Updates guarded by expected state**:
> ```sql
> UPDATE jobs
> SET status = 'running', updated_at = NOW()
> WHERE id = $1 AND status = 'pending';
> ```
> - **Request 1**: Executes the atomic update first. `affected` rows = `1`. The update succeeds (**200 OK**).
> - **Request 2**: Executes milliseconds later. Since status is now `'running'`, `WHERE status = 'pending'` matches `0` rows.
> - **Result**: Request 2 detects `affected === 0`, re-checks the database, and returns a **`409 Conflict`**:
> ```json
> {
>   "statusCode": 409,
>   "error": "Conflict",
>   "message": "Race Condition: Concurrent update detected! Job status was modified from 'pending' to 'running' by another request."
> }
> ```

#### 4. How would you prevent invalid or inconsistent state?
> **Answer**:
> 1. **Atomic DB Conditional Updates**: Guarantees atomic state changes without stale reads.
> 2. **Version Column (Optimistic Locking)**: Tracks entity version numbers to prevent stale UI writes.
> 3. **Database Constraints & Enum Types**: Status column restricted to `pending`, `running`, `completed`, `failed`.
> 4. **Real-time SSE Broadcasting**: Instantly synchronizes all open browser tabs when a job changes state.

---

## 🌟 Bonus Features Implemented

1. **Real-Time Multi-Tab Synchronization (Server-Sent Events)**:
   - Server streams `JOB_CREATED`, `JOB_UPDATED`, and `JOB_DELETED` events over `/jobs/sse/stream`.
   - Open two browser tabs side-by-side: updating a job in Tab 1 updates Tab 2 instantly in real-time!

2. **Simulated Background Worker Execution Engine**:
   - When a job transitions to `running`, a background worker processes the task asynchronously for 5 seconds.
   - Upon completion, the worker automatically sets status to `completed` (or `failed`) and broadcasts the update live to the dashboard UI.

---

## 📦 Deployment Guide

### Deploying Backend to Render
1. Push repository to GitHub.
2. Go to **Render Dashboard** -> **New Web Service** -> Connect Repo.
3. Root Directory: `backend`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm run start:prod`
6. Add Environment Variable:
   - `DATABASE_URL` = [Your Supabase URI string]

### Deploying Frontend to Vercel
1. Go to **Vercel Dashboard** -> **New Project** -> Connect Repo.
2. Root Directory: `frontend`
3. Framework Preset: `Vite`
4. Add Environment Variable:
   - `VITE_API_URL` = [Your Live Render Backend URL, e.g. `https://your-api.onrender.com`]

---

## 📁 Repository Structure

```
developer-airth/
├── backend/                  # NestJS Application
│   ├── src/
│   │   ├── jobs/
│   │   │   ├── dto/          # CreateJobDto, UpdateJobStatusDto
│   │   │   ├── entities/     # TypeORM Job Entity
│   │   │   ├── enums/        # JobStatus & JobType enums
│   │   │   ├── events/       # JobEventsService (SSE Event Stream)
│   │   │   ├── services/     # JobWorkerService (Background execution engine)
│   │   │   ├── utils/        # JobStateMachine validation rules
│   │   │   ├── jobs.controller.ts
│   │   │   ├── jobs.service.ts
│   │   │   └── jobs.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example
│   ├── test-concurrency.js   # Automated race-condition test script
│   └── package.json
├── frontend/                 # React + Vite + Tailwind Application
│   ├── src/
│   │   ├── components/       # Header, JobStats, JobFilters, JobCard, CreateJobModal
│   │   ├── services/         # API Service & SSE EventSource
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
└── README.md
```
