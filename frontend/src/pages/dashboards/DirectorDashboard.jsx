import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  RefreshCw,
  School,
  UserCheck,
  Users,
  XCircle
} from 'lucide-react';

import toast from 'react-hot-toast';

import { getDirectorDashboardReport } from '../../services/dashboard.service';

function DirectorDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const summary = dashboard?.summary || {};

  const loadDashboard = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getDirectorDashboardReport();
      setDashboard(response.data || null);
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudo cargar el dashboard del Director.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const attendancePercent = useMemo(() => {
    const total = Number(summary.asistencias_hoy || 0);
    const presentes = Number(summary.presentes_hoy || 0);

    if (total === 0) return 0;

    return Math.round((presentes / total) * 100);
  }, [summary]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={38} />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando dashboard institucional...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-brand-950 text-white p-6 sm:p-8 shadow-soft">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gold-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-28 -left-28 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.18em]">
              Panel institucional
            </p>

            <h1 className="text-3xl sm:text-4xl font-extrabold mt-2">
              Dashboard del Director
            </h1>

            <p className="text-blue-100 mt-3 max-w-3xl">
              Vista general del colegio con asistencia diaria, alertas activas,
              justificaciones pendientes, comunicados y estado académico.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          icon={Users}
          label="Estudiantes"
          value={summary.total_estudiantes}
          description="Registrados en el sistema"
        />

        <MetricCard
          icon={UserCheck}
          label="Docentes"
          value={summary.total_docentes}
          description="Personal docente registrado"
        />

        <MetricCard
          icon={School}
          label="Aulas"
          value={summary.total_aulas}
          description="Aulas configuradas"
        />

        <MetricCard
          icon={BookOpen}
          label="Cursos"
          value={summary.total_cursos}
          description="Cursos académicos"
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-brand-900 uppercase tracking-[0.18em]">
                Asistencia de hoy
              </p>

              <h2 className="text-xl font-extrabold text-brand-950 mt-1">
                Estado diario institucional
              </h2>
            </div>

            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-900 text-sm font-extrabold">
              <CalendarDays size={16} />
              {attendancePercent}% asistencia
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-5">
            <MiniStatusCard
              icon={ClipboardCheck}
              label="Registros"
              value={summary.asistencias_hoy}
            />

            <MiniStatusCard
              icon={CheckCircle2}
              label="Presentes"
              value={summary.presentes_hoy}
              tone="green"
            />

            <MiniStatusCard
              icon={XCircle}
              label="Faltas"
              value={summary.faltas_hoy}
              tone="red"
            />

            <MiniStatusCard
              icon={AlertCircle}
              label="Tardanzas"
              value={summary.tardanzas_hoy}
              tone="yellow"
            />
          </div>

          <div className="mt-6 space-y-3">
            {(dashboard?.attendance_last_7_days || []).map((item) => (
              <AttendanceTrendRow key={item.fecha} item={item} />
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
          <p className="text-sm font-extrabold text-red-600 uppercase tracking-[0.18em]">
            Alertas activas
          </p>

          <h2 className="text-xl font-extrabold text-brand-950 mt-1">
            Seguimiento urgente
          </h2>

          <div className="grid grid-cols-1 gap-4 mt-5">
            <AlertSummaryCard
              icon={AlertCircle}
              label="Inasistencias"
              value={summary.alertas_asistencia_activas}
              description="Alertas por faltas consecutivas"
            />

            <AlertSummaryCard
              icon={GraduationCap}
              label="Académicas"
              value={summary.alertas_academicas_activas}
              description="Alertas por nota C"
            />

            <AlertSummaryCard
              icon={Bell}
              label="Justificaciones"
              value={summary.justificaciones_pendientes}
              description="Solicitudes pendientes"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <DashboardList
          title="Alertas académicas recientes"
          eyebrow="Bajo rendimiento"
          items={dashboard?.active_academic_alerts || []}
          emptyText="No hay alertas académicas activas."
          renderItem={(item) => (
            <AlertItem
              icon={GraduationCap}
              title={item.estudiante}
              subtitle={`${item.curso || 'Curso'} · ${formatBimesterLabel(item.bimestre)} · ${item.grado || ''} ${item.seccion || ''} ${item.turno || ''}`}
              message={item.mensaje}
              tone="red"
            />
          )}
        />

        <DashboardList
          title="Alertas de asistencia recientes"
          eyebrow="Inasistencias"
          items={dashboard?.active_attendance_alerts || []}
          emptyText="No hay alertas de asistencia activas."
          renderItem={(item) => (
            <AlertItem
              icon={AlertCircle}
              title={item.estudiante}
              subtitle={`${item.grado || ''} ${item.seccion || ''} ${item.turno || ''} · ${formatDate(item.fecha_inicio)} - ${formatDate(item.fecha_fin)}`}
              message={item.mensaje}
              tone="red"
            />
          )}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <DashboardList
          title="Justificaciones pendientes"
          eyebrow="Asistencia"
          items={dashboard?.pending_justifications || []}
          emptyText="No hay justificaciones pendientes."
          renderItem={(item) => (
            <AlertItem
              icon={Bell}
              title={item.estudiante}
              subtitle={`${formatDate(item.fecha_asistencia)} · ${item.grado || ''} ${item.seccion || ''} ${item.turno || ''}`}
              message={item.motivo}
              tone="yellow"
            />
          )}
        />

        <DashboardList
          title="Cursos con alertas"
          eyebrow="Rendimiento"
          items={dashboard?.academic_alerts_by_course || []}
          emptyText="No hay cursos con alertas activas."
          renderItem={(item) => (
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <div>
                <p className="font-extrabold text-brand-950">
                  {item.curso}
                </p>

                <p className="text-sm text-slate-500">
                  Alertas académicas activas
                </p>
              </div>

              <span className="text-2xl font-extrabold text-red-600">
                {Number(item.total || 0)}
              </span>
            </div>
          )}
        />

        <DashboardList
          title="Comunicados recientes"
          eyebrow="Avisos"
          items={dashboard?.recent_announcements || []}
          emptyText="No hay comunicados recientes."
          renderItem={(item) => (
            <AlertItem
              icon={Bell}
              title={item.titulo}
              subtitle={`${item.destinatario_tipo || 'general'} · ${formatDateTime(item.fecha)}`}
              message={item.contenido}
              tone="blue"
            />
          )}
        />
      </section>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, description }) {
  return (
    <article className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6 hover:-translate-y-1 hover:shadow-lg transition">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
        <Icon size={24} />
      </div>

      <p className="text-sm font-bold text-slate-500 mt-5">
        {label}
      </p>

      <p className="text-3xl font-extrabold text-brand-950 mt-2">
        {formatNumber(value)}
      </p>

      <p className="text-sm text-slate-500 mt-2">
        {description}
      </p>
    </article>
  );
}

function MiniStatusCard({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-900',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    yellow: 'bg-yellow-50 text-yellow-700'
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone] || tones.brand}`}>
        <Icon size={20} />
      </div>

      <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mt-4">
        {label}
      </p>

      <p className="text-2xl font-extrabold text-brand-950 mt-1">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function AlertSummaryCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="w-11 h-11 rounded-xl bg-white text-red-600 flex items-center justify-center">
          <Icon size={21} />
        </div>

        <span className="text-3xl font-extrabold text-red-600">
          {formatNumber(value)}
        </span>
      </div>

      <p className="font-extrabold text-brand-950 mt-4">
        {label}
      </p>

      <p className="text-sm text-slate-500 mt-1">
        {description}
      </p>
    </div>
  );
}

function DashboardList({
  title,
  eyebrow,
  items,
  emptyText,
  renderItem
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <p className="text-sm font-extrabold text-brand-900 uppercase tracking-[0.18em]">
          {eyebrow}
        </p>

        <h2 className="text-xl font-extrabold text-brand-950 mt-1">
          {title}
        </h2>
      </div>

      <div className="p-5 space-y-3 max-h-[420px] overflow-y-auto">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id || item.curso}>
              {renderItem(item)}
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto text-slate-300" size={38} />
            <p className="text-sm text-slate-500 mt-3">
              {emptyText}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function AlertItem({
  icon: Icon,
  title,
  subtitle,
  message,
  tone = 'red'
}) {
  const tones = {
    red: 'bg-red-50 text-red-600 border-red-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100'
  };

  return (
    <article className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tones[tone] || tones.red}`}>
          <Icon size={21} />
        </div>

        <div className="min-w-0">
          <p className="font-extrabold text-brand-950">
            {title || 'Sin nombre'}
          </p>

          <p className="text-sm text-slate-500 mt-1">
            {subtitle || 'Sin detalle'}
          </p>

          <p className="text-sm text-slate-600 mt-2 line-clamp-2">
            {message || 'Sin mensaje registrado.'}
          </p>
        </div>
      </div>
    </article>
  );
}

function AttendanceTrendRow({ item }) {
  const total = Number(item.total || 0);
  const presentes = Number(item.presentes || 0);
  const percent = total > 0 ? Math.round((presentes / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-extrabold text-brand-950">
            {formatDate(item.fecha)}
          </p>

          <p className="text-sm text-slate-500">
            {formatNumber(total)} registros · {formatNumber(item.faltas)} faltas · {formatNumber(item.tardanzas)} tardanzas
          </p>
        </div>

        <span className="text-sm font-extrabold text-brand-900">
          {percent}%
        </span>
      </div>

      <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full bg-brand-900 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-PE');
}

function formatBimesterLabel(value) {
  const labels = {
    B1: 'Bimestre 1',
    B2: 'Bimestre 2',
    B3: 'Bimestre 3',
    B4: 'Bimestre 4'
  };

  return labels[value] || value || 'Bimestre no registrado';
}

function getDateOnly(value) {
  if (!value) return '';

  const text = String(value).trim();
  const match = text.match(/^\d{4}-\d{2}-\d{2}/);

  if (match) return match[0];

  const date = new Date(text);

  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  return text.slice(0, 10);
}

function formatDate(value) {
  const dateOnly = getDateOnly(value);

  if (!dateOnly) return 'Sin fecha';

  const date = new Date(`${dateOnly}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatDateTime(value) {
  if (!value) return 'Sin fecha';

  const text = String(value).replace(' ', 'T');
  const date = new Date(text.endsWith('Z') ? text : `${text}Z`);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export default DirectorDashboard;