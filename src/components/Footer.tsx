import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();

  // 不在登录页和首页显示导航按钮
  const showNavButtons = location.pathname !== '/login' && location.pathname !== '/home';

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekDay = weekDays[date.getDay()];

    return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds} ${weekDay}`;
  };

  return (
    <div className="footer-container">
      {showNavButtons && (
        <div className="nav-buttons">
          <button className="nav-btn back-btn" onClick={() => navigate(-1)}>
            <span className="nav-icon">↩️</span> 返回上一步
          </button>
          <button className="nav-btn home-btn" onClick={() => navigate('/home')}>
            <span className="nav-icon">🏠</span> 返回首页
          </button>
        </div>
      )}
      <footer className="app-footer">
        <div className="footer-left">
          <span className="footer-clock-icon">🕒</span>
          <span className="footer-time">{formatDate(time)}</span>
        </div>
        <div className="footer-right">
          <span className="footer-company">苏州希思碧电子有限公司</span>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
