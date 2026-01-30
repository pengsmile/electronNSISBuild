import React from 'react';
import { useLocation } from 'react-router-dom';
import { getTitleByPath } from '../router';
import './TitleBar.css';

const TitleBar: React.FC = () => {
  const location = useLocation();

  // 直接从路由配置中获取标题
  const currentTitle = getTitleByPath(location.pathname);

  const handleMinimize = () => {
    window.electron.minimize();
  };

  const handleMaximize = () => {
    window.electron.maximize();
  };

  const handleClose = () => {
    window.electron.close();
  };

  return (
    <div className="title-bar">
      <div className="title-bar-left">
        <img src="/logo.png" alt="logo" className="title-bar-logo" />
      </div>
      
      <div className="title-bar-center">
        <span className="title-bar-title">{currentTitle}</span>
      </div>

      <div className="title-bar-right">
        <div className="title-bar-controls">
          <button className="control-button minimize" onClick={handleMinimize} title="Minimize">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect fill="currentColor" width="10" height="1" x="1" y="6" />
            </svg>
          </button>
          <button className="control-button maximize" onClick={handleMaximize} title="Maximize">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect fill="none" stroke="currentColor" strokeWidth="1" width="9" height="9" x="1.5" y="1.5" />
            </svg>
          </button>
          <button className="control-button close" onClick={handleClose} title="Close">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path fill="currentColor" d="M10.5 1.5l-9 9m0-9l9 9" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
