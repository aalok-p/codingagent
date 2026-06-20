import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateRole } from '../api/auth';

export default function RolePicker() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRolePick(role) {
    setLoading(true);
    setError('');
    try {
      const data = await updateRole(role);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      navigate(role === 'seller' ? '/seller/products' : '/buyer/products');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to set role. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Choose Your Role</h2>
        <p className="auth-role-hint">
          Welcome! Please select how you want to use this platform.
        </p>

        {error && <div className="error-banner">{error}</div>}

        <div className="role-picker-actions">
          <button
            className="role-card picker-card"
            onClick={() => handleRolePick('buyer')}
            disabled={loading}
          >
            <span className="role-icon">🛒</span>
            <span className="role-label">Buyer</span>
            <span className="role-desc">Browse products and place orders</span>
          </button>
          <button
            className="role-card picker-card"
            onClick={() => handleRolePick('seller')}
            disabled={loading}
          >
            <span className="role-icon">📦</span>
            <span className="role-label">Seller</span>
            <span className="role-desc">Manage your inventory and sales</span>
          </button>
        </div>
      </div>
    </div>
  );
}
