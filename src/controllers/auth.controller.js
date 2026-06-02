const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


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
    
    const token = jwt.sign({ userId: newUser._id}, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token);

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

    const token = jwt.sign({ userId: user._id}, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token);

    res.status(200).json({
        message: "User logged in successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });

}




module.exports = { registerUserController, loginUserController };