import {
  LayoutDashboard,
  Users,
  FileText,
  School,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Bell,
  BarChart3,
  ShieldCheck,
  Settings,
  GraduationCap,
  UserRound,
  Home
} from 'lucide-react';

export const roleHomePath = {
  Director: '/dashboard',
  Administrativo: '/dashboard',
  Auxiliar: '/dashboard',
  Docente: '/dashboard',
  Estudiante: '/dashboard',
  Apoderado: '/dashboard'
};

export const navigationItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['Director', 'Administrativo', 'Auxiliar', 'Docente']
  },
  {
    label: 'Inicio',
    path: '/dashboard',
    icon: Home,
    roles: ['Estudiante', 'Apoderado']
  },

  // Usuarios
  {
    label: 'Usuarios',
    path: '/director/users',
    icon: Users,
    roles: ['Director']
  },
  {
    label: 'Usuarios',
    path: '/admin/users',
    icon: Users,
    roles: ['Administrativo']
  },

  // Matrículas
  {
    label: 'Matrículas',
    path: '/director/enrollments',
    icon: FileText,
    roles: ['Director']
  },
  {
    label: 'Matrículas',
    path: '/admin/enrollments',
    icon: FileText,
    roles: ['Administrativo']
  },

  // Formatos
  {
    label: 'Formatos',
    path: '/director/formats',
    icon: FileText,
    roles: ['Director']
  },
  {
    label: 'Formatos',
    path: '/admin/formats',
    icon: FileText,
    roles: ['Administrativo']
  },

  // Aulas
  {
    label: 'Aulas',
    path: '/director/classrooms',
    icon: School,
    roles: ['Director']
  },

  // Cursos
  {
    label: 'Cursos',
    path: '/director/courses',
    icon: BookOpen,
    roles: ['Director']
  },
  {
    label: 'Mis cursos',
    path: '/teacher/courses',
    icon: BookOpen,
    roles: ['Docente']
  },
  {
    label: 'Cursos',
    path: '/student/courses',
    icon: BookOpen,
    roles: ['Estudiante']
  },

  // Horarios
  {
    label: 'Horarios',
    path: '/director/schedules',
    icon: CalendarDays,
    roles: ['Director']
  },
  {
    label: 'Mis horarios',
    path: '/teacher/schedules',
    icon: CalendarDays,
    roles: ['Docente']
  },
  {
    label: 'Horario',
    path: '/student/schedule',
    icon: CalendarDays,
    roles: ['Estudiante']
  },
  {
    label: 'Horario',
    path: '/guardian/schedule',
    icon: CalendarDays,
    roles: ['Apoderado']
  },

  // Asistencia
  {
    label: 'Asistencia',
    path: '/director/attendance',
    icon: ClipboardCheck,
    roles: ['Director']
  },
  {
    label: 'Asistencia',
    path: '/auxiliary/attendance',
    icon: ClipboardCheck,
    roles: ['Auxiliar']
  },
  {
    label: 'Asistencia',
    path: '/teacher/attendance',
    icon: ClipboardCheck,
    roles: ['Docente']
  },
  {
    label: 'Asistencia',
    path: '/student/attendance',
    icon: ClipboardCheck,
    roles: ['Estudiante']
  },
  {
    label: 'Asistencia',
    path: '/guardian/attendance',
    icon: ClipboardCheck,
    roles: ['Apoderado']
  },

  // Estudiantes / hijos
  {
    label: 'Estudiantes',
    path: '/auxiliary/students',
    icon: GraduationCap,
    roles: ['Auxiliar']
  },
  {
    label: 'Mis estudiantes',
    path: '/teacher/students',
    icon: GraduationCap,
    roles: ['Docente']
  },
  {
    label: 'Mis hijos',
    path: '/guardian/children',
    icon: UserRound,
    roles: ['Apoderado']
  },

  // Notas
  {
    label: 'Notas',
    path: '/director/grades',
    icon: ClipboardList,
    roles: ['Director']
  },
  {
    label: 'Notas',
    path: '/teacher/grades',
    icon: ClipboardList,
    roles: ['Docente']
  },
  {
    label: 'Notas',
    path: '/student/grades',
    icon: ClipboardList,
    roles: ['Estudiante']
  },
  {
    label: 'Notas',
    path: '/guardian/grades',
    icon: ClipboardList,
    roles: ['Apoderado']
  },

  // Resultado anual
  {
    label: 'Resultado anual',
    path: '/director/annual-results',
    icon: BarChart3,
    roles: ['Director']
  },
  {
    label: 'Resultado anual',
    path: '/teacher/annual-results',
    icon: BarChart3,
    roles: ['Docente']
  },
  {
    label: 'Resultado anual',
    path: '/student/annual-result',
    icon: BarChart3,
    roles: ['Estudiante']
  },
  {
    label: 'Resultado anual',
    path: '/guardian/annual-result',
    icon: BarChart3,
    roles: ['Apoderado']
  },

  // Comunicados
  {
    label: 'Comunicados',
    path: '/director/announcements',
    icon: Bell,
    roles: ['Director']
  },
  {
    label: 'Comunicados',
    path: '/admin/announcements',
    icon: Bell,
    roles: ['Administrativo']
  },
  {
    label: 'Comunicados',
    path: '/auxiliary/announcements',
    icon: Bell,
    roles: ['Auxiliar']
  },
  {
    label: 'Comunicados',
    path: '/teacher/announcements',
    icon: Bell,
    roles: ['Docente']
  },
  {
    label: 'Comunicados',
    path: '/student/announcements',
    icon: Bell,
    roles: ['Estudiante']
  },
  {
    label: 'Comunicados',
    path: '/guardian/announcements',
    icon: Bell,
    roles: ['Apoderado']
  },

  // Progreso
  {
    label: 'Mi progreso',
    path: '/student/progress',
    icon: BarChart3,
    roles: ['Estudiante']
  },
  {
    label: 'Mi progreso',
    path: '/guardian/progress',
    icon: BarChart3,
    roles: ['Apoderado']
  },

  // Reportes
  {
    label: 'Reportes',
    path: '/director/reports',
    icon: BarChart3,
    roles: ['Director']
  },
  {
    label: 'Reportes',
    path: '/admin/reports',
    icon: BarChart3,
    roles: ['Administrativo']
  },
  {
    label: 'Reportes',
    path: '/auxiliary/reports',
    icon: BarChart3,
    roles: ['Auxiliar']
  },

  // Seguridad
  {
    label: 'Seguridad',
    path: '/director/security',
    icon: ShieldCheck,
    roles: ['Director']
  },
  {
    label: 'Seguridad',
    path: '/admin/security',
    icon: ShieldCheck,
    roles: ['Administrativo']
  },

  // Configuración
  {
    label: 'Configuración',
    path: '/director/settings',
    icon: Settings,
    roles: ['Director']
  },
  {
    label: 'Configuración',
    path: '/admin/settings',
    icon: Settings,
    roles: ['Administrativo']
  },
  {
    label: 'Configuración',
    path: '/auxiliary/settings',
    icon: Settings,
    roles: ['Auxiliar']
  },
  {
    label: 'Configuración',
    path: '/teacher/settings',
    icon: Settings,
    roles: ['Docente']
  },
  {
    label: 'Configuración',
    path: '/student/settings',
    icon: Settings,
    roles: ['Estudiante']
  },
  {
    label: 'Configuración',
    path: '/guardian/settings',
    icon: Settings,
    roles: ['Apoderado']
  }
];

export const getMenuByRole = (role) => {
  return navigationItems.filter((item) => item.roles.includes(role));
};

export const getMobileMenuByRole = (role) => {
  const items = getMenuByRole(role);

  if (role === 'Director') {
    return items.filter((item) =>
      [
        '/dashboard',
        '/director/enrollments',
        '/director/users',
        '/director/attendance',
        '/director/security',
        '/director/settings'
      ].includes(item.path)
    );
  }

  if (role === 'Administrativo') {
    return items.filter((item) =>
      [
        '/dashboard',
        '/admin/enrollments',
        '/admin/users',
        '/admin/formats',
        '/admin/announcements',
        '/admin/settings'
      ].includes(item.path)
    );
  }

  if (role === 'Auxiliar') {
    return items.filter((item) =>
      [
        '/dashboard',
        '/auxiliary/attendance',
        '/auxiliary/students',
        '/auxiliary/announcements',
        '/auxiliary/reports',
        '/auxiliary/settings'
      ].includes(item.path)
    );
  }

  if (role === 'Docente') {
    return items.filter((item) =>
      [
        '/dashboard',
        '/teacher/courses',
        '/teacher/schedules',
        '/teacher/attendance',
        '/teacher/grades',
        '/teacher/settings'
      ].includes(item.path)
    );
  }

  if (role === 'Estudiante') {
    return items.filter((item) =>
      [
        '/dashboard',
        '/student/schedule',
        '/student/attendance',
        '/student/grades',
        '/student/announcements',
        '/student/settings'
      ].includes(item.path)
    );
  }

  if (role === 'Apoderado') {
    return items.filter((item) =>
      [
        '/dashboard',
        '/guardian/children',
        '/guardian/attendance',
        '/guardian/grades',
        '/guardian/announcements',
        '/guardian/settings'
      ].includes(item.path)
    );
  }

  return [];
};