import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './user.js';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 22782;

app.use(bodyParser.json());

// اتصال بقاعدة البيانات
import './db.js';

// تعريف النموذج الخاص بك
// تم تضمينه في ملف `user.js`

// تسجيل مستخدم جديد
app.post('/register', async (req, res) => {
  const { username, email, password, discordUsername, role } = req.body;

  if (!username || !email || !password || !discordUsername || !role) {
    return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
  }

  try {
    // تحقق إذا كان المستخدم موجودًا بالفعل
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    // تشفير كلمة المرور
    const hashedPassword = bcrypt.hashSync(password, 10);

    // إضافة المستخدم الجديد إلى قاعدة البيانات
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      discordUsername,
      role
    });

    await newUser.save();

    res.status(200).json({ message: 'تم التسجيل بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء التسجيل' });
  }
});

// تسجيل الدخول
app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  
  const user = await User.findOne({ email });
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
  }

  // توليد التوكن JWT
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
});

// إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({ message: 'المستخدم غير موجود' });
  }

  // إنشاء رابط إعادة تعيين كلمة المرور
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // إرسال البريد الإلكتروني
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password'
    }
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'إعادة تعيين كلمة المرور',
    text: `يمكنك إعادة تعيين كلمة المرور من خلال الرابط التالي: ${resetLink}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إرسال البريد الإلكتروني' });
  }
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
