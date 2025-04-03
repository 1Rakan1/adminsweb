require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// اتصال MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✓ تم الاتصال بـ MongoDB بنجاح'))
.catch(err => console.error('✗ خطأ في الاتصال:', err));

// نماذج البيانات
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  birthDate: { type: Date, required: true },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'assistant', 'assistant_leader', 'leader'], 
    default: 'user' 
  },
  rating: { type: Number, default: 0 },
  skills: [String],
  isVerified: { type: Boolean, default: true },
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
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now }
}));

const Chat = mongoose.model('Chat', new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    isSystem: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
}));

const Notification = mongoose.model('Notification', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  relatedEntity: { type: String, enum: ['ticket', 'user', 'application'] },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now }
}));

const AdminApplication = mongoose.model('AdminApplication', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  programmingSkills: { type: [String], required: true },
  discordUsername: { type: String, required: true },
  contactEmail: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: String,
  createdAt: { type: Date, default: Date.now }
}));

// Middleware المصادقة
function authenticate(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'الوصول مرفوض - لا يوجد token' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token غير صالح' });
  }
}

function checkRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'غير مصرح لك بهذا الإجراء' });
    }
    next();
  };
}

// مسارات المستخدمين
app.post('/api/register', async (req, res) => {
  try {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const user = await User.create({
      username: req.body.username,
      password: hashedPassword,
      email: req.body.email,
      fullName: req.body.fullName,
      birthDate: req.body.birthDate
    });
    
    const token = jwt.sign(
      { _id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.status(201).json({ user, token });
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
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

// مسارات التذاكر
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

    // إرسال إشعار للمسؤولين
    const admins = await User.find({ 
      role: { $in: ['admin', 'assistant', 'assistant_leader', 'leader'] } 
    });
    
    await Notification.insertMany(admins.map(admin => ({
      user: admin._id,
      title: 'تذكرة جديدة تحتاج مراجعة',
      message: `تم إنشاء تذكرة جديدة: ${ticket.title}`,
      relatedEntity: 'ticket',
      relatedId: ticket._id
    })));

    res.status(201).json({ ticket, chat });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/tickets', authenticate, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'user') {
      query = { createdBy: req.user._id };
    } else if (req.user.role === 'admin') {
      query = { $or: [{ assignedTo: req.user._id }, { assignedTo: null }] };
    } else if (req.user.role === 'assistant') {
      query = { 
        $or: [
          { assignedTo: req.user._id },
          { priority: { $in: ['medium', 'high'] }, assignedTo: null }
        ]
      };
    } else if (['assistant_leader', 'leader'].includes(req.user.role)) {
      query = {};
    }
    
    const tickets = await Ticket.find(query)
      .populate('createdBy', 'username fullName')
      .populate('assignedTo', 'username fullName');
      
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب التذاكر' });
  }
});

app.put('/api/tickets/:id/assign', authenticate, checkRole(['admin', 'assistant', 'assistant_leader', 'leader']), async (req, res) => {
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

    // إرسال إشعار للمستخدم
    await Notification.create({
      user: ticket.createdBy,
      title: 'تم تعيين مسؤول لتذكرتك',
      message: `تم تعيين ${req.user.username} لتذكرتك "${ticket.title}"`,
      relatedEntity: 'ticket',
      relatedId: ticket._id
    });

    res.json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/tickets/:id/rate', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'التذكرة غير موجودة' });
    if (ticket.createdBy.toString() !== req.user._id) {
      return res.status(403).json({ error: 'غير مصرح لك بتقييم هذه التذكرة' });
    }

    ticket.rating = req.body.rating;
    ticket.feedback = req.body.feedback;
    ticket.status = 'closed';
    await ticket.save();

    // تحديث تقييم المسؤول
    if (ticket.assignedTo) {
      const assignedUser = await User.findById(ticket.assignedTo);
      const userTickets = await Ticket.countDocuments({ assignedTo: ticket.assignedTo });
      assignedUser.rating = ((assignedUser.rating * (userTickets - 1)) + ticket.rating) / userTickets;
      await assignedUser.save();
    }

    res.json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// مسارات المحادثة
app.get('/api/chats/:ticketId', authenticate, async (req, res) => {
  try {
    const chat = await Chat.findOne({ ticket: req.params.ticketId })
      .populate('participants', 'username fullName role')
      .populate('messages.sender', 'username fullName role');
      
    if (!chat) return res.status(404).json({ error: 'المحادثة غير موجودة' });
    
    // التحقق من أن المستخدم مشارك في المحادثة
    if (!chat.participants.some(p => p._id.toString() === req.user._id)) {
      return res.status(403).json({ error: 'غير مصرح لك بالوصول إلى هذه المحادثة' });
    }
    
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المحادثة' });
  }
});

app.post('/api/chats/:ticketId/messages', authenticate, async (req, res) => {
  try {
    const chat = await Chat.findOne({ ticket: req.params.ticketId });
    if (!chat) return res.status(404).json({ error: 'المحادثة غير موجودة' });
    
    // التحقق من أن المستخدم مشارك في المحادثة
    if (!chat.participants.some(p => p.toString() === req.user._id)) {
      return res.status(403).json({ error: 'غير مصرح لك بإرسال رسائل في هذه المحادثة' });
    }
    
    const message = {
      sender: req.user._id,
      content: req.body.content
    };
    
    chat.messages.push(message);
    await chat.save();
    
    // إرسال إشعار لجميع المشاركين الآخرين
    const otherParticipants = chat.participants.filter(p => p.toString() !== req.user._id);
    await Notification.insertMany(otherParticipants.map(userId => ({
      user: userId,
      title: 'رسالة جديدة',
      message: `رسالة جديدة في تذكرة من ${req.user.username}`,
      relatedEntity: 'ticket',
      relatedId: chat.ticket
    })));
    
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// مسارات الإدارة
app.post('/api/admin/applications', authenticate, async (req, res) => {
  try {
    const existingApp = await AdminApplication.findOne({
      user: req.user._id,
      status: 'pending'
    });
    if (existingApp) return res.status(400).json({ error: 'لديك طلب قيد المراجعة بالفعل' });

    const application = await AdminApplication.create({
      user: req.user._id,
      name: req.body.name,
      age: req.body.age,
      programmingSkills: req.body.programmingSkills.split(',').map(s => s.trim()),
      discordUsername: req.body.discordUsername,
      contactEmail: req.body.contactEmail
    });

    // إرسال إشعار للقادة
    const leaders = await User.find({ 
      role: { $in: ['leader', 'assistant_leader'] } 
    });
    
    await Notification.insertMany(leaders.map(leader => ({
      user: leader._id,
      title: 'طلب انضمام جديد للإدارة',
      message: `طلب جديد من ${req.user.username} للانضمام للإدارة`,
      relatedEntity: 'application',
      relatedId: application._id
    })));

    res.status(201).json(application);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/applications', authenticate, checkRole(['leader', 'assistant_leader']), async (req, res) => {
  try {
    const applications = await AdminApplication.find({ status: 'pending' })
      .populate('user', 'username email rating')
      .populate('reviewedBy', 'username');
      
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الطلبات' });
  }
});

app.put('/api/admin/applications/:id', authenticate, checkRole(['leader', 'assistant_leader']), async (req, res) => {
  try {
    const application = await AdminApplication.findById(req.params.id)
      .populate('user');
      
    if (!application) return res.status(404).json({ error: 'الطلب غير موجود' });
    
    application.status = req.body.status;
    application.reviewedBy = req.user._id;
    application.reviewNotes = req.body.reviewNotes;
    await application.save();
    
    if (req.body.status === 'approved') {
      await User.findByIdAndUpdate(application.user._id, { role: 'admin' });
      
      await Notification.create({
        user: application.user._id,
        title: 'تم قبول طلبك للانضمام للإدارة',
        message: 'تهانينا! تمت ترقيتك إلى رتبة أدمن',
        relatedEntity: 'user'
      });
    } else {
      await Notification.create({
        user: application.user._id,
        title: 'تم رفض طلبك للانضمام للإدارة',
        message: req.body.reviewNotes || 'للأسف لم يتم قبول طلبك هذه المرة',
        relatedEntity: 'user'
      });
    }
    
    res.json(application);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id/promote', authenticate, checkRole(['leader', 'assistant_leader']), async (req, res) => {
  try {
    // مساعد القائد يمكنه ترقية إلى أدمن فقط
    if (req.user.role === 'assistant_leader' && req.body.role !== 'admin') {
      return res.status(403).json({ error: 'يمكنك فقط ترقية المستخدمين إلى أدمن' });
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, {
      role: req.body.role
    }, { new: true });
    
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    
    await Notification.create({
      user: user._id,
      title: 'تم تغيير رتبتك',
      message: `تم ترقيتك إلى رتبة ${req.body.role}`,
      relatedEntity: 'user'
    });
    
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// مسارات الإشعارات
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      user: req.user._id,
      isRead: false 
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الإشعارات' });
  }
});

app.put('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, {
      isRead: true
    }, { new: true });
    
    if (!notification) return res.status(404).json({ error: 'الإشعار غير موجود' });
    
    res.json(notification);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// بدء الخادم
const PORT = process.env.PORT || 6147;
const HOST = process.env.HOST || '87.106.52.7';
app.listen(PORT, HOST, () => {
  console.log(`✓ الخادم يعمل على http://${HOST}:${PORT}`);
});
