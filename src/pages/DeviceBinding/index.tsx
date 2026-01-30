import React, { useState } from 'react';
import { message } from 'antd';

const DeviceBinding: React.FC = () => {
  const [department, setDepartment] = useState('');
  const [line, setLine] = useState('');
  const [isBound, setIsBound] = useState(false);

  const getMacAddress = async (): Promise<string | void> => {
    return await window.ipcRenderer.invoke('get-mac-address');
  };

  const handleBind = async () => {
    const mac = await getMacAddress();
    if (mac) {
      message.success(`获取到的MAC地址: ${mac}`);
      if (department && line) {
        setIsBound(true);
      } else {
        // alert('请选择部门和线体');
      }
    } else {
      message.error('获取MAC地址失败');
    }
  };

  return (
    <div className="device-binding-page">
      <div className="binding-form">
        <div className="form-row">
          <div className="form-group">
            <label><span className="required">*</span>部门</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">选择部门</option>
              <option value="dept1">生产部</option>
              <option value="dept2">质检部</option>
            </select>
          </div>
          <div className="form-group">
            <label>线体</label>
            <select value={line} onChange={(e) => setLine(e.target.value)}>
              <option value="">选择线体</option>
              <option value="line1">A线</option>
              <option value="line2">B线</option>
            </select>
          </div>
        </div>

        <div className="button-container">
          <button className="bind-btn" onClick={handleBind}>绑定</button>
        </div>

        {isBound && (
          <div className="success-message">
            <span className="success-icon">✔️</span>
            <span className="success-text">终端192.168.1.115绑定完成</span>
          </div>
        )}
      </div>

      <style>{`
        .device-binding-page {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 20px;
          box-sizing: border-box;
        }

        .binding-form {
          width: 80%;
          max-width: 800px;
        }

        .form-row {
          display: flex;
          justify-content: space-around;
          margin-bottom: 60px;
        }

        .form-group {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .form-group label {
          font-size: 20px;
          color: #d32f2f;
          font-weight: bold;
          min-width: 60px;
        }

        .required {
          margin-right: 4px;
        }

        .form-group select {
          width: 200px;
          padding: 10px;
          font-size: 18px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: white;
          color: #666;
        }

        .button-container {
          display: flex;
          justify-content: center;
          margin-bottom: 40px;
        }

        .bind-btn {
          background-color: #03a9f4;
          color: white;
          border: none;
          padding: 15px 60px;
          font-size: 24px;
          font-weight: bold;
          border-radius: 4px;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .bind-btn:active {
          transform: scale(0.98);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .success-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 20px;
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border-left: 5px solid #4caf50;
        }

        .success-icon {
          color: white;
          background: #4caf50;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .success-text {
          font-size: 22px;
          color: #2e7d32;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default DeviceBinding;
