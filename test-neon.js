const fs = require('fs');
const path = require('path');

// Auto-load .env for local testing
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim().replace(/^["'](.*)["']$/, '$1');
      }
    }
  });
}

const NEON_CONNECTION_STRING = process.env.NEON_CONNECTION_STRING;
const NEON_ENDPOINT = process.env.NEON_ENDPOINT || 'https://ep-rapid-sunset-a54uayxa.us-east-2.aws.neon.tech/sql';

async function test() {
  if (!NEON_CONNECTION_STRING) {
    console.error('Please set NEON_CONNECTION_STRING in your .env file or environment.');
    return;
  }
  try {
    const res = await fetch(NEON_ENDPOINT, {
      method: 'POST',
      headers: {
        'Neon-Connection-String': NEON_CONNECTION_STRING,
        'Neon-Raw-Text-Output': 'true',
        'Neon-Array-Mode': 'true',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'SELECT id, email, password_hash, name FROM users LIMIT 1;',
        params: []
      })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
