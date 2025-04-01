import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from './models/user.js';
import { requestAdminRole, getAdminRequests, updateToAdmin } from './user.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 22782;

app.use(bodyParser.json());

// الاتصال بـ MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// تسجيل مستخدم جديد
app.post('/register', async (req, res) => {
  const { username, password, discordUsername, role } = req.body;

  if (!username || !password || !discordUsername || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (role === 'admin' || role === 'superAdmin') {
    const adminCount = await User.countDocuments({ role: { $in: ['admin', 'superAdmin'] } });
    if (adminCount >= 1) {
      return res.status(403).json({ message: 'Only one admin or superadmin is allowed' });
    }
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = new User({
    username,
    password: hashedPassword,
    discordUsername,
    role,
    adminRequest: { reason: '', status: 'pending' }
  });

  try {
    await newUser.save();
    res.status(200).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تسجيل الدخول
app.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  const user = await User.findOne({ username, role });

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// تقديم طلب للحصول على رتبة أدمن
app.post('/requestAdmin', async (req, res) => {
  const { userId, reason } = req.body;

  try {
    const response = await requestAdminRole(userId, reason);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// عرض طلبات التحول إلى أدمن
app.get('/adminRequests', async (req, res) => {
  try {
    const adminRequests = await getAdminRequests();
    res.json(adminRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// قبول طلب التحول إلى أدمن
app.post('/acceptAdminRequest', async (req, res) => {
  const { userId } = req.body;

  try {
    const response = await updateToAdmin(userId);
    res.json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

