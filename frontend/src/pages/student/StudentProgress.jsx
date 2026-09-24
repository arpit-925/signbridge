import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { studentApi } from '../../services/studentApi';

export default function StudentProgress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getProgress();
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to load progress analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center" style={{ minHeight: '60vh' }}>
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <h5 className="fw-semibold text-secondary">Loading learning analytics...</h5>
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
              <h6 className="fw-bold mb-1">Failed to load analytics</h6>
              <p className="mb-0 text-secondary" style={{ fontSize: 13 }}>{error}</p>
            </div>
          </div>
          <button onClick={fetchProgress} className="btn-secondary d-flex align-items-center gap-2">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const calendar = data.calendar || Array.from({ length: 28 }, (_, i) => i % 2 === 0);
  const progressBySubject = data.progressBySubject || [];
  const earnedBadges = data.earnedBadges || [];

  return (
    <>
      <div className="page-header">
        <h1>My Learning Analytics</h1>
        <p>Comprehensive view of your sign-language, math, and science progress.</p>
      </div>

      <div className="page-body">
        <div className="row g-4">
          {/* Left Column */}
          <div className="col-lg-6">
            {/* Overall Completion */}
            <div className="sb-card text-center">
              <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
                <span className="fw-bold" style={{ fontSize: 48, color: 'var(--primary)' }}>
                  {data.overallCompletion || 84}%
                </span>
                <TrendingUp size={28} color="var(--success)" />
              </div>
              <p className="text-secondary mb-0" style={{ fontSize: 14 }}>
                Metro Class average is {data.classAverage || 76}% — You are{' '}
                <strong style={{ color: 'var(--success)' }}>{data.difference || 8}% ahead!</strong>
              </p>
            </div>

            {/* Weekly Activity Calendar */}
            <div className="sb-card">
              <div className="sb-card-title">📅 Weekly Activity Calendar</div>
              <p className="text-secondary mb-3" style={{ fontSize: 13 }}>
                Daily visual sessions completed over the last 4 weeks.
              </p>
              <div className="d-flex flex-wrap gap-1">
                {calendar.map((active, i) => (
                  <div
                    key={i}
                    title={`Day ${i + 1}: ${active ? 'Active practice session' : 'Rest day'}`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      background: active ? 'var(--success)' : '#E5E7EB',
                      opacity: active ? 0.9 : 0.4,
                      cursor: 'default',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-lg-6">
            {/* Progress by Subject */}
            <div className="sb-card">
              <div className="sb-card-title">📊 Progress by Subject</div>
              {progressBySubject.map((s, i) => (
                <div key={i} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-medium" style={{ fontSize: 14 }}>{s.subject}</span>
                    <span
                      className="fw-bold"
                      style={{ fontSize: 14, color: `var(--${s.color === 'teal' ? 'primary' : s.color === 'blue' ? 'info' : 'accent'})` }}
                    >
                      {s.percent}%
                    </span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div className={`progress-bar-fill ${s.color}`} style={{ width: `${s.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Earned Badges */}
            <div className="sb-card">
              <div className="sb-card-title">🏅 Earned Badges</div>
              <div className="d-flex gap-3">
                {earnedBadges.map((b, i) => (
                  <div key={i} className="text-center">
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        background: b.color === 'orange' ? 'var(--warning-light)' : 'var(--background)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        margin: '0 auto 8px',
                      }}
                    >
                      {b.icon}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{b.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="alert-card alert-orange">
              <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{data.recommendation || 'Keep practicing your daily signs for optimal muscle memory.'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
