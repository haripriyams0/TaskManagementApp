const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
});

module.exports = mongoose.model('User', userSchema);
// This module defines a Mongoose schema for a User model with email and password fields.       