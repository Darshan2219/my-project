# Deployment Guide

This guide shows you how to deploy your Portfolio Advisory System to various cloud platforms.

## 🚀 Quick Deploy Options

### 1. Vercel (Recommended - Easiest)

**Steps:**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Sign in with GitHub
4. Click "New Project" → Import your repository
5. Vercel auto-detects settings and deploys!

**Configuration:** Already included in `vercel.json`

### 2. Railway (Great for Full-Stack)

**Steps:**
1. Push code to GitHub  
2. Go to [railway.app](https://railway.app)
3. Sign in with GitHub
4. Click "New Project" → Deploy from GitHub repo
5. Railway automatically builds and deploys

**Configuration:** Already included in `railway.json`

### 3. Render (Professional)

**Steps:**
1. Push code to GitHub
2. Go to [render.com](https://render.com) 
3. Sign in with GitHub
4. Click "New" → "Web Service"
5. Connect your GitHub repo
6. Render uses the `render.yaml` configuration

### 4. Heroku (Classic)

**Steps:**
```bash
# Install Heroku CLI first
heroku create your-app-name
git push heroku main
```

### 5. DigitalOcean App Platform

**Steps:**
1. Push to GitHub
2. Go to DigitalOcean → App Platform
3. Connect GitHub repo
4. App Platform auto-deploys

## 📋 Pre-Deployment Checklist

**✅ Code Preparation:**
- [ ] Code pushed to GitHub
- [ ] `.gitignore` excludes `node_modules/` and `dist/`
- [ ] `package.json` has correct start script
- [ ] TypeScript builds without errors

**✅ Environment Variables:**
- [ ] Copy `.env.example` to `.env` on your platform
- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT` (usually auto-detected)

**✅ Configuration Files:**
- [ ] `vercel.json` - for Vercel
- [ ] `railway.json` - for Railway  
- [ ] `render.yaml` - for Render
- [ ] `Dockerfile` - for containerized deployments

## 🔧 Platform-Specific Notes

### Vercel
- **Best for:** Static sites + serverless functions
- **Pros:** Zero config, automatic HTTPS, great performance
- **Limits:** Function timeout (30s), good for API-heavy apps

### Railway  
- **Best for:** Full-stack apps with databases
- **Pros:** Very developer-friendly, automatic deployments
- **Cost:** $5/month after free tier

### Render
- **Best for:** Production apps
- **Pros:** Full Docker support, databases, very reliable
- **Cost:** Free tier available, then $7/month

## 🛠️ Build Process

All platforms will run:
```bash
npm install          # Install dependencies  
npm run build        # Compile TypeScript
npm start           # Start the server
```

## 🌍 Custom Domain

Once deployed, you can add a custom domain:

**Vercel:** Project Settings → Domains
**Railway:** Project Settings → Networking  
**Render:** Dashboard → Custom Domains

## 🔒 Security for Production

**Environment Variables to Set:**
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-key
API_KEY=your-secure-api-key
```

## 🚨 Troubleshooting

**Build Fails:**
- Check `package.json` scripts
- Ensure TypeScript compiles locally: `npm run build`

**Runtime Errors:**
- Check platform logs
- Verify environment variables
- Ensure static files are copied: `postbuild` script

**API Doesn't Work:**
- Check if `dist/public` contains frontend files
- Verify Express static file serving

## 📊 Monitoring

**Free Options:**
- **Vercel:** Built-in analytics
- **Railway:** Built-in metrics
- **Render:** Application logs

**Advanced Monitoring:**
- Sentry for error tracking
- LogRocket for user sessions
- New Relic for performance

## 💡 Recommended Workflow

1. **Development:** Local with `npm run dev`
2. **Staging:** Deploy to free tier (Railway/Render)
3. **Production:** Deploy to paid tier with custom domain
4. **CI/CD:** Use GitHub Actions (config included)

## 🎯 Best Choice for Your Use Case

**For Portfolio Advisory System:**
- **Vercel** - If you want the easiest deployment
- **Railway** - If you might add a database later
- **Render** - If you want a professional production setup

All three are excellent choices! Start with Vercel for simplicity.