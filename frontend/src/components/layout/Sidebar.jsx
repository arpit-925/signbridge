import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Hand, LogOut } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function Sidebar({ config, user, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const getIcon = (iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent size={18} /> : null;
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    }
    navigate('/login');
  };

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setOpen(!open)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Hand size={20} color="#fff" /></div>
          <div>
            <h2>SIGN BRIDGE</h2>
            <span>{config.portalName}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {config.links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/student' || link.path === '/teacher' || link.path === '/parent' || link.path === '/admin'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {getIcon(link.icon)}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-visual-mode">
            <span className="dot" />
            Visual Mode: AAA High Contrast
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <div className="sidebar-user mb-0">
              <div className="sidebar-avatar">{user.avatar || 'SB'}</div>
              <div className="sidebar-user-info">
                <h4>{user.name}</h4>
                <p>{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center p-2 rounded-2"
              title="Sign Out"
              style={{ border: '1px solid rgba(239, 68, 68, 0.4)', background: 'transparent', color: '#EF4444' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
