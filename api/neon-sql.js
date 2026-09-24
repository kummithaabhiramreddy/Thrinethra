/**
 * Vercel Serverless Function: Neon PostgreSQL SQL Proxy
 * Securely executes SQL queries on Neon without exposing credentials or endpoints to GitHub/client.
 * Reads NEON_CONNECTION_STRING and NEON_ENDPOINT from Vercel Environment Variables.
 */

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Neon-Connection-String, Neon-Raw-Text-Output, Neon-Array-Mode');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed. Use POST for SQL queries.' });
  }

  try {
    const connectionString = process.env.NEON_CONNECTION_STRING;
    let neonEndpoint = process.env.NEON_ENDPOINT;

    if (!connectionString) {
      return res.status(500).json({
        message: 'NEON_CONNECTION_STRING is missing in Vercel Environment Variables. Please add it under Vercel Settings > Environment Variables.',
        error: true
      });
    }

    // If NEON_ENDPOINT is not explicitly configured, derive endpoint host from connection string
    if (!neonEndpoint) {
      try {
        const match = connectionString.match(/@([^/:]+)/);
        if (match && match[1]) {
          const host = match[1].replace('-pooler', '');
          neonEndpoint = `https://${host}/sql`;
        }
      } catch (e) {}
    }

    if (!neonEndpoint) {
      return res.status(500).json({
        message: 'NEON_ENDPOINT could not be resolved. Please set NEON_ENDPOINT in Vercel Environment Variables.',
        error: true
      });
    }

    let payload = req.body;
    if (Buffer.isBuffer(payload)) {
      payload = JSON.parse(payload.toString('utf8') || '{}');
    } else if (typeof payload === 'string') {
      payload = JSON.parse(payload || '{}');
    }
    payload = payload || {};

    if (!payload.query) {
      return res.status(400).json({ message: 'Missing SQL query parameter' });
    }

    const neonRes = await fetch(neonEndpoint, {
      method: 'POST',
      headers: {
        'Neon-Connection-String': connectionString,
        'Neon-Raw-Text-Output': 'true',
        'Neon-Array-Mode': 'true',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: payload.query,
        params: payload.params || []
      })
    });

    const data = await neonRes.json();
    return res.status(neonRes.status).json(data);
  } catch (err) {
    console.error('Vercel Neon Proxy Error:', err);
    return res.status(500).json({
      message: err.message || 'Neon database serverless proxy error',
      error: true
    });
  }
};
