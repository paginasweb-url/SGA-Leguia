import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  GraduationCap,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Trophy,
  UserRound
} from 'lucide-react';

import {
  getAcademicPeriodsForAnnualResults,
  getMyAnnualResult
} from '../../services/annualResults.service';

import { getStoredUser } from '../../utils/storage';

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

function MyAnnualResults() {
  const user = getStoredUser();

  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  const [type, setType] = useState('');
  const [studentResult, setStudentResult] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadInitial = async () => {
    try {
      setError('');
      setLoading(true);

      const periodsResponse = await getAcademicPeriodsForAnnualResults();
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

  const loadAnnualResult = async ({ silent = false } = {}) => {
    if (!selectedPeriodId) return;

    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getMyAnnualResult({
        periodoId: selectedPeriodId
      });

      setType(response.type || '');

      if (response.type === 'student') {
        setStudentResult(response.data || null);
        setChildren([]);
        setSelectedStudentId('');
      }

      if (response.type === 'guardian') {
        const childrenData = response.data?.children || [];
        setChildren(childrenData);
        setStudentResult(null);

        if (childrenData.length > 0 && !selectedStudentId) {
          setSelectedStudentId(String(childrenData[0].result.student.estudiante_id));
        }
      }
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudo cargar el resultado anual.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedPeriodId) {
      loadAnnualResult();
    }
  }, [selectedPeriodId]);

  const selectedChild = useMemo(() => {
    if (type !== 'guardian') return null;

    return children.find(
      (child) =>
        String(child.result?.student?.estudiante_id) === String(selectedStudentId)
    );
  }, [children, selectedStudentId, type]);

  const currentResult = type === 'student'
    ? studentResult
    : selectedChild?.result;

  if (loading && !refreshing) {
    return <Loading text="Cargando resultado anual..." />;
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
              Resultado anual
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Consulta la nota final por curso, el estado anual y el puesto de mérito.
            </p>

            <p className="text-sm text-blue-100 mt-4">
              Sesión: <span className="font-extrabold text-white">{user?.nombres || user?.username}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadAnnualResult({ silent: true })}
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
              {children.map((child) => (
                <option
                  key={child.result.student.estudiante_id}
                  value={child.result.student.estudiante_id}
                >
                  {child.result.student.nombres} {child.result.student.apellidos}
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

      {currentResult ? (
        <StudentAnnualDetail result={currentResult} />
      ) : (
        <EmptyState text="No hay resultado anual para mostrar." />
      )}
    </main>
  );
}

function StudentAnnualDetail({ result }) {
  const student = result.student || {};
  const summary = result.summary || {};
  const courses = result.courses || [];

  return (
    <section className="space-y-6">
      <article className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
        <div className="p-6 bg-brand-950 text-white">
          <p className="text-xs font-extrabold text-gold-500 uppercase tracking-[0.18em]">
            Estudiante
          </p>

          <h2 className="text-2xl font-extrabold mt-2">
            {student.nombres} {student.apellidos}
          </h2>

          <p className="text-sm text-blue-100 mt-1">
            {student.grado} {student.seccion} · Turno {student.turno}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 p-5">
          <SummaryCard icon={Trophy} label="Puesto" value={`${summary.puesto_merito || '-'} de ${summary.total_estudiantes_aula || '-'}`} />
          <SummaryCard icon={Award} label="Puntos" value={summary.puntos_totales || 0} />
          <SummaryCard icon={GraduationCap} label="Estado" value={summary.estado_anual || '-'} />
          <SummaryCard icon={BookOpen} label="Cursos" value={summary.total_cursos || 0} />
        </div>

        <div className="px-5 pb-5">
          <p className="text-sm text-slate-500">
            {summary.observacion}
          </p>
        </div>
      </article>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {courses.map((course) => (
          <CourseAnnualCard key={course.curso_id} course={course} />
        ))}
      </section>
    </section>
  );
}

function CourseAnnualCard({ course }) {
  return (
    <article className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-extrabold text-brand-950">
            {course.curso}
          </p>

          <p className="text-sm text-slate-500 mt-1">
            Nota base: {course.bimestre_base || 'Sin bimestre'}
          </p>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${gradeBadge(course.nota_final)}`}>
          {course.nota_final || 'Sin nota'}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-5">
        {['B1', 'B2', 'B3', 'B4'].map((bimester) => (
          <div key={bimester} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
            <p className="text-[11px] font-bold text-slate-400">{bimester}</p>
            <p className="font-extrabold text-brand-950 mt-1">
              {course.bimestres?.[bimester] || '-'}
            </p>
          </div>
        ))}
      </div>

      {course.motivo_ajuste && (
        <p className="text-sm text-slate-500 mt-4">
          {course.motivo_ajuste}
        </p>
      )}
    </article>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
      <Icon className="text-brand-900" size={24} />
      <p className="text-xs font-bold text-slate-500 mt-4">{label}</p>
      <p className="text-xl font-extrabold text-brand-950 mt-1">{value}</p>
    </div>
  );
}

function gradeBadge(value) {
  if (value === 'AD') return 'bg-green-100 text-green-700';
  if (value === 'A') return 'bg-blue-100 text-blue-700';
  if (value === 'B') return 'bg-yellow-100 text-yellow-700';
  if (value === 'C') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
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

export default MyAnnualResults;