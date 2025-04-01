import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  discordUsername: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin', 'superAdmin'], default: 'user' },
  verificationCode: { type: Number, required: true },  // كود التحقق
  verified: { type: Boolean, default: false },  // حالة التحقق
});

const User = mongoose.model('User', userSchema);
export default User;
