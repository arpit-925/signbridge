import { useState, useEffect } from 'react';
import { Plus, Settings, Loader2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { teacherApi } from '../../services/teacherApi';

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState(null);

  // New Class Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('Grade 2');
  const [newClassModule, setNewClassModule] = useState('Greetings Module');
  const [submitting, setSubmitting] = useState(false);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await teacherApi.getClasses();
      setClasses(res || []);
      if (res && res.length > 0) {
        const firstId = res[0].id || res[0]._id;
        setSelectedClassId(firstId);
        loadStudents(firstId);
      }
    } catch (err) {
      setError(err.message || 'Unable to fetch classes.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId) => {
    setStudentsLoading(true);
    try {
      const roster = await teacherApi.getClassStudents(classId);
      setStudents(roster || []);
    } catch (err) {
      console.warn('Failed to load roster:', err.message);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleSelectClass = (cls) => {
    const id = cls.id || cls._id;
    setSelectedClassId(id);
    loadStudents(id);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setSubmitting(true);
    try {
      await teacherApi.createClass({
        name: newClassName.trim(),
        grade: newClassGrade,
        module: newClassModule,
        code: `ASL-${Math.floor(100 + Math.random() * 900)}`,
      });
      setShowAddModal(false);
      setNewClassName('');
      await fetchClasses();
    } catch (err) {
      alert(err.message || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const activeClass = classes.find((c) => (c.id || c._id) === selectedClassId) || classes[0];

  return (
    <>
      <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h1>Class Management</h1>
          <p>Configure accessibility parameters, rosters, and lesson plans for your assigned classrooms.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary-accent">
          <Plus size={16} /> Add New Class
        </button>
      </div>

      <div className="page-body">
        {loading && (
          <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
            <Loader2 size={32} className="animate-spin text-primary mb-2" />
            <span className="text-secondary" style={{ fontSize: 14 }}>Loading classroom portals...</span>
          </div>
        )}

        {error && !loading && (
          <div className="alert-card alert-pink d-flex align-items-center justify-content-between p-3 my-3">
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={18} color="var(--danger)" />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
            <button onClick={fetchClasses} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Modal for adding new class */}
        {showAddModal && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ background: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}
          >
            <div className="sb-card" style={{ width: '90%', maxWidth: 480 }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Create Classroom</h5>
                <button onClick={() => setShowAddModal(false)} className="btn btn-sm btn-link p-0 text-secondary">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateClass}>
                <div className="sb-form-group">
                  <label>Class Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ASL 201 - Everyday Conversations"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                  />
                </div>
                <div className="sb-form-group">
                  <label>Grade Level</label>
                  <select value={newClassGrade} onChange={(e) => setNewClassGrade(e.target.value)}>
                    <option>Grade 1</option>
                    <option>Grade 2</option>
                    <option>Grade 3</option>
                    <option>Grade 4</option>
                    <option>Grade 5</option>
                    <option>Grade 6</option>
                  </select>
                </div>
                <div className="sb-form-group">
                  <label>Initial Learning Module</label>
                  <input
                    type="text"
                    placeholder="e.g. Greetings & Introductions"
                    value={newClassModule}
                    onChange={(e) => setNewClassModule(e.target.value)}
                  />
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary-accent d-flex align-items-center gap-2">
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    Create Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Class Cards */}
            <div className="row g-3 mb-4">
              {classes.map((cls) => {
                const id = cls.id || cls._id;
                const isSelected = id === selectedClassId;
                return (
                  <div key={id} className="col-md-6" onClick={() => handleSelectClass(cls)} style={{ cursor: 'pointer' }}>
                    <div
                      className="sb-card"
                      style={{
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: isSelected ? 'var(--background)' : 'var(--surface)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="fw-bold mb-1" style={{ fontSize: 16 }}>{cls.name}</h5>
                          <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>{cls.grade}</span>
                        </div>
                        {isSelected && <span className="badge-active">Selected Roster</span>}
                      </div>
                      <p className="text-secondary mb-3" style={{ fontSize: 13 }}>
                        Roster: {cls.roster || (cls.students?.length || 0)} Students | {cls.module || 'Standard Curriculum'}
                      </p>
                      <div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-secondary" style={{ fontSize: 12 }}>Overall Classroom Progress</span>
                          <span className="fw-bold" style={{ fontSize: 12 }}>{cls.progress || 75}%</span>
                        </div>
                        <div className="progress-bar-wrapper">
                          <div className="progress-bar-fill teal" style={{ width: `${cls.progress || 75}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Student Roster Table */}
            <div className="sb-card">
              <div className="sb-card-title d-flex justify-content-between align-items-center">
                <span>Active Student Roster — {activeClass?.name || 'Class Roster'}</span>
                {studentsLoading && <Loader2 size={16} className="animate-spin text-primary" />}
              </div>

              {students.length === 0 ? (
                <p className="text-secondary p-4 text-center mb-0">No students enrolled in this class yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="sb-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Enrollment Date</th>
                        <th>Progress</th>
                        <th>Last Active</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => (
                        <tr key={i}>
                          <td className="fw-semibold">{s.name}</td>
                          <td>{s.enrollment || 'Sep 4, 2025'}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="progress-bar-wrapper" style={{ width: 100 }}>
                                <div className="progress-bar-fill teal" style={{ width: `${s.progress || 80}%` }} />
                              </div>
                              <span className="fw-semibold" style={{ fontSize: 12 }}>{s.progress || 80}%</span>
                            </div>
                          </td>
                          <td className="text-secondary">{s.lastActive || 'Today'}</td>
                          <td>
                            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                              <Settings size={12} /> Configure Modes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
