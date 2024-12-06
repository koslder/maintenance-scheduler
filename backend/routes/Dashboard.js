const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/employee'); // Adjust this path to your User model
const authenticateToken = require('../Middleware/authenticateToken');

const router = express.Router();

router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id); // Fetch the user by ID from the token
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: `Welcome, ${user.firstName} ${user.lastName}`,
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
