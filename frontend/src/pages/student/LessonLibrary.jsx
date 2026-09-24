import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ArrowRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { studentApi } from '../../services/studentApi';

const tabs = ['All Signs', 'ASL Basics', 'Math Signs', 'Science Signs', 'Daily Communication'];

export default function LessonLibrary() {
  const [activeTab, setActiveTab] = useState('All Signs');
  const [search, setSearch] = useState('');
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLessons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getLessons({
        category: activeTab,
        search,
      });
      setLessons(res.lessons || []);
    } catch (err) {
      setError(err.message || 'Unable to fetch lessons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLessons();
  };

  const progressColors = { teal: 'teal', blue: 'blue', orange: 'orange', purple: 'purple' };

  return (
    <>
      <div className="page-header">
        <h1>Lesson Library</h1>
        <p>Explore curriculum-mapped visual lessons with step-by-step sign feedback.</p>
      </div>

      <div className="page-body">
        {/* Featured Unit */}
        <div
          className="sb-card mb-4"
          style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #EFF6FF 100%)', border: 'none' }}
        >
          <div className="row align-items-center">
            <div className="col-md-8">
              <span className="badge-new mb-2 d-inline-block">CURRICULUM MAPPED</span>
              <h4 className="fw-bold mt-2">Unit 4: Social Science and Civic Signs</h4>
              <p className="text-secondary" style={{ fontSize: 14 }}>
                Learn vocabulary for community roles, government basics, and visual signs for public entities.
              </p>
              <Link to="/student/lessons/4" className="btn-primary-teal">
                Start Unit <ArrowRight size={16} />
              </Link>
            </div>
            <div className="col-md-4 text-center mt-3 mt-md-0">
              <div style={{ fontSize: 80 }}>🏫</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search lessons by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {/* Loading State */}
        {loading && (
          <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
            <Loader2 size={32} className="animate-spin text-primary mb-2" />
            <span className="text-secondary" style={{ fontSize: 14 }}>Loading curriculum lessons...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="alert-card alert-pink d-flex align-items-center justify-content-between p-3 my-3">
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={18} color="var(--danger)" />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
            <button onClick={fetchLessons} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && lessons.length === 0 && (
          <div className="sb-card text-center p-5">
            <p className="text-secondary mb-2" style={{ fontSize: 15 }}>No lessons found matching your criteria.</p>
            <button
              onClick={() => {
                setActiveTab('All Signs');
                setSearch('');
              }}
              className="btn-secondary"
              style={{ fontSize: 13 }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Lesson Grid */}
        {!loading && !error && lessons.length > 0 && (
          <div className="row g-3">
            {lessons.map((lesson) => {
              const lessonId = lesson.id || lesson._id;
              const colorClass = progressColors[lesson.color] || 'teal';
              return (
                <div key={lessonId} className="col-md-6 col-lg-4">
                  <Link to={`/student/lessons/${lessonId}`} style={{ textDecoration: 'none' }}>
                    <div
                      className="sb-card h-100"
                      style={{ cursor: 'pointer', transition: 'all 0.2s', marginBottom: 0 }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge-info" style={{ fontSize: 11 }}>{lesson.category}</span>
                        <span className="text-secondary" style={{ fontSize: 11 }}>{lesson.level}</span>
                      </div>
                      <h6 className="fw-semibold mt-2 mb-3" style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                        {lesson.title}
                      </h6>
                      <div className="d-flex align-items-center gap-2 text-secondary mb-3" style={{ fontSize: 12 }}>
                        <Clock size={14} /> {lesson.duration || '12 mins'}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress-bar-wrapper" style={{ flex: 1 }}>
                          <div
                            className={`progress-bar-fill ${colorClass}`}
                            style={{ width: `${lesson.progress || 0}%` }}
                          />
                        </div>
                        <span className="fw-semibold" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {lesson.progress || 0}%
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
