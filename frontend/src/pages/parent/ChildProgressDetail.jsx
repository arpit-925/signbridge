import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, AlertCircle, RefreshCw, ShieldAlert, ArrowLeft } from 'lucide-react';
import { parentApi } from '../../services/parentApi';

export default function ChildProgressDetail() {
  const { childId } = useParams();
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(childId || null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await parentApi.getChildren();
        const items = Array.isArray(list) ? list : [];
        if (cancelled) return;
        setChildren(items);
        setActiveChildId((prev) => prev || items[0]?.id || null);
        if (items.length === 0) {
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load your children.');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchProgress = async () => {
    if (!activeChildId) return;
    setLoading(true);
    setError(null);
    setIsForbidden(false);
    try {
      const res = await parentApi.getChildProgress(activeChildId);
      setData(res);
    } catch (err) {
      if (err.status === 403) {
        setIsForbidden(true);
      } else {
        setError(err.message || 'Unable to load progress for this child.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [activeChildId]);

  const activeChild = children.find((c) => String(c.id) === String(activeChildId));
  const name = activeChild?.name || 'Your child';

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center" style={{ minHeight: '60vh' }}>
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <h5 className="fw-semibold text-secondary">Loading child progress analytics...</h5>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="p-4">
        <div className="alert-card alert-pink d-flex align-items-start gap-3 p-4">
          <ShieldAlert size={28} color="var(--danger)" style={{ flexShrink: 0 }} />
          <div>
            <h5 className="fw-bold mb-1">Access Restricted (403 Forbidden)</h5>
            <p className="text-secondary mb-3" style={{ fontSize: 14 }}>
              Security Violation: You are only authorized to view analytics and progress records for your registered children.
            </p>
            <Link to="/parent" className="btn-secondary d-inline-flex align-items-center gap-2">
              <ArrowLeft size={14} /> Back to My Children
            </Link>
          </div>
        </div>
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
              <h6 className="fw-bold mb-1">Failed to load progress</h6>
              <p className="mb-0 text-secondary" style={{ fontSize: 13 }}>{error || 'No children are linked to this account.'}</p>
            </div>
          </div>
          <button onClick={fetchProgress} className="btn-secondary d-flex align-items-center gap-2">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const childSubjects = data.childSubjects || [];
  const dailyEngagement = data.dailyEngagement || [];
  const feedback = data.teacherFeedback;

  const switchChild = () => {
    if (children.length < 2) return;
    const index = children.findIndex((c) => String(c.id) === String(activeChildId));
    const next = children[(index + 1) % children.length];
    setActiveChildId(next.id);
  };

  return (
    <>
      <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h1>{name}'s Learning Journey</h1>
          <p>{activeChild?.school || 'Metro Public School'}</p>
        </div>
        <div className="d-flex gap-2">
          {children.length > 1 && (
            <button onClick={switchChild} className="btn-secondary">
              Switch to {children.find((c) => String(c.id) !== String(activeChildId))?.name || 'next child'}
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="filter-tabs mb-4">
          <button className="filter-tab active">Overview</button>
          <button className="filter-tab">Lessons</button>
          <button className="filter-tab">Quizzes</button>
          <button className="filter-tab">Achievements</button>
        </div>

        <div className="row g-4">
          <div className="col-lg-7">
            <div className="sb-card mb-4">
              <div className="sb-card-title">📊 Subject Performance Breakdown</div>
              {childSubjects.length === 0 && (
                <p className="text-secondary mb-0" style={{ fontSize: 13 }}>No lesson progress recorded yet.</p>
              )}
              {childSubjects.map((s, i) => (
                <div key={i} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-medium" style={{ fontSize: 14 }}>{s.subject}</span>
                    <span className="fw-bold" style={{ fontSize: 14 }}>{s.percent}%</span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div className={`progress-bar-fill ${s.color || 'teal'}`} style={{ width: `${s.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="sb-card">
              <div className="sb-card-title">📅 Daily Learning Engagement (approx. hours)</div>
              <div className="d-flex align-items-end justify-content-between pt-4" style={{ height: 160 }}>
                {dailyEngagement.map((day, i) => (
                  <div key={i} className="text-center d-flex flex-column align-items-center" style={{ flex: 1 }}>
                    <div
                      className={`rounded-top ${day.hours > 4 ? 'bg-accent' : 'bg-primary'}`}
                      style={{
                        width: 24,
                        height: Math.max(4, day.hours * 20),
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <span className="text-secondary mt-2" style={{ fontSize: 11 }}>{day.day}</span>
                    <span className="fw-bold" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      {day.hours}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="sb-card mb-4">
              <div className="sb-card-title">👩‍🏫 Teacher Feedback Summary</div>
              <div className="p-3 rounded-2" style={{ background: 'var(--background)', borderLeft: '3px solid var(--primary)' }}>
                {feedback ? (
                  <>
                    <span className="fw-bold d-block mb-1" style={{ fontSize: 13 }}>
                      {feedback.teacher} • {feedback.subject}
                    </span>
                    <p className="text-secondary mb-0" style={{ fontSize: 13, lineHeight: 1.6 }}>
                      "{feedback.comment}"
                    </p>
                  </>
                ) : (
                  <p className="text-secondary mb-0" style={{ fontSize: 13 }}>No teacher feedback has been recorded yet.</p>
                )}
              </div>
            </div>

            <div className="sb-card">
              <div className="sb-card-title">💡 Supportive Strategies</div>
              <div className="d-flex align-items-start gap-2">
                <input type="checkbox" defaultChecked className="mt-1" style={{ accentColor: 'var(--primary)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                  {data.supportiveStrategy || 'Encourage daily ASL practice using the lesson modules.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
