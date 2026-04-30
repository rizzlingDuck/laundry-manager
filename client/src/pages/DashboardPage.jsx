import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiDollarSign, FiTruck, FiCalendar } from 'react-icons/fi';
import api from '../api';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!data) return <div className="error-msg">Failed to load dashboard.</div>;

  const maxStatus = Math.max(...Object.values(data.ordersByStatus), 1);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your laundry business</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><FiPackage /></div>
          <div className="stat-info">
            <h3>{data.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiDollarSign /></div>
          <div className="stat-info">
            <h3>₹{data.totalRevenue.toLocaleString()}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FiCalendar /></div>
          <div className="stat-info">
            <h3>{data.todayOrders}</h3>
            <p>Today's Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiTruck /></div>
          <div className="stat-info">
            <h3>₹{data.todayRevenue.toLocaleString()}</h3>
            <p>Today's Revenue</p>
          </div>
        </div>
      </div>

      <div className="section-grid">
        <div className="card">
          <div className="section-title">📊 Orders by Status</div>
          <div className="chart-container">
            {['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'].map((status) => (
              <div className="chart-bar-row" key={status}>
                <span className="chart-label">{status}</span>
                <div className="chart-bar-bg">
                  <div
                    className={`chart-bar-fill ${status.toLowerCase()}`}
                    style={{ width: `${(data.ordersByStatus[status] / maxStatus) * 100}%` }}
                  />
                </div>
                <span className="chart-value">{data.ordersByStatus[status]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title">🏆 Top Garments</div>
          {data.topGarments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No data yet</p>
          ) : (
            <div className="garment-list">
              {data.topGarments.map((g) => (
                <div className="garment-item" key={g.garment_type}>
                  <span>{g.garment_type} ({g.totalQuantity} pcs)</span>
                  <span>₹{g.totalRevenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-title" style={{ marginBottom: 12 }}>🕐 Recent Orders</div>
        {data.recentOrders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders yet</h3>
            <p>Create your first order to get started</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/orders/new')}>Create Order</button>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Delivery</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.order_id} onClick={() => navigate(`/orders/${order.order_id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{order.order_id}</td>
                    <td>{order.customer_name}</td>
                    <td><span className={`badge badge-${order.status.toLowerCase()}`}><span className="badge-dot" />{order.status}</span></td>
                    <td style={{ fontWeight: 600 }}>₹{order.total_amount}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{order.estimated_delivery || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
