require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

// الاتصال بقاعدة البيانات MongoDB
mongoose.connect('mongodb+srv://wick-studio25:wick-studio25@cluster0.jwvlb.mongodb.net/saedni?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('تم الاتصال بـ MongoDB بنجاح'))
.catch(err => console.error('خطأ في الاتصال بـ MongoDB:', err));

// تعريف نماذج البيانات
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin', 'assistant', 'leader'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
}));

const Ticket = mongoose.model('Ticket', new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['technical', 'admin_request'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], required: true },
  status: { type: String, default: 'open' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}));

const Chat = mongoose.model('Chat', new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
}));

// إنشاء حسابات الإدارة الأولية
async function createAdminUsers() {
  try {
    const leader = await User.findOne({ username: 'egamer' });
    if (!leader) {
      await User.create({
        username: 'egamer',
        password: bcrypt.hashSync('g96n00r5', 10),
        email: 'leader@saedni.com',
        role: 'leader'
      });
      console.log('تم إنشاء حساب القائد بنجاح');
    }

    const assistant = await User.findOne({ username: 'rakanm2' });
    if (!assistant) {
      await User.create({
        username: 'rakanm2',
        password: bcrypt.hashSync('g96n00r5', 10),
        email: 'assistant@saedni.com',
        role: 'assistant'
      });
      console.log('تم إنشاء حساب المساعد بنجاح');
    }
  } catch (err) {
    console.error('خطأ في إنشاء حسابات الإدارة:', err);
  }
}

// Middleware المصادقة
function authenticate(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'الوصول مرفوض - لا يوجد token' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token غير صالح' });
  }
}

// Middleware للتحقق من الصلاحيات
function checkRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'غير مصرح لك بهذا الإجراء' });
    }
    next();
  };
}

app.use(express.json());

// مسارات API
app.post('/api/register', async (req, res) => {
  try {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const user = await User.create({
      username: req.body.username,
      password: hashedPassword,
      email: req.body.email
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({ error: 'اسم المستخدم غير صحيح' });

    const validPass = bcrypt.compareSync(req.body.password, user.password);
    if (!validPass) return res.status(400).json({ error: 'كلمة المرور غير صحيحة' });

    const token = jwt.sign(
      { _id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '1d' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

app.post('/api/tickets', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.create({
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      priority: req.body.priority,
      createdBy: req.user._id
    });

    const chat = await Chat.create({
      ticket: ticket._id,
      participants: [req.user._id]
    });

    res.status(201).json({ ticket, chat });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/tickets/:id/assign', authenticate, checkRole(['admin', 'assistant', 'leader']), async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, {
      assignedTo: req.user._id,
      status: 'assigned'
    }, { new: true });

    if (!ticket) return res.status(404).json({ error: 'التذكرة غير موجودة' });

    await Chat.updateOne(
      { ticket: ticket._id },
      { $addToSet: { participants: req.user._id } }
    );

    res.json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/chats/:id/messages', authenticate, async (req, res) => {
  try {
    const chat = await Chat.findByIdAndUpdate(req.params.id, {
      $push: {
        messages: {
          sender: req.user._id,
          content: req.body.content
        }
      }
    }, { new: true });

    if (!chat) return res.status(404).json({ error: 'المحادثة غير موجودة' });

    res.json(chat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/users/:id/promote', authenticate, checkRole(['leader']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      role: req.body.role
    }, { new: true });

    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// بدء الخادم وإنشاء حسابات الإدارة
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`الخادم يعمل على port ${PORT}`);
  createAdminUsers();
});
