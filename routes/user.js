const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET_KEY = 'super_secret_jwt_key_for_this_task';

// Middleware to authenticate user
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.user = decoded;
        next();
    });
}

// Get Profile
router.get('/profile', authenticate, (req, res) => {
    db.get('SELECT id, name, email, role, address, phone FROM users WHERE id = ?', [req.user.userId], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'User not found' });
        res.json(row);
    });
});

// Update Profile
router.put('/profile', authenticate, (req, res) => {
    const { name, address, phone } = req.body;
    db.run('UPDATE users SET name = ?, address = ?, phone = ? WHERE id = ?', [name, address, phone, req.user.userId], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Profile updated successfully' });
    });
});

// Get Wishlist
router.get('/wishlist', authenticate, (req, res) => {
    const query = `
        SELECT p.*, w.id as wishlist_id FROM wishlists w
        JOIN products p ON w.product_id = p.id
        WHERE w.user_id = ?
    `;
    db.all(query, [req.user.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Add to Wishlist
router.post('/wishlist', authenticate, (req, res) => {
    const { productId } = req.body;
    db.run('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [req.user.userId, productId], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Product already in wishlist' });
            }
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Added to wishlist', wishlistId: this.lastID });
    });
});

// Remove from Wishlist
router.delete('/wishlist/:productId', authenticate, (req, res) => {
    db.run('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.userId, req.params.productId], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Removed from wishlist' });
    });
});

module.exports = router;
