// api/data.js
// Returns QuickBooks data for a specific customer

const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Set ALLOWED_ORIGIN in your Vercel environment variables
// e.g. https://your-app.vercel.app
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://your-app.vercel.app';

async function getCustomer(email) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/customers?email=eq.${encodeURIComponent(email)}&select=*`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json();
  return data[0];
}

async function qbFetch(path, accessToken, realmId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'quickbooks.api.intuit.com',
      path: `/v3/company/${realmId}${path}`,
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${accessToken}` }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({}); } });
    }).on('error', reject);
  });
}

module.exports = async (req, res) => {
  // Restrict CORS to your specific domain only
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const { email } = req.query;
  if (!email) return res.end(JSON.stringify({ error: 'No email' }));
  try {
    const customer = await getCustomer(email);
    if (!customer) return res.end(JSON.stringify({ error: 'Customer not found' }));
    const { access_token, realm_id, business, plan } = customer;
    const [customers, invoices, accounts] = await Promise.all([
      qbFetch('/query?query=SELECT%20*%20FROM%20Customer%20MAXRESULTS%20100', access_token, realm_id),
      qbFetch('/query?query=SELECT%20*%20FROM%20Invoice%20MAXRESULTS%20100', access_token, realm_id),
      qbFetch('/query?query=SELECT%20*%20FROM%20Account%20MAXRESULTS%20100', access_token, realm_id),
    ]);
    res.end(JSON.stringify({ customers, invoices, accounts, business, plan }));
  } catch(e) {
    res.end(JSON.stringify({ error: e.message }));
  }
};
