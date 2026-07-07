const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const mailer = require('../utils/mailer');

const SECRET_KEY = 'super_secret_jwt_key_for_this_task';

const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

router.post('/', authenticate, async (req, res) => {
    const { items, total, shipping_address } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        const orderRes = await client.query(
            'INSERT INTO orders (user_id, total, shipping_address, status) VALUES ($1, $2, $3, $4) RETURNING id', 
            [req.user.userId, total, shipping_address, 'Pending']
        );
        const orderId = orderRes.rows[0].id;

        for (let item of items) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, item.id, item.quantity, item.price]
            );
        }

        await client.query('COMMIT');

        // Fetch user email to send confirmation
        db.get('SELECT email FROM users WHERE id = ?', [req.user.userId], (err, user) => {
            if (!err && user) {
                const emailHtml = `<h1>Order Confirmed!</h1><p>Your order #${orderId} has been successfully placed.</p><p>Total: ₹${total}</p><p>Shipping to: ${shipping_address}</p>`;
                mailer.sendMail(user.email, `Order Confirmation #${orderId}`, `Your order #${orderId} is confirmed.`, emailHtml);
            }
        });

        res.status(201).json({ message: 'Order placed successfully', orderId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Order creation error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    } finally {
        client.release();
    }
});

// GET user's own orders
router.get('/my', authenticate, (req, res) => {
    db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows || []);
    });
});

module.exports = router;
