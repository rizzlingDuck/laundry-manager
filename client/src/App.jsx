import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import CreateOrderPage from './pages/CreateOrderPage';
import OrderDetailPage from './pages/OrderDetailPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    // --- Edge case: handle corrupted JSON in localStorage ---
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      console.error('Corrupted user data in localStorage, clearing.');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // --- Edge case: if token exists but user is null, force logout ---
  if (token && !user) {
    handleLogout();
  }

  if (!token) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/new" element={<CreateOrderPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
