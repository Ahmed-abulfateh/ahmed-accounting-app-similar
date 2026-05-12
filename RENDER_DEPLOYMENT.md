# Render Deployment Troubleshooting

## Current Status
- **Local Development:** ✅ Working (`npm run dev:full`)
- **GitHub Pages Frontend:** ✅ Deployed and working (auth forms visible)
- **Render Backend:** ❌ Not responding (404 no-server)

## Why It's Failing

The app requires a backend server to:
1. Handle authentication (signup/login)
2. Store data in MongoDB
3. Serve API endpoints
4. Support CORS for GitHub Pages

When GitHub Pages tries to reach Render, it gets: **404 with `x-render-routing: no-server`**

This means: **The Render service is not running.**

## Step-by-Step Fix

### Step 1: Check Render Dashboard
1. Go to: https://dashboard.render.com/
2. Sign in with GitHub
3. Select your service: **ahmed-accounting-app**
4. Check **Status** in the top right:
   - If it says **"Running"** → Go to Step 2
   - If it says **"Suspended"** → Click **Resume** button and wait 2 minutes
   - If it shows **"Failed"** or error → Click **Manual Deploy → Deploy latest commit**

### Step 2: Verify Environment Variables
Check that ALL these variables are set in Render Dashboard:
```
✓ MONGODB_URI        (should start with mongodb+srv://)
✓ JWT_SECRET         (random string, minimum 16 chars)
✓ SMTP_HOST          (smtp.gmail.com)
✓ SMTP_PORT          (587)
✓ SMTP_USER          (your email)
✓ SMTP_PASS          (Gmail app password, not regular password)
✓ WORKSPACE_EMAIL    (notification email)
✓ FRONTEND_URL       (auto-set by render.yaml)
✓ ADDITIONAL_FRONTEND_ORIGINS  (must be: https://ahmed-abulfateh.github.io)
```

⚠️ **If any are missing:** Add them before redeploying

### Step 3: Trigger Manual Deployment
1. In Render Dashboard, go to **Deploys**
2. Click **Manual Deploy → Deploy latest commit**
3. Wait for the deploy to complete:
   - **Building** phase (2-3 minutes)
   - **Running** phase - service should start
   - Health check should pass

### Step 4: Verify It's Running
Run this command to test:
```bash
curl https://ahmed-accounting-app.onrender.com/api/health
```

Should return: `{"status":"healthy"}` or similar JSON response

If you still get **404 no-server**, continue to Step 5.

### Step 5: Check Deployment Logs
1. In Render Dashboard → **Logs** tab
2. Look for:
   - ✅ Build output showing successful npm install and build
   - ✅ Message saying "Mailer API running on ..."
   - ❌ Any error messages

Common errors:
- **`MONGODB_URI` is missing** → Add to environment variables
- **`JWT_SECRET` is missing** → Add to environment variables
- **Port binding error** → Rarely happens on Render (use Port 4000)
- **Memory/timeout errors** → Upgrade Render plan from Starter

### Step 6: Test Full Flow
Once API responds with 200 OK:

1. Open GitHub Pages: https://ahmed-abulfateh.github.io/ahmed-accounting-app-similar/#/signup
2. Create account with test email
3. Should show success and redirect to dashboard
4. Data persists in MongoDB

## Quick Commands to Test

**From your local terminal:**

```bash
# Test API is responding
curl https://ahmed-accounting-app.onrender.com/api/health

# Test CORS for GitHub Pages
curl -X OPTIONS https://ahmed-accounting-app.onrender.com/api/auth/signup \
  -H "Origin: https://ahmed-abulfateh.github.io"

# Should show Access-Control-Allow-Origin header
```

## If Still Not Working

Options:
1. **Check Render free tier limits** - Starter plan can be slow on first request
2. **Restart service:** In Render Dashboard → **Settings** → **Restart Service**
3. **Delete and recreate:** Delete service, create new from render.yaml
4. **Check GitHub actions:** Ensure latest code is pushed to GitHub before Render deploy

## Local Testing (Before Render)

To verify backend works locally:
```bash
# Terminal 1: Keep npm run dev:full running
npm run dev:full

# Terminal 2: Test API
curl http://localhost:4000/api/health

# Terminal 3: Test signup flow locally
# Open http://localhost:5173/#/signup and create account
```

## Deployment Architecture

```
GitHub Pages (Static Frontend)
    ↓ (API calls)
Render Backend (Node.js + Express)
    ↓ (Stores data)
MongoDB (Database)

GitHub Pages Frontend = https://ahmed-abulfateh.github.io/ahmed-accounting-app-similar/
Render Backend = https://ahmed-accounting-app.onrender.com
MongoDB = Cloud cluster (configured via MONGODB_URI)
```

## Configuration Summary

**render.yaml** defines:
- Build: `npm install && npm run build`
- Start: `npm start` (runs server.js)
- Health check: `/api/health` endpoint

**server.js**:
- Listens on PORT 4000 (or uses $PORT env var)
- Serves API endpoints: /api/auth/*, /api/health
- Serves static files from dist/ folder
- Handles CORS for GitHub Pages origin

**GitHub Pages to Render flow:**
1. User opens: https://ahmed-abulfateh.github.io/ahmed-accounting-app-similar/#/signup
2. Frontend app loads from GitHub Pages (static files)
3. User fills form and clicks "Create Account"
4. JavaScript calls: `https://ahmed-accounting-app.onrender.com/api/auth/signup`
5. Render backend responds with JWT token
6. Frontend stores token and shows dashboard

## Need More Help?

1. **Check Render service status:** https://status.render.com/
2. **Render documentation:** https://render.com/docs
3. **Run this locally first:** `npm run dev:full` to verify setup
4. **Share Render deployment logs** if deploy keeps failing
