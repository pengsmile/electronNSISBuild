import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path?: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    { id: '1', title: '设备绑定', icon: '🔗', path: '/device-binding' },
    { id: '2', title: '开线点检', icon: '📋' },
    { id: '3', title: '员工打卡', icon: '👤' },
    { id: '4', title: '开工', icon: '🚀' },
    { id: '5', title: 'E-SOP', icon: '📖' },
    { id: '6', title: '暂停/恢复', icon: '⏯️' },
    { id: '7', title: '报工', icon: '📊' },
    { id: '8', title: '打印标签', icon: '🏷️' },
    { id: '9', title: '安灯呼叫', icon: '🔔' },
    { id: '10', title: '维修确认', icon: '🛠️' },
  ];

  const handleMenuClick = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className="home-page">
      <div className="menu-grid">
        {menuItems.map((item) => (
          <div key={item.id} className="menu-card" onClick={() => handleMenuClick(item)}>
            <div className="menu-icon-wrapper">
              <span className="menu-icon">{item.icon}</span>
            </div>
            <div className="menu-title">{item.title}</div>
          </div>
        ))}
      </div>

      <style>{`
        .home-page {
          min-height: 100%;
          padding: 40px;
          box-sizing: border-box;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .menu-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 30px;
          max-width: 1200px;
          width: 100%;
        }

        .menu-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          aspect-ratio: 1 / 1;
        }

        .menu-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .menu-card:active {
          transform: translateY(2px) scale(0.98);
          background-color: #f0f0f0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.1s;
        }

        .menu-icon-wrapper {
          width: 80px;
          height: 80px;
          background: #e3f2fd;
          border-radius: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 15px;
        }

        .menu-icon {
          font-size: 40px;
        }

        .menu-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default Home;
