import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  GraduationCap,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Search,
  UserRoundCheck
} from 'lucide-react';

import { getMyCourses } from '../../services/courses.service';
import { getStoredUser } from '../../utils/storage';

function StudentCourses() {
  const user = getStoredUser();

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadCourses = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getMyCourses();
      setCourses(response.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar tus cursos.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return courses.filter((item) => {
      const composed = [
        item.nombre,
        item.docente,
        item.grado,
        item.seccion,
        item.turno
      ].join(' ').toLowerCase();

      return !term || composed.includes(term);
    });
  }, [courses, search]);

  const classroomInfo = useMemo(() => {
    const first = courses[0];

    if (!first) return null;

    return {
      grado: first.grado,
      seccion: first.seccion,
      turno: first.turno
    };
  }, [courses]);

  const counters = useMemo(() => {
    return {
      courses: courses.length,
      teachers: new Set(courses.map((item) => item.docente_id)).size,
      classrooms: new Set(courses.map((item) => item.aula_id)).size
    };
  }, [courses]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando cursos...
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
              Portal Estudiante
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              Mis cursos
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Consulta los cursos correspondientes a tu aula y docentes asignados.
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

      {error && (
        <div className="bg-red-50 border border-red-100 text-danger rounded-2xl p-4 flex gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <CounterCard icon={BookOpen} label="Cursos" value={counters.courses} description="Cursos matriculados" />
        <CounterCard icon={UserRoundCheck} label="Docentes" value={counters.teachers} description="Docentes asignados" />
        <CounterCard icon={LayoutGrid} label="Aulas" value={counters.classrooms} description="Aulas vinculadas" />
      </section>

      {classroomInfo && (
        <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
          <p className="text-sm font-extrabold text-gold-600 uppercase tracking-[0.18em]">
            Aula actual
          </p>

          <h2 className="text-2xl font-extrabold text-brand-950 mt-2">
            {classroomInfo.grado} {classroomInfo.seccion} · {classroomInfo.turno}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Cursos obtenidos desde tu matrícula aprobada.
          </p>
        </section>
      )}

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar curso o docente..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          />
        </div>
      </section>

      {filteredCourses.length > 0 ? (
        <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCourses.map((course) => (
            <div
              key={`${course.id}-${course.docente_id}-${course.aula_id}`}
              className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6 hover:-translate-y-1 hover:shadow-lg transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
                <BookOpen size={24} />
              </div>

              <h2 className="text-xl font-extrabold text-brand-950 mt-5">
                {course.nombre}
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Docente: <span className="font-bold text-slate-700">{course.docente}</span>
              </p>

              <div className="mt-5 border border-slate-100 rounded-2xl p-4 bg-slate-50">
                <p className="text-xs font-bold text-slate-500">
                  Aula
                </p>

                <p className="font-extrabold text-brand-950 mt-1">
                  {course.grado} {course.seccion}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Turno {course.turno}
                </p>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <EmptyState text="No se encontraron cursos con los filtros aplicados." />
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

export default StudentCourses;