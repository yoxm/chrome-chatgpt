import { CloseOutlined, MoreOutlined } from '@ant-design/icons';
import Button from 'antd/es/button/button';
import Popover from 'antd/es/popover';
import Space from 'antd/es/space';
import { useState } from 'react';
const logo = chrome.runtime.getURL(`assets/icon.png`);

export default function FloatBox({ setShowLittleWindow }) {
  return (
    <div id="float-box">
      <div
        className="content"
        style={{
          height: '32px',
          background: '#FFFFFF',
          borderRadius: '8px',
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
        }}>
        <Space align="center">
          <img src={logo} alt="logo" style={{ width: '20px', height: '20px', borderRadius: '8px' }} />
          <Button type="text" size="small" onClick={() => setShowLittleWindow(true)}>
            翻译
          </Button>
          <Button size="small" type="text">
            总结
          </Button>
          <Popover content={'232'} title="Title" getPopupContainer={() => document.getElementById('float-box')}>
            <Button type="text" size="small" icon={<MoreOutlined />}></Button>
          </Popover>
          <Button type="text" size="small" icon={<CloseOutlined />}></Button>
        </Space>
      </div>
    </div>
  );
}

export function PopoverContent() {
  return <span>content</span>;
}
