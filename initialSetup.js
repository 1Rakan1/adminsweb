// server/initialSetup.js
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const createInitialUsers = async () => {
  try {
    // حساب القائد
    const leaderExists = await User.findOne({ username: 'egamer' });
    if (!leaderExists) {
      await User.create({
        username: 'egamer',
        password: 'g96n00r0',
        fullName: 'القائد العام',
        birthDate: new Date('1990-01-01'),
        role: 'leader'
      });
    }

    // حساب المساعد
    const assistantExists = await User.findOne({ username: 'rakanm2' });
    if (!assistantExists) {
      await User.create({
        username: 'rakanm2',
        password: 'g96n00r0',
        fullName: 'المساعد الأول',
        birthDate: new Date('1995-01-01'),
        role: 'assistant'
      });
    }
  } catch (err) {
    console.error('Error creating initial users:', err);
  }
};

module.exports = createInitialUsers;
