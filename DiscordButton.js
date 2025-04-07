import React from 'react';
import { Button } from 'antd';
import { DiscordOutlined } from '@ant-design/icons';

const DiscordButton = () => (
  <Button 
    type="primary" 
    icon={<DiscordOutlined />}
    onClick={() => window.open('https://discord.gg/dXQcWv49JZ', '_blank')}
    style={{ 
      margin: '10px',
      backgroundColor: '#5865F2',
      borderColor: '#5865F2'
    }}
  >
    انضم لقناة الديسكورد الصوتية
  </Button>
);

export default DiscordButton;
