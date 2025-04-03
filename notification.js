const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  relatedEntity: { type: String, enum: ['ticket', 'user', 'application'] },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now }
});
