const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('ecommerce.db');

const angles = [
    "https://placehold.co/400x530/f8f8f8/a0a0a0.png?text=Left+Angle",
    "https://placehold.co/400x530/f8f8f8/a0a0a0.png?text=Right+Angle",
    "https://placehold.co/400x530/f8f8f8/a0a0a0.png?text=Top+Angle",
    "https://placehold.co/400x530/f8f8f8/a0a0a0.png?text=Bottom+Angle"
];

db.serialize(() => {
    const stmt = db.prepare('UPDATE products SET additional_images = ?');
    stmt.run(JSON.stringify(angles), function(err) {
        if (err) {
            console.error(err);
        } else {
            console.log(`Updated all ${this.changes} products to have left, right, top, and bottom angles.`);
        }
    });
    stmt.finalize();
});
