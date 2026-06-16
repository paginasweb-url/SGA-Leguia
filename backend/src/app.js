import express from 'express';
import cors from 'cors';

import usersRoutes from './routes/users.routes.js';
import authRoutes from './routes/auth.routes.js';
import studentsRoutes from './routes/students.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import teachersRoutes from './routes/teachers.routes.js';
import guardiansRoutes from './routes/guardians.routes.js';
import guardianStudentRoutes from './routes/guardianStudent.routes.js';
import gradesRoutes from './routes/grades.routes.js';
import sectionsRoutes from './routes/sections.routes.js';
import classroomsRoutes from './routes/classrooms.routes.js';
import academicPeriodsRoutes from './routes/academicPeriods.routes.js';
import coursesRoutes from './routes/courses.routes.js';
import teacherCourseRoutes from './routes/teacherCourse.routes.js';
import schedulesRoutes from './routes/schedules.routes.js';
import enrollmentRequestsRoutes from './routes/enrollmentRequests.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import gradesNotesRoutes from './routes/gradesNotes.routes.js';
import announcementsRoutes from './routes/announcements.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import progressRoutes from './routes/progress.routes.js';
import passwordRecoveryRoutes from './routes/passwordRecovery.routes.js';
import enrollmentFormatsRoutes from './routes/enrollmentFormats.routes.js';
import annualResultsRoutes from './routes/annualResults.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import rolesRoutes from './routes/roles.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend funcionando correctamente'
  });
});

app.use('/api/users', usersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/guardians', guardiansRoutes);
app.use('/api/guardian-student', guardianStudentRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/classrooms', classroomsRoutes);
app.use('/api/academic-periods', academicPeriodsRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/teacher-courses', teacherCourseRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/enrollment-requests', enrollmentRequestsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades-notes', gradesNotesRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/password-recovery', passwordRecoveryRoutes);
app.use('/api/enrollment-formats', enrollmentFormatsRoutes);
app.use('/api/annual-results', annualResultsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/roles', rolesRoutes);

export default app;