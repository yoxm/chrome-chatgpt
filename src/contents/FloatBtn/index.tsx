import { StyleProvider } from '@ant-design/cssinjs';
import { useEventListener, useMemoizedFn, useTextSelection } from 'ahooks';
import Button from 'antd/es/button';
import type { MenuProps } from 'antd/es/menu/menu';
import cssText from 'data-text:~/contents/FloatBtn/index.css';
import type { PlasmoCSConfig } from 'plasmo';
import { useState } from 'react';
import { ThemeProvider } from '~theme';
import './index-base.css';

export const config: PlasmoCSConfig = {
  matches: ['https://*/*'],
};

const HOST_ID = 'float-btn';
export const getShadowHostId = () => HOST_ID;

// Inject into the ShadowDOM
export const getStyle = () => {
  const style = document.createElement('style');
  style.textContent = cssText;
  return style;
};

const items: MenuProps['items'] = [
  {
    label: 'Submit and continue',
    key: '1',
  },
];

const Floatbtn = () => {
  const [selectioning, setSelectioning] = useState(false);

  const [style, setStyle] = useState({ transform: 'translate(0, 0)' });

  const [show, setShow] = useState(false);

  const {
    text = '',
    left = 0,
    top = 0,
    height = 0,
    width = 0,
  } = useTextSelection();

  const memoizedFn = useMemoizedFn(onMouseUp);

  function onMouseUp(event) {
    if (text) {
      if (left && top) {
        setStyle({
          transform: `translate(${left + width / 2 - 30}px, ${top + 30}px)`,
        });
      }
      // if (top < window.innerHeight / 2) {
      //   shortcutIsTop = false;
      // } else {
      //   shortcutIsTop = true;
      // }
      setSelectioning(true);
      setShow(true);
    }
    // if (!text && show) {
    //   setShow(false);
    //   // showMenu = false;
    // }
  }
  useEventListener('mouseup', memoizedFn);

  const hide = () => {
    setShow(false);
  };

  return (
    <ThemeProvider>
      <StyleProvider container={document.getElementById(HOST_ID).shadowRoot}>
        <div className="float-btn" style={style}>
          {show && <Button type="primary">Click me</Button>}
        </div>
      </StyleProvider>
    </ThemeProvider>
  );
};

export default Floatbtn;
