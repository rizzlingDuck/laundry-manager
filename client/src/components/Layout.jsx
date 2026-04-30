import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiList, FiPlusCircle, FiLogOut, FiUser } from 'react-icons/fi';

export default function Layout({ children, user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          Laundry<span>Pro</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FiGrid /> Dashboard
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FiList /> Orders
          </NavLink>
          <NavLink to="/orders/new" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FiPlusCircle /> New Order
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-link" style={{ cursor: 'default', opacity: 0.7 }}>
            <FiUser /> {user?.username || 'User'}
          </div>
          <button className="sidebar-link" onClick={onLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>
      <main className="main-content fade-in">
        {children}
      </main>
    </div>
  );
}
