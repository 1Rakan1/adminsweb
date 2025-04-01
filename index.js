import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import User from './models/user.js'; // تأكد من استيراد نموذج المستخدم

dotenv.config();

const app = express();
const PORT = process.env.PORT || 22782;

app.use(bodyParser.json());

// الاتصال بقاعدة البيانات MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// عند تشغيل السيرفر، تحقق من وجود سوبر أدمن، وإذا لم يكن موجودًا، أنشئه
mongoose.connection.once('open', async () => {
  const superAdmin = await User.findOne({ username: 'rakanm2' });

  if (!superAdmin) {
    const hashedPassword = bcrypt.hashSync('bd2w56ra', 10);
    const newSuperAdmin = new User({
      username: 'rakanm2',
      password: hashedPassword,
      discordUsername: 'rakanm2_discord',
      role: 'superAdmin',
      emailVerified: true,
      verificationCode: null,
    });

    await newSuperAdmin.save();
    console.log('Super Admin account created: rakanm2');
  }
});

// تسجيل مستخدم جديد
app.post('/register', async (req, res) => {
  const { username, password, discordUsername, role, email } = req.body;

  if (!username || !password || !discordUsername || !role || !email) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const userExists = await User.findOne({ username });

  if (userExists) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = new User({
    username,
    password: hashedPassword,
    discordUsername,
    role,
    email,
    emailVerified: false,
    verificationCode: Math.floor(100000 + Math.random() * 900000),  // توليد كود تحقق من 6 أرقام
  });

  await newUser.save();

  // إرسال كود التحقق عبر البريد الإلكتروني
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
    subject: 'Email Verification Code',
    text: `Your verification code is: ${newUser.verificationCode}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ message: 'Error sending verification email' });
    }
    res.status(200).json({ message: 'User registered successfully. Please check your email for verification.' });
  });
});

// تسجيل الدخول
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
