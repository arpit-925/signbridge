import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { teacherApi } from '../../services/teacherApi';

export default function StudentProgressMonitoring() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchClassesAndStudents = async () => {
    setLoading(true);
    try {
      const clsList = await teacherApi.getClasses();
      setClasses(clsList || []);
      if (clsList && clsList.length > 0) {
        const firstId = clsList[0].id || clsList[0]._id;
        setSelectedClassId(firstId);
        const roster = await teacherApi.getClassStudents(firstId);
        setStudents(roster || []);
        if (roster && roster.length > 0) {
          setSelectedStudent(roster[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to load monitoring data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndStudents();
  }, []);

  const handleClassChange = async (classId) => {
    setSelectedClassId(classId);
    setLoading(true);
    try {
      const roster = await teacherApi.getClassStudents(classId);
      setStudents(roster || []);
      if (roster && roster.length > 0) {
        setSelectedStudent(roster[0]);
      } else {
        setSelectedStudent(null);
      }
    } catch (err) {
      console.warn('Error loading class students:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = { Excelling: 'badge-active', 'On Track': 'badge-info', 'Needs Help': 'badge-danger' };

  const monitoringKPIs = [
    { label: 'Active Roster', value: `${students.length} Students`, sub: 'Enrolled in current cohort' },
    { label: 'Classroom Average', value: '82%', sub: '+3% improvement this sprint' },
    { label: 'Consistent Streaks', value: '88%', sub: 'Students practicing daily' },
  ];

  return (
    <>
      <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h1>Learning Analytics & Monitoring</h1>
          <p>Compare progress metrics, streaks, and individual evaluation trends.</p>
        </div>
        <select
          className="form-select"
          style={{ width: 'auto', fontSize: 14, borderRadius: 'var(--radius-md)' }}
          value={selectedClassId}
          onChange={(e) => handleClassChange(e.target.value)}
        >
          {classes.map((c) => {
            const id = c.id || c._id;
            return (
              <option key={id} value={id}>
                {c.name} ({c.grade})
              </option>
            );
          })}
        </select>
      </div>

      <div className="page-body">
        {/* KPIs */}
        <div className="kpi-grid">
          {monitoringKPIs.map((kpi, i) => (
            <div key={i} className="kpi-card">
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-sub">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
            <Loader2 size={32} className="animate-spin text-primary mb-2" />
            <span className="text-secondary" style={{ fontSize: 14 }}>Loading analytics roster...</span>
          </div>
        ) : (
          <div className="row g-4">
            {/* Performance Table */}
            <div className="col-lg-7">
              <div className="sb-card">
                <div className="sb-card-title">📊 Individual Performance Summary</div>
                {students.length === 0 ? (
                  <p className="text-secondary p-4 text-center mb-0">No student performance records in this class.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="sb-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Progress</th>
                          <th>Quiz Score</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, i) => {
                          const isSelected = selectedStudent?.name === s.name;
                          return (
                            <tr
                              key={i}
                              onClick={() => setSelectedStudent(s)}
                              style={{
                                cursor: 'pointer',
                                background: isSelected ? 'var(--background)' : 'transparent',
                              }}
                            >
                              <td className="fw-semibold">{s.name}</td>
                              <td>{s.progress || 80}%</td>
                              <td className="fw-semibold">92%</td>
                              <td>
                                <span className={statusColors[s.status || 'On Track']}>
                                  {s.status || 'On Track'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Student Detail */}
            <div className="col-lg-5">
              <div className="sb-card">
                <div className="sb-card-title">🔍 Student Detail Evaluation</div>
                <h6 className="fw-bold mb-3" style={{ color: 'var(--primary)' }}>
                  {selectedStudent?.name || 'Leo Chen'}
                </h6>
                {[
                  { label: 'ASL Basics & Greetings', value: selectedStudent?.progress || 95, color: 'teal' },
                  { label: 'Vocabulary Retention', value: 80, color: 'blue' },
                  { label: 'Signing Fluidity & Clarity', value: 88, color: 'orange' },
                ].map((s, i) => (
                  <div key={i} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span style={{ fontSize: 14 }}>{s.label}</span>
                      <span className="fw-bold" style={{ fontSize: 14 }}>{s.value}%</span>
                    </div>
                    <div className="progress-bar-wrapper">
                      <div className={`progress-bar-fill ${s.color}`} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
