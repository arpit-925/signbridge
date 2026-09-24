import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import LandingPage from '../pages/public/LandingPage';
import Signup from '../pages/public/Signup';
import Login from '../pages/public/Login';
import Onboarding from '../pages/public/Onboarding';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import LessonLibrary from '../pages/student/LessonLibrary';
import LessonView from '../pages/student/LessonView';
import QuizLibrary from '../pages/student/QuizLibrary';
import QuizPractice from '../pages/student/QuizPractice';
import SignConverter from '../pages/student/SignConverter';
import ObjectRecognition from '../pages/student/ObjectRecognition';
import StudentProgress from '../pages/student/StudentProgress';
import Achievements from '../pages/student/Achievements';
import MessagesNotifications from '../pages/student/MessagesNotifications';
import StudentSettings from '../pages/student/StudentSettings';

// Teacher Pages
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import ClassManagement from '../pages/teacher/ClassManagement';
import AssignmentCreation from '../pages/teacher/AssignmentCreation';
import StudentProgressMonitoring from '../pages/teacher/StudentProgressMonitoring';
import FeedbackGrading from '../pages/teacher/FeedbackGrading';
import TeacherResources from '../pages/teacher/TeacherResources';

// Parent Pages
import ParentDashboard from '../pages/parent/ParentDashboard';
import ChildProgressDetail from '../pages/parent/ChildProgressDetail';
import ParentCommunication from '../pages/parent/ParentCommunication';
import HelpCenter from '../pages/parent/HelpCenter';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';

import { currentUser, sidebarConfig } from '../data/mockData';

// Placeholder Component for sub-links
const Placeholder = ({ title }) => (
  <>
    <div className="page-header">
      <h1>{title}</h1>
      <p>This page is configured in the navigation and will contain specific management details.</p>
    </div>
    <div className="page-body">
      <div className="sb-card text-center p-5">
        <h4 className="text-secondary">Workspace Under Construction</h4>
        <p className="text-muted">Standard portal link fordistrict-wide management configurations.</p>
      </div>
    </div>
  </>
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Student Portal */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="student">
            <DashboardLayout config={sidebarConfig.student} user={currentUser.student} />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="lessons" element={<LessonLibrary />} />
        <Route path="lessons/:id" element={<LessonView />} />
        <Route path="quizzes" element={<QuizLibrary />} />
        <Route path="quizzes/:id" element={<QuizPractice />} />
        <Route path="converter" element={<SignConverter />} />
        <Route path="objects" element={<ObjectRecognition />} />
        <Route path="progress" element={<StudentProgress />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="messages" element={<MessagesNotifications />} />
        <Route path="settings" element={<StudentSettings />} />
      </Route>

      {/* Teacher Portal */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRole="teacher">
            <DashboardLayout config={sidebarConfig.teacher} user={currentUser.teacher} />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="classes" element={<ClassManagement />} />
        <Route path="assignments" element={<AssignmentCreation />} />
        <Route path="progress" element={<StudentProgressMonitoring />} />
        <Route path="grading" element={<FeedbackGrading />} />
        <Route path="resources" element={<TeacherResources />} />
        <Route path="settings" element={<Placeholder title="Teacher Account Settings" />} />
      </Route>

      {/* Parent Portal */}
      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRole="parent">
            <DashboardLayout config={sidebarConfig.parent} user={currentUser.parent} />
          </ProtectedRoute>
        }
      >
        <Route index element={<ParentDashboard />} />
        <Route path="children" element={<Placeholder title="My Children Profiles" />} />
        <Route path="progress" element={<ChildProgressDetail />} />
        <Route path="progress/:childId" element={<ChildProgressDetail />} />
        <Route path="messages" element={<ParentCommunication />} />
        <Route path="help" element={<HelpCenter />} />
        <Route path="settings" element={<Placeholder title="Parent Account Settings" />} />
      </Route>

      {/* Admin Portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <DashboardLayout config={sidebarConfig.admin} user={currentUser.admin} />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<Placeholder title="User Management Desk" />} />
        <Route path="courses" element={<Placeholder title="School Courses & Roster Config" />} />
        <Route path="settings" element={<Placeholder title="District System Settings" />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
