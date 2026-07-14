import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  School,
  Search,
  Trash2,
  X
} from 'lucide-react';

import toast from 'react-hot-toast';

import {
  cancelCalendarEvent,
  createCalendarEvent,
  getCalendarClassrooms,
  getCalendarEvents,
  updateCalendarEvent
} from '../../services/calendar.service';

import { getRole } from '../../utils/storage';

const eventTypeLabels = {
  bimestre: 'Bimestre',
  evaluacion: 'Evaluación',
  reunion: 'Reunión',
  actividad: 'Actividad',
  feriado: 'Feriado',
  entrega_notas: 'Entrega de notas',
  otro: 'Otro'
};

const eventTypeStyles = {
  bimestre: 'bg-blue-50 text-blue-700 border-blue-100',
  evaluacion: 'bg-red-50 text-red-700 border-red-100',
  reunion: 'bg-purple-50 text-purple-700 border-purple-100',
  actividad: 'bg-green-50 text-green-700 border-green-100',
  feriado: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  entrega_notas: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  otro: 'bg-slate-50 text-slate-700 border-slate-200'
};

const stateStyles = {
  activo: 'bg-green-50 text-green-700 border-green-100',
  cancelado: 'bg-red-50 text-red-700 border-red-100'
};

const getToday = () => new Date().toISOString().slice(0, 10);

const initialForm = (role) => ({
  titulo: '',
  descripcion: '',
  tipo_evento: 'actividad',
  alcance: role === 'Docente' ? 'aula' : 'general',
  aula_id: '',
  fecha_inicio: getToday(),
  fecha_fin: '',
  hora_inicio: '',
  hora_fin: '',
  importante: false,
  notificar: false
});

function AcademicCalendar() {
  const role = getRole();

  const canManage = ['Director', 'Administrativo', 'Docente'].includes(role);
  const canCreateGeneral = ['Director', 'Administrativo'].includes(role);

  const [events, setEvents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [filters, setFilters] = useState({
    estado: 'activo',
    tipo_evento: 'todos',
    desde: '',
    hasta: ''
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(initialForm(role));
  const [saving, setSaving] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [canceling, setCanceling] = useState(false);

  const loadCalendar = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [eventsResponse, classroomsResponse] = await Promise.all([
        getCalendarEvents(filters),
        getCalendarClassrooms()
      ]);

      setEvents(eventsResponse.data || []);
      setClassrooms(classroomsResponse.data || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudo cargar el calendario académico.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  const groupedEvents = useMemo(() => {
    return events.reduce((acc, item) => {
      const dateKey = getDateOnly(item.fecha_inicio) || 'sin_fecha';

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push(item);
      return acc;
    }, {});
  }, [events]);

  const counters = useMemo(() => {
    return events.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.estado] = (acc[item.estado] || 0) + 1;

        if (item.importante) {
          acc.importantes += 1;
        }

        if (item.alcance === 'general') {
          acc.generales += 1;
        }

        if (item.alcance === 'aula') {
          acc.por_aula += 1;
        }

        return acc;
      },
      {
        total: 0,
        activo: 0,
        cancelado: 0,
        importantes: 0,
        generales: 0,
        por_aula: 0
      }
    );
  }, [events]);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setForm(initialForm(role));
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingEvent(item);

    setForm({
      titulo: item.titulo || '',
      descripcion: item.descripcion || '',
      tipo_evento: item.tipo_evento || 'actividad',
      alcance: role === 'Docente' ? 'aula' : item.alcance || 'general',
      aula_id: item.aula_id ? String(item.aula_id) : '',
      fecha_inicio: getDateOnly(item.fecha_inicio),
      fecha_fin: item.fecha_fin ? getDateOnly(item.fecha_fin) : '',
      hora_inicio: normalizeTime(item.hora_inicio),
      hora_fin: normalizeTime(item.hora_fin),
      importante: Boolean(item.importante),
      notificar: Boolean(item.notificar)
    });

    setModalOpen(true);
  };

  const buildPayload = () => {
    const alcance = role === 'Docente'
      ? 'aula'
      : form.alcance;

    return {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      tipo_evento: form.tipo_evento,
      alcance,
      aula_id: alcance === 'aula' ? Number(form.aula_id) : null,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin || null,
      hora_inicio: form.hora_inicio || null,
      hora_fin: form.hora_fin || null,
      importante: Boolean(form.importante),
      notificar: Boolean(form.notificar)
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const payload = buildPayload();

      const response = editingEvent
        ? await updateCalendarEvent({
          id: editingEvent.id,
          payload
        })
        : await createCalendarEvent(payload);

      toast.success(
        response.message ||
        (editingEvent ? 'Evento actualizado correctamente.' : 'Evento creado correctamente.')
      );

      setModalOpen(false);
      setEditingEvent(null);

      await loadCalendar({ silent: true });
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudo guardar el evento.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!cancelTarget) return;

    try {
      setCanceling(true);

      const response = await cancelCalendarEvent({
        id: cancelTarget.id,
        motivo: cancelMotivo.trim() || null
      });

      toast.success(response.message || 'Evento cancelado correctamente.');

      setCancelTarget(null);
      setCancelMotivo('');

      await loadCalendar({ silent: true });
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudo cancelar el evento.'
      );
    } finally {
      setCanceling(false);
    }
  };

  const canEditEvent = (item) => {
    if (!canManage) return false;

    if (item.estado === 'cancelado') return false;

    if (['Director', 'Administrativo'].includes(role)) {
      return true;
    }

    return role === 'Docente' && item.alcance === 'aula';
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={38} />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando calendario académico...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-brand-950 text-white p-6 sm:p-8 shadow-soft">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gold-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-28 -left-28 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.18em]">
              Agenda institucional
            </p>

            <h1 className="text-3xl sm:text-4xl font-extrabold mt-2">
              Calendario académico
            </h1>

            <p className="text-blue-100 mt-3 max-w-3xl">
              Consulta eventos generales, evaluaciones, reuniones, feriados,
              entregas de notas y actividades por aula.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => loadCalendar({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              Actualizar
            </button>

            {canManage && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center justify-center gap-2 bg-gold-500 text-brand-950 px-5 py-3 rounded-xl font-extrabold hover:bg-gold-400 transition"
              >
                <Plus size={18} />
                Nuevo evento
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <CounterCard icon={CalendarDays} label="Eventos" value={counters.total} />
        <CounterCard icon={CheckCircle2} label="Activos" value={counters.activo} />
        <CounterCard icon={Bell} label="Importantes" value={counters.importantes} />
        <CounterCard icon={School} label="Por aula" value={counters.por_aula} />
        <CounterCard icon={X} label="Cancelados" value={counters.cancelado} />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">
              Estado
            </span>

            <select
              value={filters.estado}
              onChange={(e) => setFilters((prev) => ({ ...prev, estado: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            >
              <option value="activo">Activos</option>
              <option value="cancelado">Cancelados</option>
              <option value="todos">Todos</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">
              Tipo
            </span>

            <select
              value={filters.tipo_evento}
              onChange={(e) => setFilters((prev) => ({ ...prev, tipo_evento: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            >
              <option value="todos">Todos</option>
              {Object.entries(eventTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">
              Desde
            </span>

            <input
              type="date"
              value={filters.desde}
              onChange={(e) => setFilters((prev) => ({ ...prev, desde: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">
              Hasta
            </span>

            <input
              type="date"
              value={filters.hasta}
              onChange={(e) => setFilters((prev) => ({ ...prev, hasta: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => loadCalendar({ silent: true })}
              disabled={refreshing}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
            >
              <Search size={18} />
              Filtrar
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        {Object.keys(groupedEvents).length > 0 ? (
          Object.entries(groupedEvents).map(([dateKey, items]) => (
            <section key={dateKey} className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-brand-900 uppercase tracking-[0.18em]">
                    Fecha
                  </p>

                  <h2 className="text-xl font-extrabold text-brand-950 mt-1">
                    {formatDateLong(dateKey)}
                  </h2>
                </div>

                <span className="inline-flex rounded-full px-4 py-2 bg-white border border-slate-200 text-sm font-extrabold text-slate-600">
                  {items.length} evento(s)
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-5">
                {items.map((item) => (
                  <EventCard
                    key={item.id}
                    item={item}
                    canEdit={canEditEvent(item)}
                    onEdit={() => handleOpenEdit(item)}
                    onCancel={() => {
                      setCancelTarget(item);
                      setCancelMotivo('');
                    }}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-10 text-center">
            <AlertCircle className="mx-auto text-slate-300" size={46} />

            <h2 className="text-xl font-extrabold text-brand-950 mt-4">
              No hay eventos académicos
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              No se encontraron eventos para los filtros seleccionados.
            </p>
          </section>
        )}
      </section>

      {modalOpen && (
        <EventFormModal
          role={role}
          canCreateGeneral={canCreateGeneral}
          editingEvent={editingEvent}
          form={form}
          setForm={setForm}
          classrooms={classrooms}
          saving={saving}
          onClose={() => {
            if (!saving) {
              setModalOpen(false);
              setEditingEvent(null);
            }
          }}
          onSubmit={handleSubmit}
        />
      )}

      {cancelTarget && (
        <CancelEventModal
          item={cancelTarget}
          motivo={cancelMotivo}
          setMotivo={setCancelMotivo}
          canceling={canceling}
          onClose={() => {
            if (!canceling) {
              setCancelTarget(null);
              setCancelMotivo('');
            }
          }}
          onConfirm={handleCancelEvent}
        />
      )}
    </main>
  );
}

function EventCard({
  item,
  canEdit,
  onEdit,
  onCancel
}) {
  const typeClass =
    eventTypeStyles[item.tipo_evento] ||
    eventTypeStyles.otro;

  const stateClass =
    stateStyles[item.estado] ||
    stateStyles.activo;

  const classroomLabel = `${item.grado || ''} ${item.seccion || ''} ${item.turno || ''}`.trim();

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5 hover:bg-white hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border ${typeClass}`}>
              {eventTypeLabels[item.tipo_evento] || 'Evento'}
            </span>

            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border capitalize ${stateClass}`}>
              {item.estado}
            </span>

            {item.importante && (
              <span className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold border bg-red-50 text-red-700 border-red-100">
                Importante
              </span>
            )}
          </div>

          <h3 className="text-lg font-extrabold text-brand-950 mt-3">
            {item.titulo}
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            {item.alcance === 'general'
              ? 'Evento general'
              : `Aula: ${classroomLabel || 'No precisa'}`}
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
          <CalendarDays size={23} />
        </div>
      </div>

      {item.descripcion && (
        <p className="text-sm text-slate-600 mt-4 line-clamp-3">
          {item.descripcion}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        <MiniInfo
          icon={CalendarDays}
          label="Fecha"
          value={formatDateRange(item.fecha_inicio, item.fecha_fin)}
        />

        <MiniInfo
          icon={Clock3}
          label="Hora"
          value={formatTimeRange(item.hora_inicio, item.hora_fin)}
        />
      </div>

      <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-slate-500">
          Creado por: <span className="font-bold">{item.creado_por_nombre || 'No precisa'}</span>
        </p>

        {canEdit && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-extrabold hover:bg-brand-800 transition"
            >
              <Edit3 size={16} />
              Editar
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-extrabold hover:bg-red-700 transition"
            >
              <Trash2 size={16} />
              Cancelar
            </button>
          </div>
        )}
      </div>

      {item.estado === 'cancelado' && (
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-extrabold text-red-700 uppercase tracking-wide">
            Motivo de cancelación
          </p>

          <p className="text-sm text-red-700 mt-1">
            {item.motivo_cancelacion || 'Sin motivo registrado.'}
          </p>
        </div>
      )}
    </article>
  );
}

function EventFormModal({
  role,
  canCreateGeneral,
  editingEvent,
  form,
  setForm,
  classrooms,
  saving,
  onClose,
  onSubmit
}) {
  const isTeacher = role === 'Docente';
  const isClassroomScope = form.alcance === 'aula';

  return (
    <div className="fixed inset-0 z-[90] bg-brand-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <section className="relative bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-soft border border-slate-200 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="absolute right-4 top-4 z-20 w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 flex items-center justify-center transition disabled:opacity-60"
        >
          <X size={20} />
        </button>

        <div className="bg-brand-950 text-white p-6 rounded-t-3xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-gold-500/20 rounded-full blur-3xl" />

          <div className="relative pr-10">
            <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.18em]">
              Calendario académico
            </p>

            <h2 className="text-2xl font-extrabold mt-2">
              {editingEvent ? 'Editar evento' : 'Nuevo evento'}
            </h2>

            <p className="text-sm text-blue-100 mt-2">
              {isTeacher
                ? 'Como docente, solo puedes gestionar eventos por aula asignada.'
                : 'Registra eventos generales o por aula.'}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">
              Título
            </span>

            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
              maxLength={150}
              required
              disabled={saving}
              placeholder="Ejemplo: Reunión con apoderados"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">
              Descripción
            </span>

            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              rows={4}
              disabled={saving}
              placeholder="Detalle del evento académico..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 resize-none disabled:opacity-60"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">
                Tipo de evento
              </span>

              <select
                value={form.tipo_evento}
                onChange={(e) => setForm((prev) => ({ ...prev, tipo_evento: e.target.value }))}
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
              >
                {Object.entries(eventTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">
                Alcance
              </span>

              <select
                value={form.alcance}
                onChange={(e) => {
                  const nextScope = e.target.value;

                  setForm((prev) => ({
                    ...prev,
                    alcance: nextScope,
                    aula_id: nextScope === 'general' ? '' : prev.aula_id
                  }));
                }}
                disabled={saving || isTeacher || !canCreateGeneral}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
              >
                {!isTeacher && <option value="general">General</option>}
                <option value="aula">Por aula</option>
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">
                Aula
              </span>

              <select
                value={form.aula_id}
                onChange={(e) => setForm((prev) => ({ ...prev, aula_id: e.target.value }))}
                disabled={saving || !isClassroomScope}
                required={isClassroomScope}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
              >
                <option value="">
                  Selecciona aula
                </option>

                {classrooms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.grado} {item.seccion} {item.turno}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">
                Fecha inicio
              </span>

              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
                required
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">
                Fecha fin
              </span>

              <input
                type="date"
                value={form.fecha_fin}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha_fin: e.target.value }))}
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">
                Hora inicio
              </span>

              <input
                type="time"
                value={form.hora_inicio}
                onChange={(e) => setForm((prev) => ({ ...prev, hora_inicio: e.target.value }))}
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">
                Hora fin
              </span>

              <input
                type="time"
                value={form.hora_fin}
                onChange={(e) => setForm((prev) => ({ ...prev, hora_fin: e.target.value }))}
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.importante}
                onChange={(e) => setForm((prev) => ({ ...prev, importante: e.target.checked }))}
                disabled={saving}
                className="mt-1"
              />

              <span>
                <span className="block font-extrabold text-brand-950">
                  Evento importante
                </span>

                <span className="block text-sm text-slate-500 mt-1">
                  Resalta el evento visualmente en el calendario.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.notificar}
                onChange={(e) => setForm((prev) => ({ ...prev, notificar: e.target.checked }))}
                disabled={saving}
                className="mt-1"
              />

              <span>
                <span className="block font-extrabold text-brand-950">
                  Notificar por campanita
                </span>

                <span className="block text-sm text-slate-500 mt-1">
                  Envía una notificación web a los usuarios correspondientes.
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-extrabold hover:bg-slate-50 disabled:opacity-60 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-900 text-white font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              {editingEvent ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function CancelEventModal({
  item,
  motivo,
  setMotivo,
  canceling,
  onClose,
  onConfirm
}) {
  return (
    <div className="fixed inset-0 z-[95] bg-brand-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <section className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-soft border border-slate-200 overflow-hidden">
        <div className="bg-red-600 text-white p-6">
          <h2 className="text-2xl font-extrabold">
            Cancelar evento
          </h2>

          <p className="text-red-100 mt-2">
            El evento no se eliminará físicamente, quedará como cancelado.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-extrabold text-brand-950">
              {item.titulo}
            </p>

            <p className="text-sm text-slate-500 mt-1">
              {formatDateRange(item.fecha_inicio, item.fecha_fin)}
            </p>
          </div>

          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">
              Motivo de cancelación
            </span>

            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              disabled={canceling}
              placeholder="Ejemplo: Se reprogramará para otra fecha."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none disabled:opacity-60"
            />
          </label>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={canceling}
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-extrabold hover:bg-slate-50 disabled:opacity-60 transition"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={canceling}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 text-white font-extrabold hover:bg-red-700 disabled:opacity-60 transition"
            >
              {canceling ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
              Confirmar cancelación
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CounterCard({
  icon: Icon,
  label,
  value
}) {
  return (
    <article className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
      <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
        <Icon size={22} />
      </div>

      <p className="text-sm font-bold text-slate-500 mt-4">
        {label}
      </p>

      <p className="text-3xl font-extrabold text-brand-950 mt-1">
        {Number(value || 0)}
      </p>
    </article>
  );
}

function MiniInfo({
  icon: Icon,
  label,
  value
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={16} />

        <p className="text-xs font-extrabold uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p className="text-sm font-bold text-brand-950 mt-2">
        {value}
      </p>
    </div>
  );
}

function getDateOnly(value) {
  if (!value) return '';

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  const match = text.match(/^\d{4}-\d{2}-\d{2}/);

  if (match) return match[0];

  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return text.slice(0, 10);
}

function normalizeTime(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

function formatDateLong(value) {
  const dateOnly = getDateOnly(value);

  if (!dateOnly || dateOnly === 'sin_fecha') {
    return 'Sin fecha';
  }

  const date = new Date(`${dateOnly}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return date.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function formatDateShort(value) {
  const dateOnly = getDateOnly(value);

  if (!dateOnly) {
    return 'Sin fecha';
  }

  const date = new Date(`${dateOnly}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatDateRange(start, end) {
  const startText = formatDateShort(start);

  if (!end) return startText;

  const endText = formatDateShort(end);

  if (startText === endText) return startText;

  return `${startText} - ${endText}`;
}

function formatTimeRange(start, end) {
  const startText = normalizeTime(start);
  const endText = normalizeTime(end);

  if (!startText && !endText) {
    return 'Todo el día';
  }

  if (startText && !endText) {
    return `${startText}`;
  }

  return `${startText} - ${endText}`;
}

export default AcademicCalendar;