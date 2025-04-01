import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import mongoose from 'mongoose';
import User from './user.js'; // استيراد مودل المستخدم
import connectDB from './db.js';

dotenv.config();
connectDB(); // الاتصال بقاعدة البيانات

const app = express();
const PORT = process.env.PORT || 22782;

app.use(cors());
app.use(bodyParser.json());

// تسجيل مستخدم جديد
app.post('/register', async (req, res) => {
  const { username, email, password, discordUsername, role } = req.body;

  if (!username || !email || !password || !discordUsername || !role) {
    return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
  }

  try {
    // تحقق مما إذا كان البريد الإلكتروني مسجلاً من قبل
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    // تشفير كلمة المرور
    const hashedPassword = bcrypt.hashSync(password, 10);

    // إنشاء مستخدم جديد
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      discordUsername,
      role: role === 'admin' || role === 'superAdmin' ? role : 'user',
    });

    // حفظ المستخدم في قاعدة البيانات
    await newUser.save();

    res.status(201).json({ message: 'تم التسجيل بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

