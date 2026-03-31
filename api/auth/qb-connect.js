// api/auth/qb-connect.js
// Initiates QuickBooks OAuth flow

const QB_CLIENT_ID = process.env.QB_CLIENT_ID;
const QB_REDIRECT_URI = process.env.QB_REDIRECT_URI;
const QB_SCOPE = 'com.intuit.quickbooks.accounting';

// Set ALLOWED_ORIGIN for CORS
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://ai-bookkeeper-red.vercel.app';

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
  
  try {
    // Validate environment variables
    if (!QB_CLIENT_ID || !QB_REDIRECT_URI) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ 
        error: 'QuickBooks OAuth not configured. Missing QB_CLIENT_ID or QB_REDIRECT_URI.' 
      }));
    }
    
    // Get customer email from query params (optional)
    const { email } = req.query;
    
    // Generate state parameter for CSRF protection
    const state = email || `setup_${Date.now()}`;
    
    // Build QuickBooks OAuth URL
    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
    authUrl.searchParams.set('client_id', QB_CLIENT_ID);
    authUrl.searchParams.set('scope', QB_SCOPE);
    authUrl.searchParams.set('redirect_uri', QB_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('state', state);
    
    // Return the OAuth URL
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      authUrl: authUrl.toString(),
      state: state
    }));
    
  } catch (error) {
    console.error('QuickBooks connect error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message }));
  }
};
