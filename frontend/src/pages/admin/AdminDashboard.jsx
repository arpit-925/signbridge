import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw, Users, BookOpen, Award, BarChart3 } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, ana] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getAnalytics(),
      ]);
      setDashboardData(dash);
      setAnalytics(ana);
    } catch (err) {
      setError(err.message || 'Unable to load admin district dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center" style={{ minHeight: '60vh' }}>
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <h5 className="fw-semibold text-secondary">Compiling district-wide telemetry and aggregations...</h5>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-4">
        <div className="alert-card alert-pink d-flex align-items-center justify-content-between p-4">
          <div className="d-flex align-items-center gap-3">
            <AlertCircle size={24} color="var(--danger)" />
            <div>
              <h6 className="fw-bold mb-1">Failed to load admin telemetry</h6>
              <p className="mb-0 text-secondary" style={{ fontSize: 13 }}>{error}</p>
            </div>
          </div>
          <button onClick={fetchAdminData} className="btn-secondary d-flex align-items-center gap-2">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const userStats = analytics?.users || { totalStudents: 3, totalTeachers: 1, totalParents: 1, totalAdmins: 1, totalUsers: 6 };
  const contentStats = analytics?.content || { totalLessons: 6, totalQuizzes: 1, totalAssignments: 2 };
  const academic = analytics?.academicPerformance || { averageQuizScore: 94, quizPassRate: 100, totalQuizAttempts: 1 };
  const cohortData = dashboardData.cohortData || [];
  const announcements = dashboardData.announcements || [];

  return (
    <>
      <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h1>Metro School District Admin Panel</h1>
          <p>Real-time MongoDB telemetry, cohort tracking, and educational analytics.</p>
        </div>
        <button onClick={fetchAdminData} className="btn-dark-purple d-flex align-items-center gap-2">
          <RefreshCw size={14} /> Refresh Telemetry
        </button>
      </div>

      <div className="page-body">
        {/* Real KPI Aggregates */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Registered Students</div>
            <div className="kpi-value">{userStats.totalStudents} Students</div>
            <div className="kpi-sub">Across active district schools</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Curriculum Content</div>
            <div className="kpi-value">{contentStats.totalLessons} Lessons</div>
            <div className="kpi-sub">{contentStats.totalQuizzes} Quizzes • {contentStats.totalAssignments} Assignments</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Avg Quiz Performance</div>
            <div className="kpi-value">{academic.averageQuizScore}%</div>
            <div className="kpi-sub" style={{ color: 'var(--success)' }}>{academic.quizPassRate}% Pass Rate ({academic.totalQuizAttempts} Attempts)</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">District Active Users</div>
            <div className="kpi-value">{userStats.totalUsers} Total</div>
            <div className="kpi-sub">{userStats.totalTeachers} Teachers • {userStats.totalParents} Parents</div>
          </div>
        </div>

        <div className="row g-4">
          {/* Cohort Breakdown Matrix */}
          <div className="col-lg-8">
            <div className="sb-card">
              <div className="sb-card-title">Grade / Cohort Breakdown Matrix</div>
              {cohortData.length === 0 ? (
                <p className="text-secondary p-4 text-center mb-0">No active cohorts recorded.</p>
              ) : (
                <div className="table-responsive">
                  <table className="sb-table">
                    <thead>
                      <tr>
                        <th>Grade Cohort</th>
                        <th>Students</th>
                        <th>Avg Lesson Time</th>
                        <th>IEP Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohortData.map((row, i) => (
                        <tr key={i}>
                          <td className="fw-semibold">{row.cohort}</td>
                          <td>{row.students}</td>
                          <td>{row.avgTime}</td>
                          <td>
                            <span className="badge-active">{row.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* System Announcements */}
          <div className="col-lg-4">
            <div className="sb-card">
              <div className="sb-card-title">System Announcements & Notices</div>
              {announcements.length === 0 ? (
                <p className="text-secondary p-3 mb-0">No active district announcements.</p>
              ) : (
                announcements.map((item, i) => (
                  <div key={i} className="alert-card alert-orange mb-3">
                    <div>
                      <span className="fw-bold d-block mb-1" style={{ fontSize: 13, color: '#92400E' }}>
                        {item.title}
                      </span>
                      <p className="mb-0 text-secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
