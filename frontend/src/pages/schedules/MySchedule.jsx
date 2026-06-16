import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Loader2,
  RefreshCw,
  UserRoundCheck
} from 'lucide-react';

import { getMySchedules } from '../../services/schedules.service';
import { getRole, getStoredUser } from '../../utils/storage';

const days = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes'
];

function MySchedule() {
  const role = getRole();
  const user = getStoredUser();

  const [schedules, setSchedules] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('todos');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadSchedules = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getMySchedules();
      setSchedules(response.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo cargar el horario.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const students = useMemo(() => {
    const map = new Map();

    schedules.forEach((item) => {
      if (!item.estudiante_id) return;

      map.set(item.estudiante_id, item.estudiante || 'Estudiante');
    });

    return [...map.entries()].map(([id, name]) => ({
      id,
      name
    }));
  }, [schedules]);

  const visibleSchedules = useMemo(() => {
    if (selectedStudent === 'todos') return schedules;

    return schedules.filter(
      (item) => Number(item.estudiante_id) === Number(selectedStudent)
    );
  }, [schedules, selectedStudent]);

  const groupedByDay = useMemo(() => {
    return days.map((day) => ({
      day,
      items: visibleSchedules.filter((item) => item.dia_semana === day)
    }));
  }, [visibleSchedules]);

  const counters = useMemo(() => {
    return {
      total: visibleSchedules.length,
      courses: new Set(visibleSchedules.map((item) => item.curso_id).filter(Boolean)).size,
      teachers: new Set(visibleSchedules.map((item) => item.docente_id).filter(Boolean)).size,
      classrooms: new Set(visibleSchedules.map((item) => item.aula_id).filter(Boolean)).size
    };
  }, [visibleSchedules]);

  const pageText = getPageText(role);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando horario...
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
              {pageText.eyebrow}
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              {pageText.title}
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              {pageText.description}
            </p>

            <p className="text-sm text-blue-100 mt-4">
              Sesión: <span className="font-extrabold text-white">{user?.nombres || user?.username}</span> · {role}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadSchedules({ silent: true })}
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
          <p className="text-sm font-semibold">
            {error}
          </p>
        </div>
      )}

      {role === 'Apoderado' && students.length > 1 && (
        <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">
              Estudiante
            </span>

            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            >
              <option value="todos">Todos los estudiantes vinculados</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <CounterCard icon={CalendarDays} label="Clases" value={counters.total} description="Registros semanales" />
        <CounterCard icon={Bell} label="Cursos" value={counters.courses} description="Cursos programados" />
        <CounterCard icon={UserRoundCheck} label="Docentes" value={counters.teachers} description="Docentes registrados" />
        <CounterCard icon={LayoutGrid} label="Aulas" value={counters.classrooms} description="Aulas vinculadas" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {groupedByDay.map((group) => (
          <DayColumn
            key={group.day}
            day={group.day}
            items={group.items}
            role={role}
          />
        ))}
      </section>
    </main>
  );
}

function DayColumn({ day, items, role }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
      <div className="p-5 bg-brand-950 text-white">
        <h2 className="font-extrabold text-lg">
          {day}
        </h2>

        <p className="text-sm text-blue-100 mt-1">
          {items.length} clase(s)
        </p>
      </div>

      <div className="divide-y divide-slate-100 min-h-[220px]">
        {items.length > 0 ? (
          items.map((item) => (
            <ScheduleCard key={`${item.id}-${item.estudiante_id || 'me'}`} item={item} role={role} />
          ))
        ) : (
          <div className="p-6 text-center">
            <Clock className="mx-auto text-slate-300" size={34} />
            <p className="text-sm text-slate-500 mt-3">
              Sin clases
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleCard({ item, role }) {
  return (
    <div className="p-5 hover:bg-slate-50 transition">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
          <Clock size={20} />
        </div>

        <div className="min-w-0">
          <p className="font-extrabold text-brand-950">
            {item.curso}
          </p>

          <p className="text-sm text-slate-500 mt-1">
            {formatTime(item.hora_inicio)} - {formatTime(item.hora_fin)}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            {item.docente}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            {item.grado} {item.seccion} · {item.turno}
          </p>

          {role === 'Apoderado' && item.estudiante && (
            <span className="inline-flex mt-3 rounded-full px-3 py-1 text-xs font-extrabold bg-gold-50 text-gold-700 border border-gold-100">
              {item.estudiante}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CounterCard({ icon: Icon, label, value, description }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6 hover:-translate-y-1 hover:shadow-lg transition">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
        <Icon size={24} />
      </div>

      <p className="text-sm font-bold text-slate-500 mt-5">
        {label}
      </p>

      <p className="text-3xl font-extrabold text-brand-950 mt-2">
        {Number(value || 0).toLocaleString('es-PE')}
      </p>

      <p className="text-sm text-slate-500 mt-2">
        {description}
      </p>
    </div>
  );
}

function getPageText(role) {
  if (role === 'Docente') {
    return {
      eyebrow: 'Panel Docente',
      title: 'Mis horarios',
      description: 'Consulta tus clases asignadas por día, curso y aula.'
    };
  }

  if (role === 'Estudiante') {
    return {
      eyebrow: 'Portal Estudiante',
      title: 'Mi horario',
      description: 'Consulta el horario semanal correspondiente a tu aula.'
    };
  }

  if (role === 'Apoderado') {
    return {
      eyebrow: 'Portal Apoderado',
      title: 'Horario de estudiantes',
      description: 'Consulta el horario semanal de los estudiantes vinculados.'
    };
  }

  return {
    eyebrow: 'Horarios',
    title: 'Horario',
    description: 'Consulta los horarios registrados.'
  };
}

function formatTime(value) {
  if (!value) return 'No precisa';
  return String(value).slice(0, 5);
}

export default MySchedule;