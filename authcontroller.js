const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, birthDate } = req.body;

    // 1) التحقق من عدم وجود مستخدم بنفس البريد أو اسم المستخدم
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'البريد الإلكتروني أو اسم المستخدم موجود بالفعل'
      });
    }

    // 2) إنشاء المستخدم
    const newUser = await User.create({
      username,
      email,
      password,
      fullName,
      birthDate
    });

    // 3) إنشاء token
    const token = signToken(newUser._id);

    // 4) إرسال الاستجابة
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 1) التحقق من وجود المستخدم وكلمة المرور
    if (!username || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'الرجاء إدخال اسم المستخدم وكلمة المرور'
      });
    }

    // 2) التحقق من صحة المستخدم
    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await user.comparePassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    // 3) تحديث آخر تسجيل دخول
    user.lastLogin = Date.now();
    await user.save();

    // 4) إنشاء token
    const token = signToken(user._id);

    // 5) إرسال الاستجابة
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};
