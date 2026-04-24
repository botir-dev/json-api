import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Webhook,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/webhooks', label: 'Webhooks', icon: Webhook, adminOnly: true },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const visibleNav = navItems.filter((n) => !n.adminOnly || isAdmin);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 20,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '260px',
          background: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 30,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          overflowY: 'auto',
        }}
        className="sidebar-desktop"
      >
        <style>{`
          @media (min-width: 768px) {
            .sidebar-desktop { transform: translateX(0) !important; }
            .main-content { margin-left: 260px !important; }
          }
        `}</style>

        {/* Logo */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#f1f5f9' }}>
              Enterprise
            </span>
            <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
              Management Console
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#475569',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '8px 12px 6px',
            }}
          >
            Navigation
          </p>
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#f1f5f9' : '#94a3b8',
                background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                borderLeft: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.15s',
                marginBottom: '2px',
                textDecoration: 'none',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  {label}
                  {isActive && (
                    <ChevronRight size={12} style={{ marginLeft: 'auto', color: '#3b82f6' }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div
          style={{
            padding: '12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <NavLink
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
              background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
              transition: 'background 0.15s',
              marginBottom: '4px',
            })}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '12px',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {user?.firstName?.[0] || user?.username?.[0] || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username}
              </p>
              <p style={{ fontSize: '11px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </p>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              fontSize: '13px',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
              e.currentTarget.style.color = '#fca5a5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className="main-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Top bar */}
        <header
          style={{
            height: '64px',
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: '16px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.04)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#475569',
            }}
            className="mobile-menu-btn"
          >
            <style>{`
              @media (max-width: 767px) {
                .mobile-menu-btn { display: flex !important; }
              }
            `}</style>
            <Menu size={18} />
          </button>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                  {user?.firstName || user?.username}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
