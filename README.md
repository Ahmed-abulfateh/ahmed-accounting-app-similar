# ahmed-accounting-app-similar

## Render Deployment

This project is ready for Render using the blueprint in [render.yaml](render.yaml).

### 1) Deploy with Blueprint

1. Push this repository to GitHub.
2. In Render, choose New + and then Blueprint.
3. Select this repository.
4. Render will create two services:
	 - ahmed-accounting-api (Node backend for email API)
	 - ahmed-accounting-web (Static frontend)

### 2) Required Environment Variables

Set these on the backend service (ahmed-accounting-api):

- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- WORKSPACE_EMAIL
- FRONTEND_URL
- MONGODB_URI
- JWT_SECRET

Set this on the frontend service (ahmed-accounting-web):

- VITE_API_URL (backend URL, example: https://ahmed-accounting-api.onrender.com)

### 3) Notes

- FRONTEND_URL supports comma-separated origins (for example local + Render URL):
	- http://localhost:5173,https://your-frontend.onrender.com
- The backend health endpoint is:
	- /api/health
