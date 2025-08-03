const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    phone: { type: String, required: true },
    notes: { type: String, default: '' },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'failed'],
        default: 'pending'
    },
    isFinalized: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);