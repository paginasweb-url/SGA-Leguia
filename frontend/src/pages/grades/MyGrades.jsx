import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  UserRound
} from 'lucide-react';

import {
  BIMESTERS,
  getAcademicPeriodsForGrades,
  getMyGrades
} from '../../services/gradesNotes.service';

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

function getCourseName(row) {
  return row.curso || row.nombre_curso || row.nombre || 'Curso';
}

function getGradeValue(row) {
  return row.nota || row.calificacion || 'Sin nota';
}

function MyGrades() {
  const user = getStoredUser();

  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  const [type, setType] = useState('');
  const [student, setStudent] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [search, setSearch] = useState('');
  const [selectedBimester, setSelectedBimester] = useState('todos');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadInitial = async () => {
    try {
      setError('');
      setLoading(true);

      const periodsResponse = await getAcademicPeriodsForGrades();
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

  const loadGrades = async ({ silent = false } = {}) => {
    if (!selectedPeriodId) return;

    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getMyGrades({
        periodoId: selectedPeriodId
      });

      setType(response.type || '');

      if (response.type === 'student') {
        setStudent({
          ...(response.data?.student || {}),
          grades: response.data?.grades || []
        });

        setChildren([]);
        setSelectedStudentId('');
      }

      if (response.type === 'guardian') {
        const childrenData = response.data?.children || [];
        setChildren(childrenData);

        if (childrenData.length > 0 && !selectedStudentId) {
          setSelectedStudentId(String(childrenData[0].student.estudiante_id));
        }
      }
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudieron cargar las notas.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedPeriodId) {
      loadGrades();
    }
  }, [selectedPeriodId]);

  const selectedChild = useMemo(() => {
    if (type !== 'guardian') return null;

    return children.find(
      (child) => String(child.student.estudiante_id) === String(selectedStudentId)
    );
  }, [children, selectedStudentId, type]);

  const currentStudent = type === 'student' ? student : selectedChild?.student;

  const grades = useMemo(() => {
    if (type === 'student') {
      return student?.grades || [];
    }

    if (type === 'guardian') {
      return selectedChild?.grades || [];
    }

    return [];
  }, [type, student, selectedChild]);

  const filteredGrades = useMemo(() => {
    const term = search.trim().toLowerCase();

    return grades.filter((row) => {
      const courseName = getCourseName(row).toLowerCase();

      const matchesSearch =
        !term ||
        courseName.includes(term) ||
        String(row.docente || '').toLowerCase().includes(term);

      const matchesBimester =
        selectedBimester === 'todos' ||
        row.bimestre === selectedBimester;

      return matchesSearch && matchesBimester;
    });
  }, [grades, search, selectedBimester]);

  const groupedByBimester = useMemo(() => {
    const map = new Map();

    filteredGrades.forEach((row) => {
      const key = row.bimestre || 'Sin bimestre';

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push(row);
    });

    return [...map.entries()];
  }, [filteredGrades]);

  const counters = useMemo(() => {
    return {
      total: grades.length,
      ad: grades.filter((row) => getGradeValue(row) === 'AD').length,
      a: grades.filter((row) => getGradeValue(row) === 'A').length,
      risk: grades.filter((row) => getGradeValue(row) === 'C').length
    };
  }, [grades]);

  if (loading && !refreshing) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando notas...
          </p>
        </div>
      </div>
    );
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
              Notas bimestrales
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Consulta las notas registradas por curso y bimestre.
            </p>

            <p className="text-sm text-blue-100 mt-4">
              Sesión: <span className="font-extrabold text-white">{user?.nombres || user?.username}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadGrades({ silent: true })}
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
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <CounterCard icon={ClipboardList} label="Registros" value={counters.total} description="Notas registradas" />
        <CounterCard icon={GraduationCap} label="AD" value={counters.ad} description="Logro destacado" />
        <CounterCard icon={BookOpen} label="A" value={counters.a} description="Logro esperado" />
        <CounterCard icon={AlertCircle} label="C" value={counters.risk} description="Requiere apoyo" />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {type === 'guardian' && (
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="lg:col-span-3 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            >
              {children.map((child) => (
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
            className={`${type === 'guardian' ? 'lg:col-span-3' : 'lg:col-span-3'} px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800`}
          >
            <option value="">Período</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.nombre || period.anio || `Período ${period.id}`}
              </option>
            ))}
          </select>

          <select
            value={selectedBimester}
            onChange={(e) => setSelectedBimester(e.target.value)}
            className="lg:col-span-3 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="todos">Todos los bimestres</option>
            {BIMESTERS.map((bimester) => (
              <option key={bimester.value} value={bimester.value}>
                {bimester.label}
              </option>
            ))}
          </select>

          <div className="relative lg:col-span-3">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar curso..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </div>
        </div>
      </section>

      {currentStudent && (
        <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
              <UserRound size={24} />
            </div>

            <div>
              <p className="text-sm font-extrabold text-gold-600 uppercase tracking-[0.18em]">
                Estudiante
              </p>

              <h2 className="text-xl font-extrabold text-brand-950 mt-1">
                {currentStudent.nombres} {currentStudent.apellidos}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                DNI {currentStudent.dni} · Código {currentStudent.codigo_estudiante || 'No precisa'}
              </p>
            </div>
          </div>
        </section>
      )}

      {groupedByBimester.length > 0 ? (
        <section className="space-y-5">
          {groupedByBimester.map(([bimester, rows]) => (
            <div
              key={bimester}
              className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden"
            >
              <div className="p-5 bg-brand-950 text-white">
                <p className="text-xs font-extrabold text-gold-500 uppercase tracking-[0.18em]">
                  {BIMESTERS.find((item) => item.value === bimester)?.label || bimester}
                </p>

                <h2 className="text-xl font-extrabold mt-2">
                  {rows.length} curso(s) con nota
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 p-5">
                {rows.map((grade, index) => (
                  <GradeCard key={`${grade.curso_id || grade.id || index}-${grade.bimestre}`} grade={grade} />
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <EmptyState text="No hay notas registradas con los filtros aplicados." />
      )}
    </main>
  );
}

function GradeCard({ grade }) {
  const value = getGradeValue(grade);

  return (
    <div className="border border-slate-200 rounded-3xl p-5 hover:bg-slate-50 transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-extrabold text-brand-950">
            {getCourseName(grade)}
          </p>

          <p className="text-sm text-slate-500 mt-1">
            {grade.grado ? `${grade.grado} ${grade.seccion || ''}` : 'Aula no especificada'}
          </p>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${getGradeBadgeClass(value)}`}>
          {value}
        </span>
      </div>

      {grade.observacion && (
        <p className="text-sm text-slate-500 mt-4">
          {grade.observacion}
        </p>
      )}
    </div>
  );
}

function getGradeBadgeClass(value) {
  if (value === 'AD') return 'bg-green-100 text-green-700';
  if (value === 'A') return 'bg-blue-100 text-blue-700';
  if (value === 'B') return 'bg-yellow-100 text-yellow-700';
  if (value === 'C') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
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

function EmptyState({ text }) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-10 text-center">
      <BookOpen className="mx-auto text-slate-300" size={46} />
      <p className="text-sm text-slate-500 mt-3">{text}</p>
    </section>
  );
}

export default MyGrades;