// server/controllers/issueController.js
const Issue = require('../models/Issue');

exports.createIssue = async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'مستوى الأولوية غير صحيح'
      });
    }

    const issue = await Issue.create({
      title,
      description,
      priority,
      userId: req.user.id,
      status: 'open'
    });

    res.status(201).json({
      success: true,
      data: issue
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المشكلة'
    });
  }
};
