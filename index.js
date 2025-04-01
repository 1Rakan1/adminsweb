import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import User from './models/user.js';
import Chat from './models/chat.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 22782;

app.use(bodyParser.json());

// اتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    // إضافة سوبر أدمن إذا لم يكن موجودًا
    addSuperAdmin();
  })
  .catch(err => console.log(err));

// إضافة سوبر أدمن
async function addSuperAdmin() {
  const superAdminExists = await User.findOne({ username: 'rakanm2' });
  if (!superAdminExists) {
    const hashedPassword = bcrypt.hashSync('bd2w56ra', 10);
    const newSuperAdmin = new User({
      username: 'rakanm2',
      password: hashedPassword,
      discordUsername: 'RakanM2',
      role: 'superAdmin',
      emailVerified: true,  // لأنه سوبر أدمن
      verificationCode: null,
    });

    await newSuperAdmin.save();
    console.log('Super Admin created: rakanm2');
  } else {
    console.log('Super Admin already exists');
  }
}

// بيانات المستخدم الافتراضية
let users = [];

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  }
});

// تسجيل مستخدم جديد
app.post('/register', async (req, res) => {
  const { username, password, discordUsername, role } = req.body;

  if (!username || !password || !discordUsername || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = new User({
    username,
    password: hashedPassword,
    discordUsername,
    role,
    emailVerified: false,
    verificationCode: Math.floor(100000 + Math.random() * 900000),
  });

  await newUser.save();

  // إرسال كود التحقق إلى البريد الإلكتروني
  const mailOptions = {
    from: process.env.EMAIL,
    to: newUser.email,
    subject: 'Verification Code',
    text: `Your verification code is: ${newUser.verificationCode}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Email sent: ' + info.response);
  });

  res.status(200).json({ message: 'User registered successfully. Please check your email for the verification code.' });
});

// تسجيل دخول
app.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  const user = await User.findOne({ username, role });

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// إرسال رابط إعادة تعيين كلمة المرور
app.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Reset Password',
    text: `Click the following link to reset your password: ${resetLink}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Email sent: ' + info.response);
  });

  res.json({ message: 'Password reset link sent to your email' });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
