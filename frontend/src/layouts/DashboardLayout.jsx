import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ config, user: fallbackUser }) {
  const { user: authUser, logout } = useAuth();
  const activeUser = authUser || fallbackUser || { name: 'User', role: 'Student', avatar: 'SB' };

  return (
    <div className="d-flex">
      <Sidebar config={config} user={activeUser} onLogout={logout} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

