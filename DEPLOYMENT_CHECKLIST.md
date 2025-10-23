# Deployment Checklist

Use this checklist to ensure a smooth deployment.

## Before Deployment

- [ ] Code is tested locally
- [ ] All dependencies are installed
- [ ] Environment variables are configured
- [ ] `.gitignore` includes `.env` files
- [ ] Code is committed to GitHub

## Render Setup (Backend)

### 1. Create Web Service

- [ ] Sign up/login to Render (https://render.com)
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Select your repository

### 2. Configure Service Settings

**Basic Settings:**
- [ ] Name: `pixel-runner-server` (or your choice)
- [ ] Region: Select closest to users
- [ ] Branch: `main`
- [ ] Root Directory: `server`

**Build Settings:**
- [ ] Runtime: `Node`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`

**Plan:**
- [ ] Select "Free" (or "Starter" for $7/month for always-on)

### 3. Environment Variables

Add the following in Render dashboard:

- [ ] `NODE_ENV` = `production`
- [ ] `CLIENT_URL` = `http://localhost:5173` (update after Netlify deployment)

### 4. Deploy

- [ ] Click "Create Web Service"
- [ ] Wait for deployment to complete
- [ ] Copy your Render URL: `https://your-app-name.onrender.com`
- [ ] Test health endpoint: `https://your-app-name.onrender.com/health`

## Netlify Setup (Frontend)

### 1. Update Environment Variables

In Netlify dashboard:

- [ ] Go to Site settings → Environment variables
- [ ] Add: `VITE_SERVER_URL` = `https://your-app-name.onrender.com`
- [ ] Save changes

### 2. Update Build Settings (if needed)

- [ ] Build Command: `npm run build`
- [ ] Publish Directory: `dist`

### 3. Deploy

- [ ] Push changes to GitHub (triggers auto-deploy)
- [ ] Or click "Trigger deploy" in Netlify dashboard
- [ ] Wait for build to complete
- [ ] Copy your Netlify URL: `https://your-app.netlify.app`

## Update CORS (Critical!)

### Update Render Environment Variable

- [ ] Go back to Render dashboard
- [ ] Navigate to your web service
- [ ] Go to Environment tab
- [ ] Update `CLIENT_URL` to: `https://your-app.netlify.app`
- [ ] Click "Save Changes"
- [ ] Service will auto-redeploy

## Testing

### Server Health Check

- [ ] Visit: `https://your-app-name.onrender.com/health`
- [ ] Should return JSON with status: "ok"

### Frontend Connection

- [ ] Open: `https://your-app.netlify.app`
- [ ] Open browser DevTools → Console
- [ ] Look for: "Connected to server: <socket-id>"
- [ ] Check connection indicator shows: 🟢 Connected

### Multiplayer Test

- [ ] Open site in two browser tabs
- [ ] Verify player count increases
- [ ] Play game in one tab
- [ ] Verify score updates are visible

## Post-Deployment

- [ ] Monitor Render logs for errors
- [ ] Monitor Netlify deploy logs
- [ ] Test from different devices/networks
- [ ] Share with friends to test multiplayer

## Troubleshooting

### If connection fails:

1. **Check Render Logs**
   - [ ] Go to Render dashboard → Your service → Logs
   - [ ] Look for errors or CORS issues

2. **Check Environment Variables**
   - [ ] Verify `VITE_SERVER_URL` in Netlify
   - [ ] Verify `CLIENT_URL` in Render
   - [ ] Ensure URLs are exact (no trailing slashes)

3. **Check CORS Configuration**
   - [ ] Verify `server/server.js` CORS config includes your Netlify URL
   - [ ] Redeploy server after CORS changes

4. **Check Browser Console**
   - [ ] Look for connection errors
   - [ ] Look for CORS errors
   - [ ] Verify Socket.IO is loading

### If server is slow:

- [ ] Free tier sleeps after 15 min inactivity
- [ ] First request takes 30-60 seconds to wake
- [ ] Consider upgrading to Starter ($7/mo) for always-on

## URLs to Save

Record your deployment URLs:

```
Frontend (Netlify): https://_____________________.netlify.app
Backend (Render):   https://_____________________.onrender.com
Health Check:       https://_____________________.onrender.com/health
```

## Support

- Render Docs: https://render.com/docs
- Netlify Docs: https://docs.netlify.com
- Socket.IO Docs: https://socket.io/docs/

---

**Deployment Complete! 🎉**
