const User = require('./models/User');
const bcrypt = require('bcryptjs');

const createInitialUsers = async () => {
  try {
    const users = [
      {
        username: 'egamer',
        password: await bcrypt.hash('g96n00r0', 10),
        fullName: 'القائد العام',
        birthDate: new Date('1990-01-01'),
        role: 'leader'
      },
      {
        username: 'rakanm2',
        password: await bcrypt.hash('g96n00r0', 10),
        fullName: 'المساعد الأول',
        birthDate: new Date('1995-01-01'),
        role: 'assistant'
      },
      {
        username: 'admin1',
        password: await bcrypt.hash('admin123', 10),
        fullName: 'مدير النظام',
        birthDate: new Date('1985-01-01'),
        role: 'admin'
      }
    ];

    for (const user of users) {
      const exists = await User.findOne({ username: user.username });
      if (!exists) {
        await User.create(user);
        console.log(`تم إنشاء مستخدم ${user.role}: ${user.username}`);
      }
    }
  } catch (err) {
    console.error('حدث خطأ أثناء إنشاء المستخدمين:', err);
  }
};

module.exports = createInitialUsers;
