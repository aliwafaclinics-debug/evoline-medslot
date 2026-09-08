# Evoline MedSlot — PowerShell Deployment Guide

## Prerequisites

- Node.js 20+ (https://nodejs.org)
- PowerShell 5.0+ (or PowerShell 7+)
- Railway account (https://railway.app) — free tier available
- Vercel account (https://vercel.com) — free tier available
- PostgreSQL client (`psql`) — optional, for local database schema management

## Quick Start

### Step 1: Allow PowerShell Script Execution

Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Step 2: Run the Deployment Script

Navigate to the project directory and run:

```powershell
cd "C:\Users\Nahhas\Downloads\evoline-medslot-complete (1)\01-source-code"
.\deploy.ps1
```

This will:
1. Check all prerequisites
2. Log you into Railway and Vercel
3. Deploy the backend to Railway with PostgreSQL
4. Deploy the frontend to Vercel
5. Optionally set up a custom domain

### Step 3: Verify Deployment

After the script completes, you'll get URLs for:
- Backend API: `https://xxx.up.railway.app/api`
- Swagger Docs: `https://xxx.up.railway.app/api/docs`
- Frontend: `https://evoline-medslot.vercel.app`

## Custom Domain Setup

If you want to use `evolinemedslot.ae`:

### DNS Records at Your Domain Provider

Add these records:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |
| CNAME | api | xxx.up.railway.app (from Railway dashboard) |

### Command-Line Setup (if script skips it)

```powershell
# Add frontend domain to Vercel
vercel domains add evolinemedslot.ae --yes

# Add API domain to Railway
cd apps/backend
railway domain add api.evolinemedslot.ae
```

## Manual Deployment (Step-by-Step)

If you prefer to run commands manually:

### Login

```powershell
npm install -g @railway/cli vercel

railway login
vercel login
```

### Deploy Backend

```powershell
cd apps/backend

# Initialize Railway project
railway init --name "evoline-medslot-backend"

# Add PostgreSQL
railway add --plugin postgresql

# Set environment variables
railway variables set NODE_ENV="production"
railway variables set PORT="3001"
railway variables set JWT_ACCESS_SECRET="$(openssl rand -hex 32)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
railway variables set FRONTEND_URL="https://evolinemedslot.ae"

# Deploy
railway up --detach

# Get backend URL
railway domain
```

### Deploy Database Schema

```powershell
# Get database URL from Railway
$dbUrl = railway variables get DATABASE_URL

# Run schema (requires psql installed)
psql $dbUrl -f ../database/evoline_medslot_schema_simplified.sql
```

### Deploy Frontend

```powershell
cd ../frontend

# Create production environment file
"NEXT_PUBLIC_API_URL=https://api.evolinemedslot.ae/api" | Out-File .env.production

# Deploy to Vercel
vercel --prod --yes --name "evoline-medslot"
```

## Troubleshooting

### Railway CLI not found

```powershell
npm install -g @railway/cli
```

### Vercel CLI not found

```powershell
npm install -g vercel
```

### psql not found (for database setup)

Install PostgreSQL from https://www.postgresql.org/download/windows/

Or run schema setup manually from Railway dashboard:
1. Go to Railway dashboard
2. Click your project
3. Click PostgreSQL plugin
4. Use the built-in query editor to paste the schema SQL

### Backend doesn't respond after deployment

Give it 2-5 minutes to start. Check logs:

```powershell
cd apps/backend
railway logs
```

### Frontend not connecting to backend

Verify the `.env.production` file has the correct backend URL:

```powershell
cat apps/frontend/.env.production
```

Should show:
```
NEXT_PUBLIC_API_URL=https://api.evolinemedslot.ae/api
```

## Environment Variables Reference

### Backend (Railway)

| Variable | Example | Notes |
|----------|---------|-------|
| NODE_ENV | production | |
| PORT | 3001 | |
| DATABASE_URL | postgres://... | Auto-set by Railway |
| JWT_ACCESS_SECRET | (random hex) | Generate with `openssl rand -hex 32` |
| JWT_REFRESH_SECRET | (random hex) | Generate with `openssl rand -hex 32` |
| JWT_ACCESS_EXPIRES_IN | 15m | |
| JWT_REFRESH_EXPIRES_IN | 30d | |
| FRONTEND_URL | https://evolinemedslot.ae | |
| REDIS_HOST | localhost | Auto-set if you add Redis |
| TWILIO_ACCOUNT_SID | (optional) | For SMS/WhatsApp |
| SENDGRID_API_KEY | (optional) | For email |

### Frontend (Vercel)

| Variable | Example | Notes |
|----------|---------|-------|
| NEXT_PUBLIC_API_URL | https://api.evolinemedslot.ae/api | Publicly visible in browser |

## Post-Deployment Checklist

- [ ] Backend responds to `GET /api/v1/clinics`
- [ ] Swagger docs accessible at `/api/docs`
- [ ] Frontend loads in browser
- [ ] Create first Admin user via Swagger
- [ ] Test login flow
- [ ] Add Twilio credentials (if using SMS)
- [ ] Add SendGrid credentials (if using email)
- [ ] Set up monitoring in Railway and Vercel dashboards

## Useful Commands

```powershell
# View backend logs
cd apps/backend
railway logs

# View all environment variables
railway variables

# Set a new environment variable
railway variables set MY_VAR="value"

# Re-deploy after code changes
railway up --detach

# View Vercel logs
cd ../frontend
vercel logs

# Set frontend environment variable
vercel env add MY_VAR
```

## Support

For issues:
1. Check Railway dashboard: https://dashboard.railway.app
2. Check Vercel dashboard: https://vercel.com/dashboard
3. Review backend logs: `railway logs` (in backend directory)
4. Review deployment logs in each dashboard

## Security Notes

- Never commit `.env` files
- Railway and Vercel store secrets securely
- JWT secrets are generated randomly on each deployment
- Database passwords are auto-managed by Railway

---

**Happy deploying!** 🚀
