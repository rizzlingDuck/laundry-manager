import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiRefreshCw } from 'react-icons/fi';
import api from '../api';

const STATUSES = ['ALL', 'RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const navigate = useNavigate();

  const fetchOrders = (page = 1) => {
    setLoading(true);
    setError('');
    const params = { page, limit: 20 };
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (search.trim()) {
      // Search in customer name, phone, or garment
      if (/^\d+$/.test(search.trim())) {
        params.phone = search.trim();
      } else {
        params.customer = search.trim();
      }
    }

    api.get('/orders', { params })
      .then((res) => {
        setOrders(res.data.orders);
        setPagination(res.data.pagination);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.response?.data?.error || 'Failed to load orders.');
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  // --- Edge case: clear search and reset ---
  const handleClearSearch = () => {
    setSearch('');
    setStatusFilter('ALL');
    // fetchOrders will be called by the statusFilter useEffect
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Orders</h1>
          <p>{pagination.total} total orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/orders/new')}>
          <FiPlus /> New Order
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1 }}>
            <input
              className="form-input"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 280 }}
            />
            <button className="btn btn-secondary btn-sm" type="submit"><FiSearch /></button>
            {/* --- Edge case: refresh / clear button --- */}
            {(search || statusFilter !== 'ALL') && (
              <button className="btn btn-ghost btn-sm" type="button" onClick={handleClearSearch} title="Clear filters">
                <FiRefreshCw />
              </button>
            )}
          </form>
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* --- Edge case: show error state --- */}
        {error && <div className="error-msg" style={{ margin: 16 }}>{error}</div>}

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders found</h3>
            <p>Try adjusting your filters or create a new order</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Est. Delivery</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id} onClick={() => navigate(`/orders/${order.order_id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{order.order_id}</td>
                    <td>{order.customer_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{order.phone}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {order.items?.map((i) => `${i.garment_type} ×${i.quantity}`).join(', ') || '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${order.status.toLowerCase()}`}>
                        <span className="badge-dot" />{order.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{order.total_amount?.toLocaleString()}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{order.estimated_delivery || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
                <button
                  className="btn btn-sm btn-secondary"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchOrders(pagination.page - 1)}
                >
                  Previous
                </button>
                <span style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  className="btn btn-sm btn-secondary"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchOrders(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
