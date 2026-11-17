import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Database,
  History,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  PieChart,
  PlusCircle,
  ScanBarcode,
  Target,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/add-food', label: 'Add Food', icon: PlusCircle },
  { to: '/scan-barcode', label: 'Scan Barcode', icon: ScanBarcode },
  { to: '/diary', label: 'Food Diary', icon: BookOpen },
  { to: '/summary', label: 'Nutrition Summary', icon: PieChart },
  { to: '/history', label: 'History', icon: History },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/foods', label: 'Food Database', icon: Database },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    showToast('You have been logged out.', 'info');
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Primary Navigation">
        <div className="sidebar-header">
          <div className="sidebar-logo" aria-hidden="true">
            <Leaf size={22} />
          </div>
          <div>
            <h1 className="sidebar-title">NutriTrack</h1>
            <div className="sidebar-tagline">Nutrition &amp; Diet Tracker</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user-chip">
              <div className="sidebar-user-name">{user.fullName}</div>
            </div>
          )}
          <button type="button" className="nav-item" onClick={handleLogout}>
            <LogOut size={20} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="mobile-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Leaf size={22} aria-hidden="true" />
            <strong>Nutrition &amp; Diet Tracker</strong>
          </div>
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        <main className="main-content">
          <Outlet />

          <section className="healthy-banner" aria-label="Healthy living tip">
            <div>
              <h3>Consistent Habits Build Lasting Nutrition Balance</h3>
              <p>
                Log meals consistently, check macro balance daily, and review trends up to 365 days.
              </p>
            </div>
            <NavLink to="/add-food" className="btn btn-secondary">
              + Log a Meal
            </NavLink>
          </section>
        </main>
      </div>
    </div>
  );
}
