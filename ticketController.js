exports.createTicket = async (req, res) => {
  try {
    const { title, description, type, priority } = req.body;
    
    const ticket = new Ticket({
      title,
      description,
      type,
      priority,
      createdBy: req.user._id
    });

    await ticket.save();

    // إنشاء محادثة جديدة
    const chat = new Chat({
      ticket: ticket._id,
      participants: [req.user._id]
    });

    await chat.save();

    // إرسال إشعار للمسؤولين
    await createNotificationForAdmins(ticket);

    res.status(201).json({
      message: 'تم إنشاء التذكرة بنجاح',
      ticket,
      chatId: chat._id
    });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء التذكرة' });
  }
};
// server/controllers/ticketController.js
exports.assignTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: 'التذكرة غير موجودة' });

    ticket.assignedTo = req.user._id;
    ticket.status = 'assigned';
    await ticket.save();

    // إضافة المسؤول إلى المحادثة
    await Chat.updateOne(
      { ticket: ticketId },
      { $addToSet: { participants: req.user._id } }
    );

    // إرسال إشعار للمستخدم
    await Notification.create({
      user: ticket.createdBy,
      title: 'تم تعيين مسؤول لتذكرتك',
      message: `تم تعيين مسؤول لتذكرتك "${ticket.title}"`,
      relatedEntity: 'ticket',
      relatedId: ticket._id
    });

    res.json({ message: 'تم تعيين التذكرة لك بنجاح', ticket });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء تعيين التذكرة' });
  }
};
// server/controllers/ticketController.js
exports.rateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { rating, feedback } = req.body;
    
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: 'التذكرة غير موجودة' });

    ticket.rating = rating;
    ticket.feedback = feedback;
    ticket.status = 'closed';
    await ticket.save();

    // تحديث تقييم المسؤول
    await updateUserRating(ticket.assignedTo, rating);

    res.json({ message: 'تم تقييم التذكرة بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء تقييم التذكرة' });
  }
};

async function updateUserRating(userId, newRating) {
  const user = await User.findById(userId);
  const totalTickets = await Ticket.countDocuments({ assignedTo: userId });
  
  // حساب التقييم الجديد كمتوسط
  user.rating = ((user.rating * (totalTickets - 1)) + newRating) / totalTickets;
  await user.save();
}
