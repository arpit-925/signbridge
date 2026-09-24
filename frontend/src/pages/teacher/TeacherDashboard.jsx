import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Send, AlertTriangle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { teacherApi } from '../../services/teacherApi';
import { useAuth } from '../../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await teacherApi.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to load teacher dashboard.');
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
        <h5 className="fw-semibold text-secondary">Loading classroom dashboard...</h5>
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
              <h6 className="fw-bold mb-1">Failed to load teacher dashboard</h6>
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
  const classroomAgenda = data.classroomAgenda || [];
  const recentActivity = data.recentActivity || [];
  const teacherAlerts = data.teacherAlerts || [];

  return (
    <>
      <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h1>Good morning, {user?.name ? `${user.name.split(' ')[0]}` : 'Teacher'}! ☀️</h1>
          <p>Here is a summary of what's happening in your classroom portals today.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/teacher/assignments" className="btn-primary-accent text-decoration-none">
            <Plus size={16} /> Create Assignment
          </Link>
          <Link to="/teacher/classes" className="btn-primary-teal text-decoration-none">
            <Send size={16} /> Manage Classes
          </Link>
        </div>
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
            <div className="sb-card">
              <div className="sb-card-title">📅 Today's Classroom Agenda</div>
              {classroomAgenda.length === 0 ? (
                <p className="text-secondary p-3 mb-0">No classes scheduled today.</p>
              ) : (
                classroomAgenda.map((item, i) => (
                  <div
                    key={i}
                    className="d-flex align-items-start gap-3 py-3"
                    style={{ borderBottom: i < classroomAgenda.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                  >
                    <span className="fw-bold" style={{ fontSize: 14, color: 'var(--primary)', minWidth: 48 }}>
                      {item.time}
                    </span>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="fw-semibold" style={{ fontSize: 14 }}>
                          {item.grade} - {item.title}
                        </span>
                        <span className={item.statusType === 'active' ? 'badge-active' : 'badge-upcoming'}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-secondary mb-0" style={{ fontSize: 13 }}>{item.type}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="sb-card">
              <div className="sb-card-title">⚡ Recent Student Activity Feed</div>
              {recentActivity.length === 0 ? (
                <p className="text-secondary p-3 mb-0">No recent student submissions logged.</p>
              ) : (
                recentActivity.map((item, i) => (
                  <div
                    key={i}
                    className="d-flex align-items-center gap-3 py-2"
                    style={{ borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                  >
                    <span style={{ fontSize: 18 }}>{item.icon || '📝'}</span>
                    <div className="flex-grow-1">
                      <span style={{ fontSize: 14 }}>
                        <strong>{item.student}</strong> {item.action}{' '}
                        {item.detail && <span className="text-secondary">({item.detail})</span>}
                      </span>
                    </div>
                    <span className="text-secondary" style={{ fontSize: 12 }}>{item.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="col-lg-5">
            <div className="sb-card">
              <div className="sb-card-title">🔔 Notifications & Tasks</div>
              {teacherAlerts.length === 0 ? (
                <p className="text-secondary p-3 mb-0">All grading tasks and alerts up to date!</p>
              ) : (
                teacherAlerts.map((alert, i) => (
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
