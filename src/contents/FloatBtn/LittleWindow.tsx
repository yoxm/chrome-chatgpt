import { CloseOutlined } from '@ant-design/icons';
import Button from 'antd/es/button/button';
import TextArea from 'antd/es/input/TextArea';
import Space from 'antd/es/space';
import { useEffect } from 'react';
const logo = chrome.runtime.getURL(`assets/icon.png`);

export default function littleWindow({ text }: { text: string }) {
  useEffect(() => {
    
  }, []);

  return (
    <div
      className="bg-white rounded border border-solid border-slate-500"
      style={{ padding: '12px 16px', width: '500px' }}>
      <div className="flex justify-between mb-5">
        <Space>
          <img src={logo} alt="logo" className="w-5 h-5 rounded-lg" />
          <h3 className="text-black">{'翻译'} </h3>
        </Space>
        <CloseOutlined />
      </div>

      <div className="flex flex-col ">
        <Space className="mb-5">
          <Button size="small">总结</Button>
          <Button size="small">翻译</Button>
          <Button size="small">重写</Button>
          <Button size="small">扩充</Button>
        </Space>

        <Space direction="vertical">
          <div className="p-4 border border-solid border-e6eaf2 text-base whitespace-pre-wrap relative flex flex-col gap-1 rounded-md">
            <div className="text-base font-medium color flex justify-between">
              <h2 className="header-text">Input</h2>
            </div>
            <TextArea rows={4} bordered={false} value={text} />
            <div className="input-footer"></div>
          </div>
          <div className="p-4 border border-solid border-e6eaf2 text-base whitespace-pre-wrap relative flex flex-col gap-1 rounded-md">
            <div className="text-base font-medium color flex justify-between">
              <h2 className="header-text">Output</h2>
            </div>
            <TextArea rows={4} bordered={false} />
            <div className="output-footer"></div>
          </div>
        </Space>
      </div>
    </div>
  );
}
