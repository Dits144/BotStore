const sqlite3=require('sqlite3');
const db=new sqlite3.Database('./data/botstore.sqlite');
db.all('SELECT id, item_name, description, in_stock, fast_delivery, is_rare FROM catalogues LIMIT 1', (err, rows) => {
  console.log('ERROR:', err);
  console.log('ROWS:', rows);
  db.close();
});
