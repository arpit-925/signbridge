import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hand, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState('Student');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    school: 'Metro Public School',
    captionSize: '24px',
    playbackSpeed: '0.75',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    if (form.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: role.toLowerCase(),
        school: form.school.trim() || 'Metro Public School',
        captionSize: form.captionSize,
        playbackSpeed: parseFloat(form.playbackSpeed) || 0.75,
      };

      const user = await register(payload);
      navigate(`/${user.role.toLowerCase()}`, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check information.');
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
          <h2 className="fw-bold" style={{ fontSize: 22 }}>Create Your Account</h2>
          <p className="text-secondary" style={{ fontSize: 14 }}>Join the Sign Bridge community today</p>
        </div>

        {errorMessage && (
          <div className="alert-card alert-pink mb-3 d-flex align-items-center gap-2" role="alert">
            <AlertCircle size={16} color="var(--danger)" />
            <span style={{ fontSize: 13 }}>{errorMessage}</span>
          </div>
        )}

        <div className="role-tabs mb-4">
          {['Student', 'Teacher', 'Parent'].map((r) => (
            <button
              key={r}
              type="button"
              className={`role-tab ${role === r ? 'active' : ''}`}
              onClick={() => {
                setRole(r);
                setErrorMessage('');
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="sb-form-group">
            <label>Full Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Leo Chen"
            />
          </div>

          <div className="sb-form-group">
            <label>Email Address *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@school.edu"
            />
          </div>

          <div className="sb-form-group">
            <label>Password (min 6 chars) *</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Choose a secure password"
            />
          </div>

          <div className="sb-form-group">
            <label>School / Institution (Optional)</label>
            <input
              type="text"
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
              placeholder="Metro Public School"
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 18, marginTop: 8 }}>
            <h6 className="fw-semibold mb-3" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Accessibility Preferences
            </h6>
            <div className="sb-form-group">
              <label>Caption Display Size</label>
              <select
                value={form.captionSize}
                onChange={(e) => setForm({ ...form, captionSize: e.target.value })}
              >
                <option value="32px">Extra Large (32pt) — High Contrast</option>
                <option value="24px">Large (24pt)</option>
                <option value="16px">Medium (16pt)</option>
              </select>
            </div>
            <div className="sb-form-group">
              <label>Sign Animation Playback Speed</label>
              <select
                value={form.playbackSpeed}
                onChange={(e) => setForm({ ...form, playbackSpeed: e.target.value })}
              >
                <option value="0.75">0.75x (Slower Learning Pace)</option>
                <option value="1.0">1.0x (Standard)</option>
                <option value="1.25">1.25x (Faster)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-accent w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
            style={{ padding: 14 }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Creating Account...
              </>
            ) : (
              'Complete Sign Up'
            )}
          </button>
        </form>

        <p className="text-center mt-3 mb-0" style={{ fontSize: 13 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In Instead
          </Link>
        </p>
      </div>
    </div>
  );
}
