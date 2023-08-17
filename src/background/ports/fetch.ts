import type { PlasmoMessaging } from '@plasmohq/messaging';

import { Storage } from '@plasmohq/storage';

console.log('port start success');

const BASE_URL = 'https://chat-proxy.cutterman.cn/api';
const TokenStorage = new Storage();

const accessToken = '216521|dnfwmQGc1u386SX6BkGxbQyylumRyDexKhyLS6aC';

export interface MessageItem {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
let abortController;

// @ts-ignore
async function* makeTextFileLineIterator(url, params) {
  const utf8Decoder = new TextDecoder('utf-8');

  if (accessToken === null) throw new Error('没有权限');

  const { messages } = params;

  const response = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${accessToken}`,
    },
    body: JSON.stringify({
      messages: messages,
      key: '',
      temperature: 0.6,
    }),
    mode: 'cors',
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const data = response.body;
  if (!data) {
    throw new Error('没有返回数据');
  }

  const reader = response.body.getReader();
  let { value: chunk, done: readerDone } = await reader.read();
  // @ts-ignore
  chunk = chunk ? utf8Decoder.decode(chunk, { stream: true }) : '';

  let re = /\r\n|\n|\r/gm;
  let startIndex = 0;

  for (;;) {
    // @ts-ignore
    let result = re.exec(chunk);
    if (!result) {
      if (readerDone) {
        break;
      }
      // @ts-ignore
      let remainder = chunk.substr(startIndex);
      ({ value: chunk, done: readerDone } = await reader.read());
      // @ts-ignore
      chunk = remainder + (chunk ? utf8Decoder.decode(chunk, { stream: true }) : '');
      startIndex = re.lastIndex = 0;
      continue;
    }
    // @ts-ignore
    yield chunk.substring(startIndex, result.index);
    startIndex = re.lastIndex;
  }
  if (startIndex < chunk.length) {
    // last line didn't end in a newline char
    // @ts-ignore
    yield chunk.substr(startIndex);
  }
}

async function fetchData(messages: MessageItem[]) {
  // 过滤掉content是TypeError: Failed to fetch的消息
  messages = messages.filter((item) => {
    return item.content !== 'TypeError: Failed to fetch' && item.content !== 'Error';
  });
  // 如果messages的数量超过6条，取最后的6条
  if (messages.length > 10) {
    messages = messages.slice(messages.length - 10, messages.length);
  }
  const accessToken = 'u81Xt2v0IK0nCd1xCmLILflExKRU5Y';
  if (accessToken === null) {
    throw new Error('没有权限');
  }
  //const url: string = "https://chat1.cutterman.cn/api/stream3";
  const url: string = 'https://chat-proxy.cutterman.cn/api/stream2';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `${accessToken}`,
    },
    body: JSON.stringify({
      messages: messages,
      key: '',
      temperature: 0.6,
    }),
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const data = response.body;
  if (!data) {
    throw new Error('没有返回数据');
  }

  const reader = data.getReader();
  const decoder = new TextDecoder('utf-8');
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    if (value) {
      let char = decoder.decode(value);
      if (char === '\n') {
        continue;
      }
      if (char) {
      }
    }
    done = readerDone;
  }
}

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  const { body } = req;
  const { apiName, params } = body;
  console.log(`Yoyo:  ~ file: fetch.ts:133 ~ consthandler:PlasmoMessaging.PortHandler= ~ apiName:`, apiName, params);
  if (!apiName) return;

  switch (apiName) {
    case 'getMessages':
      let { messages } = params;
      // 过滤掉content是TypeError: Failed to fetch的消息
      messages = messages.filter((item) => {
        return item.content !== 'TypeError: Failed to fetch' && item.content !== 'Error';
      });
      // 如果messages的数量超过6条，取最后的6条
      if (messages.length > 10) {
        messages = messages.slice(messages.length - 10, messages.length);
      }
      if (accessToken === null) {
        throw new Error('没有权限');
      }

      res.send({ action: 'start' });

      abortController = new AbortController();
      const signal = abortController.signal;
      //const url: string = "https://chat1.cutterman.cn/api/stream3";
      const url: string = 'https://chat-proxy.cutterman.cn/api/stream2';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `${accessToken}`,
        },
        body: JSON.stringify({
          messages: messages,
          key: '',
          temperature: 0.6,
        }),
        signal,
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = response.body;
      if (!data) {
        throw new Error('没有返回数据');
      }

      const reader = data.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (value) {
          let char = decoder.decode(value);
          if (char === '\n') {
            continue;
          }
          if (char) {
            res.send({
              action: 'message',
              payload: {
                message: char,
                role: 'assistant',
              },
            });
          }
        }
        done = readerDone;
      }
      res.send({ action: 'end' });

      if (!TokenStorage.getItem('access_token')) {
        TokenStorage.set('access_token', response.headers.get('Authorization'));
      }

      break;

    case 'cancel':
      if (abortController) abortController.abort();
      res.send({ action: 'end' });
      break;

    case 'addMessage':
      const addMessageRes = await addMessage(params);

      break;
    case 'getHistory':
      const { page = 1 } = params;
      const messageListRes = await sessionHistory(page);
      const { list = [] } = messageListRes;

      res.send({
        action: 'history',
        payload: { list },
      });

      break;
    case 'deleteHistory':
      const { session_id } = params;
      await deleteSession(session_id);

      res.send({
        action: 'deleteHistorySuccess',
        payload: { session_id },
      });
      break;
    case 'getMessageList':
      const { sessionId } = params;
      const messageRes = await messageList(sessionId);

      res.send({
        action: 'messageList',
        payload: { messageRes: messageRes.list },
      });
      break;
  }
};

export interface MessageItem {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface HistoryItem {
  created_at: string;
  content: string;
  session_id: string;
}

export interface PromptItem {
  desc: string;
  type?: 'text' | 'image';
  prompt: string;
}

export interface User {
  phone: string;
  name: string;
  avatar: string;
  vip: number;
  subscript_end?: string;
}

export interface Response {
  errno: number;
  info: string;
}
export interface LoginInfo extends Response {
  access_token: string;
  is_wechat_bind: number;
}

export interface MessageListInfo extends Response {
  list: MessageItem[];
}

const host: string = 'https://api.cutterman.cn';

export interface Response {
  errno: number;
  info: string;
}
export interface LoginInfo extends Response {
  access_token: string;
  is_wechat_bind: number;
}

export interface AliPayInfo extends Response {
  html: string;
  order_id: string;
}

export interface WechatPrePay {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
  prepay_id: string;
  order_id: string;
}

export interface WechatPayInfo extends Response {
  result: WechatPrePay;
}

export interface OrderStatusInfo extends Response {
  order: {
    trade_status: number;
    order_id: string;
  };
}

export interface HistoryInfo extends Response {
  list: {
    current_page: number;
    data: HistoryItem[];
    next_page_url: string | null;
    prev_page_url: string | null;
  };
}

export interface SubscriptionInfo extends Response {
  subscription?: {
    app: string;
    subscribe_end: string;
    subscribe_start: string;
    type: number;
  };
}

export interface OrderInfo extends Response {
  data: {
    order_id: string;
    price: number;
    name: string;
  };
}

export interface QRCodeInfo extends Response {
  qrcodeUrl: string;
  sessionId: number;
}

export interface MessageListInfo extends Response {
  list: MessageItem[];
}

async function request(action: string, params: any) {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (accessToken) {
    // @ts-ignore
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const response = await fetch(host + action, {
    method: 'POST',
    headers: headers,
    body: Object.keys(params)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&'),
  });
  if (response.headers.get('content-type')?.includes('application/json')) {
    return response.json();
  }
  return await response.text();
}

/**
 * 获取用户信息
 */
export async function getUserInfo(): Promise<User> {
  return await request('/chat/user-info', {});
}

/**
 * 发送短信验证码
 */
export async function sendSMS(phone: string): Promise<Response> {
  const params = {
    phone: phone,
  };
  return await request('/api/send-sms', params);
}

/**
 * 登录
 */
export async function login(phone: string, code: string): Promise<LoginInfo> {
  const params = {
    phone: phone,
    code: code,
  };
  const res = await request('/api/login-sms', params);
  if (res.errno === 0) {
    localStorage.setItem('access_token', res.access_token);
  }
  return res;
}

export async function logout(): Promise<Response> {
  const r = await request('/api/logout', {});
  if (r.errno === 0) {
    localStorage.removeItem('access_token');
  }
  return r;
}

export async function alipay(order_id: string): Promise<string> {
  return await request('/api/new-trade', { order_id, access_token: localStorage.getItem('access_token') });
}

export async function wechatPay(open_id: string, type: number): Promise<WechatPayInfo> {
  return await request('/chat/wechat-pay', { open_id: open_id, type: type });
}

export async function orderStatus(orderId: string): Promise<OrderStatusInfo> {
  return await request('/api/order-info', { order_id: orderId });
}

export async function addMessage(params: {
  sessionId: string;
  content: string;
  role: string;
  model: string;
}): Promise<Response> {
  return await request('/chat/add-message', params);
}

export async function sessionHistory(page: number): Promise<HistoryInfo> {
  return await request('/chat/session-list?page=' + page, {});
}

export async function deleteSession(sessionId: string) {
  return await request('/chat/delete-session', { session_id: sessionId });
}

export async function messageList(sessionId: string): Promise<MessageListInfo> {
  return await request('/chat/message-list', { session_id: sessionId });
}

export async function subscription(): Promise<SubscriptionInfo> {
  return await request('/chat/subscription', {});
}

export async function newOrder(sku_id: number): Promise<OrderInfo> {
  return await request('/api/new-order', { sku_id });
}

export async function getWechatQRCode(): Promise<QRCodeInfo> {
  return await request('/api/get-wechat-qrcode', { sessionId: 0 });
}

export async function getQrCodeStatus(sessionId: number): Promise<LoginInfo> {
  const res = await request('/api/login-qrcode-status', { sessionId: sessionId });
  if (res.errno === 0) {
    localStorage.setItem('access_token', res.access_token);
  }
  return res;
}

export async function bindWechat(sessionId: number): Promise<Response> {
  return await request('/api/bind-wechat', { sessionId: sessionId });
}

export async function bindPhone(phone: string, code: string): Promise<Response> {
  return await request('/api/bind-phone', { phone, code });
}

export {};

export default handler;
