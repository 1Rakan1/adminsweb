import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import User from './models/user.js';
import { randomInt } from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

let verificationCode = '';  // حفظ كود التحقق مؤقتًا

// تسجيل مستخدم جديد
app.post('/register', async (req, res) => {
  const { username, password, discordUsername, email, role } = req.body;

  if (!username || !password || !discordUsername || !email || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return res.status(400).json({ message: 'Username or email already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = new User({
    username,
    password: hashedPassword,
    discordUsername,
    email,
    role,
  });

  try {
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });

    // إرسال بريد إلكتروني للمستخدم
    verificationCode = randomInt(100000, 999999).toString();  // توليد كود تحقق عشوائي

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
      subject: 'Verify your EGamer Account',
      text: `Your verification code is: ${verificationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error saving user' });
  }
});

// التحقق من كود التحقق
app.post('/verify-code', (req, res) => {
  const { verificationCode: userCode } = req.body;

  if (userCode === verificationCode) {
    res.status(200).json({ message: 'Verification successful' });
  } else {
    res.status(400).json({ message: 'Invalid verification code' });
  }
});

// تسجيل الدخول
app.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  const user = await User.findOne({ username, role });

  if (!user) {
    return res.status(400).json({ message: 'Invalid username or role' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Invalid password' });
  }

  // إنشاء توكن JWT
  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({ message: 'Login successful', token });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
