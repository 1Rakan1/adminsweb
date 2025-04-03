require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✓ تم الاتصال بـ MongoDB بنجاح');
  
  // إنشاء حسابات الإدارة
  const adminUsers = [
    {
      username: 'egamer',
      password: 'g96n00r5',
      email: 'leader@saedni.com',
      fullName: 'القائد الرئيسي',
      birthDate: new Date('1990-01-01'),
      role: 'leader',
      isVerified: true
    },
    {
      username: 'rakanm2',
      password: 'g96n00r5',
      email: 'assistant@saedni.com',
      fullName: 'مساعد القائد ركان',
      birthDate: new Date('1992-01-01'),
      role: 'assistant_leader',
      isVerified: true
    },
    {
      username: 'admin1',
      password: 'admin12345',
      email: 'admin1@saedni.com',
      fullName: 'مدير النظام الأول',
      birthDate: new Date('1985-01-01'),
      role: 'admin',
      isVerified: true
    }
  ];

  for (const userData of adminUsers) {
    const existingUser = await User.findOne({ username: userData.username });
    if (!existingUser) {
      userData.password = bcrypt.hashSync(userData.password, 10);
      await User.create(userData);
      console.log(`✓ تم إنشاء حساب ${userData.role}: ${userData.username}`);
    } else {
      console.log(`⚠ الحساب موجود مسبقاً: ${userData.username}`);
    }
  }

  mongoose.disconnect();
})
.catch(err => {
  console.error('✗ خطأ في الاتصال:', err);
  process.exit(1);
});
