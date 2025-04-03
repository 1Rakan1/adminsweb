// server/models/User.js
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  birthDate: { type: Date, required: true },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'assistant', 'assistant_leader', 'leader'], 
    default: 'user' 
  },
  rating: { type: Number, default: 0 },
  skills: [String],
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
