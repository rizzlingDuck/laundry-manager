import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiX, FiCheck } from 'react-icons/fi';
import api from '../api';

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [garmentOptions, setGarmentOptions] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [items, setItems] = useState([{ garmentType: '', quantity: 1, pricePerItem: 0 }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); // --- Edge case: prevent double submit ---

  useEffect(() => {
    api.get('/pricing').then((res) => {
      setGarmentOptions(res.data.garments);
      if (res.data.garments.length > 0) {
        setItems([{
          garmentType: res.data.garments[0].type,
          quantity: 1,
          pricePerItem: res.data.garments[0].price,
        }]);
      }
    }).catch(() => {
      setError('Failed to load garment pricing. Please refresh.');
    });
  }, []);

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'quantity') {
      // --- Edge case: ensure quantity is a positive integer, no negatives, no NaN ---
      const parsed = parseInt(value);
      newItems[index].quantity = isNaN(parsed) ? 1 : Math.max(1, Math.min(999, parsed));
    } else if (field === 'pricePerItem') {
      // --- Edge case: ensure price is non-negative ---
      const parsed = parseFloat(value);
      newItems[index].pricePerItem = isNaN(parsed) ? 0 : Math.max(0, parsed);
    } else if (field === 'garmentType') {
      newItems[index][field] = value;
      const opt = garmentOptions.find((g) => g.type === value);
      if (opt) newItems[index].pricePerItem = opt.price;
    }
    setItems(newItems);
  };

  const addItem = () => {
    // --- Edge case: limit max items ---
    if (items.length >= 50) {
      setError('Maximum 50 items per order.');
      return;
    }
    const def = garmentOptions[0];
    setItems([...items, {
      garmentType: def?.type || '',
      quantity: 1,
      pricePerItem: def?.price || 0,
    }]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.pricePerItem * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- Edge case: prevent double-click submission ---
    if (submitting) return;

    const trimmedName = customerName.trim();
    const trimmedPhone = phone.trim();

    // --- Edge case: whitespace-only validation ---
    if (!trimmedName) {
      setError('Customer name is required.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Customer name must be at least 2 characters.');
      return;
    }
    if (!trimmedPhone) {
      setError('Phone number is required.');
      return;
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setError('Phone must be a 10-digit number.');
      return;
    }

    // --- Edge case: check for items with no garment type selected ---
    for (const item of items) {
      if (!item.garmentType) {
        setError('Please select a garment type for all items.');
        return;
      }
      if (item.quantity < 1) {
        setError('Quantity must be at least 1 for all items.');
        return;
      }
    }

    // --- Edge case: check if total is zero (all free items) ---
    if (totalAmount <= 0) {
      setError('Order total must be greater than zero.');
      return;
    }

    setSubmitting(true);
    setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        customerName: trimmedName,
        phone: trimmedPhone,
        items: items.map((i) => ({
          garmentType: i.garmentType,
          quantity: parseInt(i.quantity),
          pricePerItem: parseFloat(i.pricePerItem),
        })),
      });
      navigate(`/orders/${data.order.orderId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order.');
      setSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  // --- Edge case: restrict phone input to digits only ---
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // strip non-digits
    if (val.length <= 10) setPhone(val);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Create New Order</h1>
        <p>Add customer details and select garments</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">👤 Customer Details</div>
          {error && <div className="error-msg">{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerName">Customer Name</label>
              <input id="customerName" className="form-input" placeholder="e.g. Rahul Sharma" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required maxLength={100} />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input id="phone" className="form-input" placeholder="e.g. 9876543210" value={phone} onChange={handlePhoneChange} required maxLength={10} inputMode="numeric" pattern="[0-9]*" />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>👕 Garments</span>
            <button type="button" className="btn btn-sm btn-secondary" onClick={addItem} disabled={items.length >= 50}><FiPlus /> Add Item</button>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div className="item-row" style={{ marginBottom: 4 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Garment Type</label>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</label>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price (₹)</label>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subtotal</label>
              <div style={{ width: 40 }} />
            </div>

            {items.map((item, i) => (
              <div className="item-row" key={i}>
                <div className="form-group">
                  <select className="form-select" value={item.garmentType} onChange={(e) => updateItem(i, 'garmentType', e.target.value)}>
                    {garmentOptions.length === 0 && <option value="">Loading...</option>}
                    {garmentOptions.map((g) => (
                      <option key={g.type} value={g.type}>{g.type} — ₹{g.price}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <input className="form-input" type="number" min="1" max="999" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} onBlur={(e) => { if (!e.target.value || parseInt(e.target.value) < 1) updateItem(i, 'quantity', '1'); }} />
                </div>
                <div className="form-group">
                  <input className="form-input" type="number" min="0" step="0.01" value={item.pricePerItem} onChange={(e) => updateItem(i, 'pricePerItem', e.target.value)} />
                </div>
                <div className="form-group">
                  <div className="form-input" style={{ background: 'var(--bg-secondary)', fontWeight: 600 }}>
                    ₹{(item.pricePerItem * item.quantity).toLocaleString()}
                  </div>
                </div>
                <button type="button" className="remove-item-btn" onClick={() => removeItem(i)} disabled={items.length <= 1} style={items.length <= 1 ? { opacity: 0.3 } : {}}>
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="order-summary">
          <h3>Order Summary</h3>
          {items.map((item, i) => (
            <div className="summary-row" key={i}>
              <span>{item.garmentType || 'Unselected'} × {item.quantity}</span>
              <span>₹{(item.pricePerItem * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="summary-row summary-total">
            <span>Total Amount</span>
            <span>₹{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="btn btn-primary" type="submit" disabled={loading || submitting}>
            <FiCheck /> {loading ? 'Creating...' : 'Create Order'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => navigate('/orders')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
