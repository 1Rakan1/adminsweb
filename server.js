require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { body, validationResult } = require('express-validator');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(cookieParser());

// اتصال MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://wick-studio25:wick-studio25@cluster0.jwvlb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// نماذج MongoDB
const User = require('./models/User');
const SupportTicket = require('./models/SupportTicket');

// إنشاء الحسابات الإدارية الافتراضية
async function createDefaultAccounts() {
    try {
        const roles = [
            { username: 'egamer1r', password: 'g96n00r0', role: 'leader' },
            { username: 'rakanm2', password: 'g96n00r1', role: 'assistant' },
            { username: 'admin123', password: 'g96n00r7', role: 'admin' }
        ];

        for (const { username, password, role } of roles) {
            let user = await User.findOne({ username });
            if (!user) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                
                user = new User({
                    username,
                    email: `${username}@support.com`,
                    discordName: `${username}_discord`,
                    birthDate: new Date('1990-01-01'),
                    password: hashedPassword,
                    role
                });
                
                await user.save();
                console.log(`تم إنشاء حساب ${role} افتراضي: ${username}`);
            }
        }
    } catch (err) {
        console.error('حدث خطأ أثناء إنشاء الحسابات الافتراضية:', err.message);
    }
}

// مسارات API
app.post('/api/register', [
    body('username').not().isEmpty().trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('discordName').not().isEmpty().trim(),
    body('birthDate').isDate()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }

    const { username, email, password, discordName, birthDate } = req.body;

    try {
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                msg: 'المستخدم موجود بالفعل' 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            discordName,
            birthDate: new Date(birthDate),
            password: hashedPassword,
            role: 'user'
        });

        await newUser.save();

        res.json({ 
            success: true,
            msg: 'تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن' 
        });

    } catch (err) {
        console.error('حدث خطأ أثناء التسجيل:', err);
        res.status(500).json({ 
            success: false,
            msg: 'حدث خطأ في السيرفر',
            error: err.message 
        });
    }
});

app.post('/api/login', [
    body('username').not().isEmpty().trim().escape(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }

    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ 
                success: false,
                msg: 'بيانات الاعتماد غير صحيحة' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                msg: 'بيانات الاعتماد غير صحيحة' 
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) {
                    console.error('خطأ في إنشاء التوكن:', err);
                    throw err;
                }
                
                res.cookie('token', token, { 
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                }).json({ 
                    success: true,
                    user: {
                        id: user._id,
                        username: user.username,
                        role: user.role
                    }
                });
            }
        );
    } catch (err) {
        console.error('حدث خطأ أثناء تسجيل الدخول:', err);
        res.status(500).json({ 
            success: false,
            msg: 'حدث خطأ في السيرفر',
            error: err.message 
        });
    }
});

app.get('/api/auth', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ msg: 'غير مصرح' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر');
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token').json({ success: true });
});

app.post('/api/tickets', async (req, res) => {
    try {
        const { priority, description } = req.body;
        
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, msg: 'غير مصرح' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id);
        if (!user) {
            return res.status(401).json({ success: false, msg: 'غير مصرح' });
        }

        console.log('إنشاء تذكرة جديدة:', {
            userId: user._id,
            priority,
            description
        });

        let assignee;
        if (priority === 'low') {
            assignee = await User.findOne({ role: 'admin' });
        } else {
            assignee = await User.findOne({ 
                role: { $in: ['assistant', 'leader'] } 
            });
        }

        if (!assignee) {
            console.error('لم يتم العثور على مسؤول متاح');
            return res.status(400).json({ 
                success: false, 
                msg: 'لا يوجد مسؤول متاح حالياً' 
            });
        }

        const ticket = new SupportTicket({
            userId: user._id,
            priority,
            description,
            assignedTo: assignee._id,
            status: 'open'
        });

        await ticket.save();
        
        console.log('تم إنشاء التذكرة بنجاح:', ticket);
        res.json({ 
            success: true, 
            ticket 
        });
    } catch (err) {
        console.error('حدث خطأ أثناء إنشاء التذكرة:', err);
        res.status(500).json({ 
            success: false, 
            msg: 'حدث خطأ في السيرفر',
            error: err.message 
        });
    }
});

app.get('/api/tickets', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ msg: 'غير مصرح' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id);
        if (!user) {
            return res.status(401).json({ msg: 'غير مصرح' });
        }

        let tickets;
        if (user.role === 'user') {
            tickets = await SupportTicket.find({ userId: user._id });
        } else {
            tickets = await SupportTicket.find({ assignedTo: user._id });
        }

        res.json(tickets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر');
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res
