import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, AlertTriangle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { parentApi } from '../../services/parentApi';
import { useAuth } from '../../context/AuthContext';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await parentApi.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to load parent dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center" style={{ minHeight: '60vh' }}>
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <h5 className="fw-semibold text-secondary">Loading parent portal...</h5>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4">
        <div className="alert-card alert-pink d-flex align-items-center justify-content-between p-4">
          <div className="d-flex align-items-center gap-3">
            <AlertCircle size={24} color="var(--danger)" />
            <div>
              <h6 className="fw-bold mb-1">Failed to load parent dashboard</h6>
              <p className="mb-0 text-secondary" style={{ fontSize: 13 }}>{error}</p>
            </div>
          </div>
          <button onClick={fetchDashboard} className="btn-secondary d-flex align-items-center gap-2">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const kpis = data.kpis || [];
  const children = data.children || [];
  const timeline = data.timeline || [];
  const alerts = data.alerts || [];

  return (
    <>
      <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h1>Good morning, {user?.name ? `${user.name.split(' ')[0]}` : 'Parent'}! 👋</h1>
          <p>Stay aligned with your children's K-12 learning visual progress and teacher updates.</p>
        </div>
        <Link to="/parent/messages" className="btn-primary-accent text-decoration-none">
          <Send size={14} /> Send Encouragement Message
        </Link>
      </div>

      <div className="page-body">
        {/* KPIs */}
        <div className="kpi-grid">
          {kpis.map((kpi, i) => (
            <div key={i} className="kpi-card">
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-sub">{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div className="row g-4">
          {/* Left Column */}
          <div className="col-lg-7">
            {/* My Children */}
            <div className="sb-card">
              <div className="sb-card-title">👨‍👩‍👧 My Registered Children</div>
              {children.length === 0 ? (
                <p className="text-secondary p-4 text-center mb-0">No registered children found.</p>
              ) : (
                children.map((child, i) => {
                  const childId = child.id || child._id || (child.name?.toLowerCase().includes('mia') ? 'mia' : 'leo');
                  return (
                    <div
                      key={childId || i}
                      className="d-flex align-items-center gap-3 py-3"
                      style={{ borderBottom: i < children.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {child.avatar || child.name?.slice(0, 2).toUpperCase() || 'CH'}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-0" style={{ fontSize: 14 }}>{child.name}</h6>
                        <span className="text-secondary" style={{ fontSize: 12 }}>
                          {child.grade || 'Grade 6'} • {child.school || 'Metro School'}
                        </span>
                        <p className="mb-0 text-secondary" style={{ fontSize: 12 }}>
                          Active: {child.lesson || 'Bilingual ASL Curriculum'}
                        </p>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'var(--success-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--success)',
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {child.progress || 75}%
                        </div>
                        <Link
                          to={`/parent/progress/${childId}`}
                          className="btn-secondary text-decoration-none"
                          style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Timeline */}
            <div className="sb-card">
              <div className="sb-card-title">🕐 Recent Interactive Timeline</div>
              {timeline.length === 0 ? (
                <p className="text-secondary p-4 text-center mb-0">No recent timeline events recorded.</p>
              ) : (
                timeline.map((item, i) => (
                  <div
                    key={i}
                    className="d-flex align-items-center gap-3 py-2"
                    style={{ borderBottom: i < timeline.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                  >
                    <span style={{ fontSize: 18 }}>{item.icon || '📌'}</span>
                    <span className="flex-grow-1" style={{ fontSize: 14 }}>
                      <strong>{item.child}</strong> {item.action} {item.detail}
                    </span>
                    <span className="text-secondary" style={{ fontSize: 12 }}>{item.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="col-lg-5">
            <div className="sb-card">
              <div className="sb-card-title">🔔 Parent Alerts & Notification Feed</div>
              {alerts.length === 0 ? (
                <p className="text-secondary p-3 mb-0">No active alerts at this time.</p>
              ) : (
                alerts.map((alert, i) => (
                  <div key={i} className={`alert-card alert-${alert.type || 'orange'} mb-2`}>
                    <AlertTriangle
                      size={16}
                      color={alert.type === 'pink' ? 'var(--danger)' : 'var(--warning)'}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <span style={{ fontSize: 13 }}>{alert.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
