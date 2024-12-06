const jwt = require('jsonwebtoken'); // Assuming you're using JWT for authentication
const User = require('../models/User'); // Adjust the path to your User model

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your JWT secret
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}

// Middleware to check if the user is an admin
function isAdmin(req, res, next) {
    if (req.user.role === 'admin') {
        return next();
    } else {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
}

// Middleware to check if the user is a normal user
function isUser(req, res, next) {
    if (req.user.role === 'user') {
        return next();
    } else {
        return res.status(403).json({ message: 'Access denied: Users only' });
    }
}

module.exports = { isAuthenticated, isAdmin, isUser };
