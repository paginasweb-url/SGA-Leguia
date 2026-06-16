import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Search,
  Users
} from 'lucide-react';

import {
  BIMESTERS,
  getAcademicPeriodsForGrades,
  getClassroomCourseBimesterGrades,
  getStudentsForGrades,
  getTeacherAssignmentsForGrades
} from '../../services/gradesNotes.service';

function getArray(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function getStudentId(student) {
  return student.estudiante_id || student.id;
}

function getGradeValue(row) {
  return row.nota || row.calificacion || '';
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

function GradesAdmin() {
  const [assignments, setAssignments] = useState([]);
  const [periods, setPeriods] = useState([]);

  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBimester, setSelectedBimester] = useState('B1');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);

  const [search, setSearch] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [error, setError] = useState('');

  const loadInitialData = async () => {
    try {
      setError('');
      setLoadingInitial(true);

      const [assignmentsResponse, periodsResponse] = await Promise.all([
        getTeacherAssignmentsForGrades(),
        getAcademicPeriodsForGrades()
      ]);

      const assignmentsData = getArray(assignmentsResponse);
      const periodsData = getArray(periodsResponse);

      setAssignments(assignmentsData);
      setPeriods(periodsData);

      const firstAssignment = assignmentsData[0];

      if (firstAssignment) {
        setSelectedClassroomId(String(firstAssignment.aula_id));
        setSelectedCourseId(String(firstAssignment.curso_id));
      }

      setSelectedPeriodId(String(getCurrentPeriodId(periodsData)));
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudieron cargar las asignaciones académicas.'
      );
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const classrooms = useMemo(() => {
    const map = new Map();

    assignments.forEach((item) => {
      map.set(item.aula_id, {
        id: item.aula_id,
        label: `${item.grado} ${item.seccion} - ${item.turno}`
      });
    });

    return [...map.values()];
  }, [assignments]);

  const courseOptions = useMemo(() => {
    const map = new Map();

    assignments
      .filter((item) => Number(item.aula_id) === Number(selectedClassroomId))
      .forEach((item) => {
        map.set(item.curso_id, {
          id: item.curso_id,
          label: item.curso,
          docente: item.docente
        });
      });

    return [...map.values()];
  }, [assignments, selectedClassroomId]);

  useEffect(() => {
    if (!selectedClassroomId) return;

    const firstCourse = courseOptions[0];

    if (firstCourse && !courseOptions.some((item) => String(item.id) === String(selectedCourseId))) {
      setSelectedCourseId(String(firstCourse.id));
    }
  }, [selectedClassroomId, courseOptions, selectedCourseId]);

  const selectedClassroom = classrooms.find(
    (item) => String(item.id) === String(selectedClassroomId)
  );

  const selectedCourse = courseOptions.find(
    (item) => String(item.id) === String(selectedCourseId)
  );

  const loadGradeSheet = async () => {
    if (!selectedClassroomId || !selectedCourseId || !selectedBimester || !selectedPeriodId) {
      return;
    }

    try {
      setError('');
      setLoadingSheet(true);

      const [studentsResponse, gradesResponse] = await Promise.all([
        getStudentsForGrades({
          aulaId: selectedClassroomId,
          periodoId: selectedPeriodId
        }),
        getClassroomCourseBimesterGrades({
          aulaId: selectedClassroomId,
          cursoId: selectedCourseId,
          bimestre: selectedBimester,
          periodoId: selectedPeriodId
        })
      ]);

      setStudents(getArray(studentsResponse));
      setGrades(getArray(gradesResponse));
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudo consultar la hoja de notas.'
      );
    } finally {
      setLoadingSheet(false);
    }
  };

  useEffect(() => {
    loadGradeSheet();
  }, [selectedClassroomId, selectedCourseId, selectedBimester, selectedPeriodId]);

  const rows = useMemo(() => {
    const gradesMap = new Map();

    grades.forEach((grade) => {
      gradesMap.set(Number(grade.estudiante_id), grade);
    });

    return students.map((student) => {
      const studentId = getStudentId(student);
      const grade = gradesMap.get(Number(studentId));

      return {
        ...student,
        nota: grade ? getGradeValue(grade) : '',
        observacion: grade?.observacion || ''
      };
    });
  }, [students, grades]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const fullName = `${row.nombres || ''} ${row.apellidos || ''}`.toLowerCase();

      return (
        !term ||
        fullName.includes(term) ||
        String(row.dni || '').includes(term) ||
        String(row.codigo_estudiante || '').toLowerCase().includes(term)
      );
    });
  }, [rows, search]);

  const counters = useMemo(() => {
    return {
      total: rows.length,
      graded: rows.filter((row) => row.nota).length,
      pending: rows.filter((row) => !row.nota).length,
      risk: rows.filter((row) => row.nota === 'C').length
    };
  }, [rows]);

  if (loadingInitial) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando supervisión de notas...
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
              Supervisión académica
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              Notas bimestrales
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Consulta las notas registradas por aula, curso, bimestre y período académico.
            </p>
          </div>

          <button
            type="button"
            onClick={loadGradeSheet}
            disabled={loadingSheet}
            className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
          >
            <RefreshCw size={18} className={loadingSheet ? 'animate-spin' : ''} />
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
        <CounterCard icon={Users} label="Estudiantes" value={counters.total} description="En el aula" />
        <CounterCard icon={ClipboardList} label="Con nota" value={counters.graded} description="Registrados" />
        <CounterCard icon={BookOpen} label="Pendientes" value={counters.pending} description="Sin nota" />
        <CounterCard icon={AlertCircle} label="En riesgo" value={counters.risk} description="Nota C" />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <select
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="lg:col-span-3 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="">Selecciona aula</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.label}
              </option>
            ))}
          </select>

          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="lg:col-span-3 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="">Selecciona curso</option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.label}
              </option>
            ))}
          </select>

          <select
            value={selectedBimester}
            onChange={(e) => setSelectedBimester(e.target.value)}
            className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            {BIMESTERS.map((bimester) => (
              <option key={bimester.value} value={bimester.value}>
                {bimester.label}
              </option>
            ))}
          </select>

          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="">Período</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.nombre || period.anio || `Período ${period.id}`}
              </option>
            ))}
          </select>

          <div className="relative lg:col-span-2">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-extrabold text-brand-950">
            {selectedCourse?.label || 'Curso'} · {selectedClassroom?.label || 'Aula'}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Docente: {selectedCourse?.docente || 'No precisa'}
          </p>
        </div>

        {loadingSheet ? (
          <div className="p-12 text-center">
            <Loader2 className="mx-auto animate-spin text-brand-900" size={34} />
            <p className="text-sm text-slate-500 mt-3">Consultando notas...</p>
          </div>
        ) : filteredRows.length > 0 ? (
          <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
            {filteredRows.map((row) => (
              <StudentGradeViewRow key={getStudentId(row)} row={row} />
            ))}
          </div>
        ) : (
          <EmptyState text="No hay estudiantes para mostrar." />
        )}
      </section>
    </main>
  );
}

function StudentGradeViewRow({ row }) {
  return (
    <div className="p-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_120px_260px] gap-4 lg:items-center hover:bg-slate-50 transition">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
          <GraduationCap size={22} />
        </div>

        <div className="min-w-0">
          <p className="font-extrabold text-brand-950 truncate">
            {row.apellidos}, {row.nombres}
          </p>

          <p className="text-sm text-slate-500 mt-1">
            DNI {row.dni} · Código {row.codigo_estudiante || 'No precisa'}
          </p>
        </div>
      </div>

      <span className={`inline-flex justify-center px-3 py-2 rounded-xl text-sm font-extrabold ${getGradeBadgeClass(row.nota)}`}>
        {row.nota || 'Sin nota'}
      </span>

      <p className="text-sm text-slate-500">
        {row.observacion || 'Sin observación'}
      </p>
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
    <div className="p-12 text-center">
      <LayoutGrid className="mx-auto text-slate-300" size={46} />
      <p className="text-sm text-slate-500 mt-3">{text}</p>
    </div>
  );
}

export default GradesAdmin;