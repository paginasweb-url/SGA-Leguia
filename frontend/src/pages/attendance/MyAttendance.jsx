import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Loader2,
  RefreshCw,
  UserCheck,
  XCircle
} from 'lucide-react';

import { getMyAttendance } from '../../services/attendance.service';
import { getRole, getStoredUser } from '../../utils/storage';

const stateConfig = {
  presente: {
    label: 'Asistió',
    icon: CheckCircle2,
    className: 'bg-green-600 text-white border-green-600'
  },
  falta: {
    label: 'No asistió',
    icon: XCircle,
    className: 'bg-red-600 text-white border-red-600'
  },
  tarde: {
    label: 'Tarde',
    icon: Clock3,
    className: 'bg-yellow-500 text-brand-950 border-yellow-500'
  },
  justificado: {
    label: 'Justificado',
    icon: FileCheck2,
    className: 'bg-blue-600 text-white border-blue-600'
  }
};

function MyAttendance() {
  const role = getRole();
  const user = getStoredUser();

  const [attendance, setAttendance] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('todos');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadAttendance = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getMyAttendance();
      setAttendance((response.data || []).filter((item) => item.fecha));
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo cargar la asistencia.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const students = useMemo(() => {
    const map = new Map();

    attendance.forEach((item) => {
      if (!item.estudiante_id) return;

      map.set(item.estudiante_id, item.estudiante || 'Estudiante');
    });

    return [...map.entries()].map(([id, name]) => ({
      id,
      name
    }));
  }, [attendance]);

  const visibleAttendance = useMemo(() => {
    if (selectedStudent === 'todos') return attendance;

    return attendance.filter(
      (item) => Number(item.estudiante_id) === Number(selectedStudent)
    );
  }, [attendance, selectedStudent]);

  const summary = useMemo(() => {
    return visibleAttendance.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.estado] = (acc[item.estado] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        presente: 0,
        falta: 0,
        tarde: 0,
        justificado: 0
      }
    );
  }, [visibleAttendance]);

  const groupedByMonth = useMemo(() => {
    const map = new Map();

    visibleAttendance.forEach((item) => {
      const key = getMonthKey(item.fecha);

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push(item);
    });

    return [...map.entries()]
      .map(([key, items]) => ({
        key,
        label: formatMonth(key),
        items: items.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [visibleAttendance]);

  const pageText = getPageText(role);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando asistencia...
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
            onClick={() => loadAttendance({ silent: true })}
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

      <section className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <CounterCard icon={CalendarDays} label="Registros" value={summary.total} description="Asistencias registradas" />
        <CounterCard icon={CheckCircle2} label="Asistió" value={summary.presente} description="Presente" />
        <CounterCard icon={XCircle} label="No asistió" value={summary.falta} description="Faltas" />
        <CounterCard icon={Clock3} label="Tarde" value={summary.tarde} description="Tardanzas" />
        <CounterCard icon={FileCheck2} label="Justificado" value={summary.justificado} description="Con sustento" />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
        <h2 className="text-xl font-extrabold text-brand-950">
          Detalle de asistencia
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Solo se muestran registros reales guardados en el sistema.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <LegendItem estado="presente" value={summary.presente} />
          <LegendItem estado="falta" value={summary.falta} />
          <LegendItem estado="tarde" value={summary.tarde} />
          <LegendItem estado="justificado" value={summary.justificado} />
        </div>
      </section>

      {groupedByMonth.length > 0 ? (
        <section className="space-y-5">
          {groupedByMonth.map((month) => (
            <MonthBlock
              key={month.key}
              month={month}
              role={role}
            />
          ))}
        </section>
      ) : (
        <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-10 text-center">
          <UserCheck className="mx-auto text-slate-300" size={46} />

          <h2 className="text-xl font-extrabold text-brand-950 mt-4">
            Sin registros de asistencia
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Aún no se han registrado asistencias para esta cuenta.
          </p>
        </section>
      )}
    </main>
  );
}

function MonthBlock({ month, role }) {
  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-3xl shadow-soft p-5">
      <h3 className="text-lg font-extrabold text-brand-950 capitalize">
        {month.label}
      </h3>

      <div className="mt-5 flex flex-wrap gap-3">
        {month.items.map((item) => (
          <AttendanceDayCard
            key={`${item.id}-${item.fecha}-${item.estudiante_id || 'me'}`}
            item={item}
            role={role}
          />
        ))}
      </div>
    </div>
  );
}

function AttendanceDayCard({ item, role }) {
  const config = stateConfig[item.estado] || stateConfig.presente;
  const Icon = config.icon;

  return (
    <div className="w-[88px] bg-white border border-slate-200 rounded-xl shadow-sm p-3 text-center hover:-translate-y-1 hover:shadow-md transition">
      <p className="text-xs font-bold text-brand-950">
        {formatShortDate(item.fecha)}
      </p>

      <div className={`w-8 h-8 mx-auto mt-2 rounded-full border flex items-center justify-center ${config.className}`}>
        <Icon size={18} />
      </div>

      <p className="text-[11px] text-slate-500 mt-2 capitalize">
        {item.estado}
      </p>

      {role === 'Apoderado' && item.estudiante && (
        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
          {item.estudiante}
        </p>
      )}
    </div>
  );
}

function LegendItem({ estado, value }) {
  const config = stateConfig[estado];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between gap-3 border border-slate-200 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${config.className}`}>
          <Icon size={18} />
        </div>

        <p className="text-sm font-bold text-brand-950">
          {config.label}
        </p>
      </div>

      <p className="font-extrabold text-brand-950">
        {Number(value || 0).toLocaleString('es-PE')}
      </p>
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
      title: 'Consulta de asistencia',
      description: 'Revisa registros de asistencia de estudiantes vinculados a tus aulas asignadas.'
    };
  }

  if (role === 'Estudiante') {
    return {
      eyebrow: 'Portal Estudiante',
      title: 'Mi asistencia',
      description: 'Consulta tus registros de asistencia organizados por mes.'
    };
  }

  if (role === 'Apoderado') {
    return {
      eyebrow: 'Portal Apoderado',
      title: 'Asistencia de estudiantes',
      description: 'Consulta la asistencia de los estudiantes vinculados.'
    };
  }

  return {
    eyebrow: 'Asistencia',
    title: 'Asistencia',
    description: 'Consulta los registros de asistencia.'
  };
}

function getDateOnly(value) {
  if (!value) return '';

  return String(value).slice(0, 10);
}

function getMonthKey(value) {
  const dateOnly = getDateOnly(value);

  if (!dateOnly) return 'sin-fecha';

  return dateOnly.slice(0, 7);
}

function formatMonth(key) {
  if (!key || key === 'sin-fecha') return 'Sin fecha';

  const [year, month] = key.split('-');

  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('es-PE', {
    month: 'long',
    year: 'numeric'
  });
}

function formatShortDate(value) {
  const dateOnly = getDateOnly(value);

  if (!dateOnly) return 'Sin fecha';

  return new Date(`${dateOnly}T00:00:00`).toLocaleDateString('es-PE', {
    weekday: 'short',
    day: '2-digit'
  });
}

export default MyAttendance;