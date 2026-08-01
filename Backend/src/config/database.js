const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');

async function createDemoRecruiter() {
    const demoEmail = 'recruiter@example.com';
    const demoPassword = 'demo1234';

    const existingUser = await userModel.findOne({ email: demoEmail });

    if (existingUser) {
        return;
    }

    const hashedPassword = await bcrypt.hash(demoPassword, 10);

    await userModel.create({
        username: 'recruiter-demo',
        email: demoEmail,
        password: hashedPassword
    });

    console.log('Demo recruiter user created');
}

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Connnected to Database");
        await createDemoRecruiter();

    } catch (error) {
        console.log("Database connection error:", error);
    }
}


module.exports = connectDB;