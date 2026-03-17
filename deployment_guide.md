# 🚀 100% Free Deployment Guide

Follow these steps to put your AI Quiz Game online for free using **Render** (Backend) and **Vercel** (Frontend).

## 1. Push to GitHub
1. Create a new repository on GitHub.
2. Initialize git and push your code:
   ```bash
   git init
   git add .
   git commit -m "Deployment ready"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

## 2. Deploy Backend (Render.com)
1. Go to [Render.com](https://render.com) and sign up for free.
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Settings:
   - **Name**: `ai-quiz-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Click **Advanced** and add **Environment Variables**:
   - `OPENAI_API_KEY`: (Your Groq Key)
   - `OPENAI_BASE_URL`: `https://api.groq.com/openai/v1`
   - `AI_MODEL`: `llama-3.3-70b-versatile`
   - `FRONTEND_URL`: (Wait for Step 3 to get this URL)
6. Click **Create Web Service**. 
7. Copy your backend URL (e.g., `https://ai-quiz-backend.onrender.com`).

## 3. Deploy Frontend (Vercel.com)
1. Go to [Vercel.com](https://vercel.com) and sign up for free.
2. Click **Add New** > **Project**.
3. Import your GitHub repository.
4. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
5. Expand **Environment Variables** and add:
   - `VITE_API_URL`: (Your Render URL from Step 2)
   - `VITE_SOCKET_URL`: (Your Render URL from Step 2)
6. Click **Deploy**.
7. Copy your frontend URL (e.g., `https://ai-quiz-game.vercel.app`).

## 4. Final Handshake
1. Go back to your **Render** dashboard for the backend.
2. Update the `FRONTEND_URL` environment variable with your new Vercel URL.
3. Save changes. Render will restart the server.

**🎉 You are live! Open your Vercel link and start playing.**
