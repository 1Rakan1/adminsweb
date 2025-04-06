// client/components/RoleManagement.js
import { useState, useEffect } from 'react';
import { Table, Select, Button, message } from 'antd';
import axios from 'axios';

const RoleManagement = ({ currentUserRole }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      message.error('فشل في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/api/users/${userId}/role`, { newRole });
      message.success('تم تحديث الرتبة بنجاح');
      fetchUsers();
    } catch (err) {
      message.error('فشل في تحديث الرتبة');
    }
  };

  const columns = [
    { title: 'اسم المستخدم', dataIndex: 'username', key: 'username' },
    { title: 'الاسم الكامل', dataIndex: 'fullName', key: 'fullName' },
    { title: 'الرتبة الحالية', dataIndex: 'role', key: 'role' },
    {
      title: 'تغيير الرتبة',
      key: 'action',
      render: (_, user) => (
        <Select
          defaultValue={user.role}
          style={{ width: 120 }}
          onChange={(value) => handleRoleChange(user._id, value)}
          disabled={currentUserRole !== 'leader' && user.role === 'assistant'}
        >
          <Select.Option value="user">مستخدم</Select.Option>
          <Select.Option value="admin">أدمن</Select.Option>
          {currentUserRole === 'leader' && (
            <Select.Option value="assistant">مساعد</Select.Option>
          )}
        </Select>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={users}
      rowKey="_id"
      loading={loading}
    />
  );
};

export default RoleManagement;
