import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Users
} from 'lucide-react';

import {
  BIMESTERS,
  GRADE_SCALE,
  getAcademicPeriodsForGrades,
  getClassroomCourseBimesterGrades,
  getMyTeacherAssignmentsForGrades,
  getStudentsForGrades,
  saveBimesterGrades
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

function TeacherGrades() {
  const [assignments, setAssignments] = useState([]);
  const [periods, setPeriods] = useState([]);

  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBimester, setSelectedBimester] = useState('B1');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  const [students, setStudents] = useState([]);
  const [gradeForm, setGradeForm] = useState({});
  const [search, setSearch] = useState('');

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadInitialData = async () => {
    try {
      setError('');
      setLoadingInitial(true);

      const [assignmentsResponse, periodsResponse] = await Promise.all([
        getMyTeacherAssignmentsForGrades(),
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
          'No se pudieron cargar tus cursos asignados.'
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
          label: item.curso
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
    const validAssignment = assignments.some(
      (item) =>
        Number(item.aula_id) === Number(selectedClassroomId) &&
        Number(item.curso_id) === Number(selectedCourseId)
    );

    if (!validAssignment) {
      return;
    }
    try {
      setError('');
      setSuccessMessage('');
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

      const studentsData = getArray(studentsResponse);
      const gradesData = getArray(gradesResponse);

      const savedGradesMap = new Map();

      gradesData.forEach((grade) => {
        savedGradesMap.set(Number(grade.estudiante_id), {
          nota: getGradeValue(grade),
          observacion: grade.observacion || ''
        });
      });

      const nextForm = {};

      studentsData.forEach((student) => {
        const studentId = getStudentId(student);
        const saved = savedGradesMap.get(Number(studentId));

        nextForm[studentId] = {
          nota: saved?.nota || '',
          observacion: saved?.observacion || ''
        };
      });

      setStudents(studentsData);
      setGradeForm(nextForm);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudo cargar la hoja de notas.'
      );
    } finally {
      setLoadingSheet(false);
    }
  };

  useEffect(() => {
    loadGradeSheet();
  }, [selectedClassroomId, selectedCourseId, selectedBimester, selectedPeriodId]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return students.filter((student) => {
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
    const total = students.length;
    const graded = students.filter((student) => {
      const studentId = getStudentId(student);
      return Boolean(gradeForm[studentId]?.nota);
    }).length;

    return {
      total,
      graded,
      pending: total - graded
    };
  }, [students, gradeForm]);

  const handleGradeChange = (studentId, field, value) => {
    setGradeForm((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: value
      }
    }));
  };

  const handleClassroomChange = (aulaId) => {
    setSelectedClassroomId(aulaId);

    const firstCourseForClassroom = assignments.find(
      (item) => String(item.aula_id) === String(aulaId)
    );

    setSelectedCourseId(
      firstCourseForClassroom ? String(firstCourseForClassroom.curso_id) : ''
    );
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccessMessage('');

      if (!selectedClassroomId || !selectedCourseId || !selectedBimester || !selectedPeriodId) {
        setError('Selecciona aula, curso, bimestre y período académico.');
        return;
      }

      if (students.length === 0) {
        setError('No hay estudiantes para registrar notas.');
        return;
      }

      const missingGrades = students.filter((student) => {
        const studentId = getStudentId(student);
        return !gradeForm[studentId]?.nota;
      });

      if (missingGrades.length > 0) {
        setError('Debes registrar una nota para todos los estudiantes.');
        return;
      }

      setSaving(true);

      const notas = students.map((student) => {
        const studentId = getStudentId(student);
        const nota = gradeForm[studentId].nota;

        return {
          estudiante_id: Number(studentId),
          nota,
          calificacion: nota,
          comentario: gradeForm[studentId].observacion || null,
          observacion: gradeForm[studentId].observacion || null
        };
        });
        console.log('Payload notas:', {
        aula_id: Number(selectedClassroomId),
        curso_id: Number(selectedCourseId),
        bimestre: selectedBimester,
        periodo_id: Number(selectedPeriodId),
        notas
        });
        const response = await saveBimesterGrades({
        aula_id: Number(selectedClassroomId),
        curso_id: Number(selectedCourseId),
        bimestre: selectedBimester,
        periodo_id: Number(selectedPeriodId),
        notas
        });

        if (!response?.success) {
        throw new Error(response?.error || 'No se pudieron guardar las notas.');
        }

        setSuccessMessage('Notas guardadas correctamente.');
        await loadGradeSheet();
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudieron guardar las notas.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando módulo de notas...
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
              Panel Docente
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              Notas bimestrales
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Registra una nota por estudiante, curso, aula, bimestre y período académico.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loadingSheet}
            className="inline-flex items-center justify-center gap-2 bg-gold-500 text-brand-950 px-5 py-3 rounded-xl font-extrabold hover:bg-gold-400 disabled:opacity-60 transition"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Guardar notas
          </button>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-100 text-danger rounded-2xl p-4 flex gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-100 text-green-700 rounded-2xl p-4 flex gap-3">
          <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{successMessage}</p>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <CounterCard icon={Users} label="Estudiantes" value={counters.total} description="Matriculados en el aula" />
        <CounterCard icon={ClipboardList} label="Con nota" value={counters.graded} description="Notas registradas" />
        <CounterCard icon={AlertCircle} label="Pendientes" value={counters.pending} description="Faltan por registrar" />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <select
            value={selectedClassroomId}
            onChange={(e) => handleClassroomChange(e.target.value)}
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

          <button
            type="button"
            onClick={loadGradeSheet}
            disabled={loadingSheet}
            className="lg:col-span-2 inline-flex items-center justify-center gap-2 bg-brand-950 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-brand-900 disabled:opacity-60 transition"
          >
            <RefreshCw size={18} className={loadingSheet ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-brand-950">
              {selectedCourse?.label || 'Curso'} · {selectedClassroom?.label || 'Aula'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Escala permitida: AD, A, B, C
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar estudiante..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </div>
        </div>

        {loadingSheet ? (
          <div className="p-12 text-center">
            <Loader2 className="mx-auto animate-spin text-brand-900" size={34} />
            <p className="text-sm text-slate-500 mt-3">Cargando estudiantes y notas...</p>
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
            {filteredStudents.map((student) => {
              const studentId = getStudentId(student);
              const value = gradeForm[studentId] || { nota: '', observacion: '' };

              return (
                <StudentGradeRow
                  key={studentId}
                  student={student}
                  value={value}
                  onChange={(field, nextValue) =>
                    handleGradeChange(studentId, field, nextValue)
                  }
                />
              );
            })}
          </div>
        ) : (
          <EmptyState text="No hay estudiantes para mostrar." />
        )}
      </section>
    </main>
  );
}

function StudentGradeRow({ student, value, onChange }) {
  return (
    <div className="p-5 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_180px_320px] gap-4 xl:items-center hover:bg-slate-50 transition">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
          <GraduationCap size={22} />
        </div>

        <div className="min-w-0">
          <p className="font-extrabold text-brand-950 truncate">
            {student.apellidos}, {student.nombres}
          </p>

          <p className="text-sm text-slate-500 mt-1">
            DNI {student.dni} · Código {student.codigo_estudiante || 'No precisa'}
          </p>
        </div>
      </div>

      <select
        value={value.nota || ''}
        onChange={(e) => onChange('nota', e.target.value)}
        className="px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 font-extrabold"
      >
        <option value="">Seleccionar nota</option>
        {GRADE_SCALE.map((grade) => (
          <option key={grade.value} value={grade.value}>
            {grade.label}
          </option>
        ))}
      </select>

      <input
        value={value.observacion || ''}
        onChange={(e) => onChange('observacion', e.target.value)}
        placeholder="Observación opcional"
        className="px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
      />
    </div>
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

function EmptyState({ text }) {
  return (
    <div className="p-12 text-center">
      <BookOpen className="mx-auto text-slate-300" size={46} />
      <p className="text-sm text-slate-500 mt-3">{text}</p>
    </div>
  );
}

export default TeacherGrades;