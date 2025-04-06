require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketio = require('socket.io');

// استيراد الروابط
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const issueRoutes = require('./routes/issueRoutes');

// تهيئة التطبيق
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saadni', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  require('./initialSetup')(); // إنشاء الحسابات الأولية
})
.catch(err => console.error('MongoDB connection error:', err));

// الروابط
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);

// تكوين Socket.io
require('./sockets/chat')(io);

// تشغيل الخادم
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
