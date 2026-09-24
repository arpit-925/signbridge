import { useState, useEffect } from 'react';
import { Upload, Search, Loader2, AlertCircle, RefreshCw, X, CheckCircle } from 'lucide-react';
import { teacherApi } from '../../services/teacherApi';

export default function TeacherResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Printable Classroom Materials');
  const [newGrade, setNewGrade] = useState('Grade 1-3');
  const [uploading, setUploading] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await teacherApi.getResources();
      setResources(res || []);
    } catch (err) {
      setError(err.message || 'Unable to load teacher resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setUploading(true);
    try {
      await teacherApi.createResource({
        title: newTitle.trim(),
        type: newType,
        grade: newGrade,
        badge: 'CUSTOM RESOURCE',
      });
      setShowUploadModal(false);
      setNewTitle('');
      setSuccessToast('Custom resource published successfully!');
      setTimeout(() => setSuccessToast(null), 4000);
      await fetchResources();
    } catch (err) {
      alert(err.message || 'Failed to publish resource');
    } finally {
      setUploading(false);
    }
  };

  const filtered = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h1>Curriculum & Teacher Resources</h1>
          <p>Access pre-built lesson plans, worksheets, methodology documents, and visual guides.</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="btn-primary-accent">
          <Upload size={14} /> Upload Custom Resource
        </button>
      </div>

      <div className="page-body">
        {successToast && (
          <div className="alert-card alert-green mb-3 d-flex align-items-center gap-2">
            <CheckCircle size={18} color="var(--success)" />
            <span>{successToast}</span>
          </div>
        )}

        <div className="search-bar mb-3">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search curriculum files, printable flashcards, teaching guidelines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ background: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}
          >
            <div className="sb-card" style={{ width: '90%', maxWidth: 480 }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Upload Curriculum Resource</h5>
                <button onClick={() => setShowUploadModal(false)} className="btn btn-sm btn-link p-0 text-secondary">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleUpload}>
                <div className="sb-form-group">
                  <label>Resource Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ASL Weather Vocabulary Flashcards"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="sb-form-group">
                  <label>Resource Type</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                    <option>Printable Classroom Materials</option>
                    <option>Instructional Video Reference</option>
                    <option>Lesson Plan Document</option>
                    <option>Quiz & Assessment Sheet</option>
                  </select>
                </div>
                <div className="sb-form-group">
                  <label>Grade Level</label>
                  <select value={newGrade} onChange={(e) => setNewGrade(e.target.value)}>
                    <option>Grade 1-3</option>
                    <option>Grade 4-6</option>
                    <option>Middle School (Grade 7-8)</option>
                    <option>Teacher Preparation</option>
                  </select>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={uploading} className="btn-primary-accent d-flex align-items-center gap-2">
                    {uploading && <Loader2 size={16} className="animate-spin" />}
                    Publish Resource
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading && (
          <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
            <Loader2 size={32} className="animate-spin text-primary mb-2" />
            <span className="text-secondary" style={{ fontSize: 14 }}>Loading curriculum resources...</span>
          </div>
        )}

        {error && !loading && (
          <div className="alert-card alert-pink d-flex align-items-center justify-content-between p-3 my-3">
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={18} color="var(--danger)" />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
            <button onClick={fetchResources} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="sb-card mb-3">
            <div className="sb-card-title">📚 Standard K-12 Lesson Modules & Materials</div>
            {filtered.length === 0 ? (
              <p className="text-secondary p-4 text-center mb-0">No resources found matching search.</p>
            ) : (
              <div className="row g-3">
                {filtered.map((resource, i) => (
                  <div key={resource._id || i} className="col-md-6">
                    <div
                      className="p-3 rounded-2"
                      style={{ border: '1px solid var(--border-color)', background: 'var(--background)' }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0" style={{ fontSize: 15 }}>{resource.title}</h6>
                        <span className="badge-free">{resource.badge || 'FREE STANDARD'}</span>
                      </div>
                      <p className="text-secondary mb-3" style={{ fontSize: 13 }}>
                        {resource.type} • {resource.grade}
                      </p>
                      <button className="btn-success" style={{ fontSize: 12 }}>
                        Assign to Class
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
