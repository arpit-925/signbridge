import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { studentApi } from '../../services/studentApi';

export default function QuizPractice() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    setSelectedOption(null);
    setResult(null);
    try {
      const data = await studentApi.getQuizById(id || '1');
      setQuiz(data);
    } catch (err) {
      setError(err.message || 'Unable to load quiz.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const handleSubmitAnswer = async () => {
    if (selectedOption === null) return;
    setSubmitting(true);
    try {
      const attemptRes = await studentApi.attemptQuiz(id || '1', [
        { questionIndex: 0, selectedOption },
      ]);
      setResult(attemptRes);
    } catch (err) {
      alert(err.message || 'Failed to submit quiz attempt');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center" style={{ minHeight: '60vh' }}>
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <h5 className="fw-semibold text-secondary">Loading evaluation questions...</h5>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="p-4">
        <div className="alert-card alert-pink d-flex align-items-center justify-content-between p-4">
          <div className="d-flex align-items-center gap-3">
            <AlertCircle size={24} color="var(--danger)" />
            <div>
              <h6 className="fw-bold mb-1">Failed to load quiz</h6>
              <p className="mb-0 text-secondary" style={{ fontSize: 13 }}>{error || 'Quiz not found'}</p>
            </div>
          </div>
          <Link to="/student" className="btn-secondary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const options = quiz.options || ['Hello', 'Thank You', 'Goodbye', 'Please'];

  return (
    <>
      <div className="page-header">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <h1>{quiz.title}</h1>
            <p>Question 1 of {quiz.totalQuestions || 2}</p>
          </div>
          <span className="badge-info" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
            {quiz.mode || 'Untimed Practice'}
          </span>
        </div>
      </div>

      <div className="page-body">
        <div className="sb-card">
          <div className="row g-4">
            {/* Video */}
            <div className="col-lg-5">
              <div className="video-container" style={{ minHeight: 280 }}>
                <div className="text-center text-white">
                  <div style={{ fontSize: 72, marginBottom: 12 }}>🧑‍🎓</div>
                  <p style={{ fontSize: 13, opacity: 0.8 }}>3D Sign Language Evaluation Feed</p>
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="col-lg-7">
              <h5 className="fw-bold mb-3" style={{ fontSize: 17 }}>
                {quiz.question}
              </h5>
              <button
                className="d-flex align-items-center gap-2 text-secondary mb-4"
                style={{ background: 'none', border: 'none', fontSize: 13, cursor: 'pointer' }}
              >
                <Play size={14} /> Replay visual sign prompt
              </button>

              <div className="d-flex flex-column gap-2 mb-4">
                {options.map((opt, i) => {
                  const isSelected = selectedOption === i;
                  const isEvaluated = result !== null;
                  const isAnswerCorrect = result?.answers?.[0]?.selectedOption === i && result?.answers?.[0]?.isCorrect;
                  const isAnswerWrong = result?.answers?.[0]?.selectedOption === i && !result?.answers?.[0]?.isCorrect;

                  let borderColor = 'var(--border-color)';
                  let bg = 'var(--surface)';

                  if (isEvaluated) {
                    if (isAnswerCorrect) {
                      borderColor = 'var(--success)';
                      bg = 'var(--success-light)';
                    } else if (isAnswerWrong) {
                      borderColor = 'var(--danger)';
                      bg = 'var(--danger-light)';
                    }
                  } else if (isSelected) {
                    borderColor = 'var(--primary)';
                    bg = 'var(--primary-light)';
                  }

                  return (
                    <button
                      key={i}
                      disabled={isEvaluated || submitting}
                      onClick={() => setSelectedOption(i)}
                      className="text-start p-3 rounded-2 d-flex align-items-center gap-3"
                      style={{
                        border: `2px solid ${borderColor}`,
                        background: bg,
                        cursor: isEvaluated ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      <span className="fw-bold" style={{ color: 'var(--text-secondary)', minWidth: 24 }}>
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                      {isEvaluated && isAnswerCorrect && (
                        <CheckCircle size={18} color="var(--success)" className="ms-auto" />
                      )}
                      {isEvaluated && isAnswerWrong && (
                        <XCircle size={18} color="var(--danger)" className="ms-auto" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Evaluation Feedback */}
              {result && (
                <div className={`alert-card ${result.passed ? 'alert-green' : 'alert-pink'} mb-3`}>
                  <div className="d-flex align-items-start gap-2">
                    {result.passed ? (
                      <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
                    ) : (
                      <AlertCircle size={20} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                    )}
                    <div>
                      <div className="fw-bold mb-1">
                        {result.passed ? `Correct! Score: ${result.percentage}%` : `Review Needed — Score: ${result.percentage}%`}
                      </div>
                      <span style={{ fontSize: 13 }}>{result.feedback}</span>
                    </div>
                  </div>
                </div>
              )}

              {!result && (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null || submitting}
                  className="btn-primary-accent d-flex align-items-center justify-content-center gap-2"
                  style={{ padding: '10px 24px', fontSize: 14 }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Evaluating...
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="text-secondary fst-italic" style={{ fontSize: 13 }}>
            Continuous practice builds fluent ASL communication.
          </span>
          {result && (
            <button onClick={fetchQuiz} className="btn-secondary d-flex align-items-center gap-2">
              <RefreshCw size={14} /> Practice Again
            </button>
          )}
        </div>
      </div>
    </>
  );
}
