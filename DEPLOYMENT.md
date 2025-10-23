# Deployment Guide

This guide will help you deploy your Pixel Runner Game with Socket.IO multiplayer functionality.

## Architecture

- **Frontend**: React + Vite (hosted on Netlify)
- **Backend**: Node.js + Express + Socket.IO (hosted on Render)

## Prerequisites

1. A GitHub account
2. A Netlify account (for frontend)
3. A Render account (for backend)

---

## Part 1: Deploy the Socket.IO Server to Render

### Step 1: Prepare Your Server Code

The server code is already configured to work with Render. It includes:

✅ Dynamic port binding using `process.env.PORT`
✅ CORS configuration for cross-origin requests
✅ Listening on `0.0.0.0` for external connections

### Step 2: Deploy to Render

1. **Sign up for Render**
   - Go to https://render.com
   - Sign up using your GitHub account

2. **Create a New Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Select this repository

3. **Configure the Service**

   | Setting | Value |
   |---------|-------|
   | **Name** | `pixel-runner-server` (or your choice) |
   | **Region** | Choose one close to your users |
   | **Branch** | `main` |
   | **Root Directory** | `server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Plan** | Free (or Starter for $7/month) |

4. **Add Environment Variables**

   In Render's dashboard, add:

   - **Key**: `CLIENT_URL`
   - **Value**: `https://your-app.netlify.app` (update after deploying frontend)

   You can also add multiple URLs separated by commas:
   ```
   http://localhost:5173,https://your-app.netlify.app
   ```

5. **Deploy**

   Click **"Create Web Service"**. Render will:
   - Pull your code from GitHub
   - Run `npm install`
   - Start your server with `npm start`

   **Your server URL will be**: `https://pixel-runner-server.onrender.com`

   ⚠️ **Note**: Free tier services spin down after 15 minutes of inactivity. The first request after inactivity will take 30-60 seconds.

---

## Part 2: Deploy the Frontend to Netlify

### Step 1: Configure Environment Variables

1. **In your Netlify dashboard**:
   - Go to **Site settings** → **Environment variables**
   - Add a new variable:
     - **Key**: `VITE_SERVER_URL`
     - **Value**: `https://pixel-runner-server.onrender.com` (your Render URL)

### Step 2: Deploy to Netlify

Since you're already hosting on Netlify:

1. **Update Build Settings** (if needed):
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

2. **Redeploy**:
   - Push your changes to GitHub
   - Netlify will automatically rebuild and deploy

---

## Part 3: Update CORS Configuration

After both deployments are complete:

1. **Get your Netlify URL**: `https://your-app.netlify.app`

2. **Update Render Environment Variable**:
   - Go to your Render dashboard
   - Navigate to your web service
   - Go to **Environment** tab
   - Update `CLIENT_URL` with your actual Netlify URL
   - Click **"Save Changes"**
   - Render will automatically redeploy

---

## Testing Your Deployment

### 1. Test Server Health

Visit: `https://pixel-runner-server.onrender.com/health`

You should see:
```json
{
  "status": "ok",
  "players": 0,
  "uptime": 123.45
}
```

### 2. Test Frontend Connection

1. Open your Netlify site: `https://your-app.netlify.app`
2. Open browser DevTools → Console
3. Look for: `Connected to server: <socket-id>`
4. The connection status should show: 🟢 Connected

### 3. Test Multiplayer

1. Open your site in two different browser windows/tabs
2. You should see the player count increase
3. Play the game in one window and watch the score updates

---

## Local Development

### Running the Server Locally

```bash
# Install server dependencies
npm run server:install

# Start the server in development mode
npm run server:dev
```

Server will run on `http://localhost:3000`

### Running the Frontend Locally

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend will run on `http://localhost:5173`

Make sure your `.env.local` has:
```
VITE_SERVER_URL=http://localhost:3000
```

---

## Troubleshooting

### Frontend can't connect to server

**Check:**
1. Verify `VITE_SERVER_URL` is set correctly in Netlify
2. Check browser console for CORS errors
3. Ensure `CLIENT_URL` in Render includes your Netlify URL
4. Rebuild Netlify site after changing env variables

### Server shows CORS errors

**Fix:**
1. Update `server/server.js` CORS origin to include your frontend URL
2. Or update `CLIENT_URL` environment variable on Render
3. Redeploy the server

### Render server is slow to respond

**Explanation:**
- Free tier services sleep after 15 min of inactivity
- First request takes ~30-60 seconds to wake up
- Upgrade to Starter plan ($7/mo) for always-on service

### Socket disconnects frequently

**Check:**
1. Network stability
2. Render server logs for errors
3. Consider upgrading to paid tier for better reliability

---

## Project Structure

```
pixel-runner-game/
├── server/                    # Backend (deploy to Render)
│   ├── server.js             # Socket.IO server
│   ├── package.json          # Server dependencies
│   └── .env                  # Server environment variables
├── src/                      # Frontend (deploy to Netlify)
│   ├── components/
│   │   └── Game.jsx          # Game with Socket.IO integration
│   ├── socket.js             # Socket.IO client connection
│   └── main.jsx
├── .env.local                # Frontend environment variables
└── package.json              # Frontend dependencies
```

---

## Environment Variables Summary

### Frontend (Netlify)
```
VITE_SERVER_URL=https://pixel-runner-server.onrender.com
```

### Backend (Render)
```
PORT=<auto-assigned-by-render>
CLIENT_URL=https://your-app.netlify.app
NODE_ENV=production
```

---

## Cost Breakdown

| Service | Tier | Cost | Features |
|---------|------|------|----------|
| Netlify | Free | $0 | 100GB bandwidth, auto-deploy |
| Render (Free) | Free | $0 | Spins down after 15 min |
| Render (Starter) | Paid | $7/mo | Always on, better performance |

**Recommendation**: Start with free tier, upgrade Render to Starter if you need always-on availability.

---

## Next Steps

1. ✅ Deploy server to Render
2. ✅ Deploy frontend to Netlify
3. ✅ Configure environment variables
4. ✅ Test the connection
5. 🎮 Share your game!

---

## Support

If you encounter issues:

1. Check Render logs: Dashboard → Your Service → Logs
2. Check Netlify logs: Dashboard → Deploys → Deploy log
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly

---

**Happy Gaming! 🎮**
