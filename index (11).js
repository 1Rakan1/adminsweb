import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 22782;

app.use(bodyParser.json());

// بيانات المستخدم الافتراضية
let users = [];

// بيانات مستخدمين افتراضيين
const adminUser = {
  id: 1,
  username: 'admin',
  password: bcrypt.hashSync('adminpassword', 10),
  discordUsername: 'adminDiscord',
  role: 'superAdmin', // admin, user, superAdmin
};

users.push(adminUser);

// تسجيل مستخدم جديد
app.post('/register', (req, res) => {
  const { username, password, discordUsername, role } = req.body;

  if (!username || !password || !discordUsername || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // إذا كان الدور أدمن أو سوبر أدمن، تأكد من وجود فقط واحد منهم
  if (role === 'admin' || role === 'superAdmin') {
    const adminCount = users.filter(user => user.role === 'admin' || user.role === 'superAdmin').length;
    if (adminCount >= 1) {
      return res.status(403).json({ message: 'Only one admin or superadmin is allowed' });
    }
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: users.length + 1,
    username,
    password: hashedPassword,
    discordUsername,
    role: role === 'admin' || role === 'superAdmin' ? role : 'user',
  };

  users.push(newUser);
  res.status(200).json({ message: 'User registered successfully' });
});

// تسجيل الدخول
app.post('/login', (req, res) => {
  const { username, password, role } = req.body;
  const user = users.find((u) => u.username === username && u.role === role);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
