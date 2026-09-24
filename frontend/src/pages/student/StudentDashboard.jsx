import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { studentApi } from '../../services/studentApi';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const btnColors = { success: 'btn-success', info: 'btn-primary-teal', accent: 'btn-primary-accent' };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center" style={{ minHeight: '60vh' }}>
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <h5 className="fw-semibold text-secondary">Loading your dashboard...</h5>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="alert-card alert-pink d-flex align-items-center justify-content-between p-4">
          <div className="d-flex align-items-center gap-3">
            <AlertCircle size={24} color="var(--danger)" />
            <div>
              <h6 className="fw-bold mb-1">Error Loading Dashboard</h6>
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

  const streakDays = data?.streak || 7;
  const quickActions = data?.quickActions || [];
  const assignedLessons = data?.assignedLessons || [];
  const performance = data?.weeklyPerformance || { completionPercentage: 75, lessonsDone: '9/12', quizScore: '92%' };
  const completionPct = performance.completionPercentage || 75;
  const circumference = 2 * Math.PI * 60; // 377
  const strokeDashoffset = circumference - (completionPct / 100) * circumference;

  return (
    <>
      <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h1>Good morning, {user?.name || 'Student'}! 👋</h1>
          <p>Keep up your incredible progress. Metro Public School is proud of you!</p>
        </div>
        <span
          className="badge-upcoming d-flex align-items-center gap-1"
          style={{ border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)' }}
        >
          <Flame size={14} /> {streakDays}-Day Streak!
        </span>
      </div>

      <div className="page-body">
        {/* Quick Actions */}
        <div className="row g-3 mb-4">
          {quickActions.map((action, i) => (
            <div key={i} className="col-md-4">
              <div className="quick-action-card h-100 d-flex flex-column">
                <h6 className="fw-semibold mb-1" style={{ fontSize: 15 }}>{action.title}</h6>
                <p className="text-secondary mb-3" style={{ fontSize: 13, flex: 1 }}>{action.desc}</p>
                <Link
                  to={action.path}
                  className={btnColors[action.btnColor] || 'btn-primary-teal'}
                  style={{
                    textAlign: 'center',
                    display: 'block',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {action.btn}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4">
          {/* Assigned Lessons */}
          <div className="col-lg-7">
            <div className="sb-card">
              <div className="sb-card-title d-flex justify-content-between align-items-center">
                <span>📋 Assigned Lessons</span>
                <Link to="/student/lessons" className="text-primary text-decoration-none" style={{ fontSize: 13, fontWeight: 600 }}>
                  View All &rarr;
                </Link>
              </div>

              {assignedLessons.length === 0 ? (
                <p className="text-secondary p-3 mb-0 text-center">No assigned lessons currently.</p>
              ) : (
                assignedLessons.map((lesson, i) => (
                  <div
                    key={i}
                    className="d-flex align-items-center justify-content-between py-3"
                    style={{ borderBottom: i < assignedLessons.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                  >
                    <div>
                      {lesson.lessonId ? (
                        <Link to={`/student/lessons/${lesson.lessonId}`} className="fw-semibold text-decoration-none" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                          {lesson.title}
                        </Link>
                      ) : (
                        <span className="fw-semibold" style={{ fontSize: 14 }}>{lesson.title}</span>
                      )}
                      <span className="text-secondary ms-2" style={{ fontSize: 12 }}>{lesson.duration}</span>
                    </div>
                    <span className={lesson.statusColor === 'success' || lesson.status === 'Completed' ? 'badge-active' : 'badge-info'}>
                      {lesson.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Weekly Performance Ring */}
          <div className="col-lg-5">
            <div className="sb-card text-center">
              <div className="sb-card-title justify-content-center">📊 Weekly Performance</div>
              <div className="progress-ring-container my-4" style={{ width: 140, height: 140, margin: '0 auto' }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="60" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="progress-ring-text">{completionPct}%</span>
              </div>
              <p className="text-secondary mb-0" style={{ fontSize: 13 }}>Weekly Goal Progress</p>
              <div className="d-flex justify-content-center gap-4 mt-3">
                <div className="d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                  Lessons Done: {performance.lessonsDone}
                </div>
                <div className="d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                  Quiz Score: {performance.quizScore}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
