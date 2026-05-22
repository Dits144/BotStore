const sqlite3=require('sqlite3');
const db=new sqlite3.Database('./data/botstore.sqlite');
db.all('SELECT group_id, group_name FROM rentals', (e, r) => console.log('RENTALS:', r));
db.all('SELECT group_id, count(id) as c FROM catalogues GROUP BY group_id', (e, r) => console.log('CATALOGUES:', r));
setTimeout(()=>db.close(), 1000);
