const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./data/botstore.sqlite');
const http = require('http');
const jwt = require('jsonwebtoken');

// 1. Delete unwanted groups from rentals
db.run('DELETE FROM rentals WHERE group_name NOT IN ("DitsStore Customer", "Coba")', function(err) {
  if (err) console.error("DELETE Error:", err);
  else console.log("Deleted", this.changes, "unwanted groups from rentals.");
  db.close();
});

// 2. Fetch from API
const token = jwt.sign({ email: 'dits144@gmail.com' }, 'supersecretkey144');
http.get({
  hostname: 'localhost',
  port: 3010,
  path: '/api/products/120363423098988269%40g.us',
  headers: { 'Authorization': 'Bearer ' + token }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('API returned', parsed.length || 0, 'products.');
      if (parsed.length > 0) console.log(parsed[0]);
    } catch (e) {
      console.log('Raw API Response:', data);
    }
  });
}).on('error', console.error);
