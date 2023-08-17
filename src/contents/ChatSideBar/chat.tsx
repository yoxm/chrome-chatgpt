import { HistoryOutlined, LoadingOutlined, PlusOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { usePort } from '@plasmohq/messaging/hook';
import { useKeyPress, useThrottle } from 'ahooks';
import { Avatar, Button, Space, Spin, Tabs, type TabsProps } from 'antd/es';
import TextArea from 'antd/es/input/TextArea';
import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import mdKatex from 'markdown-it-katex';
import type { PlasmoCSConfig } from 'plasmo';
import { useEffect, useRef, useState } from 'react';
import { addMessage, type MessageItem } from '../../background/ports/fetch';
import { preWrapperPlugin } from './markdown';
import { uniqueID } from './util';

export const config: PlasmoCSConfig = {
  matches: ['<all_urls>'],
};

document.addEventListener('DOMContentLoaded', (event) => {});

function ChatItem({ role, content }: MessageItem) {
  const htmlString = () => {
    if (role === 'user') {
      return escapeHtml(content);
    }
    const md = MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      // highlight: function (str, lang) {
      //   try {
      //     const hasLang = hljs.getLanguage(lang);
      //     console.log(`Yoyo:  ~ file: chat.tsx:3d2 ~ htmlString ~ hasLang:`, hasLang);
      //     if (!hasLang) throw new Error('no lang');

      //     if (lang && hasLang) {
      //       return hljs.highlight(str, { language: lang }).value;
      //     }
      //   } catch (__) {
      //     if (str) {
      //       console.log(`Yoyo:  ~ file: chat.tsx:42 ~ htmlString ~ str:`, str);
      //       return hljs.highlightAuto(str);
      //     }
      //   }
      // },
    })
      .use(mdKatex)
      .use(preWrapperPlugin);

    if (typeof content === 'function') {
      return md.render((content as Function)().trim());
    } else if (typeof content === 'string') {
      return md.render(content.trim());
    }
    return '';
  };

  function escapeHtml(str: string) {
    var div = document.createElement('div');
    var text = document.createTextNode(str);
    div.appendChild(text);
    return div.innerHTML;
  }

  return (
    <div className="chat-item">
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div className="avatar" style={{ marginTop: '5px' }}>
          <Avatar size={26} icon={<UserOutlined />} />
        </div>
        <div className="content">
          <div dangerouslySetInnerHTML={{ __html: htmlString() }} className="message-text-content" />
        </div>
      </div>
    </div>
  );
}

function ChatContent({ updateChat }) {
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState('');
  const [curInput, setCurInput] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [generating, setGenerating] = useState(false);

  const [sessionId, setSessionId] = useState('');

  const inputRef = useRef(null);

  const fetchPort = usePort('fetch');

  useEffect(() => {
    setSessionId(sessionStorage.getItem('sessionId') || uniqueID());
    focusInput();
  }, []);

  useEffect(() => {
    const { disconnect } = fetchPort.listen((messageItem) => {
      return disconnect;
    });
  }, []);

  function focusInput() {
    const input = inputRef.current as any;
    input.focus();
  }

  const scrollToBottom = () => {
    // 让 message 类的元素滚动到底部
    const shadowRoot = document.getElementById('chat-sidebar').shadowRoot;
    const messageElements = shadowRoot.querySelectorAll('.chat-item');

    if (messageElements.length === 0) return;

    // 让 message 类的元素滚动到底部
    const messageContentElement = shadowRoot.querySelector('.message');
    messageContentElement.scrollTop = messageContentElement.scrollHeight;
  };

  useEffect(() => {
    if (!currentAssistantMessage) return;

    scrollToBottom();
  }, [currentAssistantMessage]);

  useEffect(() => {
    const { disconnect } = fetchPort.listen((messageItem) => {
      const { action, payload } = messageItem;
      if (action === 'start') {
        setGenerating(true);
        return;
      }

      if (action === 'end') {
        setCurrentAssistantMessage((lastPre) => {
          setMessages((pre) => [...pre, { role: 'assistant', content: lastPre }]);
          return '';
        });

        setGenerating(false);

        const shadowRoot = document.getElementById('chat-sidebar');

        shadowRoot.querySelectorAll('code').forEach((el) => {
          hljs.highlightElement(el as any);
        });

        return;
      }

      if (action === 'message') {
        const { message } = payload;
        setCurrentAssistantMessage((pre) => pre + message);

        scrollToBottom();
      }

      if (action === 'messageList') {
        const { messageRes } = payload;
        setMessages(messageRes);

        inputRef.current.focus();

        scrollToBottom();
      }

      return disconnect;
    });
  }, []);

  useEffect(() => {
    if (generating) return;

    fetchPort.send({
      apiName: 'addMessage',
      params: {
        session_id: sessionId,
        content: messages[messages.length - 1]?.content,
        role: 'assistant',
        model: 'gpt-3.5-turbo',
      },
    });
  }, [generating]);

  function newSession() {
    setMessages([]);
    setCurrentAssistantMessage('');
    sessionStorage.setItem('messageList', JSON.stringify([]));

    const session = uniqueID();
    setSessionId(session);
    sessionStorage.setItem('sessionId', session);

    focusInput();
  }

  async function sendMessage() {
    if (curInput === '') return;
    if (generating) return;

    const messages: MessageItem[] = [
      {
        role: 'user',
        content: curInput,
      },
    ];

    let filterMessages = messages.filter((item) => {
      return item.content !== 'TypeError: Failed to fetch' && item.content !== 'Error';
    });
    // 如果messages的数量超过6条，取最后的6条
    if (filterMessages.length > 10) {
      filterMessages = filterMessages.slice(filterMessages.length - 10, filterMessages.length);
    }

    fetchPort.send({
      apiName: 'getMessages',
      params: { messages: filterMessages },
    });

    setMessages((pre) => [...pre, ...messages]);

    fetchPort.send({
      apiName: 'addMessage',
      params: { session_id: sessionId, content: curInput, role: 'user', model: 'gpt-3.5-turbo' },
    });

    setCurInput('');
  }

  useKeyPress(['meta.enter'], () => {
    sendMessage();
  });

  function showHistory() {
    updateChat({
      action: 'open-history',
      payload: {},
    });
  }

  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  return (
    <div className="chat-content">
      <div className="message">
        {messages.map((item, index) => (
          <ChatItem key={index} {...item} />
        ))}
        {currentAssistantMessage !== '' && <ChatItem role="assistant" content={currentAssistantMessage} />}
      </div>
      <div className="action">
        <div className="toolbar">
          <Space>
            <Button size="small" icon={<PlusOutlined />} type="primary" onClick={newSession}>
              新会话
            </Button>
            <Button size="small" icon={<HistoryOutlined />} type="default" onClick={showHistory}>
              会话历史
            </Button>
          </Space>
        </div>
        <div className="input">
          {generating && (
            <div className="input-overlay">
              <Spin indicator={antIcon} />
              正在思考
              <Button
                type="default"
                size="small"
                style={{ marginLeft: '5px' }}
                onClick={() => {
                  fetchPort.send({
                    apiName: 'cancel',
                    params: {},
                  });
                }}>
                不用了
              </Button>
            </div>
          )}

          <TextArea
            bordered={false}
            style={{ height: '100px', resize: 'none' }}
            placeholder="请输入你想要的"
            autoSize={{ minRows: 3, maxRows: 3 }}
            value={curInput}
            ref={inputRef}
            onChange={(e) => {
              setCurInput(e.target.value);
            }}
          />

          <Button
            icon={<SendOutlined />}
            type="ghost"
            shape="circle"
            size="small"
            className="btn"
            onClick={sendMessage}
          />
        </div>
      </div>
    </div>
  );
}

function Chat({ updateChat }) {
  const tabItems = [
    {
      key: '1',
      label: '聊天',
      children: <ChatContent updateChat={updateChat} />,
    },
  ];

  const renderTabBar: TabsProps['renderTabBar'] = (props, DefaultTabBar) => (
    <DefaultTabBar {...props} style={{ padding: '0 20px' }} />
  );

  return (
    <div className="chat-cm">
      <Tabs defaultActiveKey="1" items={tabItems} renderTabBar={renderTabBar} />
    </div>
  );
}

export default Chat;
