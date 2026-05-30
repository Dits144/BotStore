const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./data/botstore.sqlite');
db.all('SELECT * FROM catalogues LIMIT 1', (e, r) => {
  if (e) console.error(e);
  else console.log('ROW:', r);
});
setTimeout(() => db.close(), 1000);
