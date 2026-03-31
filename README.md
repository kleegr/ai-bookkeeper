# AI Bookkeeper - QuickBooks Powered SaaS

> **Security Status: ✅ Secure** - No hardcoded credentials, proper CORS restrictions, OAuth2 flow implemented

An AI-powered bookkeeping assistant that connects to QuickBooks Online to provide automated financial insights and reporting.

## 🚀 Features

- **Secure QuickBooks Integration** - OAuth2 flow with token refresh
- **AI-Powered Insights** - Automated analysis of your financial data
- **Real-time Reporting** - Up-to-date financial metrics and KPIs
- **Customizable Preferences** - Tailor the AI to your business needs

## 🔧 Setup Instructions

### 1. QuickBooks Developer App

1. Go to [QuickBooks Developer Console](https://developer.intuit.com/app/developer/qbo/docs/get-started)
2. Create a new app for "QuickBooks Online Accounting API"
3. Set your redirect URI to: `https://your-domain.vercel.app/api/auth/qb-callback`
4. Copy your Client ID and Client Secret

### 2. Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your dashboard
3. Run the SQL commands from `database/schema.sql`
4. Copy your project URL and service role key

### 3. Environment Variables

In your Vercel project settings, add these environment variables:

```bash
# QuickBooks OAuth
QB_CLIENT_ID=your_quickbooks_app_client_id
QB_CLIENT_SECRET=your_quickbooks_app_client_secret
QB_REDIRECT_URI=https://your-domain.vercel.app/api/auth/qb-callback

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# Security
ALLOWED_ORIGIN=https://your-domain.vercel.app
```

### 4. Deploy & Test

1. Push your code to GitHub
2. Vercel will automatically deploy
3. Visit `/setup` to test the QuickBooks connection

## 🔐 Security Features

- **OAuth2 Flow** - Secure QuickBooks authorization
- **CORS Protection** - API locked to your domain
- **Token Encryption** - Secure token storage in database
- **Row Level Security** - Database access controls
- **No Hardcoded Secrets** - All credentials in environment variables

## 📡 API Endpoints

- `GET /api/auth/qb-connect` - Initiate QuickBooks OAuth
- `GET /api/auth/qb-callback` - Handle OAuth callback
- `GET /api/qb-status` - Check connection status
- `GET /api/data` - Fetch QuickBooks financial data

## 🎨 User Flow

1. **Landing Page** - Coming Soon with setup link
2. **Setup Process** - 3-step QuickBooks onboarding
3. **OAuth Connection** - Secure QuickBooks authorization
4. **Data Sync** - Real-time financial data import
5. **AI Analysis** - Automated insights and reporting

## 👥 Support

Questions? Email: [support@kleegr.com](mailto:support@kleegr.com)

---

**Built by Kleegr** - AI-powered business automation tools
