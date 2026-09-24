import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Send, Camera, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { teacherApi } from '../../services/teacherApi';

export default function AssignmentCreation() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [classId, setClassId] = useState('');
  const [title, setTitle] = useState('Video Practice: Simple Classroom Greetings');
  const [description, setDescription] = useState(
    'Watch the instructional greetings, practice the visual signs for "hello", "thank you", and "good morning". Record yourself signing back clearly with good lighting.'
  );
  const [includedLessonResource, setIncludedLessonResource] = useState('Common Classroom Greetings (ASL Core)');
  const [dueDateDays, setDueDateDays] = useState(3);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const res = await teacherApi.getClasses();
        setClasses(res || []);
        if (res && res.length > 0) {
          setClassId(res[0].id || res[0]._id);
        }
      } catch (err) {
        console.warn('Failed to fetch classes:', err.message);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  const handlePublish = async (status = 'Published') => {
    if (!title.trim()) {
      setFeedback({ type: 'error', text: 'Please enter an assignment title.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(dueDateDays, 10));

      await teacherApi.createAssignment({
        classId: classId || undefined,
        title: title.trim(),
        description: description.trim(),
        includedLessonResource,
        dueDate,
        status,
      });

      setFeedback({
        type: 'success',
        text: `Assignment successfully ${status === 'Published' ? 'published' : 'saved as draft'}!`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to create assignment.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h1>Create New Assignment</h1>
          <p>Design inclusive video response activities or auto-graded curriculum tasks.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={() => handlePublish('Draft')}
            disabled={saving}
            className="btn-secondary d-flex align-items-center gap-2"
          >
            <Save size={14} /> Save Draft
          </button>
          <button
            onClick={() => handlePublish('Published')}
            disabled={saving}
            className="btn-primary-accent d-flex align-items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Publish Assignment
          </button>
        </div>
      </div>

      <div className="page-body">
        {feedback && (
          <div className={`alert-card ${feedback.type === 'success' ? 'alert-green' : 'alert-pink'} mb-4 d-flex align-items-center gap-2`}>
            {feedback.type === 'success' ? (
              <CheckCircle size={18} color="var(--success)" />
            ) : (
              <AlertCircle size={18} color="var(--danger)" />
            )}
            <span style={{ fontSize: 14 }}>{feedback.text}</span>
          </div>
        )}

        <div className="row g-4">
          {/* Assignment Form */}
          <div className="col-lg-7">
            <div className="sb-card">
              <div className="sb-card-title">📝 Assignment Details</div>

              <div className="sb-form-group">
                <label>Assign to Class</label>
                {loadingClasses ? (
                  <div className="text-secondary py-2">Loading classes...</div>
                ) : (
                  <select value={classId} onChange={(e) => setClassId(e.target.value)}>
                    {classes.map((cls) => {
                      const id = cls.id || cls._id;
                      return (
                        <option key={id} value={id}>
                          {cls.name} ({cls.grade})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div className="sb-form-group">
                <label>Assignment Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Video Practice: Simple Classroom Greetings"
                />
              </div>

              <div className="sb-form-group">
                <label>Description & Task Directions</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail what students should practice and sign..."
                />
              </div>

              <div className="sb-form-group">
                <label>Included Lesson Resource</label>
                <input
                  type="text"
                  value={includedLessonResource}
                  onChange={(e) => setIncludedLessonResource(e.target.value)}
                  placeholder="e.g. Common Classroom Greetings (ASL Core)"
                />
              </div>

              <div className="sb-form-group">
                <label>Due Date Timeline</label>
                <select value={dueDateDays} onChange={(e) => setDueDateDays(e.target.value)}>
                  <option value={1}>Due in 1 day (Tomorrow)</option>
                  <option value={3}>Due in 3 days</option>
                  <option value={7}>Due in 1 week</option>
                  <option value={14}>Due in 2 weeks</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="col-lg-5">
            <div
              className="sb-card"
              style={{
                background: 'linear-gradient(180deg, #F0FDFA 0%, #FFFFFF 100%)',
                border: '2px solid var(--primary-light)',
              }}
            >
              <div className="text-center mb-3">
                <span
                  className="text-secondary"
                  style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Live Student View Preview
                </span>
              </div>

              <div className="p-3 rounded-3" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
                <div className="d-flex gap-2 mb-3">
                  <span className="badge-active" style={{ fontSize: 10 }}>STUDENT ASSIGNMENT</span>
                  <span className="text-secondary d-flex align-items-center gap-1" style={{ fontSize: 11 }}>
                    <Clock size={12} /> Due in {dueDateDays} days
                  </span>
                </div>

                <h6 className="fw-bold mb-2" style={{ fontSize: 15 }}>
                  {title || 'Untitled Assignment'}
                </h6>
                <p className="text-secondary mb-3" style={{ fontSize: 12 }}>
                  {description || 'No description provided.'}
                </p>

                <div className="video-container mb-3" style={{ minHeight: 140, borderRadius: 'var(--radius-md)' }}>
                  <div className="text-white text-center">
                    <span style={{ fontSize: 40 }}>👩‍🏫</span>
                    <p style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>
                      Resource: {includedLessonResource}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary-accent w-100"
                  style={{
                    padding: '10px',
                    justifyContent: 'center',
                    fontSize: 13,
                    background: 'transparent',
                    color: 'var(--accent)',
                    border: '2px solid var(--accent)',
                  }}
                >
                  <Camera size={14} /> Record Response Camera
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
