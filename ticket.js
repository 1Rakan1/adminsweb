const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['technical', 'admin_request'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], required: true },
  status: { 
    type: String, 
    enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed'], 
    default: 'open' 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now }
});
