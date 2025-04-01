import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  discordUsername: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'superAdmin'], default: 'user' },
  email: { type: String, required: true, unique: true },
});

const User = mongoose.model('User', userSchema);
export default User;
