const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const blacklistTokenModel = require('../models/blacklist.model');

const demoAccountEmail = 'recruiter@example.com';

function createAuthToken(user) {
    const isDemoAccount = user.email.trim().toLowerCase() === demoAccountEmail;
    const payload = {
        id: user._id,
        accountType: isDemoAccount ? 'demo' : 'user'
    };

    if (isDemoAccount) {
        payload.demoSessionId = randomUUID();
    }

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
}

function setAuthCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    });
}

async function registerUserController(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email and password' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim();

    if (!normalizedEmail || !normalizedUsername || String(password).length < 6) {
        return res.status(400).json({ message: 'Please provide valid username, email and a password with at least 6 characters' });
    }

    const isUserAlreadyExist = await userModel.findOne({
        $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
    });

    if (isUserAlreadyExist) {
        return res.status(400).json({ message: 'Account with the same email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword
    });

    const token = createAuthToken(newUser);
    setAuthCookie(res, token);

    return res.status(201).json({
        message: 'User registered successfully',
        user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email
        }
    });
}

async function loginUserController(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await userModel.findOne({ email: String(email).trim().toLowerCase() });

    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password);

    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = createAuthToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
        message: 'User logged in successfully',
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });
}

async function logoutUserController(req, res) {
    const token = req.cookies?.token;

    if (token) {
        await blacklistTokenModel.findOneAndUpdate(
            { token },
            { $setOnInsert: { token } },
            { upsert: true, new: true }
        );
    }

    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    return res.status(200).json({ message: 'User logged out successfully' });
}

async function getMeController(req, res) {
    const user = await userModel.findById(req.user.id).select('_id username email');

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
        message: 'User details fetched successfully',
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });
}

module.exports = { registerUserController, loginUserController, logoutUserController, getMeController };