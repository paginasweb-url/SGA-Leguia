import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  GraduationCap,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  Users
} from 'lucide-react';

import { getMyTeacherStudents } from '../../services/teacherCourses.service';
import { getStoredUser } from '../../utils/storage';

function TeacherStudents() {
  const user = getStoredUser();

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('todos');
  const [selectedCourse, setSelectedCourse] = useState('todos');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadStudents = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getMyTeacherStudents();
      setRows(response.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar tus estudiantes.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const classrooms = useMemo(() => {
    const map = new Map();

    rows.forEach((item) => {
      map.set(item.aula_id, {
        id: item.aula_id,
        label: `${item.grado} ${item.seccion} - ${item.turno}`
      });
    });

    return [...map.values()];
  }, [rows]);

  const courses = useMemo(() => {
    const map = new Map();

    rows.forEach((item) => {
      map.set(item.curso_id, {
        id: item.curso_id,
        label: item.curso
      });
    });

    return [...map.values()];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((item) => {
      const fullName = `${item.nombres || ''} ${item.apellidos || ''}`.toLowerCase();

      const matchesSearch =
        !term ||
        fullName.includes(term) ||
        String(item.dni || '').includes(term) ||
        String(item.codigo_estudiante || '').toLowerCase().includes(term) ||
        String(item.curso || '').toLowerCase().includes(term);

      const matchesClassroom =
        selectedClassroom === 'todos' ||
        Number(item.aula_id) === Number(selectedClassroom);

      const matchesCourse =
        selectedCourse === 'todos' ||
        Number(item.curso_id) === Number(selectedCourse);

      return matchesSearch && matchesClassroom && matchesCourse;
    });
  }, [rows, search, selectedClassroom, selectedCourse]);

  const groupedByClassroom = useMemo(() => {
    const map = new Map();

    filteredRows.forEach((item) => {
      const key = item.aula_id;

      if (!map.has(key)) {
        map.set(key, {
          aula_id: item.aula_id,
          grado: item.grado,
          seccion: item.seccion,
          turno: item.turno,
          courses: new Map(),
          students: new Map()
        });
      }

      const group = map.get(key);

      group.courses.set(item.curso_id, item.curso);

      group.students.set(item.estudiante_id, {
        estudiante_id: item.estudiante_id,
        codigo_estudiante: item.codigo_estudiante,
        nombres: item.nombres,
        apellidos: item.apellidos,
        dni: item.dni,
        correo: item.correo,
        estado: item.estado,
        periodo_id: item.periodo_id,
        matricula_estado: item.matricula_estado
      });
    });

    return [...map.values()].map((group) => ({
      ...group,
      courses: [...group.courses.entries()].map(([id, nombre]) => ({
        id,
        nombre
      })),
      students: [...group.students.values()]
    }));
  }, [filteredRows]);

  const counters = useMemo(() => {
    return {
      students: new Set(rows.map((item) => item.estudiante_id)).size,
      classrooms: new Set(rows.map((item) => item.aula_id)).size,
      courses: new Set(rows.map((item) => item.curso_id)).size
    };
  }, [rows]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando estudiantes...
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
              Mis estudiantes
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Consulta estudiantes matriculados en las aulas donde tienes cursos asignados.
            </p>

            <p className="text-sm text-blue-100 mt-4">
              Sesión: <span className="font-extrabold text-white">{user?.nombres || user?.username}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadStudents({ silent: true })}
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

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <CounterCard icon={Users} label="Estudiantes" value={counters.students} description="Sin duplicar por curso" />
        <CounterCard icon={LayoutGrid} label="Aulas" value={counters.classrooms} description="Aulas asignadas" />
        <CounterCard icon={BookOpen} label="Cursos" value={counters.courses} description="Cursos dictados" />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="relative lg:col-span-6">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar estudiante, DNI, código o curso..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </div>

          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="lg:col-span-3 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="todos">Todas las aulas</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.label}
              </option>
            ))}
          </select>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="lg:col-span-3 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="todos">Todos los cursos</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {groupedByClassroom.length > 0 ? (
        <section className="space-y-5">
          {groupedByClassroom.map((group) => (
            <div
              key={group.aula_id}
              className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden"
            >
              <div className="p-6 bg-brand-950 text-white">
                <p className="text-xs font-extrabold text-gold-500 uppercase tracking-[0.18em]">
                  Aula asignada
                </p>

                <h2 className="text-xl font-extrabold mt-2">
                  {group.grado} {group.seccion} · {group.turno}
                </h2>

                <div className="flex flex-wrap gap-2 mt-4">
                  {group.courses.map((course) => (
                    <span
                      key={course.id}
                      className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold bg-white/10 border border-white/10 text-white"
                    >
                      {course.nombre}
                    </span>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {group.students.map((student) => (
                  <StudentRow key={student.estudiante_id} student={student} />
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <EmptyState text="No se encontraron estudiantes con los filtros aplicados." />
      )}
    </main>
  );
}

function StudentRow({ student }) {
  return (
    <div className="p-5 hover:bg-slate-50 transition">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
          <UserCheck size={23} />
        </div>

        <div className="min-w-0">
          <p className="font-extrabold text-brand-950">
            {student.apellidos}, {student.nombres}
          </p>

          <p className="text-sm text-slate-500 mt-1">
            DNI {student.dni} · Código {student.codigo_estudiante || 'No precisa'}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            {student.correo}
          </p>
        </div>
      </div>
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
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-10 text-center">
      <GraduationCap className="mx-auto text-slate-300" size={46} />
      <p className="text-sm text-slate-500 mt-3">{text}</p>
    </section>
  );
}

export default TeacherStudents;