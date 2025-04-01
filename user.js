import mongoose from 'mongoose';

const adminRequestSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  discordUsername: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'superAdmin'], default: 'user' },
  adminRequest: adminRequestSchema,
});

export const User = mongoose.model('User', userSchema);
