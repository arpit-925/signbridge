import { useState, useEffect } from 'react';
import { Lock, Trophy, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { studentApi } from '../../services/studentApi';

const filterTabs = ['All', 'Streaks', 'Subject Mastery', 'Quiz Heroes', 'Converter Milestones'];

export default function Achievements() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAchievements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getAchievements();
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to load achievements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center" style={{ minHeight: '60vh' }}>
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <h5 className="fw-semibold text-secondary">Loading achievements & leaderboards...</h5>
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
              <h6 className="fw-bold mb-1">Failed to load milestones</h6>
              <p className="mb-0 text-secondary" style={{ fontSize: 13 }}>{error}</p>
            </div>
          </div>
          <button onClick={fetchAchievements} className="btn-secondary d-flex align-items-center gap-2">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const allBadges = data.allBadges || [];
  const leaderboard = data.leaderboard || [];

  return (
    <>
      <div className="page-header">
        <h1>Milestones & Achievements</h1>
        <p>Gamified badges and school leaderboards celebrating your learning steps.</p>
      </div>

      <div className="page-body">
        {/* Milestone Progress */}
        <div className="sb-card mb-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h5 className="fw-bold mb-1" style={{ fontSize: 16 }}>{data.currentLevel || 'Level 6 Sign Master'}</h5>
              <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                Next milestone unlocks at {data.nextMilestoneXp || 1200} XP
              </p>
            </div>
            <div className="d-flex align-items-center gap-3" style={{ minWidth: 280 }}>
              <div className="progress-bar-wrapper" style={{ flex: 1 }}>
                <div className="progress-bar-fill green" style={{ width: `${data.progressPercent || 70}%` }} />
              </div>
              <span className="fw-bold" style={{ fontSize: 13, color: 'var(--success)' }}>
                {data.currentXp || 850} / {data.nextMilestoneXp || 1200} XP
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${activeFilter === tab ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="row g-4">
          {/* Badges Grid */}
          <div className="col-lg-7">
            <div className="row g-3">
              {allBadges.map((badge, i) => (
                <div key={i} className="col-sm-6">
                  <div className="sb-card h-100" style={{ opacity: badge.unlocked ? 1 : 0.6, marginBottom: 0 }}>
                    <div className="d-flex align-items-start gap-3">
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 'var(--radius-md)',
                          background: badge.unlocked ? 'var(--success-light)' : 'var(--background)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          flexShrink: 0,
                        }}
                      >
                        {badge.unlocked ? badge.icon : <Lock size={18} color="var(--text-muted)" />}
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1" style={{ fontSize: 14 }}>{badge.name}</h6>
                        <p className="text-secondary mb-1" style={{ fontSize: 12 }}>{badge.desc}</p>
                        <span
                          style={{
                            fontSize: 11,
                            color: badge.unlocked ? 'var(--success)' : 'var(--text-muted)',
                            fontWeight: 600,
                          }}
                        >
                          {badge.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="col-lg-5">
            <div className="sb-card">
              <div className="sb-card-title">
                <Trophy size={16} color="var(--accent)" /> Class Leaderboard
              </div>
              {leaderboard.length === 0 ? (
                <p className="text-secondary p-3 text-center mb-0">No entries currently on leaderboard.</p>
              ) : (
                leaderboard.map((entry, i) => (
                  <div
                    key={i}
                    className="d-flex align-items-center justify-content-between py-2 px-3 rounded-2 mb-1"
                    style={{
                      background: entry.isYou ? 'var(--success-light)' : 'transparent',
                      fontWeight: entry.isYou ? 600 : 400,
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <span className="fw-bold" style={{ fontSize: 14, color: 'var(--text-secondary)', minWidth: 20 }}>
                        {i + 1}
                      </span>
                      <div>
                        <span style={{ fontSize: 14 }}>
                          {entry.name}{' '}
                          {entry.isYou && <span style={{ color: 'var(--primary)', fontSize: 12 }}>(You)</span>}
                        </span>
                        <span className="d-block text-secondary" style={{ fontSize: 11 }}>{entry.grade}</span>
                      </div>
                    </div>
                    <span className="fw-bold" style={{ fontSize: 14, color: 'var(--accent)' }}>
                      {(entry.xp || 0).toLocaleString()} XP
                    </span>
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
