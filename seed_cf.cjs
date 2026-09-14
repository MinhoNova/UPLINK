const data = require('./src/data/db.json');
const d1Id = '779b2a59-50c9-4378-bfa9-b6d96ac4d692';

(async () => {
  const url = `https://api.cloudflare.com/client/v4/accounts/af65482042bced31efab5e396fd78b5d/d1/database/${d1Id}/query`;
  
  for (const [key, value] of Object.entries(data)) {
    const j = JSON.stringify(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const sql = `INSERT INTO kv_store (key, value) VALUES ('${key}', '${j}') ON CONFLICT(key) DO UPDATE SET value=excluded.value;`;
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + process.env.CF_API_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql })
      });
      const r = await res.json();
      if (r.success) console.log('OK:', key);
      else console.log('FAIL:', key, r.errors);
    } catch (e) {
      console.log('Error:', key, e.message);
    }
  }
})();
