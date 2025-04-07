import React, { useState, useEffect } from 'react';
import { Table, Select, Button, message } from 'antd';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const UserManagement = ({ currentUser }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/users');
      setUsers(res.data.data.users);
    } catch (err) {
      message.error(t('user.fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(`/api/users/${userId}/promote`, { newRole });
      message.success(t('user.promote_success'));
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || t('user.promote_error'));
    }
  };

  const columns = [
    {
      title: t('user.username'),
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: t('user.current_role'),
      dataIndex: 'role',
      key: 'role',
      render: (role) => t(`roles.${role}`)
    },
    {
      title: t('user.actions'),
      key: 'actions',
      render: (_, user) => (
        <Select
          defaultValue={user.role}
          style={{ width: 120 }}
          onChange={(value) => handleRoleChange(user._id, value)}
          disabled={
            // لا يمكن تعديل رتبة القائد أو تعديل رتبة مستخدم آخر بنفس الرتبة
            user.role === 'leader' || 
            (currentUser.role === 'assistant' && user.role === 'assistant')
          }
        >
          <Select.Option value="user">{t('roles.user')}</Select.Option>
          <Select.Option value="admin">{t('roles.admin')}</Select.Option>
          {currentUser.role === 'leader' && (
            <>
              <Select.Option value="assistant">{t('roles.assistant')}</Select.Option>
              <Select.Option value="leader">{t('roles.leader')}</Select.Option>
            </>
          )}
        </Select>
      )
    }
  ];

  return (
    <div className="user-management">
      <h2>{t('user.management_title')}</h2>
      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="_id"
        loading={loading}
      />
    </div>
  );
};

export default UserManagement;
