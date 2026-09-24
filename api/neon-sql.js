/**
 * Vercel Serverless Function: Neon PostgreSQL SQL Proxy
 * Securely executes SQL queries on Neon without exposing credentials to the client/GitHub.
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
    const neonEndpoint = process.env.NEON_ENDPOINT || 'https://ep-rapid-sunset-a54uayxa.us-east-2.aws.neon.tech/sql';

    if (!connectionString) {
      return res.status(500).json({
        message: 'NEON_CONNECTION_STRING is not set. Please add it to your Vercel Project Settings > Environment Variables.',
        error: true
      });
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

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
