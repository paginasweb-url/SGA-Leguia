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
  Users
} from 'lucide-react';

import {
  getAcademicPeriodsForAnnualResults,
  getClassroomAnnualResults,
  getTeacherAssignmentsForAnnualResults
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

function TeacherAnnualResults() {
  const [periods, setPeriods] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');

  const [result, setResult] = useState(null);
  const [search, setSearch] = useState('');

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState('');

  const classrooms = useMemo(() => {
    const map = new Map();

    assignments.forEach((item) => {
      map.set(item.aula_id, {
        aula_id: item.aula_id,
        grado: item.grado,
        seccion: item.seccion,
        turno: item.turno
      });
    });

    return [...map.values()];
  }, [assignments]);

  const loadInitial = async () => {
    try {
      setError('');
      setLoadingInitial(true);

      const [periodsResponse, assignmentsResponse] = await Promise.all([
        getAcademicPeriodsForAnnualResults(),
        getTeacherAssignmentsForAnnualResults()
      ]);

      const periodsData = getArray(periodsResponse);
      const assignmentsData = getArray(assignmentsResponse);

      setPeriods(periodsData);
      setAssignments(assignmentsData);

      setSelectedPeriodId(String(getCurrentPeriodId(periodsData)));

      if (assignmentsData.length > 0) {
        setSelectedClassroomId(String(assignmentsData[0].aula_id));
      }
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudieron cargar tus aulas asignadas.'
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

  if (loadingInitial) {
    return <Loading text="Cargando resultado anual..." />;
  }

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-brand-950 text-white shadow-soft p-6 lg:p-8">
        <div className="absolute -top-28 -right-24 w-80 h-80 bg-gold-500/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div>
            <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.2em]">
              Panel Docente
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              Resultado anual
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Consulta el resultado anual de los estudiantes en tus aulas asignadas.
            </p>
          </div>

          <button
            type="button"
            onClick={loadResults}
            disabled={loadingResults}
            className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
          >
            <RefreshCw size={18} className={loadingResults ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      {error && <ErrorMessage text={error} />}

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <select
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="lg:col-span-4 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            {classrooms.map((classroom) => (
              <option key={classroom.aula_id} value={classroom.aula_id}>
                {classroom.grado} {classroom.seccion} - {classroom.turno}
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

      {loadingResults ? (
        <Loading text="Consultando resultado anual..." small />
      ) : filteredStudents.length > 0 ? (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredStudents.map((item) => (
            <TeacherStudentCard key={item.student.estudiante_id} item={item} />
          ))}
        </section>
      ) : (
        <EmptyState text="No hay resultados para mostrar." />
      )}
    </main>
  );
}

function TeacherStudentCard({ item }) {
  const student = item.student || {};
  const summary = item.summary || {};
  const courses = item.courses || [];

  return (
    <article className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
      <div className="p-5 bg-brand-950 text-white">
        <p className="text-xs font-extrabold text-gold-500 uppercase tracking-[0.18em]">
          Puesto {summary.puesto_merito || '-'} de {summary.total_estudiantes_aula || '-'}
        </p>

        <h2 className="text-xl font-extrabold mt-2">
          {student.apellidos}, {student.nombres}
        </h2>

        <p className="text-sm text-blue-100 mt-1">
          {summary.puntos_totales || 0} puntos · {summary.estado_anual}
        </p>
      </div>

      <div className="p-5 space-y-3">
        {courses.map((course) => (
          <div
            key={course.curso_id}
            className="flex items-center justify-between gap-3 border border-slate-100 rounded-2xl p-4"
          >
            <div>
              <p className="font-extrabold text-brand-950">{course.curso}</p>
              <p className="text-xs text-slate-500 mt-1">
                Base {course.bimestre_base || '-'} · {course.estado}
              </p>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${gradeBadge(course.nota_final)}`}>
              {course.nota_final || 'Sin nota'}
            </span>
          </div>
        ))}
      </div>
    </article>
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

export default TeacherAnnualResults;