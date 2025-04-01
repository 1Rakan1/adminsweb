import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';  // لإرسال البريد الإلكتروني
import mongoose from 'mongoose';  // للتخزين في قاعدة البيانات

dotenv.config();

const app = express();
const PORT = process.env.PORT || 22782;
app.use(bodyParser.json());

// قاعدة البيانات MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Failed to connect to MongoDB", err));

// نموذج المستخدم في قاعدة البيانات
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  discordUsername: String,
  role: { type: String, default: 'user' },
  email: String,
});

const User = mongoose.model('User', userSchema);

// إنشاء حساب سوبر أدمن افتراضي
const createSuperAdmin = async () => {
  const superAdminExists = await User.findOne({ role: 'superAdmin' });
  if (!superAdminExists) {
    const hashedPassword = bcrypt.hashSync('superadminpassword', 10);
    const superAdmin = new User({
      username: 'superAdmin',
      password: hashedPassword,
      discordUsername: 'superAdminDiscord',
      role: 'superAdmin',
      email: 'superadmin@example.com',
    });
    await superAdmin.save();
  }
};

createSuperAdmin();

// تسجيل مستخدم جديد
app.post('/register', async (req, res) => {
  const { username, password, discordUsername, role, email } = req.body;

  if (!username || !password || !discordUsername || !role || !email) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'Username already taken' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = new User({
    username,
    password: hashedPassword,
    discordUsername,
    role,
    email,
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

// إرسال رابط لاستعادة كلمة المرور
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: 'Email not found' });
  }

  // إرسال بريد إلكتروني
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Password Reset',
    text: 'Click the link to reset your password: [reset link]',
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ message: 'Error sending email' });
    }
    res.status(200).json({ message: 'Password reset email sent' });
  });
});

// تقديم طلب لتصبح أدمن
app.post('/apply-admin', async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  if (user.role !== 'user') {
    return res.status(400).json({ message: 'User is already an admin or super admin' });
  }

  user.role = 'admin';
  await user.save();
  res.status(200).json({ message: 'User is now an admin' });
});

// قبول أو رفض طلب الأدمن من السوبر أدمن
app.post('/approve-admin', async (req, res) => {
  const { userId, approve } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  if (approve) {
    user.role = 'admin';
    await user.save();
    res.status(200).json({ message: 'User approved as admin' });
  } else {
    res.status(200).json({ message: 'User rejected as admin' });
  }
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
