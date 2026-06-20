import { useState, useEffect } from 'react';
import { getOrders } from '../../api/orders';
import { fileComplaint } from '../../api/complaints';
import { useToast } from '../../components/Toast';
import { useNavigate } from 'react-router-dom';

function statusBadgeClass(status) {
  switch (status) {
    case 'pending': return 'status-pending';
    case 'confirmed': return 'status-confirmed';
    case 'shipped': return 'status-shipped';
    case 'delivered': return 'status-delivered';
    case 'cancelled': return 'status-cancelled';
    default: return 'status-pending';
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [complaintModal, setComplaintModal] = useState(null);
  const [complaintMsg, setComplaintMsg] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    getOrders().then((data) => {
      setOrders(Array.isArray(data) ? data : []);
    }).catch(() => {
      toast('Failed to load orders', 'error');
    }).finally(() => {
      setLoading(false);
    });
  }, [toast]);

  function toggleExpand(orderId) {
    setExpanded(expanded === orderId ? null : orderId);
  }

  function openComplaint(item) {
    setComplaintModal(item);
    setComplaintMsg('');
  }

  async function handleFileComplaint(e) {
    e.preventDefault();
    try {
      await fileComplaint(complaintModal.id, complaintMsg);
      toast('Complaint submitted successfully');
      setComplaintModal(null);
      setComplaintMsg('');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit complaint';
      toast(msg, 'error');
    }
  }

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="buyer-orders">
      <div className="buyer-orders-header">
        <button className="btn-back" onClick={() => navigate('/buyer/products')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Products
        </button>
        <h2>My Orders</h2>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet. Start shopping to see your orders here.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div
                className="order-card-header"
                onClick={() => toggleExpand(order.id)}
              >
                <div className="order-card-summary">
                  <span className="order-id">Order #{order.id}</span>
                  <span className="order-date">{formatDate(order.created_at)}</span>
                  <span className="order-items-count">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="order-card-meta">
                  <span className={`status-badge ${statusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="order-total">${Number(order.total_amount).toFixed(2)}</span>
                  <svg
                    className={`expand-icon ${expanded === order.id ? 'expand-icon-open' : ''}`}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {expanded === order.id && (
                <div className="order-card-detail">
                  <table className="order-items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="order-item-name">{item.product_name}</td>
                          <td>{item.quantity}</td>
                          <td>${Number(item.unit_price).toFixed(2)}</td>
                          <td>${Number(item.subtotal).toFixed(2)}</td>
                          <td>
                            <button
                              className="btn-small btn-secondary"
                              onClick={() => openComplaint(item)}
                            >
                              File Complaint
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {complaintModal && (
        <div className="modal-overlay" onClick={() => setComplaintModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>File Complaint</h3>
            <p className="complaint-item-ref">
              For: <strong>{complaintModal.product_name}</strong>
            </p>
            <form onSubmit={handleFileComplaint}>
              <div className="form-group">
                <label>Describe your issue</label>
                <textarea
                  className="complaint-textarea"
                  rows={4}
                  value={complaintMsg}
                  onChange={(e) => setComplaintMsg(e.target.value)}
                  placeholder="Please describe the problem with this item..."
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setComplaintModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-small" disabled={!complaintMsg.trim()}>
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
