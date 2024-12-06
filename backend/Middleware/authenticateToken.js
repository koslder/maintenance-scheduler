const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;

const authenticateToken = (req, res, next) => {
    // Get token from the Authorization header
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the token
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user; // Attach the decoded user payload
        next();
    });
};

const authRole = (role) => {
    return (req, res, next) => {
        console.log('req.user:', req.user); // Debug log
        if (!req.user || req.user.role !== role) {
            console.log('Access denied: user role is', req.user?.role); // Debug log
            res.status(403);
            return res.send('Not allowed');
        }
        console.log('Access granted: user role is', req.user.role); // Debug log
        next();
    };
};


module.exports = {
    authenticateToken,
    authRole,
};
