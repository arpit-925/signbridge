import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { studentApi } from '../../services/studentApi';

export default function QuizLibrary() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getQuizzes();
      setQuizzes(res.quizzes || []);
    } catch (err) {
      setError(err.message || 'Unable to load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>Quizzes & Skill Evaluations</h1>
        <p>Test your visual ASL comprehension and earn points toward your rank milestones.</p>
      </div>

      <div className="page-body">
        {loading && (
          <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
            <Loader2 size={32} className="animate-spin text-primary mb-2" />
            <span className="text-secondary" style={{ fontSize: 14 }}>Loading available quizzes...</span>
          </div>
        )}

        {error && !loading && (
          <div className="alert-card alert-pink d-flex align-items-center justify-content-between p-3 my-3">
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={18} color="var(--danger)" />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
            <button onClick={fetchQuizzes} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <div className="sb-card text-center p-5">
            <p className="text-secondary mb-3">No active quizzes found.</p>
            <Link to="/student/quizzes/1" className="btn-primary-teal">
              Try Demo ASL Quiz 1
            </Link>
          </div>
        )}

        {!loading && !error && quizzes.length > 0 && (
          <div className="row g-3">
            {quizzes.map((quiz) => {
              const quizId = quiz._id || quiz.id;
              return (
                <div key={quizId} className="col-md-6">
                  <div className="sb-card h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge-info">{quiz.difficulty || 'Beginner'}</span>
                        <span className="badge-upcoming">{quiz.mode || 'Untimed Mode'}</span>
                      </div>
                      <h5 className="fw-bold mt-2 mb-2" style={{ fontSize: 16 }}>{quiz.title}</h5>
                      <p className="text-secondary mb-3" style={{ fontSize: 13 }}>
                        {quiz.description || 'Test your visual understanding of signs and gestures.'}
                      </p>
                    </div>

                    <div className="d-flex align-items-center justify-content-between pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                      <span className="text-secondary" style={{ fontSize: 12 }}>
                        Passing: {quiz.passingScore || 70}%
                      </span>
                      <Link to={`/student/quizzes/${quizId}`} className="btn-primary-accent" style={{ padding: '8px 16px', fontSize: 13 }}>
                        <Play size={14} /> Start Quiz
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
