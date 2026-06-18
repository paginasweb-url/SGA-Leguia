import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';

import Dashboard from './pages/Dashboard';
import DashboardLayout from './layouts/DashboardLayout';
import ModulePage from './pages/shared/ModulePage';

import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import ChangePassword from './pages/public/ChangePassword';
import EnrollmentFormats from './pages/public/EnrollmentFormats';
import EnrollmentRequest from './pages/public/EnrollmentRequest';
import EnrollmentTracking from './pages/public/EnrollmentTracking';
import RecoverPassword from './pages/public/RecoverPassword';

import EnrollmentRequestsAdmin from './pages/enrollments/EnrollmentRequestsAdmin';
import EnrollmentFormatsAdmin from './pages/enrollmentFormats/EnrollmentFormatsAdmin';

import SecurityAdmin from './pages/security/SecurityAdmin';

import AnnouncementsPage from './pages/announcements/AnnouncementsPage';

import UsersAdmin from './pages/users/UsersAdmin';

import ClassroomsAdmin from './pages/classrooms/ClassroomsAdmin';

import CoursesAdmin from './pages/courses/CoursesAdmin';
import TeacherCourses from './pages/courses/TeacherCourses';
import StudentCourses from './pages/courses/StudentCourses';

import SchedulesAdmin from './pages/schedules/SchedulesAdmin';
import MySchedule from './pages/schedules/MySchedule';

import AttendanceAdmin from './pages/attendance/AttendanceAdmin';
import MyAttendance from './pages/attendance/MyAttendance';

import TeacherStudents from './pages/teachers/TeacherStudents';

import GradesAdmin from './pages/grades/GradesAdmin';
import TeacherGrades from './pages/grades/TeacherGrades';
import MyGrades from './pages/grades/MyGrades';

import AnnualResultsAdmin from './pages/annualResults/AnnualResultsAdmin';
import TeacherAnnualResults from './pages/annualResults/TeacherAnnualResults';
import MyAnnualResults from './pages/annualResults/MyAnnualResults';

import MyProgress from './pages/progress/MyProgress';

import ReportsAdmin from './pages/reports/ReportsAdmin';

import SettingsAdmin from './pages/settings/SettingsAdmin';

import GuardianChildren from './pages/guardians/GuardianChildren';

import AuxiliaryStudents from './pages/students/AuxiliaryStudents';

const protectedElement = (element, roles = null) => {
  return (
    <ProtectedRoute>
      {roles ? (
        <RoleRoute allowedRoles={roles}>
          {element}
        </RoleRoute>
      ) : (
        element
      )}
    </ProtectedRoute>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/matricula/solicitud"
            element={<EnrollmentRequest />}
          />

          <Route
            path="/matricula/seguimiento"
            element={<EnrollmentTracking />}
          />

          <Route
            path="/matricula/formatos"
            element={<EnrollmentFormats />}
          />

          <Route
            path="/recuperar-password"
            element={<RecoverPassword />}
          />
        </Route>

        <Route
          path="/cambiar-password"
          element={protectedElement(<ChangePassword />)}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Director */}
        <Route
          path="/director/users"
          element={protectedElement(
            <DashboardLayout>
              <UsersAdmin />
            </DashboardLayout>,
            ['Director']
          )}
        />
        <Route
          path="/director/enrollments"
          element={protectedElement(
            <DashboardLayout>
              <EnrollmentRequestsAdmin />
            </DashboardLayout>,
            ['Director']
          )}
        />
        <Route
          path="/director/classrooms"
          element={protectedElement(
            <DashboardLayout>
              <ClassroomsAdmin />
            </DashboardLayout>,
            ['Director']
          )}
        />
        <Route
          path="/director/courses"
          element={protectedElement(
            <DashboardLayout>
              <CoursesAdmin />
            </DashboardLayout>,
            ['Director']
          )}
        />
        <Route
          path="/director/schedules"
          element={protectedElement(
            <DashboardLayout>
              <SchedulesAdmin />
            </DashboardLayout>,
            ['Director']
          )}
        />
        <Route
          path="/director/attendance"
          element={protectedElement(
            <DashboardLayout>
              <AttendanceAdmin />
            </DashboardLayout>,
            ['Director']
          )}
        />
        <Route
          path="/director/grades"
          element={protectedElement(
            <DashboardLayout>
              <GradesAdmin />
            </DashboardLayout>,
            ['Director']
          )}
        />
        <Route
          path="/director/formats"
          element={protectedElement(
            <DashboardLayout>
              <EnrollmentFormatsAdmin />
            </DashboardLayout>,
            ['Director']
          )}
        />
        <Route
          path="/director/annual-results"
          element={protectedElement(
            <DashboardLayout>
              <AnnualResultsAdmin />
            </DashboardLayout>,
            ['Director']
          )}
        />
        <Route
          path="/director/announcements"
          element={protectedElement(
            <DashboardLayout>
              <AnnouncementsPage />
            </DashboardLayout>,
            ['Director']
          )}
        />
        <Route
          path="/director/reports"
          element={protectedElement(
            <DashboardLayout>
              <ReportsAdmin />
            </DashboardLayout>,
            ['Director']
          )}
        />
        <Route
          path="/director/security"
          element={protectedElement(
            <DashboardLayout>
              <SecurityAdmin />
            </DashboardLayout>,
            ['Director']
          )}
        />
        <Route
          path="/director/settings"
          element={protectedElement(
            <DashboardLayout>
              <SettingsAdmin />
            </DashboardLayout>,
            ['Director']
          )}
        />

        {/* Administrativo */}
        <Route
          path="/admin/users"
          element={protectedElement(
            <DashboardLayout>
              <UsersAdmin />
            </DashboardLayout>,
            ['Administrativo']
          )}
        />
        <Route
          path="/admin/enrollments"
          element={protectedElement(
            <DashboardLayout>
              <EnrollmentRequestsAdmin />
            </DashboardLayout>,
            ['Administrativo']
          )}
        />
        <Route
          path="/admin/formats"
          element={protectedElement(
            <DashboardLayout>
              <EnrollmentFormatsAdmin />
            </DashboardLayout>,
            ['Administrativo']
          )}
        />
        <Route
          path="/admin/announcements"
          element={protectedElement(
            <DashboardLayout>
              <AnnouncementsPage />
            </DashboardLayout>,
            ['Administrativo']
          )}
        />
        <Route
          path="/admin/reports"
          element={protectedElement(
            <DashboardLayout>
              <ReportsAdmin />
            </DashboardLayout>,
            ['Administrativo']
          )}
        />
        <Route
          path="/admin/security"
          element={protectedElement(
            <DashboardLayout>
              <SecurityAdmin />
            </DashboardLayout>,
            ['Administrativo']
          )}
        />
        <Route
          path="/admin/settings"
          element={protectedElement(
            <DashboardLayout>
              <SettingsAdmin />
            </DashboardLayout>,
            ['Administrativo']
          )}
        />

        {/* Auxiliar */}
        <Route
          path="/auxiliary/attendance"
          element={protectedElement(
            <DashboardLayout>
              <AttendanceAdmin />
            </DashboardLayout>,
            ['Auxiliar']
          )}
        />
        <Route
          path="/auxiliary/students"
          element={protectedElement(
            <DashboardLayout>
              <AuxiliaryStudents />
            </DashboardLayout>,
            ['Auxiliar']
          )}
        />
        <Route
          path="/auxiliary/reports"
          element={protectedElement(
            <DashboardLayout>
              <ReportsAdmin />
            </DashboardLayout>,
            ['Auxiliar']
          )}
        />
        <Route
          path="/auxiliary/announcements"
          element={protectedElement(
            <DashboardLayout>
              <AnnouncementsPage />
            </DashboardLayout>,
            ['Auxiliar']
          )}
        />
        <Route
          path="/auxiliary/settings"
          element={protectedElement(
            <DashboardLayout>
              <SettingsAdmin />
            </DashboardLayout>,
            ['Auxiliar']
          )}
        />
        {/* Docente */}
        <Route
          path="/teacher/courses"
          element={protectedElement(
            <DashboardLayout>
              <TeacherCourses />
            </DashboardLayout>,
            ['Docente']
          )}
        />
        <Route
          path="/teacher/schedules"
          element={protectedElement(
            <DashboardLayout>
              <MySchedule />
            </DashboardLayout>,
            ['Docente']
          )}
        />
        <Route
          path="/teacher/attendance"
          element={protectedElement(
            <DashboardLayout>
              <MyAttendance />
            </DashboardLayout>,
            ['Docente']
          )}
        />
        <Route
          path="/teacher/students"
          element={protectedElement(
            <DashboardLayout>
              <TeacherStudents />
            </DashboardLayout>,
            ['Docente']
          )}
        />
        <Route
          path="/teacher/grades"
          element={protectedElement(
            <DashboardLayout>
              <TeacherGrades />
            </DashboardLayout>,
            ['Docente']
          )}
        />
        <Route
          path="/teacher/annual-results"
          element={protectedElement(
            <DashboardLayout>
              <TeacherAnnualResults />
            </DashboardLayout>,
            ['Docente']
          )}
        />
        <Route
          path="/teacher/announcements"
          element={protectedElement(
            <DashboardLayout>
              <AnnouncementsPage />
            </DashboardLayout>,
            ['Docente']
          )}
        />
        <Route
          path="/teacher/settings"
          element={protectedElement(
            <DashboardLayout>
              <SettingsAdmin />
            </DashboardLayout>,
            ['Docente']
          )}
        />

        {/* Estudiante */}
        <Route
          path="/student/courses"
          element={protectedElement(
            <DashboardLayout>
              <StudentCourses />
            </DashboardLayout>,
            ['Estudiante']
          )}
        />
        <Route
          path="/student/schedule"
          element={protectedElement(
            <DashboardLayout>
              <MySchedule />
            </DashboardLayout>,
            ['Estudiante']
          )}
        />
        <Route
          path="/student/attendance"
          element={protectedElement(
            <DashboardLayout>
              <MyAttendance />
            </DashboardLayout>,
            ['Estudiante']
          )}
        />
        <Route
          path="/student/grades"
          element={protectedElement(
            <DashboardLayout>
              <MyGrades />
            </DashboardLayout>,
            ['Estudiante']
          )}
        />
        <Route
          path="/student/annual-result"
          element={protectedElement(
            <DashboardLayout>
              <MyAnnualResults />
            </DashboardLayout>,
            ['Estudiante']
          )}
        />
        <Route
          path="/student/announcements"
          element={protectedElement(
            <DashboardLayout>
              <AnnouncementsPage />
            </DashboardLayout>,
            ['Estudiante']
          )}
        />
        <Route
          path="/student/progress"
          element={protectedElement(
            <DashboardLayout>
              <MyProgress />
            </DashboardLayout>,
            ['Estudiante']
          )}
        />
        <Route
          path="/student/settings"
          element={protectedElement(
            <DashboardLayout>
              <SettingsAdmin />
            </DashboardLayout>,
            ['Estudiante']
          )}
        />

        {/* Apoderado */}
        <Route
          path="/guardian/children"
          element={protectedElement(
            <DashboardLayout>
              <GuardianChildren />
            </DashboardLayout>,
            ['Apoderado']
          )}
        />
        <Route
          path="/guardian/grades"
          element={protectedElement(
            <DashboardLayout>
              <MyGrades />
            </DashboardLayout>,
            ['Apoderado']
          )}
        />
        <Route
          path="/guardian/schedule"
          element={protectedElement(
            <DashboardLayout>
              <MySchedule />
            </DashboardLayout>,
            ['Apoderado']
          )}
        />
        <Route
          path="/guardian/annual-result"
          element={protectedElement(
            <DashboardLayout>
              <MyAnnualResults />
            </DashboardLayout>,
            ['Apoderado']
          )}
        />
        <Route
          path="/guardian/attendance"
          element={protectedElement(
            <DashboardLayout>
              <MyAttendance />
            </DashboardLayout>,
            ['Apoderado']
          )}
        />
        <Route
          path="/guardian/announcements"
          element={protectedElement(
            <DashboardLayout>
              <AnnouncementsPage />
            </DashboardLayout>,
            ['Apoderado']
          )}
        />
        <Route
          path="/guardian/progress"
          element={protectedElement(
            <DashboardLayout>
              <MyProgress />
            </DashboardLayout>,
            ['Apoderado']
          )}
        />
        <Route
          path="/guardian/settings"
          element={protectedElement(
            <DashboardLayout>
              <SettingsAdmin />
            </DashboardLayout>,
            ['Apoderado']
          )}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;