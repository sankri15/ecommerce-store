const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('ecommerce.db');

db.all('SELECT id, image FROM products', (err, rows) => {
    if (err) throw err;
    db.serialize(() => {
        const stmt = db.prepare('UPDATE products SET additional_images = ? WHERE id = ?');
        rows.forEach(row => {
            // A nice generic fashion/lifestyle image for the second photo
            const img2 = "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&q=80";
            stmt.run(JSON.stringify([row.image, img2]), row.id);
        });
        stmt.finalize();
        console.log('Updated all products with additional_images.');
    });
});
