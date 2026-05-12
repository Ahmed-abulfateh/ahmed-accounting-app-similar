# ahmed-accounting-app-similar

Accounting workspace with JWT authentication and per-user data isolation.

## Local Development

1. Copy `.env.example` to `.env` and fill required values.
2. Install dependencies:
	- `npm install`
3. Run frontend + backend together:
	- `npm run dev:full`
4. Open the app:
	- `http://localhost:5173` (or the next port shown by Vite)

Troubleshooting:

- If signup/login shows `Failed to fetch`, verify:
	- Backend is running on `http://localhost:4000`.
	- `VITE_API_URL` points to your backend in deployed environments.
	- `FRONTEND_URL` includes your frontend origin for CORS.

## Authentication and Data Isolation

- Users create accounts with `POST /api/auth/signup`.
- Login uses `POST /api/auth/login`.
- Token verification uses `POST /api/auth/verify`.
- User workspace sync uses:
  - `GET /api/workspace`
  - `PUT /api/workspace`

Behavior:

- Each authenticated user has isolated accounting data.
- Workspace data is persisted on backend storage.
- MongoDB is used when `MONGODB_URI` is available.
- If MongoDB is unavailable, backend falls back to in-memory storage.
- Frontend keeps local editing usable and syncs changes in the background.

## Render Deployment

This project is ready for Render using the blueprint in [render.yaml](render.yaml).

### 1) Deploy with Blueprint

1. Push this repository to GitHub.
2. In Render, choose New + and then Blueprint.
3. Select this repository.
4. Render will create one web service that runs both backend APIs and frontend app:
	 - ahmed-accounting-app

Important:

- The blueprint uses `plan: starter` so the service stays continuously running.
- On `free`, Render may sleep after inactivity.

### 2) Required Environment Variables

Set these on the web service (ahmed-accounting-app):

- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- WORKSPACE_EMAIL
- MONGODB_URI
- JWT_SECRET

Notes:

- `FRONTEND_URL` is auto-set from the same Render service URL in `render.yaml`.
- Keep `VITE_API_URL` unset for this single-service deployment so frontend uses same-origin `/api`.

Production safety notes:

- `JWT_SECRET` must be set to a strong unique value.
- The server enforces JWT secret safety in production mode.
- `FRONTEND_URL` can be comma-separated for multiple origins.

### 3) Notes

- FRONTEND_URL supports comma-separated origins (for example local + Render URL):
	- http://localhost:5173,https://your-frontend.onrender.com
- The backend health endpoint is:
	- /api/health

## GitHub Pages

The project uses a workflow at [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) to build with Vite and publish the `dist` folder.

Required GitHub setting:

- In repository Settings > Pages, set Source to GitHub Actions.
