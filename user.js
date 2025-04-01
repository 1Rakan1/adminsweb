import { User } from './models/user.js';

// تقديم طلب للحصول على رتبة أدمن
export const requestAdminRole = async (userId, reason) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'admin' || user.role === 'superAdmin') {
      throw new Error('User is already an admin or super admin');
    }

    user.adminRequest = { reason, status: 'pending' };
    await user.save();
    return { message: 'Admin request submitted successfully', user };
  } catch (error) {
    throw new Error(error.message);
  }
};

// السوبر نوفا أدمن يطلع على جميع طلبات التحول إلى أدمن
export const getAdminRequests = async () => {
  try {
    const pendingRequests = await User.find({ 'adminRequest.status': 'pending' });
    return pendingRequests;
  } catch (error) {
    throw new Error('Error fetching admin requests');
  }
};

// قبول طلب تحويل المستخدم إلى أدمن
export const updateToAdmin = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'superAdmin') {
      throw new Error('Super Admin cannot be upgraded');
    }

    user.role = 'admin';  // تحويل المستخدم إلى أدمن
    user.adminRequest.status = 'approved';  // تحديث حالة الطلب إلى تم القبول
    await user.save();
    return { message: 'User role updated to admin', user };
  } catch (error) {
    throw new Error(error.message);
  }
};
