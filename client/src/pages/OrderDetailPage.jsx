import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import api from '../api';

const STATUS_FLOW = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = () => {
    setLoading(true);
    setError('');
    api.get(`/orders/${id}`)
      .then((res) => { setOrder(res.data); setLoading(false); })
      .catch((err) => {
        setLoading(false);
        // --- Edge case: distinguish 404 from network errors ---
        if (err.response?.status === 404) {
          setError('Order not found. It may have been deleted.');
        } else {
          setError('Failed to load order. Please try again.');
        }
      });
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const getNextStatus = () => {
    if (!order) return null;
    const idx = STATUS_FLOW.indexOf(order.status);
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  const handleStatusUpdate = async () => {
    const next = getNextStatus();
    if (!next || updating) return; // --- Edge case: prevent double-click ---
    setUpdating(true);
    setError('');
    try {
      const { data } = await api.patch(`/orders/${id}/status`, { status: next });
      setOrder(data.order);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  // --- Edge case: delete order with confirmation ---
  const handleDelete = async () => {
    if (deleting) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete order ${order.order_id}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError('');
    try {
      await api.delete(`/orders/${id}`);
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete order.');
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading">Loading order details...</div>;
  if (!order && error) return (
    <div className="fade-in">
      <div className="back-link" onClick={() => navigate('/orders')}>
        <FiArrowLeft /> Back to Orders
      </div>
      <div className="error-msg">{error}</div>
    </div>
  );
  if (!order) return <div className="error-msg">Order not found.</div>;

  const nextStatus = getNextStatus();
  const currentIdx = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="fade-in">
      <div className="back-link" onClick={() => navigate('/orders')}>
        <FiArrowLeft /> Back to Orders
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {order.order_id}
            <span className={`badge badge-${order.status.toLowerCase()}`}>
              <span className="badge-dot" />{order.status}
            </span>
          </h1>
          <p>Created on {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* --- Edge case: show delete button only for RECEIVED orders --- */}
          {order.status === 'RECEIVED' && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
              <FiTrash2 /> {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          {nextStatus && (
            <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={updating}>
              {updating ? 'Updating...' : `Move to ${nextStatus}`} <FiChevronRight />
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Status Pipeline */}
      <div className="status-pipeline">
        {STATUS_FLOW.map((status, i) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`pipeline-step ${i === currentIdx ? 'active' : i < currentIdx ? 'completed' : ''}`}>
              {i < currentIdx ? '✓' : ''} {status}
            </div>
            {i < STATUS_FLOW.length - 1 && <span className="pipeline-arrow">→</span>}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">👤 Customer Information</div>
        <div className="detail-grid">
          <div className="detail-field">
            <label>Customer Name</label>
            <p>{order.customer_name}</p>
          </div>
          <div className="detail-field">
            <label>Phone Number</label>
            <p>{order.phone}</p>
          </div>
          <div className="detail-field">
            <label>Estimated Delivery</label>
            <p>{order.estimated_delivery || '—'}</p>
          </div>
          <div className="detail-field">
            <label>Last Updated</label>
            <p>{new Date(order.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">👕 Order Items</div>
        <table>
          <thead>
            <tr>
              <th>Garment</th>
              <th>Quantity</th>
              <th>Price/Item</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{item.garment_type}</td>
                <td>{item.quantity}</td>
                <td>₹{item.price_per_item}</td>
                <td style={{ fontWeight: 600 }}>₹{item.subtotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: 'right', padding: '16px 20px', borderTop: '1px solid var(--border)', fontSize: '1.2rem', fontWeight: 700 }}>
          Total: <span style={{ color: 'var(--accent)' }}>₹{order.total_amount?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
