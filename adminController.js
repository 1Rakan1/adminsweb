// server/controllers/adminController.js
exports.promoteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // التحقق من الصلاحيات
    if (req.user.role !== 'leader' && req.user.role !== 'assistant_leader') {
      return res.status(403).json({ error: 'ليس لديك الصلاحية لترقية المستخدمين' });
    }

    // التحقق من الأدوار المسموح بها
    const allowedRoles = ['user', 'admin', 'assistant'];
    if (req.user.role === 'leader') {
      allowedRoles.push('assistant_leader');
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'رتبة غير صالحة' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // إرسال إشعار للمستخدم
    await Notification.create({
      user: userId,
      title: 'تم تغيير رتبتك',
      message: `تم ترقيتك إلى رتبة ${role}`,
      relatedEntity: 'user'
    });

    res.json({ message: 'تم ترقية المستخدم بنجاح', user });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء ترقية المستخدم' });
  }
};
// server/controllers/adminController.js
exports.submitAdminApplication = async (req, res) => {
  try {
    const { name, age, programmingSkills, discordUsername, contactEmail } = req.body;
    
    const application = new AdminApplication({
      user: req.user._id,
      name,
      age,
      programmingSkills: programmingSkills.split(',').map(skill => skill.trim()),
      discordUsername,
      contactEmail
    });

    await application.save();

    // إرسال إشعار للقادة
    const leaders = await User.find({ 
      role: { $in: ['leader', 'assistant_leader'] } 
    });

    leaders.forEach(async leader => {
      await Notification.create({
        user: leader._id,
        title: 'طلب انضمام جديد للإدارة',
        message: `طلب جديد من ${req.user.username} للانضمام للإدارة`,
        relatedEntity: 'application',
        relatedId: application._id
      });
    });

    res.status(201).json({
      message: 'تم تقديم طلبك بنجاح',
      application
    });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء تقديم الطلب' });
  }
};

exports.processAdminApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, reviewNotes } = req.body;
    
    const application = await AdminApplication.findById(applicationId)
      .populate('user');

    if (!application) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    application.status = status;
    application.reviewedBy = req.user._id;
    application.reviewNotes = reviewNotes;
    await application.save();

    if (status === 'approved') {
      await User.findByIdAndUpdate(application.user._id, { role: 'admin' });
      
      await Notification.create({
        user: application.user._id,
        title: 'تم قبول طلبك للانضمام للإدارة',
        message: 'تهانينا! تمت ترقيتك إلى رتبة أدمن',
        relatedEntity: 'user'
      });
    } else {
      await Notification.create({
        user: application.user._id,
        title: 'تم رفض طلبك للانضمام للإدارة',
        message: reviewNotes || 'للأسف لم يتم قبول طلبك هذه المرة',
        relatedEntity: 'user'
      });
    }

    res.json({
      message: `تم ${status === 'approved' ? 'قبول' : 'رفض'} الطلب بنجاح`,
      application
    });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب' });
  }
};
