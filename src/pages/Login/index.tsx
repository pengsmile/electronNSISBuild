import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '123456') {
      navigate('/home');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>一体机登录</h2>
        <form onSubmit={handleLogin}>
          <div className="form-item">
            <input 
              type="text" 
              placeholder="账号" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-item">
            <input 
              type="password" 
              placeholder="密码" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="login-btn">登 录</button>
        </form>
      </div>

      <style>{`
        .login-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100%;
        }
        .login-card {
          background: #f8f8f8;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,.3);
          width: 320px;
        }
        .form-item {
          margin-bottom: 20px;
        }
        input {
          width: 100%;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #f7f7f7;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus {
          border-color: #646cff;
        }
        .login-btn {
          width: 100%;
          padding: 12px;
          background: #646cff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        }
        .login-btn:hover {
          background: #535bf2;
        }
      `}</style>
    </div>
  );
};

export default Login;
