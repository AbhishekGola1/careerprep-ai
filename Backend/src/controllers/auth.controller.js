const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const blacklistTokenModel = require('../models/blacklist.model');
const { id } = require('zod/v4/locales');


async function registerUserController(req, res) {
    
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Please provide username, email and password" });
    }

    const isUserAlreadyExist = await userModel.findOne({
        $or: [ { email }, { username } ]
    });

    if (isUserAlreadyExist) {
        return res.status(400).json({ message: "Account with the same email or username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
        username,
        email,
        password: hashedPassword
    });
    
    const token = jwt.sign({ id: newUser._id}, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({ 
        message: "User registered successfully",
        user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email
        }
    }); 
    
}


async function loginUserController(req, res) {

    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id}, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
        message: "User logged in successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });

}


async function logoutUserController(req, res) {

    const token = req.cookies.token;

    if (token) {
        await blacklistTokenModel.create({ token });
    }

    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });

    return res.status(200).json({ message: "User logged out successfully" });

}


async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id);

    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });
}




module.exports = { registerUserController, loginUserController, logoutUserController, getMeController };