const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved'],
        default: 'open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date
    },
    chatMessages: [{
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    rating: {
        score: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String
    }
});

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
