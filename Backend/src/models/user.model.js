const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [ true, "Username already exists"],
        required: true
    },

    email: {
        type: String,
        unique: [ true, "Account with this email already exists"],
        required: true
    },
    
    password: {
        type: String,
        required: true
    }
});


const userModel = mongoose.model("User", userSchema);


module.exports = userModel; 