const NEON_CONNECTION_STRING = 'postgresql://neondb_owner:npg_kCrMU0l9LViJ@ep-rapid-sunset-a54uayxa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const NEON_ENDPOINT = 'https://ep-rapid-sunset-a54uayxa.us-east-2.aws.neon.tech/sql';

async function test() {
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
        query: 'SELECT id, email, password_hash, name FROM users WHERE LOWER(email) = LOWER($1);',
        params: ['kummithaabhiramreddy@gmail.com']
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

