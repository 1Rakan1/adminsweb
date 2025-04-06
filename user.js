// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
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
  language: {
    type: String,
    enum: ['ar', 'en', 'fr'],
    default: 'ar'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
});

// تشفير كلمة المرور قبل الحفظ
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// طريقة لمقارنة كلمات المرور
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
