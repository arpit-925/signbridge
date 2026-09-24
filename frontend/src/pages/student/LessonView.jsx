import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, SkipBack, SkipForward, RotateCcw, Camera, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { studentApi } from '../../services/studentApi';

export default function LessonView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(60);

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await studentApi.getLessonById(id || '1');
        setLesson(data);
        setProgress(data.progress || 60);
      } catch (err) {
        setError(err.message || 'Unable to load lesson details.');
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  const handleMarkComplete = async () => {
    setUpdating(true);
    try {
      await studentApi.updateLessonProgress(id || '1', {
        percentage: 100,
        status: 'Completed',
      });
      setProgress(100);
    } catch (err) {
      alert(err.message || 'Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center" style={{ minHeight: '60vh' }}>
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <h5 className="fw-semibold text-secondary">Loading lesson module...</h5>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="p-4">
        <div className="alert-card alert-pink d-flex align-items-center justify-content-between p-4">
          <div className="d-flex align-items-center gap-3">
            <AlertCircle size={24} color="var(--danger)" />
            <div>
              <h6 className="fw-bold mb-1">Failed to load lesson</h6>
              <p className="mb-0 text-secondary" style={{ fontSize: 13 }}>{error || 'Lesson not found'}</p>
            </div>
          </div>
          <Link to="/student/lessons" className="btn-secondary">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const vocabList = lesson.vocabulary || [
    { word: 'Hello', desc: 'Open hand, fingers together, touch forehead and move slightly out like a salute.', active: true },
    { word: 'Thank You', desc: 'Touch flat fingertips to lips, then move hand down and forward toward the other person.', active: false },
    { word: 'Good Morning', desc: 'Place flat fingertips of right hand to chin, move hand down, then cross with arm extension.', active: false },
  ];

  const currentWord = vocabList[selectedWordIndex] || vocabList[0];

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-2 text-secondary mb-2" style={{ fontSize: 13 }}>
          <Link to="/student/lessons" className="text-decoration-none text-secondary">My Lessons</Link>
          <span>/</span>
          <span>{lesson.category || 'ASL Basics'}</span>
          <span>/</span>
          <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{lesson.title}</span>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ maxWidth: 450 }}>
            <span className="fw-semibold" style={{ fontSize: 14 }}>Lesson Completion</span>
            <div className="progress-bar-wrapper" style={{ flex: 1 }}>
              <div className="progress-bar-fill teal" style={{ width: `${progress}%` }} />
            </div>
            <span className="fw-semibold" style={{ fontSize: 13, color: 'var(--primary)' }}>{progress}%</span>
          </div>
          {progress < 100 && (
            <button
              onClick={handleMarkComplete}
              disabled={updating}
              className="btn-success d-flex align-items-center gap-2"
              style={{ fontSize: 13, padding: '8px 16px' }}
            >
              <CheckCircle size={15} /> {updating ? 'Saving...' : 'Mark Completed (100%)'}
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="row g-4">
          {/* Video Player */}
          <div className="col-lg-7">
            <div className="sb-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="video-container" style={{ minHeight: 360 }}>
                <div className="text-center text-white">
                  <div style={{ fontSize: 80, marginBottom: 16 }}>👋</div>
                  <div className="bg-dark bg-opacity-50 px-3 py-2 rounded-2" style={{ fontSize: 14 }}>
                    <strong>"{currentWord.word.toUpperCase()}"</strong> — {currentWord.desc}
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between p-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn-secondary"
                    style={{ padding: '8px' }}
                    onClick={() => setSelectedWordIndex(Math.max(0, selectedWordIndex - 1))}
                  >
                    <SkipBack size={16} />
                  </button>
                  <button className="btn-primary-teal" style={{ padding: '10px', borderRadius: '50%' }}>
                    <Play size={18} />
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ padding: '8px' }}
                    onClick={() => setSelectedWordIndex(Math.min(vocabList.length - 1, selectedWordIndex + 1))}
                  >
                    <SkipForward size={16} />
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ padding: '8px' }}
                    onClick={() => setSelectedWordIndex(0)}
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
                <div className="d-flex gap-2">
                  <span className="badge-upcoming" style={{ fontSize: 11 }}>Slo-Mo Active (0.75x)</span>
                  <span className="badge-info" style={{ fontSize: 11 }}>Mirror View</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vocabulary Panel */}
          <div className="col-lg-5">
            <div className="sb-card">
              <div className="sb-card-title">📖 Vocabulary: {lesson.title}</div>
              {vocabList.map((item, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedWordIndex(i)}
                  className="p-3 rounded-2 mb-2"
                  style={{
                    background: selectedWordIndex === i ? 'var(--warning-light)' : 'var(--background)',
                    border: selectedWordIndex === i ? '1px solid var(--warning)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <h6 className="fw-bold mb-1" style={{ fontSize: 14 }}>{item.word}</h6>
                  <p className="mb-0 text-secondary" style={{ fontSize: 13 }}>{item.desc}</p>
                </div>
              ))}
              <button
                onClick={() => navigate('/student/converter')}
                className="btn-primary-accent w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
              >
                <Camera size={16} /> Practice This Sign with Camera
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
