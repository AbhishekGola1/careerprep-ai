const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const blacklistTokenModel = require('../models/blacklist.model');
const userModel = require('../models/user.model');

const demoAccountEmail = 'recruiter@example.com';

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
        let authenticatedUser = decoded;

        if (!decoded.accountType || (decoded.accountType === 'demo' && !decoded.demoSessionId)) {
            const account = await userModel.findById(decoded.id).select('email');
            if (!account) {
                return res.status(401).json({ message: 'Invalid token' });
            }

            const isDemoAccount = account.email.trim().toLowerCase() === demoAccountEmail;
            authenticatedUser = {
                id: decoded.id,
                accountType: isDemoAccount ? 'demo' : 'user',
                ...(isDemoAccount ? { demoSessionId: decoded.demoSessionId || randomUUID() } : {})
            };

            if (isDemoAccount) {
                const refreshedToken = jwt.sign(authenticatedUser, process.env.JWT_SECRET, { expiresIn: '1d' });
                res.cookie('token', refreshedToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    maxAge: 24 * 60 * 60 * 1000
                });
            }
        }

        req.user = authenticatedUser;
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

module.exports = { authUser };