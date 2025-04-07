const User = require('../models/User');

// ترقية مستخدم (للقائد والمساعد فقط)
exports.promoteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;
    const currentUser = req.user;

    // 1) التحقق من صلاحية المستخدم الحالي
    if (!['assistant', 'leader'].includes(currentUser.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'ليس لديك صلاحية لترقية المستخدمين'
      });
    }

    // 2) القائد يمكنه تعيين أي رتبة، المساعد يمكنه تعيين أدمن فقط
    if (currentUser.role === 'assistant' && newRole !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'يمكنك فقط ترقية المستخدمين إلى أدمن'
      });
    }

    // 3) التحقق من أن الرتبة الجديدة صالحة
    const allowedRoles = ['user', 'admin', 'assistant', 'leader'];
    if (!allowedRoles.includes(newRole)) {
      return res.status(400).json({
        status: 'fail',
        message: 'رتبة غير صالحة'
      });
    }

    // 4) تنفيذ الترقية
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// عرض جميع المستخدمين مع إمكانية التصفية
exports.getAllUsers = async (req, res) => {
  try {
    // بناء query بناءً على صلاحية المستخدم
    let query = {};
    if (req.user.role === 'assistant') {
      query.role = { $in: ['user', 'admin'] };
    }

    const users = await User.find(query).select('-password');

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};
