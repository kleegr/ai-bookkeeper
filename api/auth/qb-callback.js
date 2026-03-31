// api/auth/qb-callback.js
// Handles QuickBooks OAuth callback and stores tokens

const https = require('https');
const querystring = require('querystring');

// QuickBooks OAuth configuration
const QB_CLIENT_ID = process.env.QB_CLIENT_ID;
const QB_CLIENT_SECRET = process.env.QB_CLIENT_SECRET;
const QB_REDIRECT_URI = process.env.QB_REDIRECT_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Set ALLOWED_ORIGIN for CORS
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://ai-bookkeeper-red.vercel.app';

function exchangeCodeForTokens(code, realmId) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: QB_REDIRECT_URI
    });
    
    const options = {
      hostname: 'oauth.platform.intuit.com',
      path: '/oauth2/v1/tokens/bearer',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const tokens = JSON.parse(data);
          if (tokens.access_token) {
            resolve({ ...tokens, realm_id: realmId });
          } else {
            reject(new Error('No access token in response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function storeTokens(tokens, customerEmail) {
  const tokenData = {
    customer_email: customerEmail,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    realm_id: tokens.realm_id,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    created_at: new Date().toISOString()
  };
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/qb_tokens`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(tokenData)
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to store tokens: ${error}`);
  }
  
  return await res.json();
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'text/html');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method not allowed');
  }
  
  try {
    const { code, realmId, state, error } = req.query;
    
    // Check for OAuth errors
    if (error) {
      return res.end(`
        <html>
          <head><title>QuickBooks Connection Failed</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ Connection Failed</h1>
            <p>Error: ${error}</p>
            <a href="/setup" style="color: #667eea;">← Back to Setup</a>
          </body>
        </html>
      `);
    }
    
    // Validate required parameters
    if (!code || !realmId) {
      return res.end(`
        <html>
          <head><title>Invalid QuickBooks Response</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ Invalid Response</h1>
            <p>Missing required parameters from QuickBooks.</p>
            <a href="/setup" style="color: #667eea;">← Back to Setup</a>
          </body>
        </html>
      `);
    }
    
    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code, realmId);
    
    // Extract customer email from state parameter (if provided)
    const customerEmail = state || 'demo@example.com';
    
    // Store tokens in database
    await storeTokens(tokens, customerEmail);
    
    // Return success page
    res.end(`
      <html>
        <head>
          <title>QuickBooks Connected Successfully</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; margin: 0; }
            .container { background: white; color: #333; padding: 40px; border-radius: 20px; display: inline-block; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
            .success-icon { font-size: 4rem; margin-bottom: 20px; }
            h1 { color: #28a745; margin-bottom: 20px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 50px; font-weight: 500; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">🎉</div>
            <h1>QuickBooks Connected!</h1>
            <p>Your QuickBooks account has been successfully linked to your AI Bookkeeper.</p>
            <p><strong>Company ID:</strong> ${realmId}</p>
            <p>You can now continue with the setup process.</p>
            <a href="/setup" class="btn">Continue Setup →</a>
          </div>
          <script>
            // Auto-close this window if it's a popup
            if (window.opener) {
              window.opener.postMessage({type: 'qb-connected', realmId: '${realmId}'}, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('QuickBooks callback error:', error);
    res.statusCode = 500;
    res.end(`
      <html>
        <head><title>Connection Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>❌ Connection Error</h1>
          <p>Something went wrong while connecting to QuickBooks.</p>
          <p><code>${error.message}</code></p>
          <a href="/setup" style="color: #667eea;">← Try Again</a>
        </body>
      </html>
    `);
  }
};
