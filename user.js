import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  discordUsername: { type: String, required: true },
  role: { type: String, required: true, enum: ['user', 'admin', 'superAdmin'] },
  email: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  verificationCode: { type: Number, required: false },
});

const User = mongoose.model('User', userSchema);

export default User;
