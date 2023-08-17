import cssText from 'data-text:~/contents/ChatSideBar/index.less';
import type { PlasmoCSConfig } from 'plasmo';
import { useEffect, useState } from 'react';

// Inject to the webpage itself
import { StyleProvider } from '@ant-design/cssinjs';
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePort } from '@plasmohq/messaging/hook';
import { useKeyPress } from 'ahooks';
import Avatar from 'antd/es/avatar';
import Button from 'antd/es/button';
import Divider from 'antd/es/divider';
import List from 'antd/es/list';
import Skeleton from 'antd/es/skeleton';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ThemeProvider } from '~theme';
import Chat from './chat';
import Header, { type UpdateParams } from './header';
import './index-base.css';
import message from 'antd/es/message';

const logo = chrome.runtime.getURL(`assets/icon.png`);

export type ChatAction = 'open-history';

export const config: PlasmoCSConfig = {
  matches: ['<all_urls>'],
};

// Inject into the ShadowDOM
export const getStyle = () => {
  const style = document.createElement('style');
  style.textContent = cssText;
  return style;
};

export const HOST_ID = 'chat-sidebar';
export const getShadowHostId = () => HOST_ID;

const ChatSideBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hover, setHover] = useState(false);

  function onHeaderUpdate(params: UpdateParams) {
    const { action, payload = {} } = params;
    switch (action) {
      case 'close':
        setIsOpen(false);
        break;
    }
  }

  useEffect(() => {
    document.body.classList.toggle('chat-sidebar-show', isOpen);
  }, [isOpen]);

  const fetchPort = usePort('fetch');

  useKeyPress('esc', () => {
    setIsOpen(false);
  });
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historys, setHistorys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreData = () => {
    if (loading) return;

    setLoading(true);

    setHistoryPage(historyPage + 1);
  };

  useEffect(() => {
    if (!historyPage) return;

    fetchPort.send({
      apiName: 'getHistory',
      params: { page: historyPage },
    });
  }, [historyPage]);

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const { disconnect } = fetchPort.listen((messageItem) => {
      const { action, payload } = messageItem;
      switch (action) {
        case 'history':
          setHistorys([...historys, ...payload.list.data]);
          setHasMore(payload.list.next_page_url ? true : false);
          setLoading(false);
          break;
        case 'deleteHistorySuccess':
          messageApi.open({
            type: 'success',
            content: '删除成功',
          });
          fetchPort.send({
            apiName: 'getHistory',
            params: { page: historyPage },
          });
          break;
        case 'messageList':
          setHistoryVisible(false);
          break;
      }

      return disconnect;
    });
  }, []);

  function getMessageList(sessionId) {
    fetchPort.send({
      apiName: 'getMessageList',
      params: { sessionId },
    });
  }

  function handleChatUpdate(params: UpdateParams<ChatAction>) {
    const { action, payload = {} } = params;
    switch (action) {
      case 'open-history':
        setHistoryVisible(true);
        loadMoreData();

        break;
    }
  }

  function deleteHistory(session_id) {
    fetchPort.send({
      apiName: 'deleteHistory',
      params: { session_id },
    });
  }

  function closeDrawer() {
    setHistoryVisible(false);
    setHistoryPage(0);
  }

  return (
    <>
      {contextHolder}
      <ThemeProvider>
        <StyleProvider container={document.getElementById(HOST_ID).shadowRoot}>
          <div id="sidebar" className={isOpen ? 'open' : 'close'}>
            <div
              className={`sidebar-entry-btn sidebar-entry-btn-right ${hover ? 'sidebar-entry-btn-hovered' : ''}`}
              style={{ bottom: '100px', display: 'flex' }}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={() => setIsOpen(!isOpen)}>
              <img src={logo} className="logo-img" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
              <span className="shortcut">⌘K</span>
            </div>
            <div className={`sidebar-content }`}>
              <Header update={onHeaderUpdate} />
              <Chat updateChat={handleChatUpdate} />

              <div className={`drawer ${historyVisible ? 'show' : ''}`} style={{ height: '80%', maxHeight: '680px' }}>
                <div className="drawer-header">
                  <div className="drawer-title">会话历史记录</div>
                  <CloseOutlined className="drawer-close" onClick={closeDrawer} />
                </div>
                <div className="drawer-body">
                  <div className="conv-history-drawer">
                    <div className="conv-list">
                      <div>
                        <div
                          className="conv-item-wrapper"
                          id="scrollableDiv"
                          style={{
                            overflow: 'auto',
                            padding: '0 16px',
                            height: '600px',
                          }}>
                          <InfiniteScroll
                            dataLength={historys.length}
                            next={loadMoreData}
                            hasMore={hasMore}
                            loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
                            endMessage={<Divider plain>It is all, nothing more 🤐</Divider>}
                            scrollableTarget="scrollableDiv">
                            <List
                              dataSource={historys}
                              renderItem={(item, index) => (
                                <List.Item onClick={() => getMessageList(item.session_id)}>
                                  <Avatar src={`https://xsgames.co/randomusers/avatar.php?g=pixel&key=${index}`} />
                                  <div style={{ width: '70%' }}>{item.content}</div>

                                  <Button
                                    icon={<DeleteOutlined />}
                                    type="text"
                                    onClick={() => deleteHistory(item.session_id)}></Button>
                                </List.Item>
                              )}
                            />
                          </InfiniteScroll>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {historyVisible && (
                <div className="drawer-mask">
                  <div className="drawer-close-area"></div>
                </div>
              )}
            </div>
          </div>
        </StyleProvider>
      </ThemeProvider>
    </>
  );
};

export default ChatSideBar;
