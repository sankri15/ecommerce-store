const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://glowmart_db_user:wluderVVXmGUixRu1QGmZqcUJ3lewDXb@dpg-d96dk0mq1p3s73bv8390-a.singapore-postgres.render.com/glowmart_db',
    ssl: { rejectUnauthorized: false }
});

async function updateImages() {
    try {
        await pool.query("UPDATE products SET image = $1 WHERE name LIKE '%Party Dress%'", ['images/girl_party_dress.png']);
        console.log("Images updated successfully!");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

updateImages();
