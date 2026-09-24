import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Hand, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const demoAccounts = {
  Student: { email: 'student@example.com', password: 'Student@123' },
  Teacher: { email: 'teacher@example.com', password: 'Teacher@123' },
  Parent: { email: 'parent@example.com', password: 'Parent@123' },
  Admin: { email: 'admin@example.com', password: 'Admin@123' },
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [role, setRole] = useState('Student');
  const [form, setForm] = useState(demoAccounts.Student);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRoleSelect = (r) => {
    setRole(r);
    setForm(demoAccounts[r]);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!form.email || !form.password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(form.email, form.password, role.toLowerCase());
      // Navigate to portal based on user's confirmed role
      const redirectPath = location.state?.from?.pathname || `/${user.role.toLowerCase()}`;
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-center mb-4">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
            <div className="sidebar-logo-icon" style={{ width: 36, height: 36 }}>
              <Hand size={18} color="#fff" />
            </div>
          </div>
          <h2 className="fw-bold" style={{ fontSize: 22 }}>Welcome Back</h2>
          <p className="text-secondary" style={{ fontSize: 14 }}>Sign in to your Sign Bridge account</p>
        </div>

        {errorMessage && (
          <div className="alert-card alert-pink mb-3 d-flex align-items-center gap-2" role="alert">
            <AlertCircle size={16} color="var(--danger)" />
            <span style={{ fontSize: 13 }}>{errorMessage}</span>
          </div>
        )}

        <div className="role-tabs mb-4">
          {['Student', 'Teacher', 'Parent', 'Admin'].map((r) => (
            <button
              key={r}
              type="button"
              className={`role-tab ${role === r ? 'active' : ''}`}
              onClick={() => handleRoleSelect(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="sb-form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter your email"
            />
          </div>
          <div className="sb-form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-accent w-100 mt-2 d-flex align-items-center justify-content-center gap-2"
            style={{ padding: 14 }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <span className="badge-upcoming d-inline-block mb-2" style={{ fontSize: 11 }}>
            Demo: Credentials prefilled for {role}
          </span>
          <p className="mb-0" style={{ fontSize: 13 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
