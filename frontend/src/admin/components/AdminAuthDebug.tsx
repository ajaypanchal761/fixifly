import React from 'react';

const AdminAuthDebug: React.FC = () => {
  const adminToken = localStorage.getItem('adminToken');
  const adminRefreshToken = localStorage.getItem('adminRefreshToken');
  const adminData = localStorage.getItem('adminData');

  const clearAuthData = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminData');
    window.location.reload();
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Admin Auth Debug</h4>
      <div>
        <strong>Token:</strong> {adminToken ? `${adminToken.substring(0, 20)}...` : 'None'}
      </div>
      <div>
        <strong>Refresh Token:</strong> {adminRefreshToken ? `${adminRefreshToken.substring(0, 20)}...` : 'None'}
      </div>
      <div>
        <strong>Admin Data:</strong> {adminData ? 'Present' : 'None'}
      </div>
      {adminData && (
        <div>
          <strong>Parsed Data:</strong>
          <pre style={{ fontSize: '10px', margin: '5px 0' }}>
            {JSON.stringify(JSON.parse(adminData), null, 2)}
          </pre>
        </div>
      )}
      <button 
        onClick={clearAuthData}
        style={{ 
          background: 'red', 
          color: 'white', 
          border: 'none', 
          padding: '5px 10px', 
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Clear Auth Data
      </button>
    </div>
  );
};

export default AdminAuthDebug;
