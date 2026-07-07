const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('ecommerce.db');

const updates = [
  {
    id: 64, // Women's Saree
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=80',
    additional_image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&q=80'
  },
  {
    id: 70, // Kajal Eyeliner
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&q=80',
    additional_image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80'
  }
];

db.serialize(() => {
    const stmt = db.prepare('UPDATE products SET image = ?, additional_images = ? WHERE id = ?');
    updates.forEach(u => {
        stmt.run(u.image, JSON.stringify([u.additional_image]), u.id);
    });
    stmt.finalize();
    console.log('Fixed broken images for saree and eyeliner.');
});
