const jwt = require('jsonwebtoken');
const blacklistTokenModel = require('../models/blacklist.model');

async function authUser(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
    }

    try {
        const isTokenBlacklisted = await blacklistTokenModel.findOne({ token });

        if (isTokenBlacklisted) {
            return res.status(401).json({ message: 'token is invalid' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

module.exports = { authUser };