const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    discordName: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'assistant', 'leader'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

module.exports = mongoose.model('User', UserSchema);
