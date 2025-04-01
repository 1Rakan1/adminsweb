import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/website', { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: { type: String, default: 'user' },
    verified: { type: Boolean, default: false },
});
const User = mongoose.model('User', UserSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your_email@gmail.com',
        pass: 'your_email_password'
    }
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    await transporter.sendMail({
        from: 'your_email@gmail.com',
        to: email,
        subject: 'كود التحقق',
        text: `رمز التحقق الخاص بك هو: ${verificationCode}`
    });

    res.json({ message: 'تم التسجيل بنجاح. تحقق من بريدك الإلكتروني!' });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'المستخدم غير موجود' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'كلمة المرور غير صحيحة' });

    const token = jwt.sign({ id: user._id, role: user.role }, 'your_jwt_secret_key', { expiresIn: '1h' });

    res.json({ token });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
