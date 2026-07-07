const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('ecommerce.db');

const updates = [
  {
    id: 60, // Men's Sweatshirt
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80',
    additional_image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80'
  },
  {
    id: 64, // Women's Saree
    image: 'https://images.unsplash.com/photo-1610189013582-77eb931e5f88?w=500&q=80',
    additional_image: 'https://images.unsplash.com/photo-1583391733958-d25e07fac04f?w=500&q=80'
  },
  {
    id: 70, // Kajal Eyeliner
    image: 'https://images.unsplash.com/photo-1631214500515-873950f58869?w=500&q=80',
    additional_image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80'
  },
  {
    id: 72, // Facial Sheet Mask
    image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=500&q=80',
    additional_image: 'https://images.unsplash.com/photo-1556228578-8d89f8d951df?w=500&q=80'
  },
  {
    id: 79, // Ceramic Dinner Set
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80',
    additional_image: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=500&q=80'
  }
];

db.serialize(() => {
    const stmt = db.prepare('UPDATE products SET image = ?, additional_images = ? WHERE id = ?');
    updates.forEach(u => {
        stmt.run(u.image, JSON.stringify([u.additional_image]), u.id);
    });
    stmt.finalize();
    console.log('Successfully updated the requested products with new images.');
});
