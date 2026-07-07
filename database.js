const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://glowmart_db_user:wluderVVXmGUixRu1QGmZqcUJ3lewDXb@dpg-d96dk0mq1p3s73bv8390-a.singapore-postgres.render.com/glowmart_db';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

// A wrapper to mimic sqlite3 API to minimize route changes
const db = {
    pool,
    
    _convertQuery(sql) {
        // Convert ? to $1, $2 etc for postgres
        let index = 1;
        // Also SQLite uses AUTOINCREMENT, Postgres uses SERIAL
        sql = sql.replace(/AUTOINCREMENT/ig, 'SERIAL');
        // SQLite uses DATETIME DEFAULT CURRENT_TIMESTAMP, Postgres uses TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        sql = sql.replace(/DATETIME/ig, 'TIMESTAMP');
        // SQLite uses REAL, Postgres uses NUMERIC or REAL. We can leave REAL.
        return sql.replace(/\?/g, () => `$${index++}`);
    },

    get(sql, params, callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        pool.query(this._convertQuery(sql), params, (err, res) => {
            if (callback) callback(err, res && res.rows ? res.rows[0] : null);
        });
    },

    all(sql, params, callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        pool.query(this._convertQuery(sql), params, (err, res) => {
            if (callback) callback(err, res && res.rows ? res.rows : []);
        });
    },

    run(sql, params, callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        let convertedSql = this._convertQuery(sql);
        let isInsert = convertedSql.trim().toUpperCase().startsWith('INSERT');
        
        // Postgres needs RETURNING id to mimic this.lastID
        if (isInsert && !convertedSql.toUpperCase().includes('RETURNING ID')) {
            convertedSql += ' RETURNING id';
        }

        pool.query(convertedSql, params, (err, res) => {
            const context = { 
                lastID: (isInsert && res && res.rows && res.rows.length > 0) ? res.rows[0].id : null,
                changes: (res) ? res.rowCount : 0
            };
            if (callback) callback.call(context, err);
        });
    },

    serialize(callback) {
        // SQLite serialize just runs sequentially. 
        callback();
    },

    prepare(sql) {
        // Stub for db.prepare in orders.js
        const converted = this._convertQuery(sql);
        return {
            run: function(params, callback) {
                pool.query(converted, params, (err, res) => {
                    if (callback) callback.call({lastID: res?.rows?.[0]?.id}, err);
                });
            },
            finalize: function() {}
        };
    }
};

pool.on('connect', () => {
    console.log('Connected to PostgreSQL Database.');
});

// Initialize Schema
const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                password TEXT,
                role TEXT DEFAULT 'user',
                address TEXT,
                phone TEXT,
                otp TEXT,
                otp_expiry TIMESTAMP
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE,
                image TEXT
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name TEXT,
                description TEXT,
                price REAL,
                image TEXT,
                category TEXT,
                brand TEXT,
                additional_images TEXT DEFAULT '[]'
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                total REAL,
                shipping_address TEXT,
                status TEXT DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id),
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER,
                price REAL
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS wishlists (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                product_id INTEGER REFERENCES products(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, product_id)
            )
        `);

        // Seed products
        const prodCountRes = await client.query('SELECT COUNT(*) FROM products');
        if (parseInt(prodCountRes.rows[0].count) === 0) {
            const products = [
                // Men
                ["Men's Solid Casual Shirt", "Premium cotton solid casual shirt, perfect for everyday wear. Slim fit.", 1299, "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80", "Men", "Roadster"],
                ["Men's Slim Fit Jeans", "Dark wash slim fit stretchable jeans.", 1899, "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&q=80", "Men", "Wrangler"],
                ["Men's Checked Casual Shirt", "Classic checked pattern cotton shirt for a smart casual look.", 1499, "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&q=80", "Men", "Highlander"],
                ["Men's Pullover Hoodie", "Cozy fleece pullover hoodie with front pocket.", 1999, "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80", "Men", "H&M"],
                ["Men's Formal Trousers", "Slim fit formal trousers for office wear.", 1699, "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&q=80", "Men", "Arrow"],
                ["Men's Leather Jacket", "Genuine leather biker jacket with zip details.", 4999, "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80", "Men", "US Polo"],
                ["Men's Striped Polo T-Shirt", "Classic striped polo t-shirt in pure cotton.", 999, "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&q=80", "Men", "U.S. Polo Assn."],
                ["Men's Chino Shorts", "Comfortable casual chino shorts for summer.", 899, "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80", "Men", "Roadster"],
                
                // Women
                ["Women Floral Print Dress", "Elegant floral print maxi dress with a flowy silhouette.", 2499, "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80", "Women", "Tokyo Talkies"],
                ["Women's Denim Jacket", "Classic blue denim jacket with metallic buttons.", 2199, "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&q=80", "Women", "Levi's"],
                ["Women's Ruffle Top", "Beautiful ruffle sleeve top for casual outings.", 1199, "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80", "Women", "Vero Moda"],
                ["Women's High Waist Jeans", "Stretchable high waist skinny fit jeans.", 1799, "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=500&q=80", "Women", "Only"],
                ["Women's Maxi Skirt", "Pleated elegant maxi skirt in pastel colors.", 1599, "https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=500&q=80", "Women", "Biba"],
                ["Women's Woolen Sweater", "Warm and cozy knitted sweater for winters.", 1899, "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500&q=80", "Women", "Marks & Spencer"],
                ["Women's Leather Handbag", "Premium faux leather handbag with zip closure.", 1299, "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&q=80", "Women", "H&M"],
                ["Women's Formal Blazer", "Tailored formal blazer for office and meetings.", 2599, "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=500&q=80", "Women", "Zara"],
                
                // Footwear
                ["Classic White Sneakers", "Comfortable and stylish casual white sneakers.", 1999, "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80", "Footwear", "Puma"],
                ["Running Shoes", "Lightweight running shoes with superior cushioning.", 4599, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80", "Footwear", "Nike"],
                ["Men's Formal Oxford Shoes", "Genuine leather formal oxford shoes for men.", 3299, "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500&q=80", "Footwear", "Bata"],
                ["Women's Stiletto Heels", "Elegant black stilettos for evening wear.", 2599, "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80", "Footwear", "Aldo"],
                ["Casual Slip-on Loafers", "Comfortable everyday slip-on loafers.", 1499, "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=500&q=80", "Footwear", "Red Tape"],
                ["Sports Training Shoes", "Durable sports shoes designed for gym training.", 3899, "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&q=80", "Footwear", "Reebok"],
                ["Men's Canvas Sneakers", "Classic everyday canvas sneakers.", 1299, "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80", "Footwear", "Vans"],
                ["Women's Ankle Boots", "Stylish leather ankle boots for winter.", 2999, "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500&q=80", "Footwear", "Steve Madden"],

                // Accessories
                ["Analog Men's Watch", "Sophisticated analog watch with a genuine leather strap.", 3499, "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80", "Accessories", "Fossil"],
                ["Designer Handbag", "Luxurious faux leather handbag with spacious compartments.", 2899, "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=500&q=80", "Accessories", "Hidesign"],
                ["Aviator Sunglasses", "Classic aviator sunglasses with UV protection.", 1299, "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80", "Accessories", "Ray-Ban"],
                ["Genuine Leather Belt", "Formal reversible black and brown leather belt.", 999, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80", "Accessories", "Tommy Hilfiger"],
                ["Women's Tote Bag", "Large stylish tote bag for daily use.", 1899, "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500&q=80", "Accessories", "Caprese"],
                ["Silver Pendant Necklace", "Minimalist sterling silver pendant necklace.", 1599, "images/silver_pendant_necklace.png", "Accessories", "Swarovski"],
                ["Men's Wayfarer Sunglasses", "Stylish wayfarer sunglasses for a cool look.", 1499, "https://images.unsplash.com/photo-1577803645773-f96470509666?w=500&q=80", "Accessories", "Fastrack"],
                ["Gold Plated Hoop Earrings", "Elegant gold plated large hoop earrings.", 599, "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&q=80", "Accessories", "Zaveri Pearls"],

                // Beauty
                ["Matte Liquid Lipstick", "Long-lasting matte liquid lipstick in vibrant ruby red.", 799, "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&q=80", "Beauty", "MAC"],
                ["Hydrating Face Serum", "Vitamin C and Hyaluronic Acid face serum for glowing skin.", 1150, "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80", "Beauty", "Plum"],
                ["Eyeshadow Palette", "12 color highly pigmented eyeshadow palette.", 1899, "https://images.unsplash.com/photo-1583241475880-083f84372725?w=500&q=80", "Beauty", "Maybelline"],
                ["Foundation Makeup Brush", "Soft bristle professional foundation blending brush.", 499, "https://images.unsplash.com/photo-1590156546946-ce55a12a6a5d?w=500&q=80", "Beauty", "Colorbar"],
                ["Luxury Perfume Spray", "Long-lasting floral fragrance eau de parfum.", 3599, "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500&q=80", "Beauty", "Chanel"],
                ["Skincare Moisturizer", "Daily nourishing face moisturizer for all skin types.", 850, "images/moisturizer.png", "Beauty", "Neutrogena"],
                ["Volumizing Mascara", "Waterproof volumizing mascara for intense lashes.", 699, "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=500&q=80", "Beauty", "L'Oreal"],
                ["Hair Styling Gel", "Strong hold non-sticky hair styling gel.", 350, "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80", "Beauty", "Gatsby"],

                // Kids
                ["Kids Graphic T-Shirt", "100% cotton fun graphic t-shirt for boys and girls.", 599, "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80", "Kids", "Gini & Jony"],
                ["Kids Denim Overalls", "Cute and durable denim overalls for toddlers.", 1299, "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500&q=80", "Kids", "Mothercare"],
                ["Toddler Sneakers", "Easy slip-on comfortable sneakers for kids.", 999, "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&q=80", "Kids", "Puma Kids"],
                ["Kids Winter Beanie", "Warm knitted winter beanie hat.", 399, "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500&q=80", "Kids", "Gap"],
                ["Little Girl's Party Dress", "Beautiful ruffled party dress with bow detail.", 1599, "images/girl_party_dress.png", "Kids", "Allen Solly Junior"],
                ["Boy's Cotton Shorts", "Comfortable cotton summer shorts with elastic waist.", 499, "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=500&q=80", "Kids", "United Colors of Benetton"],
                ["Kids Raincoat", "Waterproof colorful raincoat with hood.", 799, "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500&q=80", "Kids", "Mothercare"],
                ["Girls Floral Headband", "Cute floral patterned soft headband for girls.", 299, "https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=500&q=80", "Kids", "Nauti Nati"],

                // Home
                ["Geometric Print Bedsheet", "King size cotton double bedsheet with 2 pillow covers.", 1499, "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80", "Home", "Spaces"],
                ["Modern Table Lamp", "Elegant metallic table lamp for study or bedside.", 1899, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80", "Home", "HomeTown"],
                ["Ceramic Coffee Mug Set", "Set of 4 premium handcrafted ceramic mugs.", 899, "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&q=80", "Home", "Chumbak"],
                ["Velvet Decorative Pillows", "Set of 2 soft velvet throw pillow covers.", 699, "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=80", "Home", "IKEA"],
                ["Indoor Potted Plant", "Artificial lifelike indoor potted green plant.", 1299, "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&q=80", "Home", "Home Center"],
                ["Scented Soy Candle", "Relaxing vanilla and lavender scented soy candle.", 499, "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80", "Home", "Bath & Body Works"],
                ["Wooden Photo Frame", "Vintage style wooden photo frame for 5x7 photo.", 399, "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=500&q=80", "Home", "Art Street"],
                ["Cozy Knit Throw Blanket", "Soft chunky knit throw blanket for sofa.", 1199, "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=500&q=80", "Home", "Portico"]
            ];
            
            for (let p of products) {
                await client.query('INSERT INTO products (name, description, price, image, category, brand) VALUES ($1,$2,$3,$4,$5,$6)', p);
            }

            const categories = [
                ["Men", "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=200&q=80"],
                ["Women", "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&q=80"],
                ["Footwear", "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&q=80"],
                ["Accessories", "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=200&q=80"],
                ["Beauty", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&q=80"],
                ["Kids", "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=200&q=80"],
                ["Home", "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&q=80"]
            ];
            
            for (let c of categories) {
                await client.query('INSERT INTO categories (name, image) VALUES ($1,$2)', c);
            }

            const bcrypt = require('bcrypt');
            const hash = await bcrypt.hash('admin123', 10);
            await client.query("INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@glowmart.com', $1, 'admin')", [hash]);
        }
    } catch(err) {
        console.error('Error initializing db schema:', err);
    } finally {
        client.release();
    }
};

initDb();

module.exports = db;
