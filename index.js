import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './models/user.js';  
import nodemailer from 'nodemailer';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 22782;

app.use(bodyParser.json());

// الاتصال بقاعدة بيانات MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('MongoDB connection error:', err));

// تسجيل مستخدم جديد مع إرسال كود التحقق إلى البريد الإلكتروني
app.post('/register', async (req, res) => {
  const { username, password, discordUsername, email, role } = req.body;

  if (!username || !password || !discordUsername || !email || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  // إنشاء الكود العشوائي للتحقق
  const verificationCode = crypto.randomInt(100000, 999999);  // كود مكون من 6 أرقام

  // إنشاء مستخدم جديد ولكن دون التحقق حتى الآن
  const newUser = new User({
    username,
    password: hashedPassword,
    discordUsername,
    email,
    role: role === 'admin' || role === 'superAdmin' ? role : 'user',
    verificationCode,
    verified: false,  // حقل لتحديد ما إذا تم التحقق من الحساب
  });

  await newUser.save();

  // إرسال بريد إلكتروني مع كود التحقق
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification',
    text: `Your verification code is: ${verificationCode}`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      return res.status(500).json({ message: 'Error sending verification email' });
    }
    res.status(200).json({ message: 'User registered successfully. Please check your email for the verification code.' });
  });
});

// التحقق من كود التحقق
app.post('/verify', async (req, res) => {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.verificationCode !== parseInt(verificationCode)) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  user.verified = true; // تغيير الحالة إلى تم التحقق
  await user.save();

  res.status(200).json({ message: 'Email verified successfully!' });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
