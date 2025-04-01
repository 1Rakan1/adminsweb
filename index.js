import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import User from './models/user.js'; // استيراد موديل المستخدم
import './db.js'; // استيراد الاتصال بقاعدة البيانات

dotenv.config();

const app = express();
const PORT = process.env.PORT || 22782;
app.use(bodyParser.json());

// إعدادات البريد الإلكتروني
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// تسجيل مستخدم جديد
app.post('/register', async (req, res) => {
  const { username, password, discordUsername, role } = req.body;

  if (!username || !password || !discordUsername || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = new User({
    username,
    password: hashedPassword,
    discordUsername,
    role: role === 'admin' || role === 'superAdmin' ? role : 'user',
  });

  await newUser.save();
  res.status(200).json({ message: 'User registered successfully' });
});

// تسجيل الدخول
app.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  const user = await User.findOne({ username, role });

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// رابط إعادة تعيين كلمة المرور
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
  };

  await transporter.sendMail(mailOptions);
  res.json({ message: 'Password reset email sent' });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
