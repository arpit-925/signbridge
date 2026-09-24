import { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { teacherApi } from '../../services/teacherApi';

export default function FeedbackGrading() {
  const [submissions, setSubmissions] = useState([]);
  const [selected, setSelected] = useState(0);
  const [batchMode, setBatchMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [score, setScore] = useState(95);
  const [feedbackText, setFeedbackText] = useState('');
  const [grading, setGrading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await teacherApi.getSubmissions();
      setSubmissions(res || []);
      if (res && res.length > 0) {
        setScore(res[0].score || 90);
        setFeedbackText(res[0].feedback || 'Great clarity in hand gestures!');
      }
    } catch (err) {
      setError(err.message || 'Unable to load submissions queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const currentSubmission = submissions[selected] || submissions[0];

  useEffect(() => {
    if (currentSubmission) {
      setScore(currentSubmission.score || 90);
      setFeedbackText(currentSubmission.feedback || '');
    }
  }, [selected, currentSubmission]);

  const handleGrade = async (status = 'Graded') => {
    if (!currentSubmission) return;
    const id = currentSubmission._id || currentSubmission.id;
    setGrading(true);
    setStatusMessage(null);
    try {
      await teacherApi.gradeSubmission(id, {
        score: parseInt(score, 10),
        feedback: feedbackText,
        status,
      });

      setStatusMessage({
        type: 'success',
        text: `Submission ${status === 'Graded' ? 'graded and approved' : 'returned for revision'}!`,
      });

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) => ((s._id || s.id) === id ? { ...s, score: parseInt(score, 10), feedback: feedbackText, status } : s))
      );
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update grade.' });
    } finally {
      setGrading(false);
    }
  };

  return (
    <>
      <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h1>Feedback & Grading Desk</h1>
          <p>Review student-submitted sign-language video recordings and grade interactive homework.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="fw-medium" style={{ fontSize: 14 }}>Batch grading mode</span>
          <div className={`toggle-switch ${batchMode ? 'on' : ''}`} onClick={() => setBatchMode(!batchMode)} />
        </div>
      </div>

      <div className="page-body">
        {statusMessage && (
          <div
            className={`alert-card ${statusMessage.type === 'success' ? 'alert-green' : 'alert-pink'} mb-4 d-flex align-items-center gap-2`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle size={18} color="var(--success)" />
            ) : (
              <AlertCircle size={18} color="var(--danger)" />
            )}
            <span style={{ fontSize: 14 }}>{statusMessage.text}</span>
          </div>
        )}

        {loading && (
          <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
            <Loader2 size={32} className="animate-spin text-primary mb-2" />
            <span className="text-secondary" style={{ fontSize: 14 }}>Loading student submissions queue...</span>
          </div>
        )}

        {error && !loading && (
          <div className="alert-card alert-pink d-flex align-items-center justify-content-between p-3 my-3">
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={18} color="var(--danger)" />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
            <button onClick={fetchSubmissions} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && submissions.length === 0 && (
          <div className="sb-card text-center p-5">
            <p className="text-secondary mb-0">No submissions currently in the evaluation queue.</p>
          </div>
        )}

        {!loading && !error && submissions.length > 0 && currentSubmission && (
          <div className="row g-4">
            {/* Evaluation Queue */}
            <div className="col-lg-4">
              <div className="sb-card" style={{ padding: 0 }}>
                <div className="p-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <h6 className="fw-bold mb-0" style={{ fontSize: 15 }}>
                    Evaluation Queue ({submissions.length})
                  </h6>
                </div>
                {submissions.map((item, i) => {
                  const studentName = item.studentId?.name || item.studentName || 'Student';
                  const assignmentTitle = item.assignmentId?.title || item.assignment || 'Video Assignment';
                  const isSelected = selected === i;

                  return (
                    <div
                      key={item._id || i}
                      onClick={() => setSelected(i)}
                      className="p-3"
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--background)' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-semibold" style={{ fontSize: 14 }}>{studentName}</span>
                        <span className="text-secondary" style={{ fontSize: 11 }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                        </span>
                      </div>
                      <p className="text-secondary mb-1" style={{ fontSize: 12 }}>{assignmentTitle}</p>
                      <span className={item.status === 'Graded' ? 'badge-active' : 'badge-upcoming'} style={{ fontSize: 10 }}>
                        {item.status || 'Awaiting Review'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submission Detail */}
            <div className="col-lg-8">
              <div className="sb-card">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                  <div>
                    <h5 className="fw-bold mb-1" style={{ fontSize: 17 }}>
                      {currentSubmission.studentId?.name || currentSubmission.studentName || 'Student'}'s Submission
                    </h5>
                    <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                      {currentSubmission.assignmentId?.title || currentSubmission.assignment || 'Assignment'} • Status: {currentSubmission.status}
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      onClick={() => handleGrade('Needs Revision')}
                      disabled={grading}
                      className="btn-secondary"
                      style={{ fontSize: 13 }}
                    >
                      <RotateCcw size={14} /> Return for Revision
                    </button>
                    <button
                      onClick={() => handleGrade('Graded')}
                      disabled={grading}
                      className="btn-primary-accent d-flex align-items-center gap-2"
                      style={{ fontSize: 13 }}
                    >
                      {grading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Approve & Return Score
                    </button>
                  </div>
                </div>

                {/* Video Demo */}
                <div className="video-container mb-3" style={{ minHeight: 260 }}>
                  <div className="text-center text-white">
                    <div style={{ fontSize: 64, marginBottom: 12 }}>🧑‍🎓</div>
                    <p style={{ fontSize: 14, opacity: 0.8 }}>Student signing submission recording</p>
                  </div>
                </div>

                {/* AI Prediction */}
                <div className="p-3 rounded-2 mb-4" style={{ background: 'var(--background)', border: '1px solid var(--border-color)' }}>
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <span className="text-secondary" style={{ fontSize: 13 }}>
                      Auto AI translation prediction:{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>
                        "{currentSubmission.aiPrediction?.text || 'HELLO • GOOD MORNING • THANK YOU'}"
                      </strong>
                    </span>
                    <span className="badge-active">
                      AI Confidence: {currentSubmission.aiPrediction?.confidence || 95}% Match
                    </span>
                  </div>
                </div>

                {/* Grading Inputs */}
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="sb-form-group">
                      <label>Assign Score (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-8">
                    <div className="sb-form-group">
                      <label>Written Feedback Comments</label>
                      <textarea
                        rows={3}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Provide encouraging and actionable notes..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
