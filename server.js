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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/supportSystem', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// نماذج MongoDB
const User = require('./models/User');
const SupportTicket = require('./models/SupportTicket');

// إنشاء الحسابات الإدارية الافتراضية
async function createDefaultAccounts() {
    try {
        // إنشاء القائد (Leader)
        const leaderData = {
            username: 'egamer1r',
            email: 'leader@support.com',
            discordName: 'leader_discord',
            birthDate: new Date('1990-01-01'),
            password: 'g96n00r0',
            role: 'leader'
        };

        let leader = await User.findOne({ username: leaderData.username });
        if (!leader) {
            const salt = await bcrypt.genSalt(10);
            leaderData.password = await bcrypt.hash(leaderData.password, salt);
            leader = new User(leaderData);
            await leader.save();
            console.log('تم إنشاء حساب القائد الافتراضي');
        }

        // إنشاء المساعد (Assistant)
        const assistantData = {
            username: 'rakanm2',
            email: 'assistant@support.com',
            discordName: 'assistant_discord',
            birthDate: new Date('1990-01-01'),
            password: 'g96n00r1',
            role: 'assistant'
        };

        let assistant = await User.findOne({ username: assistantData.username });
        if (!assistant) {
            const salt = await bcrypt.genSalt(10);
            assistantData.password = await bcrypt.hash(assistantData.password, salt);
            assistant = new User(assistantData);
            await assistant.save();
            console.log('تم إنشاء حساب المساعد الافتراضي');
        }

        // إنشاء المسؤول (Admin)
        const adminData = {
            username: 'admin123',
            email: 'admin@support.com',
            discordName: 'admin_discord',
            birthDate: new Date('1990-01-01'),
            password: 'g96n00r7',
            role: 'admin'
        };

        let admin = await User.findOne({ username: adminData.username });
        if (!admin) {
            const salt = await bcrypt.genSalt(10);
            adminData.password = await bcrypt.hash(adminData.password, salt);
            admin = new User(adminData);
            await admin.save();
            console.log('تم إنشاء حساب المسؤول الافتراضي');
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
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, discordName, birthDate } = req.body;

    try {
        let user = await User.findOne({ $or: [{ username }, { email }] });
        if (user) {
            return res.status(400).json({ msg: 'المستخدم موجود بالفعل' });
        }

        user = new User({
            username,
            email,
            discordName,
            birthDate: new Date(birthDate),
            password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.cookie('token', token, { httpOnly: true }).json({ success: true });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر');
    }
});

app.post('/api/login', [
    body('username').not().isEmpty().trim().escape(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        let user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ msg: 'بيانات الاعتماد غير صحيحة' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'بيانات الاعتماد غير صحيحة' });
        }

        // تحديث آخر تسجيل دخول
        user.lastLogin = new Date();
        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.cookie('token', token, { httpOnly: true }).json({ success: true });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر');
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
    const { priority, description } = req.body;

    try {
        // التحقق من المصادقة
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ msg: 'غير مصرح' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id);
        if (!user) {
            return res.status(401).json({ msg: 'غير مصرح' });
        }

        // تحديد المسؤول المناسب حسب الأولوية
        let assignedRole = 'admin';
        if (priority === 'medium' || priority === 'high') {
            assignedRole = 'assistant';
        }

        // إيجاد مسؤول متاح
        const assignee = await User.findOne({ role: assignedRole });
        if (!assignee) {
            return res.status(400).json({ msg: 'لا يوجد مسؤول متاح حالياً' });
        }

        // إنشاء تذكرة جديدة
        const ticket = new SupportTicket({
            userId: user._id,
            priority,
            description,
            assignedTo: assignee._id
        });

        await ticket.save();
        res.json(ticket);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر');
    }
});

app.get('/api/users', async (req, res) => {
    try {
        // التحقق من الصلاحيات
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ msg: 'غير مصرح' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id);
        if (!user || (user.role !== 'leader' && user.role !== 'assistant')) {
            return res.status(403).json({ msg: 'غير مصرح' });
        }

        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر');
    }
});

app.post('/api/users/:id/promote', async (req, res) => {
    try {
        // التحقق من الصلاحيات (القائد فقط يمكنه الترقية)
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ msg: 'غير مصرح' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const leader = await User.findById(decoded.user.id);
        if (!leader || leader.role !== 'leader') {
            return res.status(403).json({ msg: 'غير مصرح' });
        }

        const userToPromote = await User.findById(req.params.id);
        if (!userToPromote) {
            return res.status(404).json({ msg: 'المستخدم غير موجود' });
        }

        // ترقية المستخدم إلى admin
        userToPromote.role = 'admin';
        await userToPromote.save();

        res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر');
    }
});

app.get('/api/ratings', async (req, res) => {
    try {
        // التحقق من الصلاحيات (الإداريين فقط)
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ msg: 'غير مصرح' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id);
        if (!user || user.role === 'user') {
            return res.status(403).json({ msg: 'غير مصرح' });
        }

        const tickets = await SupportTicket.find({ 
            rating: { $ne: null },
            $or: [
                { assignedTo: user._id },
                { userId: user._id }
            ]
        }).populate('userId', 'username');

        const ratings = tickets.map(ticket => ({
            user: ticket.userId,
            score: ticket.rating.score,
            comment: ticket.rating.comment
        }));

        res.json(ratings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر');
    }
});

// إنشاء الحسابات الافتراضية ثم تشغيل السيرفر
createDefaultAccounts().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`السيرفر يعمل على المنفذ ${PORT}`));
});