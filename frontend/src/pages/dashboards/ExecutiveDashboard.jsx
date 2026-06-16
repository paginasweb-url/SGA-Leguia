import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
  UserRoundCheck
} from 'lucide-react';

import { getDirectorDashboardReport } from '../../services/dashboard.service';
import { getEnrollmentRequests } from '../../services/enrollmentRequests.service';
import { getPasswordRecoveryRequests } from '../../services/security.service';
import { getStoredUser } from '../../utils/storage';

const statusStyles = {
  pendiente: 'bg-yellow-50 text-warning border-yellow-100',
  observado: 'bg-orange-50 text-warning border-orange-100',
  aprobado: 'bg-green-50 text-success border-green-100',
  rechazado: 'bg-red-50 text-danger border-red-100'
};

const configByMode = {
  director: {
    eyebrow: 'Panel Ejecutivo',
    title: 'Panel Ejecutivo de Control',
    description: 'Resumen institucional calculado desde los registros actuales del sistema.',
    enrollmentsPath: '/director/enrollments',
    usersPath: '/director/users',
    reportsPath: '/director/reports',
    gradesPath: '/director/grades',
    attendancePath: '/director/attendance',
    securityPath: '/director/security',
    formatsPath: '/director/formats',
    announcementsPath: '/director/announcements',
    primaryActionLabel: 'Nueva gestión'
  },
  admin: {
    eyebrow: 'Panel Operativo',
    title: 'Panel Administrativo',
    description: 'Resumen operativo de matrículas, formatos, usuarios y seguridad.',
    enrollmentsPath: '/admin/enrollments',
    usersPath: '/admin/users',
    reportsPath: '/admin/reports',
    securityPath: '/admin/security',
    formatsPath: '/admin/formats',
    announcementsPath: '/admin/announcements',
    primaryActionLabel: 'Gestionar matrícula'
  }
};

function ExecutiveDashboard({ mode = 'director' }) {
  const user = getStoredUser();
  const config = configByMode[mode] || configByMode.director;

  const [report, setReport] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pendingRecovery, setPendingRecovery] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [dashboardResponse, requestsResponse, recoveryResponse] =
        await Promise.all([
          getDirectorDashboardReport(),
          getEnrollmentRequests(),
          getPasswordRecoveryRequests({
            estado: 'pendiente',
            page: 1,
            limit: 50
          })
        ]);

      setReport(dashboardResponse.data || {});
      setRequests(requestsResponse.data || []);
      setPendingRecovery(
        recoveryResponse?.pagination?.total ??
        recoveryResponse?.data?.length ??
        0
      );
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo cargar el dashboard.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const recentRequests = useMemo(() => {
    return [...requests]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [requests]);

  const enrollmentSummary = useMemo(() => {
    return requests.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.estado] = (acc[item.estado] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        pendiente: 0,
        observado: 0,
        aprobado: 0,
        rechazado: 0
      }
    );
  }, [requests]);

  const gradeDistribution = useMemo(() => {
    const grouped = requests.reduce((acc, item) => {
      const grade = item.grado || 'Sin grado';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([label, value]) => ({
      label,
      value
    }));
  }, [requests]);

  const fullName = `${user?.nombres || ''} ${user?.apellidos || ''}`.trim();

  const cards = [
    {
      title: 'Total estudiantes',
      value: report?.total_estudiantes,
      description: 'Registrados en el sistema',
      icon: GraduationCap,
      border: 'border-brand-900',
      iconClass: 'bg-brand-50 text-brand-900'
    },
    {
      title: 'Total docentes',
      value: report?.total_docentes,
      description: 'Docentes activos',
      icon: Users,
      border: 'border-gold-500',
      iconClass: 'bg-gold-50 text-gold-600'
    },
    {
      title: 'Aulas activas',
      value: report?.total_aulas,
      description: 'Aulas configuradas',
      icon: Building2,
      border: 'border-brand-900',
      iconClass: 'bg-brand-50 text-brand-900'
    },
    {
      title: 'Solicitudes pendientes',
      value: report?.solicitudes_pendientes,
      description: 'Pendientes de revisión',
      icon: ClipboardList,
      border: 'border-warning',
      iconClass: 'bg-yellow-50 text-warning'
    }
  ];

  const quickActions = mode === 'director'
    ? [
        {
          icon: ClipboardList,
          title: 'Matrículas',
          description: 'Revisar solicitudes y asignar aulas.',
          to: config.enrollmentsPath,
          featured: true
        },
        {
          icon: FileText,
          title: 'Formatos',
          description: 'Gestionar formatos PDF de matrícula.',
          to: config.formatsPath
        },
        {
          icon: UserRoundCheck,
          title: 'Usuarios',
          description: 'Gestionar usuarios institucionales.',
          to: config.usersPath
        },
        {
          icon: BookOpen,
          title: 'Notas',
          description: 'Supervisar notas bimestrales.',
          to: config.gradesPath
        },
        {
          icon: CalendarDays,
          title: 'Asistencia',
          description: 'Consultar faltas y reportes.',
          to: config.attendancePath
        },
        {
          icon: ShieldAlert,
          title: 'Seguridad',
          description: 'Revisar accesos y recuperaciones.',
          to: config.securityPath,
          highlighted: true
        }
      ]
    : [
        {
          icon: ClipboardList,
          title: 'Matrículas',
          description: 'Gestionar solicitudes de matrícula.',
          to: config.enrollmentsPath,
          featured: true
        },
        {
          icon: FileText,
          title: 'Formatos',
          description: 'Publicar formatos oficiales.',
          to: config.formatsPath
        },
        {
          icon: UserRoundCheck,
          title: 'Usuarios',
          description: 'Gestionar estudiantes, docentes y apoderados.',
          to: config.usersPath
        },
        {
          icon: ShieldAlert,
          title: 'Seguridad',
          description: 'Atender recuperaciones de contraseña.',
          to: config.securityPath,
          highlighted: true
        },
        {
          icon: BarChart3,
          title: 'Reportes',
          description: 'Consultar reportes operativos.',
          to: config.reportsPath
        },
        {
          icon: Bell,
          title: 'Comunicados',
          description: 'Publicar comunicados institucionales.',
          to: config.announcementsPath
        }
      ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando dashboard...
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
              {config.eyebrow}
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              {config.title}
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              {config.description}
            </p>

            <p className="text-sm text-blue-100 mt-4">
              Bienvenido, <span className="font-extrabold text-white">{fullName || user?.username || 'Usuario'}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => loadDashboard({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              Actualizar
            </button>

            <Link
              to={config.enrollmentsPath}
              className="inline-flex items-center justify-center gap-2 bg-gold-500 text-brand-950 px-4 py-3 rounded-xl font-extrabold hover:bg-gold-100 transition"
            >
              {config.primaryActionLabel}
              <ArrowRight size={18} />
            </Link>
          </div>
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

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 bg-white/95 backdrop-blur border border-slate-200 rounded-3xl shadow-soft p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
            <div>
              <h2 className="text-xl font-extrabold text-brand-950">
                Solicitudes por grado
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Distribución calculada desde las solicitudes de matrícula registradas.
              </p>
            </div>

            <Link
              to={config.enrollmentsPath}
              className="text-sm font-extrabold text-brand-900 hover:text-brand-700 inline-flex items-center gap-1"
            >
              Ver solicitudes
              <ArrowRight size={16} />
            </Link>
          </div>

          <DynamicBarChart data={gradeDistribution} />
        </div>

        <div className="xl:col-span-4 flex flex-col gap-5">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
            <h2 className="text-sm font-extrabold text-brand-900 uppercase tracking-[0.15em]">
              Gestión de solicitudes
            </h2>

            <div className="mt-5 space-y-3">
              <StatusLine label="Pendientes" value={enrollmentSummary.pendiente} status="pendiente" />
              <StatusLine label="Observadas" value={enrollmentSummary.observado} status="observado" />
              <StatusLine label="Aprobadas" value={enrollmentSummary.aprobado} status="aprobado" />
              <StatusLine label="Rechazadas" value={enrollmentSummary.rechazado} status="rechazado" />
            </div>

            <Link
              to={config.enrollmentsPath}
              className="mt-6 w-full inline-flex justify-center items-center gap-2 border border-slate-200 text-brand-900 px-4 py-3 rounded-xl font-extrabold hover:bg-slate-50 transition"
            >
              Ver todo el listado
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="bg-brand-950 text-white rounded-3xl shadow-soft p-6 overflow-hidden relative">
            <div className="absolute -top-20 -right-20 w-52 h-52 bg-gold-500/20 rounded-full blur-2xl" />

            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-gold-500 flex items-center justify-center mb-5">
                <TrendingUp size={26} />
              </div>

              <h2 className="text-xl font-extrabold">
                Estado institucional
              </h2>

              <p className="text-sm text-blue-100 mt-2">
                Indicadores provenientes del backend.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <MiniStat label="Observadas" value={report?.solicitudes_observadas} />
                <MiniStat label="Faltas" value={report?.total_faltas} />
                <MiniStat label="En riesgo" value={report?.estudiantes_en_riesgo} />
                <MiniStat label="Recuperación" value={pendingRecovery} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5 grid grid-cols-2 gap-4">
          {quickActions.slice(0, 4).map((action) => (
            <QuickTile key={action.to} {...action} />
          ))}
        </div>

        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-brand-950">
                Solicitudes recientes
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Últimos registros creados desde el portal público.
              </p>
            </div>

            <Link
              to={config.enrollmentsPath}
              className="text-sm font-extrabold text-brand-900 hover:text-brand-700 inline-flex items-center gap-1"
            >
              Ver todas
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 max-h-[430px] overflow-y-auto">
            {recentRequests.length > 0 ? (
              recentRequests.map((request) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  to={config.enrollmentsPath}
                />
              ))
            ) : (
              <div className="p-8 text-center">
                <ClipboardList className="mx-auto text-slate-300" size={42} />
                <p className="text-sm text-slate-500 mt-3">
                  No hay solicitudes registradas.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {quickActions.length > 4 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {quickActions.slice(4).map((action) => (
            <QuickAction key={action.to} {...action} />
          ))}
        </section>
      )}
    </main>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  border,
  iconClass
}) {
  return (
    <div className={`bg-white/95 backdrop-blur border border-slate-200 border-l-4 ${border} rounded-3xl shadow-soft p-6 hover:-translate-y-1 hover:shadow-lg transition`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">
            {title}
          </p>

          <p className="text-4xl font-extrabold text-brand-950 mt-3">
            {Number(value || 0).toLocaleString('es-PE')}
          </p>

          <p className="text-sm text-slate-500 mt-2">
            {description}
          </p>
        </div>

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconClass}`}>
          <Icon size={25} />
        </div>
      </div>
    </div>
  );
}

function DynamicBarChart({ data }) {
  if (!data.length) {
    return (
      <div className="min-h-[220px] flex items-center justify-center bg-slate-50 border border-slate-100 rounded-3xl">
        <p className="text-sm text-slate-500">
          No hay datos suficientes para generar la distribución.
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const width = Math.max((item.value / maxValue) * 100, 8);

        return (
          <div
            key={item.label}
            className="bg-slate-50 border border-slate-100 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="font-extrabold text-brand-950">
                {item.label}
              </p>

              <p className="text-sm font-extrabold text-brand-900">
                {Number(item.value || 0).toLocaleString('es-PE')}
              </p>
            </div>

            <div className="h-3 bg-white border border-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-900 rounded-full transition-all duration-700"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RequestRow({ request, to }) {
  const fullName = `${request.estudiante_nombres || ''} ${request.estudiante_apellidos || ''}`.trim();
  const statusClass = statusStyles[request.estado] || 'bg-slate-50 text-slate-600 border-slate-100';

  return (
    <div className="p-5 hover:bg-slate-50 transition">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-extrabold text-brand-950">
              {request.codigo_seguimiento || `Solicitud #${request.id}`}
            </p>

            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border ${statusClass}`}>
              {request.estado}
            </span>
          </div>

          <p className="text-sm text-slate-700 mt-1 font-semibold">
            {fullName || 'Estudiante sin nombre'}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            DNI: {request.estudiante_dni} · {request.grado || 'Grado no definido'} · {request.turno || 'Turno no definido'}
          </p>
        </div>

        <Link
          to={to}
          className="inline-flex items-center justify-center gap-2 bg-brand-50 text-brand-900 px-4 py-2.5 rounded-xl text-sm font-extrabold hover:bg-brand-100 transition"
        >
          Gestionar
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
      <p className="text-xs text-blue-100 font-bold">
        {label}
      </p>

      <p className="text-2xl font-extrabold mt-1">
        {Number(value || 0).toLocaleString('es-PE')}
      </p>
    </div>
  );
}

function StatusLine({ label, value, status }) {
  const statusClass = statusStyles[status] || 'bg-slate-50 text-slate-600 border-slate-100';

  return (
    <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full border ${statusClass}`} />
        <p className="text-sm font-bold text-slate-600">
          {label}
        </p>
      </div>

      <p className="font-extrabold text-brand-950">
        {Number(value || 0).toLocaleString('es-PE')}
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
  description,
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
        {description}
      </p>

      <div className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-brand-900">
        Abrir módulo
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}

export default ExecutiveDashboard;