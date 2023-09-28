import { StyleProvider } from '@ant-design/cssinjs';
import { useEventListener, useMemoizedFn, useTextSelection } from 'ahooks';
import cssText from 'data-text:~/contents/FloatBtn/index.css';
import type { PlasmoCSConfig } from 'plasmo';
import { useState } from 'react';
import { ThemeProvider } from '~theme';
import FloatBox from './FloatBox';
import LittleWindow from './LittleWindow';
import './index-base.css';

export const config: PlasmoCSConfig = {
  matches: ['https://*/*'],
};

export const HOST_ID = 'float-btn';
export const getShadowHostId = () => HOST_ID;

// Inject into the ShadowDOM
export const getStyle = () => {
  const style = document.createElement('style');
  style.textContent = cssText;
  return style;
};

const Floatbtn = () => {
  const [selectioning, setSelectioning] = useState(false);

  const [style, setStyle] = useState({ transform: 'translate(0, 0)' });

  const [show, setShow] = useState(false);
  const [showLittleWindow, setShowLittleWindow] = useState(false);

  const { text = '', left = 0, top = 0, height = 0, width = 0 } = useTextSelection();

  const memoizedFn = useMemoizedFn(onMouseUp);

  function onMouseUp(event) {
    if (text) {
      // 让浮动按钮选中的文字的下方, 且不会超出屏幕， useTextSelection能拿到选中文字的位置。
      // 但是如果选中的文字是在屏幕底部，那么浮动按钮会被遮挡，所以需要判断一下
      // 还要加上滚动条的高度
      const { innerHeight } = window;
      const { clientY } = event;
      const { scrollY } = window;
      if (innerHeight - clientY < 100) {
        setStyle({
          transform: `translate(${left + width / 2}px, ${top - 30 + scrollY}px) translate(-50%, 50%)`,
        });
      } else {
        setStyle({
          transform: `translate(${left + width / 2}px, ${top + height + 30 + scrollY}px) translate(-50%, -50%)`,
        });

        setSelectioning(true);
        setShow(true);
      }
    } else {
      setSelectioning(false);
      setShow(false);
    }
  }

  useEventListener('mouseup', memoizedFn);

  return (
    <ThemeProvider>
      <StyleProvider container={document.getElementById(HOST_ID).shadowRoot}>
        <div className="float-btn" style={style}>
          {show && <FloatBox setShowLittleWindow={setShowLittleWindow} />}
          {<LittleWindow text={text}></LittleWindow>}
        </div>
      </StyleProvider>
    </ThemeProvider>
  );
};

export default Floatbtn;
