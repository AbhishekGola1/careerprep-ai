const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');

async function createDemoRecruiter() {
    const demoEmail = 'recruiter@example.com';
    const demoPassword = 'demo1234';

    const hashedPassword = await bcrypt.hash(demoPassword, 10);

    await userModel.findOneAndUpdate(
        { email: demoEmail },
        {
            $set: {
                username: 'recruiter-demo',
                password: hashedPassword
            },
            $setOnInsert: {
                email: demoEmail
            }
        },
        { upsert: true, new: true, runValidators: true }
    );

    console.log('Demo recruiter account is ready');
}

async function connectDB() {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not configured');
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log('Connected to Database');
    await createDemoRecruiter();
}


module.exports = connectDB;