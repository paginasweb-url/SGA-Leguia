import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Search,
  UserRoundCheck
} from 'lucide-react';

import toast from 'react-hot-toast';

import { getMyTeacherCourses } from '../../services/teacherCourses.service';
import { getStoredUser } from '../../utils/storage';

function TeacherCourses() {
  const user = getStoredUser();

  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('todos');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    setError('');
  }, [error]);

  const loadCourses = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getMyTeacherCourses();
      setAssignments(response.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar tus cursos asignados.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourses();
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

  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return assignments.filter((item) => {
      const composed = [
        item.curso,
        item.grado,
        item.seccion,
        item.turno
      ].join(' ').toLowerCase();

      const matchesSearch =
        !term ||
        composed.includes(term) ||
        String(item.id).includes(term);

      const matchesClassroom =
        selectedClassroom === 'todos' ||
        Number(item.aula_id) === Number(selectedClassroom);

      return matchesSearch && matchesClassroom;
    });
  }, [assignments, search, selectedClassroom]);

  const groupedByClassroom = useMemo(() => {
    const map = new Map();

    filteredAssignments.forEach((item) => {
      const key = item.aula_id;

      if (!map.has(key)) {
        map.set(key, {
          aula_id: item.aula_id,
          grado: item.grado,
          seccion: item.seccion,
          turno: item.turno,
          courses: []
        });
      }

      map.get(key).courses.push(item);
    });

    return [...map.values()];
  }, [filteredAssignments]);

  const counters = useMemo(() => {
    return {
      totalCourses: assignments.length,
      classrooms: new Set(assignments.map((item) => item.aula_id)).size,
      turns: new Set(assignments.map((item) => item.turno)).size
    };
  }, [assignments]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando mis cursos...
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
              Mis cursos
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Consulta los cursos, aulas, grados y secciones asignados a tu cuenta docente.
            </p>

            <p className="text-sm text-blue-100 mt-4">
              Sesión: <span className="font-extrabold text-white">{user?.nombres || user?.username}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadCourses({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <CounterCard icon={BookOpen} label="Cursos" value={counters.totalCourses} description="Cursos asignados" />
        <CounterCard icon={LayoutGrid} label="Aulas" value={counters.classrooms} description="Aulas vinculadas" />
        <CounterCard icon={CalendarDays} label="Turnos" value={counters.turns} description="Turnos registrados" />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="relative lg:col-span-8">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por curso, grado o sección..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </div>

          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="lg:col-span-4 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="todos">Todas las aulas</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {groupedByClassroom.length > 0 ? (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
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
                  {group.grado} {group.seccion}
                </h2>

                <p className="text-sm text-blue-100 mt-1">
                  Turno {group.turno} · {group.courses.length} curso(s)
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {group.courses.map((course) => (
                  <div key={course.id} className="p-5 hover:bg-slate-50 transition">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
                        <BookOpen size={24} />
                      </div>

                      <div>
                        <p className="font-extrabold text-brand-950">
                          {course.curso}
                        </p>

                        <p className="text-sm text-slate-500 mt-1">
                          Asignación #{course.id}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <EmptyState text="No tienes cursos asignados con los filtros aplicados." />
      )}
    </main>
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

export default TeacherCourses;