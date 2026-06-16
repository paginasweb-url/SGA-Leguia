import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  LayoutGrid,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Trophy,
  UserRound
} from 'lucide-react';

import {
  getAcademicPeriodsForProgress,
  getMyAnnualResultForProgress,
  getMyProgress
} from '../../services/progress.service';

import { getStoredUser } from '../../utils/storage';

const BIMESTERS = ['B1', 'B2', 'B3', 'B4'];

function getArray(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function getCurrentPeriodId(periods) {
  const current = periods.find(
    (period) =>
      period.estado === 'activo' ||
      period.estado === 'actual' ||
      period.activo === true
  );

  return current?.id || periods[0]?.id || '';
}

function getDateOnly(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function formatDate(value) {
  const dateOnly = getDateOnly(value);

  if (!dateOnly) return 'Sin fecha';

  return new Date(`${dateOnly}T00:00:00`).toLocaleDateString('es-PE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
}

function getGradeBadgeClass(value) {
  if (value === 'AD') return 'bg-green-100 text-green-700';
  if (value === 'A') return 'bg-blue-100 text-blue-700';
  if (value === 'B') return 'bg-yellow-100 text-yellow-700';
  if (value === 'C') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
}

function getAttendanceBadgeClass(value) {
  if (value === 'presente') return 'bg-green-100 text-green-700';
  if (value === 'tarde') return 'bg-yellow-100 text-yellow-700';
  if (value === 'falta') return 'bg-red-100 text-red-700';
  if (value === 'justificado') return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-600';
}

function normalizeStatus(value) {
  if (!value) return 'Sin estado';
  return value;
}

function MyProgress() {
  const user = getStoredUser();

  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  const [type, setType] = useState('');
  const [studentProgress, setStudentProgress] = useState(null);
  const [guardianChildren, setGuardianChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [annualType, setAnnualType] = useState('');
  const [studentAnnualResult, setStudentAnnualResult] = useState(null);
  const [guardianAnnualChildren, setGuardianAnnualChildren] = useState([]);

  const [announcements, setAnnouncements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadInitial = async () => {
    try {
      setError('');
      setLoading(true);

      const periodsResponse = await getAcademicPeriodsForProgress();
      const periodsData = getArray(periodsResponse);

      setPeriods(periodsData);
      setSelectedPeriodId(String(getCurrentPeriodId(periodsData)));
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudieron cargar los períodos académicos.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const loadProgress = async ({ silent = false } = {}) => {
    if (!selectedPeriodId) return;

    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [progressResponse, annualResponse] = await Promise.all([
        getMyProgress(),
        getMyAnnualResultForProgress({
          periodoId: selectedPeriodId
        })
      ]);

      setType(progressResponse.type || '');
      setAnnualType(annualResponse.type || '');

      if (progressResponse.type === 'student') {
        setStudentProgress(progressResponse.data || null);
        setGuardianChildren([]);
        setSelectedStudentId('');
        setAnnouncements(progressResponse.data?.announcements || []);
      }

      if (progressResponse.type === 'guardian') {
        const childrenData = progressResponse.data?.children || [];

        setGuardianChildren(childrenData);
        setStudentProgress(null);
        setAnnouncements(progressResponse.data?.announcements || []);

        if (childrenData.length > 0 && !selectedStudentId) {
          setSelectedStudentId(String(childrenData[0].student.estudiante_id));
        }
      }

      if (annualResponse.type === 'student') {
        setStudentAnnualResult(annualResponse.data || null);
        setGuardianAnnualChildren([]);
      }

      if (annualResponse.type === 'guardian') {
        setStudentAnnualResult(null);
        setGuardianAnnualChildren(annualResponse.data?.children || []);
      }
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudo cargar el progreso académico.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedPeriodId) {
      loadProgress();
    }
  }, [selectedPeriodId]);

  const selectedProgressChild = useMemo(() => {
    if (type !== 'guardian') return null;

    return guardianChildren.find(
      (child) => String(child.student?.estudiante_id) === String(selectedStudentId)
    );
  }, [guardianChildren, selectedStudentId, type]);

  const selectedAnnualChild = useMemo(() => {
    if (annualType !== 'guardian') return null;

    return guardianAnnualChildren.find(
      (child) => String(child.result?.student?.estudiante_id) === String(selectedStudentId)
    );
  }, [guardianAnnualChildren, selectedStudentId, annualType]);

  const currentProgress = type === 'student'
    ? studentProgress
    : selectedProgressChild;

  const currentAnnual = annualType === 'student'
    ? studentAnnualResult
    : selectedAnnualChild?.result;

  const attendanceTotals = useMemo(() => {
    const summary = currentProgress?.attendance_summary || [];

    const result = {
      total: 0,
      presente: 0,
      tarde: 0,
      falta: 0,
      justificado: 0
    };

    summary.forEach((item) => {
      const estado = item.estado;
      const total = Number(item.total || 0);

      result.total += total;

      if (estado && result[estado] !== undefined) {
        result[estado] = total;
      }
    });

    return result;
  }, [currentProgress]);

  const courseProgress = useMemo(() => {
    const annualCourses = currentAnnual?.courses || [];

    if (annualCourses.length > 0) {
      return annualCourses.map((course) => ({
        curso_id: course.curso_id,
        curso: course.curso,
        bimestres: course.bimestres || {},
        nota_final: course.nota_final,
        estado: course.estado,
        bimestre_base: course.bimestre_base,
        puntos_acumulados: course.puntos_acumulados,
        comentarios: course.comentarios || {}
      }));
    }

    const grades = currentProgress?.grades || [];
    const map = new Map();

    grades.forEach((grade) => {
      if (!map.has(grade.curso_id)) {
        map.set(grade.curso_id, {
          curso_id: grade.curso_id,
          curso: grade.curso,
          bimestres: {
            B1: null,
            B2: null,
            B3: null,
            B4: null
          },
          comentarios: {
            B1: null,
            B2: null,
            B3: null,
            B4: null
          },
          nota_final: null,
          estado: 'registrado',
          bimestre_base: null,
          puntos_acumulados: 0
        });
      }

      const item = map.get(grade.curso_id);

      item.bimestres[grade.bimestre] = grade.nota;
      item.comentarios[grade.bimestre] = grade.comentario;
      item.nota_final = grade.nota;
      item.bimestre_base = grade.bimestre;
    });

    return [...map.values()];
  }, [currentAnnual, currentProgress]);

  const counters = useMemo(() => {
    const grades = currentProgress?.grades || [];
    const riskAlerts = currentProgress?.risk_alerts || [];
    const annualSummary = currentAnnual?.summary || {};

    return {
      cursos: courseProgress.length,
      notas: grades.length,
      alertas: riskAlerts.length,
      puesto: annualSummary.puesto_merito || null,
      totalEstudiantes: annualSummary.total_estudiantes_aula || null,
      estadoAnual: annualSummary.estado_anual || 'Sin estado',
      puntos: annualSummary.puntos_totales || 0
    };
  }, [currentProgress, currentAnnual, courseProgress]);

  if (loading && !refreshing) {
    return <Loading text="Cargando mi progreso..." />;
  }

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-brand-950 text-white shadow-soft p-6 lg:p-8">
        <div className="absolute -top-28 -right-24 w-80 h-80 bg-gold-500/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div>
            <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.2em]">
              {type === 'guardian' ? 'Portal Apoderado' : 'Portal Estudiante'}
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              Mi progreso
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Consulta un resumen integral de notas, asistencia, alertas, reforzamiento y resultado anual.
            </p>

            <p className="text-sm text-blue-100 mt-4">
              Sesión: <span className="font-extrabold text-white">{user?.nombres || user?.username}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadProgress({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      {error && <ErrorMessage text={error} />}

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {type === 'guardian' && (
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="lg:col-span-6 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            >
              {guardianChildren.map((child) => (
                <option
                  key={child.student.estudiante_id}
                  value={child.student.estudiante_id}
                >
                  {child.student.nombres} {child.student.apellidos}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className={`${type === 'guardian' ? 'lg:col-span-6' : 'lg:col-span-12'} px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800`}
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.nombre || period.anio || `Período ${period.id}`}
              </option>
            ))}
          </select>
        </div>
      </section>

      {currentProgress ? (
        <>
          <StudentInfoCard
            progress={currentProgress}
            annual={currentAnnual}
          />

          <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <CounterCard icon={BookOpen} label="Cursos" value={counters.cursos} description="Cursos vinculados" />
            <CounterCard icon={ClipboardList} label="Notas" value={counters.notas} description="Notas registradas" />
            <CounterCard icon={ShieldAlert} label="Alertas" value={counters.alertas} description="Notas en C" />
            <CounterCard
              icon={Trophy}
              label="Mérito"
              value={counters.puesto ? `${counters.puesto}/${counters.totalEstudiantes}` : '-'}
              description={`${counters.puntos} puntos`}
            />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <AttendanceCard totals={attendanceTotals} />
            <AnnualStatusCard annual={currentAnnual} />
            <AnnouncementsCard announcements={announcements} />
          </section>

          <CoursesProgress courses={courseProgress} />

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <RiskAlertsCard alerts={currentProgress.risk_alerts || []} />
            <ReinforcementCard suggestions={currentProgress.reinforcement_suggestions || []} />
          </section>

          <RecentAttendanceCard attendance={currentProgress.attendance_recent || []} />
        </>
      ) : (
        <EmptyState text="No hay progreso disponible para mostrar." />
      )}
    </main>
  );
}

function StudentInfoCard({ progress, annual }) {
  const student = progress.student || {};
  const summary = annual?.summary || {};

  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
            <UserRound size={28} />
          </div>

          <div>
            <p className="text-sm font-extrabold text-gold-600 uppercase tracking-[0.18em]">
              Estudiante
            </p>

            <h2 className="text-2xl font-extrabold text-brand-950 mt-1">
              {student.nombres} {student.apellidos}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {student.grado} {student.seccion} · Turno {student.turno} · Código {student.codigo_estudiante || 'No precisa'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-brand-50 text-brand-900">
            {normalizeStatus(summary.estado_anual)}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-gold-100 text-gold-700">
            Puesto {summary.puesto_merito || '-'} de {summary.total_estudiantes_aula || '-'}
          </span>
        </div>
      </div>
    </section>
  );
}

function AttendanceCard({ totals }) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex items-center gap-3">
        <CalendarCheck className="text-brand-900" size={26} />
        <div>
          <h3 className="font-extrabold text-brand-950">Asistencia</h3>
          <p className="text-sm text-slate-500">Resumen acumulado</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <MiniStat label="Presente" value={totals.presente} />
        <MiniStat label="Tarde" value={totals.tarde} />
        <MiniStat label="Falta" value={totals.falta} />
        <MiniStat label="Justificado" value={totals.justificado} />
      </div>
    </section>
  );
}

function AnnualStatusCard({ annual }) {
  const summary = annual?.summary || {};

  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex items-center gap-3">
        <Award className="text-brand-900" size={26} />
        <div>
          <h3 className="font-extrabold text-brand-950">Resultado anual</h3>
          <p className="text-sm text-slate-500">Estado y puntaje</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <MiniStat label="Estado" value={summary.estado_anual || '-'} />
        <MiniStat label="Puntos" value={summary.puntos_totales || 0} />
      </div>

      <p className="text-sm text-slate-500 mt-4">
        {summary.observacion || 'Sin observación anual.'}
      </p>
    </section>
  );
}

function AnnouncementsCard({ announcements }) {
  const latest = announcements.slice(0, 3);

  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex items-center gap-3">
        <Bell className="text-brand-900" size={26} />
        <div>
          <h3 className="font-extrabold text-brand-950">Comunicados</h3>
          <p className="text-sm text-slate-500">Últimos avisos</p>
        </div>
      </div>

      {latest.length > 0 ? (
        <div className="mt-5 space-y-3">
          {latest.map((item) => (
            <div key={item.id} className="border border-slate-100 rounded-2xl p-3">
              <p className="font-extrabold text-sm text-brand-950">
                {item.titulo}
              </p>

              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {item.contenido}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 mt-5">
          No hay comunicados recientes.
        </p>
      )}
    </section>
  );
}

function CoursesProgress({ courses }) {
  if (!courses.length) {
    return <EmptyState text="No hay cursos con información académica." />;
  }

  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-extrabold text-brand-950">
          Progreso por curso
        </h3>

        <p className="text-sm text-slate-500 mt-1">
          Notas bimestrales y nota final calculada.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 p-5">
        {courses.map((course) => (
          <article key={course.curso_id} className="border border-slate-200 rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-extrabold text-brand-950">
                  {course.curso}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Base: {course.bimestre_base || 'Sin bimestre'} · {course.estado || 'Sin estado'}
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${getGradeBadgeClass(course.nota_final)}`}>
                {course.nota_final || 'Sin nota'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-5">
              {BIMESTERS.map((bimester) => (
                <div
                  key={bimester}
                  className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center"
                >
                  <p className="text-[11px] font-bold text-slate-400">{bimester}</p>

                  <p className="font-extrabold text-brand-950 mt-1">
                    {course.bimestres?.[bimester] || '-'}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RiskAlertsCard({ alerts }) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="text-red-600" size={26} />
        <div>
          <h3 className="font-extrabold text-brand-950">Alertas académicas</h3>
          <p className="text-sm text-slate-500">Cursos con nota C</p>
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="mt-5 space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="border border-red-100 bg-red-50 rounded-2xl p-4">
              <p className="font-extrabold text-red-700">
                {alert.curso} · {alert.bimestre}
              </p>

              <p className="text-sm text-red-600 mt-1">
                {alert.comentario || 'El estudiante requiere apoyo en este curso.'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-2 text-green-700">
          <CheckCircle2 size={20} />
          <p className="text-sm font-semibold">
            No hay alertas académicas activas.
          </p>
        </div>
      )}
    </section>
  );
}

function ReinforcementCard({ suggestions }) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="text-brand-900" size={26} />
        <div>
          <h3 className="font-extrabold text-brand-950">Reforzamiento</h3>
          <p className="text-sm text-slate-500">Sugerencias automáticas</p>
        </div>
      </div>

      {suggestions.length > 0 ? (
        <div className="mt-5 space-y-3">
          {suggestions.map((item) => (
            <div
              key={`${item.curso_id}-${item.bimestre}`}
              className="border border-slate-100 rounded-2xl p-4"
            >
              <p className="font-extrabold text-brand-950">
                {item.curso}
              </p>

              <p className="text-sm text-slate-500 mt-1">
                {item.sugerencia}
              </p>

              <p className="text-xs font-bold text-slate-400 mt-2">
                Turno sugerido: {item.turno_sugerido}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 mt-5">
          No hay sugerencias de reforzamiento por el momento.
        </p>
      )}
    </section>
  );
}

function RecentAttendanceCard({ attendance }) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-extrabold text-brand-950">
          Asistencia reciente
        </h3>

        <p className="text-sm text-slate-500 mt-1">
          Últimos registros de asistencia del estudiante.
        </p>
      </div>

      {attendance.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {attendance.map((item) => (
            <div key={item.id} className="p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-extrabold text-brand-950">
                  {formatDate(item.fecha)}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {item.observacion || 'Sin observación'}
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${getAttendanceBadgeClass(item.estado)}`}>
                {item.estado}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-slate-500">
          No hay registros recientes de asistencia.
        </div>
      )}
    </section>
  );
}

function CounterCard({ icon: Icon, label, value, description }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
        <Icon size={24} />
      </div>

      <p className="text-sm font-bold text-slate-500 mt-5">{label}</p>

      <p className="text-3xl font-extrabold text-brand-950 mt-2">
        {value}
      </p>

      <p className="text-sm text-slate-500 mt-2">{description}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="text-xl font-extrabold text-brand-950 mt-1">{value}</p>
    </div>
  );
}

function Loading({ text }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
        <p className="mt-4 text-sm font-semibold text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function ErrorMessage({ text }) {
  return (
    <div className="bg-red-50 border border-red-100 text-danger rounded-2xl p-4 flex gap-3">
      <AlertCircle size={20} className="shrink-0 mt-0.5" />
      <p className="text-sm font-semibold">{text}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-10 text-center">
      <LayoutGrid className="mx-auto text-slate-300" size={46} />
      <p className="text-sm text-slate-500 mt-3">{text}</p>
    </section>
  );
}

export default MyProgress;