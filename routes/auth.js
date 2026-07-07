const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const mailer = require('../utils/mailer');

const SECRET_KEY = 'super_secret_jwt_key_for_this_task';

// Register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please provide all required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Send Welcome Email
            const emailHtml = `<h1 style="color:#7c3aed">Welcome to GlowMart, ${name}! 🛍️</h1><p>Your account has been created successfully. Start shopping now!</p>`;
            mailer.sendMail(email, 'Welcome to GlowMart! 🛍️', 'Registration Successful', emailHtml);
            
            res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(400).json({ error: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

        const token = jwt.sign({ userId: user.id, name: user.name, role: user.role }, SECRET_KEY, { expiresIn: '30d' });
        res.json({ message: 'Logged in successfully', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
});

// Forgot Password (Generate OTP)
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'No account found with this email. Please register first.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
        const expiry = new Date(Date.now() + 15 * 60000).toISOString(); // 15 mins validity

        db.run('UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?', [otp, expiry, email], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: 'Database error' });

            const emailHtml = `
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px">
                    <h1 style="color:#7c3aed">🔐 GlowMart Password Reset</h1>
                    <p>You requested a password reset. Use the OTP below:</p>
                    <div style="background:#f3e8ff;padding:20px;border-radius:8px;text-align:center;margin:20px 0">
                        <h2 style="color:#7c3aed;letter-spacing:8px;font-size:2rem">${otp}</h2>
                    </div>
                    <p style="color:#666">This OTP is valid for <strong>15 minutes</strong>. Do not share it with anyone.</p>
                    <p style="color:#666">If you didn't request this, please ignore this email.</p>
                    <hr/>
                    <p style="color:#999;font-size:12px">GlowMart — Premium Fashion & Lifestyle Store</p>
                </div>`;
            mailer.sendMail(email, 'GlowMart Password Reset OTP', `Your OTP is ${otp}`, emailHtml);

            res.json({ message: 'OTP sent to email' });
        });
    });
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'User not found' });
        
        if (user.otp !== otp || new Date(user.otp_expiry) < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.run('UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE email = ?', [hashedPassword, email], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: 'Database error' });
            
            mailer.sendMail(email, 'Password Reset Successful', 'Your password was successfully reset.', '<h1>Password Reset</h1><p>Your password was changed successfully.</p>');
            res.json({ message: 'Password reset successfully' });
        });
    });
});

module.exports = router;
