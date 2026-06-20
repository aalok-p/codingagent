import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics } from '../../api/seller';
import { useToast } from '../../components/Toast';

export default function SellerAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    getAnalytics().then((data) => {
      setAnalytics(data);
    }).catch(() => {
      toast('Failed to load analytics', 'error');
    }).finally(() => {
      setLoading(false);
    });
  }, [toast]);

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="seller-analytics">
      <div className="seller-header">
        <h2>Dashboard</h2>
        <div className="seller-nav">
          <Link to="/seller/products" className="btn-link">Products</Link>
          <Link to="/seller/analytics" className="btn-link btn-link-active">Analytics</Link>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-products">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Products Listed</span>
            <span className="stat-card-value">{analytics.total_products_listed}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-sold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Units Sold</span>
            <span className="stat-card-value">{analytics.total_units_sold}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-revenue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Revenue</span>
            <span className="stat-card-value">${Number(analytics.total_revenue).toFixed(2)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-low">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Low Stock</span>
            <span className="stat-card-value">{analytics.low_stock_products.length}</span>
          </div>
        </div>
      </div>

      <div className="low-stock-section">
        <h3>Low Stock Products</h3>
        {analytics.low_stock_products.length === 0 ? (
          <div className="empty-state">
            <p>All products have sufficient stock.</p>
          </div>
        ) : (
          <div className="low-stock-list">
            {analytics.low_stock_products.map((p) => (
              <div key={p.id} className="low-stock-item">
                <span className="low-stock-name">{p.name}</span>
                <span className="stock-badge stock-low">{p.quantity} left</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
