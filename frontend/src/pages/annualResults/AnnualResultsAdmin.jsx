import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  GraduationCap,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Search,
  Trophy,
  Users
} from 'lucide-react';

import {
  getAcademicPeriodsForAnnualResults,
  getClassroomAnnualResults,
  getClassroomsForAnnualResults
} from '../../services/annualResults.service';

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

function getClassroomId(classroom) {
  return classroom.aula_id || classroom.id;
}

function classroomLabel(classroom) {
  return `${classroom.grado || classroom.grado_nombre || ''} ${classroom.seccion || classroom.seccion_nombre || ''} - ${classroom.turno || ''}`;
}

function AnnualResultsAdmin() {
  const [periods, setPeriods] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');

  const [result, setResult] = useState(null);
  const [search, setSearch] = useState('');

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState('');

  const loadInitial = async () => {
    try {
      setError('');
      setLoadingInitial(true);

      const [periodsResponse, classroomsResponse] = await Promise.all([
        getAcademicPeriodsForAnnualResults(),
        getClassroomsForAnnualResults()
      ]);

      const periodsData = getArray(periodsResponse);
      const classroomsData = getArray(classroomsResponse);

      setPeriods(periodsData);
      setClassrooms(classroomsData);

      setSelectedPeriodId(String(getCurrentPeriodId(periodsData)));

      if (classroomsData.length > 0) {
        setSelectedClassroomId(String(getClassroomId(classroomsData[0])));
      }
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudieron cargar los datos iniciales.'
      );
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const loadResults = async () => {
    if (!selectedPeriodId || !selectedClassroomId) return;

    try {
      setError('');
      setLoadingResults(true);

      const response = await getClassroomAnnualResults({
        aulaId: selectedClassroomId,
        periodoId: selectedPeriodId
      });

      setResult(response.data || null);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudo cargar el resultado anual.'
      );
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [selectedPeriodId, selectedClassroomId]);

  const students = result?.students || [];

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return students.filter((item) => {
      const student = item.student || {};
      const fullName = `${student.nombres || ''} ${student.apellidos || ''}`.toLowerCase();

      return (
        !term ||
        fullName.includes(term) ||
        String(student.dni || '').includes(term) ||
        String(student.codigo_estudiante || '').toLowerCase().includes(term)
      );
    });
  }, [students, search]);

  const counters = useMemo(() => {
    return {
      total: students.length,
      promoted: students.filter((item) => item.summary?.estado_anual === 'Promovido').length,
      incomplete: students.filter((item) => item.summary?.estado_anual === 'Incompleto').length,
      risk: students.filter((item) => Number(item.summary?.total_c_final || 0) > 0).length
    };
  }, [students]);

  if (loadingInitial) {
    return <Loading text="Cargando resultados anuales..." />;
  }

  return (
    <main className="space-y-6">
      <Header
        title="Resultado anual"
        subtitle="Supervisa el resultado anual, situación académica y orden de mérito por aula."
        onRefresh={loadResults}
        refreshing={loadingResults}
      />

      {error && <ErrorMessage text={error} />}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <CounterCard icon={Users} label="Estudiantes" value={counters.total} description="En el aula" />
        <CounterCard icon={GraduationCap} label="Promovidos" value={counters.promoted} description="Situación anual" />
        <CounterCard icon={AlertCircle} label="Incompletos" value={counters.incomplete} description="Faltan notas" />
        <CounterCard icon={BookOpen} label="Con C" value={counters.risk} description="Requieren apoyo" />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <select
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="lg:col-span-4 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            {classrooms.map((classroom) => (
              <option key={getClassroomId(classroom)} value={getClassroomId(classroom)}>
                {classroomLabel(classroom)}
              </option>
            ))}
          </select>

          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="lg:col-span-4 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.nombre || period.anio || `Período ${period.id}`}
              </option>
            ))}
          </select>

          <div className="relative lg:col-span-4">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar estudiante..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </div>
        </div>
      </section>

      <ResultsList
        loading={loadingResults}
        students={filteredStudents}
      />
    </main>
  );
}

function ResultsList({ loading, students }) {
  if (loading) {
    return <Loading text="Consultando resultado anual..." small />;
  }

  if (!students.length) {
    return <EmptyState text="No hay resultados para mostrar." />;
  }

  return (
    <section className="space-y-5">
      {students.map((item) => (
        <StudentAnnualCard
          key={item.student.estudiante_id}
          item={item}
        />
      ))}
    </section>
  );
}

function StudentAnnualCard({ item }) {
  const student = item.student || {};
  const summary = item.summary || {};
  const courses = item.courses || [];

  return (
    <article className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
      <div className="p-5 bg-brand-950 text-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-gold-500 uppercase tracking-[0.18em]">
            Puesto {summary.puesto_merito || '-'} de {summary.total_estudiantes_aula || '-'}
          </p>

          <h2 className="text-xl font-extrabold mt-2">
            {student.apellidos}, {student.nombres}
          </h2>

          <p className="text-sm text-blue-100 mt-1">
            DNI {student.dni} · Código {student.codigo_estudiante || 'No precisa'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge text={summary.estado_anual || 'Sin estado'} type={summary.estado_anual} />
          <Badge text={`${summary.puntos_totales || 0} puntos`} />
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <MiniStat label="Cursos" value={summary.total_cursos} />
        <MiniStat label="Calificados" value={summary.cursos_calificados} />
        <MiniStat label="Pendientes" value={summary.cursos_pendientes} />
        <MiniStat label="Cursos con C" value={summary.cursos_con_c} />
      </div>

      <div className="px-5 pb-5">
        <p className="text-sm text-slate-500 mb-4">
          {summary.observacion}
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {courses.map((course) => (
            <CourseAnnualCard key={course.curso_id} course={course} />
          ))}
        </div>
      </div>
    </article>
  );
}

function CourseAnnualCard({ course }) {
  return (
    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-extrabold text-brand-950">
            {course.curso}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Base: {course.bimestre_base || 'Sin bimestre'} · Estado: {course.estado}
          </p>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${gradeBadge(course.nota_final)}`}>
          {course.nota_final || 'Sin nota'}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4">
        {['B1', 'B2', 'B3', 'B4'].map((bimester) => (
          <div key={bimester} className="rounded-xl bg-white border border-slate-200 p-2 text-center">
            <p className="text-[11px] font-bold text-slate-400">{bimester}</p>
            <p className="font-extrabold text-brand-950 mt-1">
              {course.bimestres?.[bimester] || '-'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({ title, subtitle, onRefresh, refreshing }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand-950 text-white shadow-soft p-6 lg:p-8">
      <div className="absolute -top-28 -right-24 w-80 h-80 bg-gold-500/20 rounded-full blur-3xl" />

      <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
        <div>
          <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.2em]">
            Gestión académica
          </p>

          <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
            {title}
          </h1>

          <p className="text-blue-100 mt-3 max-w-2xl">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>
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
        {Number(value || 0).toLocaleString('es-PE')}
      </p>

      <p className="text-sm text-slate-500 mt-2">{description}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="text-2xl font-extrabold text-brand-950 mt-1">{value || 0}</p>
    </div>
  );
}

function Badge({ text, type }) {
  const classes =
    type === 'Promovido'
      ? 'bg-green-100 text-green-700'
      : type === 'Incompleto'
        ? 'bg-yellow-100 text-yellow-700'
        : type === 'Requiere recuperación'
          ? 'bg-red-100 text-red-700'
          : 'bg-white/10 text-white';

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${classes}`}>
      {text}
    </span>
  );
}

function gradeBadge(value) {
  if (value === 'AD') return 'bg-green-100 text-green-700';
  if (value === 'A') return 'bg-blue-100 text-blue-700';
  if (value === 'B') return 'bg-yellow-100 text-yellow-700';
  if (value === 'C') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
}

function Loading({ text, small = false }) {
  return (
    <div className={`${small ? 'p-10' : 'min-h-[70vh]'} flex items-center justify-center`}>
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

export default AnnualResultsAdmin;