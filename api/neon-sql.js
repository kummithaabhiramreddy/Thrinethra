const DEFAULT_NEON_CONNECTION_STRING = 'postgresql://neondb_owner:npg_kCrMU0l9LViJ@ep-rapid-sunset-a54uayxa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const DEFAULT_NEON_ENDPOINT = 'https://ep-rapid-sunset-a54uayxa.us-east-2.aws.neon.tech/sql';

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
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const connectionString = process.env.NEON_CONNECTION_STRING || DEFAULT_NEON_CONNECTION_STRING;
    const neonEndpoint = process.env.NEON_ENDPOINT || DEFAULT_NEON_ENDPOINT;

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
