// client/src/components/TicketForm.js
import { useState } from 'react';
import axios from 'axios';

const TicketForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'technical',
    priority: 'medium'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/tickets', formData);
      alert(`تم إنشاء التذكرة بنجاح! رقم التذكرة: ${res.data.ticket.ticketId}`);
      onClose();
    } catch (error) {
      alert('حدث خطأ أثناء إنشاء التذكرة');
    }
  };

  return (
    <div className="ticket-form">
      <h3>تقديم مشكلة جديدة</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>عنوان المشكلة</label>
          <input 
            type="text" 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>وصف المشكلة</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>نوع التذكرة</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          >
            <option value="technical">مشكلة فنية</option>
            <option value="admin_request">طلب إداري</option>
          </select>
        </div>

        <div className="form-group">
          <label>الأولوية</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({...formData, priority: e.target.value})}
          >
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
          </select>
        </div>

        <button type="submit">تقديم</button>
        <button type="button" onClick={onClose}>إلغاء</button>
      </form>
    </div>
  );
};
