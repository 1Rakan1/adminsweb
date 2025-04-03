// server/controllers/notificationController.js
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      user: req.user._id,
      isRead: false 
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الإشعارات' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    res.json({ message: 'تم تحديث حالة الإشعار' });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث الإشعار' });
  }
};

async function createNotificationForAdmins(ticket) {
  const admins = await User.find({ 
    role: { $in: ['admin', 'assistant', 'assistant_leader', 'leader'] } 
  });

  admins.forEach(async admin => {
    await Notification.create({
      user: admin._id,
      title: 'تذكرة جديدة تحتاج مراجعة',
      message: `تم إنشاء تذكرة جديدة: ${ticket.title}`,
      relatedEntity: 'ticket',
      relatedId: ticket._id
    });
  });
}
