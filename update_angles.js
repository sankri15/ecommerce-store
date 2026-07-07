const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('ecommerce.db');

const updates = [
  // Classic White Sneakers (id: 69, assuming based on list, or let's use name)
  {
    name: "Classic White Sneakers",
    img1: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80",
    additional: [
        "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&q=80", // Side view
        "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500&q=80"  // Top view
    ]
  },
  {
    name: "Men's Checked Casual Shirt",
    img1: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&q=80",
    additional: [
        "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&q=80", // Close up / different angle
        "https://images.unsplash.com/photo-1588359348347-9bc6cbea68fd?w=500&q=80"
    ]
  },
  {
    name: "Women Floral Print Dress",
    img1: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80",
    additional: [
        "https://images.unsplash.com/photo-1515347619253-1200b69e5d48?w=500&q=80",
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&q=80"
    ]
  },
  {
    name: "Analog Men's Watch",
    img1: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80",
    additional: [
        "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500&q=80",
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&q=80"
    ]
  }
];

db.serialize(() => {
    // First clear all additional_images
    db.run("UPDATE products SET additional_images = '[]'", (err) => {
        if(err) console.error("Error clearing:", err);
        else console.log("Cleared all hanger images.");
        
        // Then apply specific updates
        const stmt = db.prepare('UPDATE products SET additional_images = ? WHERE name = ?');
        updates.forEach(u => {
            stmt.run(JSON.stringify(u.additional), u.name);
        });
        stmt.finalize();
        console.log("Added multiple angles for specific products.");
    });
});
