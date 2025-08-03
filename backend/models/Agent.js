const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, default: 'agent' },
});

module.exports = mongoose.model('Agent', agentSchema);
// This module defines a Mongoose schema for an Agent model with fields for name, email, phone, and role.