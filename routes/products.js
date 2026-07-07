const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all products
router.get('/', (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Get a single product
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Product not found' });
        res.json(row);
    });
});

module.exports = router;
