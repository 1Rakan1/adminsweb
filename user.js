// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  birthDate: { type: Date, required: true },
  role: {
    type: String,
    enum: ['user', 'admin', 'assistant', 'leader'],
    default: 'user'
  },
  createdAt: { type: Date, default: Date.now }
});

// ... (بقية الملف كما هو)
