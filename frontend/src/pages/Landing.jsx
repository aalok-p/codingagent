import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <h1 className="landing-title">Grocery Inventory & Order Management</h1>
      <p className="landing-subtitle">Choose your role to get started</p>
      <div className="role-cards">
        <button
          className="role-card"
          onClick={() => navigate('/login?role=buyer')}
        >
          <span className="role-icon">🛒</span>
          <span className="role-label">I am a Buyer</span>
          <span className="role-desc">Browse products and place orders</span>
        </button>
        <button
          className="role-card"
          onClick={() => navigate('/login?role=seller')}
        >
          <span className="role-icon">📦</span>
          <span className="role-label">I am a Seller</span>
          <span className="role-desc">Manage your inventory and sales</span>
        </button>
      </div>
    </div>
  );
}
