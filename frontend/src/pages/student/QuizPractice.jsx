import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { studentApi } from '../../services/studentApi';

export default function QuizPractice() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState(null);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    setSelectedOption(null);
    setAnswers([]);
    setCurrentIndex(0);
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

  const questions =
    quiz?.rawQuestions?.length > 0
      ? quiz.rawQuestions
      : [{ question: quiz?.question, options: quiz?.options, mediaUrl: quiz?.mediaUrl }];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || questions[0];

  const selectOption = (optionIndex) => {
    if (result) return;
    setSelectedOption(optionIndex);
    setAnswers((prev) => {
      const next = prev.filter((a) => a.questionIndex !== currentIndex);
      next.push({ questionIndex: currentIndex, selectedOption: optionIndex });
      return next.sort((a, b) => a.questionIndex - b.questionIndex);
    });
  };

  const goToQuestion = (nextIndex) => {
    setCurrentIndex(nextIndex);
    const existing = answers.find((a) => a.questionIndex === nextIndex);
    setSelectedOption(existing ? existing.selectedOption : null);
  };

  const handleSubmitAnswer = async () => {
    if (answers.length === 0) return;
    setSubmitting(true);
    try {
      const attemptRes = await studentApi.attemptQuiz(id || '1', answers);
      setResult(attemptRes);
      setCurrentIndex(0);
      setSelectedOption(answers[0]?.selectedOption ?? null);
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
        <h5 className="fw-semibold text-secondary">Loading evaluation questions…</h5>
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
          <Link to="/student" className="btn-secondary">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const options = currentQuestion.options || [];
  const currentResult = result?.answers?.find((a) => a.questionIndex === currentIndex);
  const answeredCount = answers.length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <h1 style={{ fontSize: 22 }}>{quiz.title}</h1>
            <p className="mb-0" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Question {currentIndex + 1} of {totalQuestions}
              {!result && (
                <span style={{ marginLeft: 12, color: 'var(--primary)', fontWeight: 600 }}>
                  {answeredCount}/{totalQuestions} answered
                </span>
              )}
            </p>
          </div>
          <span
            style={{
              background: '#EDE9FE',
              color: '#7C3AED',
              fontSize: 12,
              fontWeight: 700,
              padding: '5px 14px',
              borderRadius: 20,
              whiteSpace: 'nowrap',
              alignSelf: 'flex-start',
            }}
          >
            {quiz.mode || 'Untimed Practice'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="progress-bar-wrapper" style={{ height: 6 }}>
            <div
              className="progress-bar-fill purple"
              style={{ width: `${result ? 100 : progressPct}%`, transition: 'width 0.4s' }}
            />
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Question navigation dots */}
        {totalQuestions > 1 && (
          <div className="d-flex flex-wrap gap-2 mb-4">
            {questions.map((_, qi) => {
              const isAnswered = answers.some((a) => a.questionIndex === qi);
              const isCurrent = qi === currentIndex;
              const qResult = result?.answers?.find((a) => a.questionIndex === qi);
              let dotBg = 'var(--border-color)';
              if (result && qResult) {
                dotBg = qResult.isCorrect ? 'var(--success)' : 'var(--danger)';
              } else if (isCurrent) {
                dotBg = 'var(--primary)';
              } else if (isAnswered) {
                dotBg = 'var(--accent)';
              }
              return (
                <button
                  key={qi}
                  onClick={() => goToQuestion(qi)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: `2px solid ${isCurrent ? 'var(--primary)' : 'transparent'}`,
                    background: dotBg,
                    color: dotBg === 'var(--border-color)' ? 'var(--text-secondary)' : '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title={`Question ${qi + 1}`}
                >
                  {qi + 1}
                </button>
              );
            })}
          </div>
        )}

        {/* Two-column layout: Video | Question */}
        <div className="row g-4 align-items-start">
          {/* LEFT: Sign evaluation feed */}
          <div className="col-lg-5 col-md-12">
            <div className="sb-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Video / sign display area */}
              <div
                style={{
                  background: '#0d0d1a',
                  aspectRatio: '4/3',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  minHeight: 240,
                }}
              >
                {currentQuestion.mediaUrl ? (
                  <video
                    key={currentQuestion.mediaUrl}
                    src={currentQuestion.mediaUrl}
                    controls
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="text-center text-white p-4">
                    <div style={{ fontSize: 64, marginBottom: 12 }}>🧑‍🎓</div>
                    <p style={{ fontSize: 13, opacity: 0.75, margin: 0 }}>
                      3D Sign Language Evaluation Feed
                    </p>
                    <p style={{ fontSize: 11, opacity: 0.5, margin: '6px 0 0' }}>
                      Sign visual for question {currentIndex + 1}
                    </p>
                  </div>
                )}

                {/* Question number badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(79,70,229,0.85)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: 20,
                  }}
                >
                  Q{currentIndex + 1} / {totalQuestions}
                </div>
              </div>

              {/* Replay button */}
              <div
                className="d-flex align-items-center justify-content-center p-3"
                style={{ borderTop: '1px solid var(--border-color)' }}
              >
                <button
                  className="d-flex align-items-center gap-2 text-secondary"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 6,
                  }}
                  onClick={() => {
                    // replay video if present
                    const vid = document.querySelector('.quiz-video');
                    if (vid) { vid.currentTime = 0; vid.play(); }
                  }}
                >
                  <Play size={14} /> Replay visual sign prompt
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Question + options */}
          <div className="col-lg-7 col-md-12">
            <div className="sb-card">
              {/* Question text */}
              <div className="mb-4">
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                  }}
                >
                  Question {currentIndex + 1}
                </div>
                <h5
                  className="fw-bold mb-0"
                  style={{ fontSize: 17, lineHeight: 1.5, color: 'var(--text-primary)' }}
                >
                  {currentQuestion.question}
                </h5>
              </div>

              {/* Answer options */}
              <div className="d-flex flex-column gap-2 mb-4">
                {options.map((opt, i) => {
                  const isSelected = selectedOption === i;
                  const isEvaluated = result !== null;
                  const isAnswerCorrect = currentResult?.selectedOption === i && currentResult?.isCorrect;
                  const isAnswerWrong = currentResult?.selectedOption === i && !currentResult?.isCorrect;

                  let borderColor = 'var(--border-color)';
                  let bg = 'var(--surface)';
                  let textColor = 'var(--text-primary)';

                  if (isEvaluated) {
                    if (isAnswerCorrect) {
                      borderColor = 'var(--success)';
                      bg = 'var(--success-light)';
                      textColor = '#065f46';
                    } else if (isAnswerWrong) {
                      borderColor = 'var(--danger)';
                      bg = 'var(--danger-light)';
                      textColor = '#831843';
                    }
                  } else if (isSelected) {
                    borderColor = 'var(--primary)';
                    bg = 'rgba(13,148,136,0.08)';
                    textColor = 'var(--primary-dark)';
                  }

                  return (
                    <button
                      key={i}
                      disabled={isEvaluated || submitting}
                      onClick={() => selectOption(i)}
                      style={{
                        border: `2px solid ${borderColor}`,
                        background: bg,
                        cursor: isEvaluated ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        fontSize: 14,
                        fontWeight: isSelected || isEvaluated ? 600 : 500,
                        color: textColor,
                        borderRadius: 8,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <span
                        style={{
                          minWidth: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: isSelected && !isEvaluated ? 'var(--primary)' : isAnswerCorrect ? 'var(--success)' : isAnswerWrong ? 'var(--danger)' : 'var(--border-color)',
                          color: (isSelected || isAnswerCorrect || isAnswerWrong) ? '#fff' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                          transition: 'all 0.2s',
                        }}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span style={{ flex: 1 }}>{opt}</span>
                      {isEvaluated && isAnswerCorrect && (
                        <CheckCircle size={18} color="var(--success)" style={{ flexShrink: 0 }} />
                      )}
                      {isEvaluated && isAnswerWrong && (
                        <XCircle size={18} color="var(--danger)" style={{ flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Evaluation feedback */}
              {result && (
                <div
                  className={`alert-card ${result.passed ? 'alert-green' : 'alert-pink'} mb-4`}
                  style={{ padding: '14px 16px' }}
                >
                  <div className="d-flex align-items-start gap-2">
                    {result.passed ? (
                      <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
                    ) : (
                      <AlertCircle size={20} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                    )}
                    <div>
                      <div className="fw-bold mb-1" style={{ fontSize: 15 }}>
                        {result.passed
                          ? `✅ Quiz Passed! Score: ${result.percentage}%`
                          : `📝 Review Needed — Score: ${result.percentage}%`}
                      </div>
                      <span style={{ fontSize: 13 }}>{result.feedback}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation & submit */}
              <div className="d-flex flex-wrap align-items-center gap-2">
                {currentIndex > 0 && (
                  <button
                    onClick={() => goToQuestion(currentIndex - 1)}
                    disabled={submitting}
                    className="btn-secondary d-flex align-items-center gap-1"
                    style={{ fontSize: 13 }}
                  >
                    <ChevronLeft size={15} /> Previous
                  </button>
                )}

                {!result && currentIndex < totalQuestions - 1 && (
                  <button
                    onClick={() => goToQuestion(currentIndex + 1)}
                    disabled={selectedOption === null}
                    className="btn-primary-teal d-flex align-items-center gap-1"
                    style={{ padding: '10px 20px', fontSize: 14 }}
                  >
                    Next <ChevronRight size={15} />
                  </button>
                )}

                {!result && currentIndex === totalQuestions - 1 && (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={answers.length < totalQuestions || submitting}
                    className="btn-primary-accent d-flex align-items-center justify-content-center gap-2"
                    style={{ padding: '10px 24px', fontSize: 14 }}
                  >
                    {submitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Evaluating…</>
                    ) : (
                      `Submit Quiz (${answers.length}/${totalQuestions})`
                    )}
                  </button>
                )}

                {result && currentIndex < totalQuestions - 1 && (
                  <button
                    onClick={() => goToQuestion(currentIndex + 1)}
                    className="btn-secondary d-flex align-items-center gap-1"
                    style={{ fontSize: 13 }}
                  >
                    Next <ChevronRight size={15} />
                  </button>
                )}

                {result && (
                  <button
                    onClick={fetchQuiz}
                    className="btn-secondary d-flex align-items-center gap-2 ms-auto"
                  >
                    <RefreshCw size={14} /> Practice Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <span className="text-secondary fst-italic" style={{ fontSize: 13 }}>
            Continuous practice builds fluent ISL communication.
          </span>
        </div>
      </div>
    </>
  );
}
