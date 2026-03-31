// api/qb-status.js
// Checks if a customer has QuickBooks connected

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Set ALLOWED_ORIGIN for CORS
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://ai-bookkeeper-red.vercel.app';

async function getTokenStatus(customerEmail) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/qb_tokens?customer_email=eq.${encodeURIComponent(customerEmail)}&select=*&limit=1`,
    { 
      headers: { 
        'apikey': SUPABASE_KEY, 
        'Authorization': `Bearer ${SUPABASE_KEY}` 
      } 
    }
  );
  
  if (!res.ok) {
    throw new Error(`Failed to check token status: ${res.statusText}`);
  }
  
  const tokens = await res.json();
  return tokens[0] || null;
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
  
  try {
    const { email } = req.query;
    
    if (!email) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Email parameter is required' }));
    }
    
    const tokenInfo = await getTokenStatus(email);
    
    if (tokenInfo) {
      // Check if token is expired
      const isExpired = new Date(tokenInfo.expires_at) < new Date();
      
      res.end(JSON.stringify({
        connected: true,
        realm_id: tokenInfo.realm_id,
        connected_at: tokenInfo.created_at,
        expires_at: tokenInfo.expires_at,
        is_expired: isExpired
      }));
    } else {
      res.end(JSON.stringify({
        connected: false
      }));
    }
    
  } catch (error) {
    console.error('QB status check error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error.message }));
  }
};
