const logo = chrome.runtime.getURL(`assets/icon.png`);

import { SettingOutlined, CloseOutlined, LogoutOutlined } from '@ant-design/icons';

export type HeaderAction = 'close' | 'logout' | 'setting';

export interface UpdateParams<T = any> {
  action: T;
  payload?: Record<string, any>;
}
export interface HeaderProps {
  update: (params: UpdateParams) => any;
}

function HeaderLeft() {
  return (
    <div className="header__left">
      <a className="logo-wrapper" target="_blank" rel="noreferrer">
        <img src={logo} className="logo logo-img" style={{ width: '22px', height: '22px', borderRadius: '4px' }}></img>
      </a>
      <span className="title">ChatMan</span>
    </div>
  );
}

function HeaderRight(props: HeaderProps) {
  return (
    <div className="header__right">
      <div className="header__right__item" onClick={() => props.update({ action: 'setting' })}>
        <SettingOutlined />
      </div>
      <div className="header__right__item" onClick={() => props.update({ action: 'logout' })}>
        <LogoutOutlined />
      </div>
      <div className="header__right__item" onClick={() => props.update({ action: 'close' })}>
        <CloseOutlined />
      </div>
    </div>
  );
}

function HeaderCenter() {
  return <div className="header__center"></div>;
}

function Header(props: HeaderProps) {
  const update = props.update;
  return (
    <div className="header">
      <HeaderLeft />
      <HeaderCenter />
      <HeaderRight update={update} />
    </div>
  );
}

export default Header;
