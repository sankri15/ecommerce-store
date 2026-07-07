const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('ecommerce.db');

const categoryImages = {
    "Men": [
        "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=500&q=80",
        "https://images.unsplash.com/photo-1506169894395-36397e4aa545?w=500&q=80",
        "https://images.unsplash.com/photo-1588359348347-9bc6cbea68fd?w=500&q=80",
        "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=500&q=80"
    ],
    "Women": [
        "https://images.unsplash.com/photo-1515347619253-1200b69e5d48?w=500&q=80",
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&q=80",
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80",
        "https://images.unsplash.com/photo-1502716115624-b73de925330b?w=500&q=80"
    ],
    "Footwear": [
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80",
        "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500&q=80",
        "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&q=80"
    ],
    "Beauty": [
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80",
        "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=500&q=80",
        "https://images.unsplash.com/photo-1556228578-8d89f8d951df?w=500&q=80",
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80"
    ],
    "Accessories": [
        "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500&q=80",
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&q=80",
        "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500&q=80",
        "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=500&q=80"
    ],
    "Kids": [
        "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500&q=80",
        "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80",
        "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=500&q=80",
        "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&q=80"
    ],
    "Home": [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80",
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?w=500&q=80",
        "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&q=80",
        "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80"
    ]
};

// Default fallback images just in case
const defaultImages = [
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&q=80",
    "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80",
    "https://images.unsplash.com/photo-1550639525-c97d455acf70?w=500&q=80",
    "https://images.unsplash.com/photo-1593032580308-d2a9bf8c8dd4?w=500&q=80"
];

db.all("SELECT id, category FROM products", (err, rows) => {
    if (err) throw err;
    db.serialize(() => {
        const stmt = db.prepare('UPDATE products SET additional_images = ? WHERE id = ?');
        rows.forEach(row => {
            const imgs = categoryImages[row.category] || defaultImages;
            stmt.run(JSON.stringify(imgs), row.id);
        });
        stmt.finalize();
        console.log(`Updated all ${rows.length} products with category-specific photo angles.`);
    });
});
