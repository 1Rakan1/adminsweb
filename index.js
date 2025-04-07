const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// استيراد الروابط
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const issueRoutes = require('./routes/issueRoutes');

// التهيئة
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// الاتصال بقاعدة البيانات
mongoose.connect('mongodb://localhost:27017/saadni', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  console.log('تم الاتصال بـ MongoDB');
  require('./initialSetup')();
})
.catch(err => console.error('خطأ في الاتصال:', err));

// الروابط
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);

// التشغيل
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
