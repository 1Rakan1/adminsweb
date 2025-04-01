import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 22782;

app.use(bodyParser.json());

// اتصال بقاعدة البيانات MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

// تعريف نموذج المستخدم (User model)
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, required: true, unique: true },
  password: String,
  discordUsername: String,
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// تسجيل مستخدم جديد
app.post('/register', async (req, res) => {
  const { username, email, password, discordUsername, role } = req.body;

  if (!username || !email || !password || !discordUsername || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // تحقق إذا كان المستخدم موجودًا بالفعل
    const existingUser = await User.findOne({ email });
    if (existingUser

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
