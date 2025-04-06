const User = require('./models/User');
const bcrypt = require('bcryptjs');

const createInitialUsers = async () => {
  try {
    // حساب القائد
    const leaderUser = {
      username: 'egamer',
      email: 'leader@saadni.com',
      password: await bcrypt.hash('g96n00r0', 12),
      fullName: 'القائد العام',
      birthDate: new Date('1990-01-01'),
      role: 'leader'
    };

    // حساب المساعد
    const assistantUser = {
      username: 'rakanm2',
      email: 'assistant@saadni.com',
      password: await bcrypt.hash('g96n00r0', 12),
      fullName: 'المساعد الأول',
      birthDate: new Date('1995-01-01'),
      role: 'assistant'
    };

    // حساب أدمن
    const adminUser = {
      username: 'admin1',
      email: 'admin@saadni.com',
      password: await bcrypt.hash('admin123', 12),
      fullName: 'مدير النظام',
      birthDate: new Date('1985-01-01'),
      role: 'admin'
    };

    const users = [leaderUser, assistantUser, adminUser];
    
    for (const user of users) {
      const exists = await User.findOne({ username: user.username });
      if (!exists) {
        await User.create(user);
        console.log(`Created ${user.role} user: ${user.username}`);
      }
    }
  } catch (err) {
    console.error('Error creating initial users:', err);
  }
};

module.exports = createInitialUsers;
