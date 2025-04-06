// server/controllers/userController.js
const User = require('../models/User');

exports.updateUserRole = async (req, res) => {
  try {
    // التحقق من صلاحية المستخدم
    if (!['assistant', 'leader'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بتنفيذ هذه العملية'
      });
    }

    // التحقق من الصلاحيات الممنوحة
    const allowedRoles = req.user.role === 'leader' 
      ? ['user', 'admin', 'assistant'] 
      : ['user', 'admin'];

    if (!allowedRoles.includes(req.body.newRole)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تعيين هذه الرتبة'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role: req.body.newRole },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الرتبة'
    });
  }
};
