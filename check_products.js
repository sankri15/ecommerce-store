const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('ecommerce.db');

const terms = ["%dinner%", "%facial%", "%kajal%", "%saree%", "%sweatshirt%"];
const query = `SELECT id, name FROM products WHERE name LIKE ? OR name LIKE ? OR name LIKE ? OR name LIKE ? OR name LIKE ?`;

db.all(query, terms, (err, rows) => {
    if (err) console.error(err);
    else console.log(rows);
});
