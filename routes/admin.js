const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../database');
const mailer = require('../utils/mailer');

const SECRET_KEY = 'super_secret_jwt_key_for_this_task';

// Middleware to authenticate and check if user is Admin
function isAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err || decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }
        req.user = decoded;
        next();
    });
}

// Ensure all admin routes use the middleware
router.use(isAdmin);

// Dashboard stats
router.get('/stats', (req, res) => {
    const stats = {};
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        stats.users = row.count;
        db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
            stats.products = row.count;
            db.get('SELECT COUNT(*) as count FROM orders', (err, row) => {
                stats.orders = row.count;
                db.get('SELECT SUM(total) as total FROM orders', (err, row) => {
                    stats.revenue = row.total || 0;
                    res.json(stats);
                });
            });
        });
    });
});

// GET all users
router.get('/users', (req, res) => {
    db.all('SELECT id, name, email, role, created_at FROM users', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Add new Admin
router.post('/add-admin', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')", [name, email, hashedPassword], function(err) {
            if (err) return res.status(500).json({ error: 'Database error or email exists' });
            res.json({ message: 'Admin added successfully', id: this.lastID });
        });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Categories endpoints
router.get('/categories', (req, res) => {
    db.all('SELECT * FROM categories', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

router.post('/categories', (req, res) => {
    const { name, image } = req.body;
    db.run('INSERT INTO categories (name, image) VALUES (?, ?)', [name, image], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Category added', id: this.lastID });
    });
});

// Products endpoints
router.post('/products', (req, res) => {
    const { name, description, price, image, category, brand, additional_images } = req.body;
    db.run('INSERT INTO products (name, description, price, image, category, brand, additional_images) VALUES (?,?,?,?,?,?,?)',
        [name, description, price, image, category, brand, additional_images || '[]'], function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Product added', id: this.lastID });
    });
});

// Get Orders
router.get('/orders', (req, res) => {
    db.all('SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Update Order Status
router.put('/orders/:id/status', (req, res) => {
    const { status } = req.body;
    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        if (status === 'Shipped' || status === 'Delivered') {
            db.get('SELECT u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?', [req.params.id], (err, row) => {
                if (!err && row) {
                    mailer.sendMail(row.email, `Order ${status}`, `Your order #${req.params.id} has been marked as ${status}.`, `<h1>Order Update</h1><p>Your order #${req.params.id} is now <strong>${status}</strong>.</p>`);
                }
            });
        }
        
        res.json({ message: 'Order status updated' });
    });
});

module.exports = router;
