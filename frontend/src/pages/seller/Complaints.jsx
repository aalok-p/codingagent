import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSellerComplaints, resolveComplaint } from '../../api/complaints';
import { useToast } from '../../components/Toast';

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

function statusBadgeClass(status) {
  return status === 'open' ? 'status-pending' : 'status-delivered';
}

export default function SellerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  const toast = useToast();

  useEffect(() => {
    getSellerComplaints().then((data) => {
      setComplaints(Array.isArray(data) ? data : []);
    }).catch(() => {
      toast('Failed to load complaints', 'error');
    }).finally(() => {
      setLoading(false);
    });
  }, [toast]);

  async function handleResolve(complaintId) {
    setResolving(complaintId);
    try {
      await resolveComplaint(complaintId);
      toast('Complaint resolved');
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintId ? { ...c, status: 'resolved' } : c))
      );
    } catch {
      toast('Failed to resolve complaint', 'error');
    } finally {
      setResolving(null);
    }
  }

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="seller-complaints">
      <div className="seller-header">
        <h2>Complaints</h2>
        <div className="seller-nav">
          <Link to="/seller/products" className="btn-link">Products</Link>
          <Link to="/seller/analytics" className="btn-link">Analytics</Link>
          <Link to="/seller/complaints" className="btn-link btn-link-active">Complaints</Link>
        </div>
      </div>

      {complaints.length === 0 ? (
        <div className="empty-state">
          <p>No complaints yet.</p>
        </div>
      ) : (
        <div className="complaints-list">
          {complaints.map((complaint) => (
            <div key={complaint.id} className="complaint-card">
              <div className="complaint-card-header">
                <div className="complaint-card-product">{complaint.product_name}</div>
                <span className={`status-badge ${statusBadgeClass(complaint.status)}`}>
                  {complaint.status}
                </span>
              </div>
              <div className="complaint-card-customer">
                Reported by <strong>{complaint.customer_name}</strong>
                <span className="complaint-card-date">{formatDate(complaint.created_at)}</span>
              </div>
              <p className="complaint-card-message">{complaint.message}</p>
              {complaint.status === 'open' && (
                <div className="complaint-card-actions">
                  <button
                    className="btn-primary btn-small"
                    onClick={() => handleResolve(complaint.id)}
                    disabled={resolving === complaint.id}
                  >
                    {resolving === complaint.id ? 'Resolving...' : 'Resolve'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
