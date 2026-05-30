const sqlite3 = require('sqlite3');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey144'; // From server.js
const db = new sqlite3.Database('./data/botstore.sqlite');

db.get('SELECT id, email, role FROM users LIMIT 1', (e, user) => {
  if (e) return console.error(e);
  if (!user) return console.error('No users found');

  db.get('SELECT group_id FROM catalogues LIMIT 1', (e2, catalogue) => {
    if (e2) return console.error(e2);
    if (!catalogue) return console.error('No catalogue items found');

    const group_id = catalogue.group_id;
    console.log(`Testing with User ID: ${user.id} (${user.email}) for Group: ${group_id}`);

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    // Make local HTTP request to port 3010
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 3010,
      path: `/api/products/${encodeURIComponent(group_id)}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        console.log(`RESPONSE: ${data.slice(0, 1000)}`);
        db.close();
      });
    });

    req.on('error', (err) => {
      console.error('Request Error:', err);
      db.close();
    });

    req.end();
  });
});
