import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users
} from 'lucide-react';

import { getMenuByRole } from '../../utils/navigation';
import { getStoredUser } from '../../utils/storage';
import {
  getAuxiliaryDashboardReport,
  getTeacherDashboardReport
} from '../../services/dashboard.service';
import { getMyProgress } from '../../services/progress.service';

const roleContent = {
  Docente: {
    eyebrow: 'Panel Docente',
    title: 'Dashboard Docente',
    description: 'Resumen real de cursos, aulas, horarios, estudiantes y comunicados.'
  },
  Auxiliar: {
    eyebrow: 'Panel Auxiliar',
    title: 'Dashboard Auxiliar',
    description: 'Resumen real de asistencia, aulas, estudiantes y registros recientes.'
  },
  Estudiante: {
    eyebrow: 'Portal Estudiante',
    title: 'Inicio del Estudiante',
    description: 'Resumen real de notas, asistencia, alertas, sugerencias y comunicados.'
  },
  Apoderado: {
    eyebrow: 'Portal Apoderado',
    title: 'Inicio del Apoderado',
    description: 'Seguimiento real de estudiantes vinculados, notas, asistencia y comunicados.'
  }
};

function RoleOverviewDashboard({ role }) {
  const user = getStoredUser();
  const content = roleContent[role] || {
    eyebrow: 'Portal',
    title: 'Dashboard',
    description: 'Accede a los módulos disponibles para tu rol.'
  };

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const menuItems = getMenuByRole(role).filter((item) => item.path !== '/dashboard');
  const quickItems = menuItems.slice(0, 6);
  const fullName = `${user?.nombres || ''} ${user?.apellidos || ''}`.trim();

  const loadDashboard = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let response = null;

      if (role === 'Docente') {
        response = await getTeacherDashboardReport();
      }

      if (role === 'Auxiliar') {
        response = await getAuxiliaryDashboardReport();
      }

      if (role === 'Estudiante' || role === 'Apoderado') {
        response = await getMyProgress();
      }

      setPayload(response);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo cargar el dashboard del rol.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [role]);

  const dashboardData = payload?.data || null;

  const summary = useMemo(() => {
    if (role === 'Docente') {
      const s = dashboardData?.summary || {};

      return [
        {
          title: 'Cursos asignados',
          value: s.total_cursos,
          description: 'Cursos vinculados al docente',
          icon: BookOpen
        },
        {
          title: 'Aulas asignadas',
          value: s.total_aulas,
          description: 'Aulas donde dicta clases',
          icon: LayoutDashboard
        },
        {
          title: 'Estudiantes',
          value: s.total_estudiantes,
          description: 'Estudiantes en aulas asignadas',
          icon: Users
        },
        {
          title: 'En riesgo',
          value: s.estudiantes_en_riesgo,
          description: 'Estudiantes con nota C',
          icon: AlertCircle
        }
      ];
    }

    if (role === 'Auxiliar') {
      const s = dashboardData?.summary || {};

      return [
        {
          title: 'Aulas',
          value: s.total_aulas,
          description: 'Aulas configuradas',
          icon: LayoutDashboard
        },
        {
          title: 'Matriculados',
          value: s.estudiantes_matriculados,
          description: 'Estudiantes aprobados',
          icon: Users
        },
        {
          title: 'Asistencias hoy',
          value: s.asistencias_hoy,
          description: 'Registros del día',
          icon: ClipboardCheck
        },
        {
          title: 'Faltas hoy',
          value: s.faltas_hoy,
          description: 'Faltas registradas hoy',
          icon: AlertCircle
        }
      ];
    }

    if (role === 'Estudiante') {
      const grades = dashboardData?.grades || [];
      const risk = dashboardData?.risk_alerts || [];
      const attendance = dashboardData?.attendance_summary || [];
      const totalAttendance = sumAttendance(attendance);

      return [
        {
          title: 'Notas registradas',
          value: grades.length,
          description: 'Registros académicos disponibles',
          icon: ClipboardList
        },
        {
          title: 'Cursos evaluados',
          value: countUnique(grades, 'curso_id', 'curso'),
          description: 'Cursos con notas registradas',
          icon: BookOpen
        },
        {
          title: 'Asistencia',
          value: totalAttendance,
          description: 'Registros de asistencia',
          icon: ClipboardCheck
        },
        {
          title: 'Alertas',
          value: risk.length,
          description: 'Notas C detectadas',
          icon: AlertCircle
        }
      ];
    }

    if (role === 'Apoderado') {
      const children = dashboardData?.children || [];

      const totalGrades = children.reduce(
        (acc, child) => acc + Number(child.grades?.length || 0),
        0
      );

      const totalRisk = children.reduce(
        (acc, child) => acc + Number(child.risk_alerts?.length || 0),
        0
      );

      const totalAttendance = children.reduce(
        (acc, child) => acc + sumAttendance(child.attendance_summary || []),
        0
      );

      return [
        {
          title: 'Hijos vinculados',
          value: children.length,
          description: 'Estudiantes asociados',
          icon: GraduationCap
        },
        {
          title: 'Notas registradas',
          value: totalGrades,
          description: 'Notas entre estudiantes vinculados',
          icon: ClipboardList
        },
        {
          title: 'Asistencia',
          value: totalAttendance,
          description: 'Registros de asistencia',
          icon: ClipboardCheck
        },
        {
          title: 'Alertas',
          value: totalRisk,
          description: 'Notas C detectadas',
          icon: AlertCircle
        }
      ];
    }

    return [];
  }, [role, dashboardData]);

  const primaryList = useMemo(() => {
    if (role === 'Docente') {
      return {
        title: 'Horarios registrados',
        description: 'Horarios asignados al docente.',
        items: (dashboardData?.schedules || []).slice(0, 5),
        type: 'schedule'
      };
    }

    if (role === 'Auxiliar') {
      return {
        title: 'Asistencias recientes',
        description: 'Últimos registros de asistencia.',
        items: (dashboardData?.recent_attendance || []).slice(0, 5),
        type: 'attendance'
      };
    }

    if (role === 'Estudiante') {
      return {
        title: 'Últimas notas registradas',
        description: 'Notas disponibles del estudiante.',
        items: (dashboardData?.grades || []).slice(-5).reverse(),
        type: 'grades'
      };
    }

    if (role === 'Apoderado') {
      return {
        title: 'Estudiantes vinculados',
        description: 'Resumen por estudiante asociado al apoderado.',
        items: dashboardData?.children || [],
        type: 'children'
      };
    }

    return {
      title: 'Registros',
      description: '',
      items: [],
      type: 'default'
    };
  }, [role, dashboardData]);

  const announcements = dashboardData?.announcements || [];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando dashboard de {role}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-brand-950 text-white shadow-soft p-6 lg:p-8">
        <div className="absolute -top-28 -right-24 w-80 h-80 bg-gold-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-28 -left-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div>
            <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.2em]">
              {content.eyebrow}
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              {content.title}
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              {content.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <InfoPill
                icon={UserRound}
                label="Usuario"
                value={fullName || user?.username || 'Usuario'}
              />

              <InfoPill
                icon={ShieldCheck}
                label="Rol"
                value={role}
              />

              <InfoPill
                icon={LayoutDashboard}
                label="Módulos"
                value={menuItems.length}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-100 text-danger rounded-2xl p-4 flex gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">
            {error}
          </p>
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {summary.map((card) => (
            <SummaryCard key={card.title} {...card} />
          ))}
        </div>

        <div className="xl:col-span-4">
          <AnnouncementsPanel announcements={announcements} />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5 grid grid-cols-2 gap-4">
          {quickItems.slice(0, 4).map((item, index) => (
            <QuickTile
              key={item.path}
              icon={item.icon}
              title={item.label}
              to={item.path}
              featured={index === 0}
              highlighted={index === 3}
            />
          ))}
        </div>

        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-brand-950">
              {primaryList.title}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {primaryList.description}
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {primaryList.items.length > 0 ? (
              primaryList.items.map((item, index) => (
                <DynamicRow
                  key={item.id || item.estudiante_id || item.nota_id || index}
                  item={item}
                  type={primaryList.type}
                />
              ))
            ) : (
              <EmptyList text="No hay registros disponibles para mostrar." />
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-brand-950">
              Accesos rápidos
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Módulos disponibles para {role}.
            </p>
          </div>
        </div>

        {quickItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {quickItems.map((item) => (
              <QuickAction
                key={item.path}
                icon={item.icon}
                title={item.label}
                to={item.path}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-8 text-center">
            <LayoutDashboard className="mx-auto text-slate-300" size={42} />
            <p className="text-sm text-slate-500 mt-3">
              No hay módulos configurados para este rol.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function AnnouncementsPanel({ announcements }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden h-full">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-extrabold text-brand-950">
          Comunicados recientes
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Información publicada para tu rol o aula vinculada.
        </p>
      </div>

      <div className="divide-y divide-slate-100 max-h-[430px] overflow-y-auto">
        {announcements.length > 0 ? (
          announcements.slice(0, 5).map((item) => (
            <AnnouncementRow key={item.id} item={item} />
          ))
        ) : (
          <EmptyList text="No hay comunicados disponibles." />
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  description
}) {
  return (
    <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-3xl shadow-soft p-6 hover:-translate-y-1 hover:shadow-lg transition">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
        <Icon size={24} />
      </div>

      <p className="text-sm font-bold text-slate-500 mt-5">
        {title}
      </p>

      <p className="text-3xl font-extrabold text-brand-950 mt-2 break-all">
        {Number(value || 0).toLocaleString('es-PE')}
      </p>

      <p className="text-sm text-slate-500 mt-2">
        {description}
      </p>
    </div>
  );
}

function InfoPill({ icon: Icon, label, value }) {
  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2 text-blue-100">
        <Icon size={16} />
        <p className="text-xs font-bold">
          {label}
        </p>
      </div>

      <p className="font-extrabold mt-1">
        {value || 'No precisa'}
      </p>
    </div>
  );
}

function QuickTile({
  icon: Icon,
  title,
  to,
  featured,
  highlighted
}) {
  const className = featured
    ? 'bg-brand-900 text-white hover:bg-brand-800'
    : highlighted
      ? 'bg-gold-500 text-brand-950 hover:bg-gold-100'
      : 'bg-white border border-slate-200 text-brand-950 hover:bg-slate-50';

  return (
    <Link
      to={to}
      className={`${className} rounded-3xl shadow-soft p-6 flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 transition min-h-[150px]`}
    >
      <Icon size={32} />
      <span className="font-extrabold">
        {title}
      </span>
    </Link>
  );
}

function QuickAction({
  icon: Icon,
  title,
  to
}) {
  return (
    <Link
      to={to}
      className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6 hover:-translate-y-1 hover:shadow-lg transition group"
    >
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center group-hover:bg-brand-900 group-hover:text-white transition">
        <Icon size={25} />
      </div>

      <h3 className="text-lg font-extrabold text-brand-950 mt-5">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-2">
        Abrir módulo disponible para este rol.
      </p>

      <div className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-brand-900">
        Abrir módulo
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}

function DynamicRow({ item, type }) {
  if (type === 'schedule') {
    return (
      <RowBase
        icon={CalendarDays}
        title={`${item.dia_semana || 'Día'} · ${item.hora_inicio || ''} - ${item.hora_fin || ''}`}
        subtitle={`${item.curso || 'Curso'} · ${item.grado || 'Grado'} ${item.seccion || ''} · ${item.turno || ''}`}
        badge="Horario"
      />
    );
  }

  if (type === 'attendance') {
    return (
      <RowBase
        icon={ClipboardCheck}
        title={`${item.nombres || ''} ${item.apellidos || ''}`.trim() || 'Estudiante'}
        subtitle={`${formatDate(item.fecha)} · ${item.grado || 'Grado'} ${item.seccion || ''} · ${item.turno || ''}`}
        badge={item.estado}
      />
    );
  }

  if (type === 'grades') {
    return (
      <RowBase
        icon={ClipboardList}
        title={item.curso || item.nombre_curso || 'Curso'}
        subtitle={`Bimestre ${item.bimestre || 'No precisa'}${item.comentario ? ` · ${item.comentario}` : ''}`}
        badge={item.nota}
      />
    );
  }

  if (type === 'children') {
    const student = item.student || {};

    return (
      <RowBase
        icon={GraduationCap}
        title={`${student.nombres || ''} ${student.apellidos || ''}`.trim() || 'Estudiante'}
        subtitle={`${student.grado || 'Grado no definido'} ${student.seccion || ''} · ${student.turno || 'Turno no definido'}`}
        badge={item.parentesco || 'Vinculado'}
      />
    );
  }

  return (
    <RowBase
      icon={LayoutDashboard}
      title="Registro"
      subtitle="Dato disponible"
      badge="Info"
    />
  );
}

function AnnouncementRow({ item }) {
  return (
    <RowBase
      icon={Bell}
      title={item.titulo}
      subtitle={item.contenido}
      badge={item.leido ? 'Leído' : 'Pendiente'}
    />
  );
}

function RowBase({
  icon: Icon,
  title,
  subtitle,
  badge
}) {
  return (
    <div className="p-5 hover:bg-slate-50 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
            <Icon size={22} />
          </div>

          <div className="min-w-0">
            <p className="font-extrabold text-brand-950 truncate">
              {title || 'No precisa'}
            </p>

            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
              {subtitle || 'Sin detalle adicional'}
            </p>
          </div>
        </div>

        <span className="inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-extrabold bg-slate-50 border border-slate-200 text-slate-600">
          {badge || 'Info'}
        </span>
      </div>
    </div>
  );
}

function EmptyList({ text }) {
  return (
    <div className="p-8 text-center">
      <LayoutDashboard className="mx-auto text-slate-300" size={42} />
      <p className="text-sm text-slate-500 mt-3">
        {text}
      </p>
    </div>
  );
}

function countUnique(items, key, fallbackKey) {
  return new Set(
    items
      .map((item) => item[key] || item[fallbackKey])
      .filter(Boolean)
  ).size;
}

function sumAttendance(items) {
  return items.reduce((acc, item) => acc + Number(item.total || 0), 0);
}

function formatDate(value) {
  if (!value) return 'No precisa';

  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export default RoleOverviewDashboard;