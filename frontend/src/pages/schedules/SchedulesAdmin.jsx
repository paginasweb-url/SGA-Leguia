import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit3,
  LayoutGrid,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRoundCheck,
  X
} from 'lucide-react';

import toast from 'react-hot-toast';

import {
  createSchedule,
  deleteSchedule,
  getSchedules,
  updateSchedule
} from '../../services/schedules.service';

import { getTeacherCourses } from '../../services/teacherCourses.service';

const days = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes'
];

function SchedulesAdmin() {
  const [schedules, setSchedules] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    dia_semana: 'todos',
    turno: 'todos',
    aula_id: 'todos',
    docente_id: 'todos'
  });

  const [form, setForm] = useState({
    assignment_key: '',
    dia_semana: 'Lunes',
    hora_inicio: '08:00',
    hora_fin: '09:00'
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [confirmModal, setConfirmModal] = useState(null);

  const loadData = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [schedulesResponse, assignmentsResponse] = await Promise.all([
        getSchedules(),
        getTeacherCourses()
      ]);

      setSchedules(schedulesResponse.data || []);
      setAssignments(assignmentsResponse.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar los horarios.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    setError('');
  }, [error]);

  useEffect(() => {
    if (!successMessage) return;

    toast.success(successMessage);
    setSuccessMessage('');
  }, [successMessage]);

  const assignmentOptions = useMemo(() => {
    return assignments.map((assignment) => ({
      key: `${assignment.docente_id}-${assignment.curso_id}-${assignment.aula_id}`,
      docente_id: assignment.docente_id,
      curso_id: assignment.curso_id,
      aula_id: assignment.aula_id,
      label: `${assignment.curso} · ${assignment.docente} · ${assignment.grado} ${assignment.seccion} - ${assignment.turno}`
    }));
  }, [assignments]);

  const uniqueClassrooms = useMemo(() => {
    const map = new Map();

    schedules.forEach((schedule) => {
      if (!schedule.aula_id) return;

      map.set(schedule.aula_id, {
        id: schedule.aula_id,
        label: `${schedule.grado} ${schedule.seccion} - ${schedule.turno}`
      });
    });

    return [...map.values()];
  }, [schedules]);

  const uniqueTeachers = useMemo(() => {
    const map = new Map();

    schedules.forEach((schedule) => {
      if (!schedule.docente_id) return;

      map.set(schedule.docente_id, {
        id: schedule.docente_id,
        label: schedule.docente
      });
    });

    return [...map.values()];
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    return schedules.filter((schedule) => {
      const composed = [
        schedule.curso,
        schedule.docente,
        schedule.grado,
        schedule.seccion,
        schedule.turno,
        schedule.dia_semana
      ].join(' ').toLowerCase();

      const matchesSearch =
        !term ||
        composed.includes(term) ||
        String(schedule.id).includes(term);

      const matchesDay =
        filters.dia_semana === 'todos' ||
        schedule.dia_semana === filters.dia_semana;

      const matchesTurn =
        filters.turno === 'todos' ||
        schedule.turno === filters.turno;

      const matchesClassroom =
        filters.aula_id === 'todos' ||
        Number(schedule.aula_id) === Number(filters.aula_id);

      const matchesTeacher =
        filters.docente_id === 'todos' ||
        Number(schedule.docente_id) === Number(filters.docente_id);

      return matchesSearch && matchesDay && matchesTurn && matchesClassroom && matchesTeacher;
    });
  }, [schedules, filters]);

  const counters = useMemo(() => {
    return {
      total: schedules.length,
      aulas: new Set(schedules.map((item) => item.aula_id).filter(Boolean)).size,
      docentes: new Set(schedules.map((item) => item.docente_id).filter(Boolean)).size,
      dias: new Set(schedules.map((item) => item.dia_semana).filter(Boolean)).size
    };
  }, [schedules]);

  const openCreate = () => {
    setShowCreate(true);
    setSelectedSchedule(null);
    setError('');
    setSuccessMessage('');

    setForm({
      assignment_key: assignmentOptions[0]?.key || '',
      dia_semana: 'Lunes',
      hora_inicio: '08:00',
      hora_fin: '09:00'
    });
  };

  const closeScheduleModal = () => {
    setShowCreate(false);
    setSelectedSchedule(null);
    setError('');
    setSuccessMessage('');
  };

  const closeConfirmModal = () => {
    setConfirmModal(null);
  };

  const handleSelectSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setShowCreate(false);
    setError('');
    setSuccessMessage('');

    setForm({
      assignment_key: `${schedule.docente_id}-${schedule.curso_id}-${schedule.aula_id}`,
      dia_semana: schedule.dia_semana || 'Lunes',
      hora_inicio: normalizeTimeInput(schedule.hora_inicio),
      hora_fin: normalizeTimeInput(schedule.hora_fin)
    });
  };

  const handleChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const getSelectedAssignment = () => {
    return assignmentOptions.find((item) => item.key === form.assignment_key);
  };

  const validateForm = () => {
    if (!form.assignment_key) {
      return 'Selecciona una asignación docente-curso-aula.';
    }

    if (!form.dia_semana || !form.hora_inicio || !form.hora_fin) {
      return 'Día, hora de inicio y hora de fin son obligatorios.';
    }

    if (form.hora_inicio >= form.hora_fin) {
      return 'La hora de inicio debe ser menor que la hora de fin.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setSuccessMessage('');

      const validation = validateForm();

      if (validation) {
        setError(validation);
        return;
      }

      const selectedAssignment = getSelectedAssignment();

      if (!selectedAssignment) {
        setError('La asignación seleccionada no es válida.');
        return;
      }

      setSaving(true);

      const payload = {
        aula_id: Number(selectedAssignment.aula_id),
        curso_id: Number(selectedAssignment.curso_id),
        docente_id: Number(selectedAssignment.docente_id),
        dia_semana: form.dia_semana,
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin
      };

      if (showCreate) {
        const response = await createSchedule(payload);
        setSuccessMessage(response.message || 'Horario creado correctamente.');
      } else if (selectedSchedule) {
        const response = await updateSchedule({
          id: selectedSchedule.id,
          payload
        });

        setSuccessMessage(response.message || 'Horario actualizado correctamente.');
      }

      setShowCreate(false);
      setSelectedSchedule(null);

      await loadData({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo guardar el horario.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (schedule) => {
      setConfirmModal({
        type: 'danger',
        title: 'Eliminar horario',
        description: `¿Deseas eliminar el horario de ${schedule.curso} el día ${schedule.dia_semana}? Esta acción no se podrá deshacer.`,
        confirmText: 'Eliminar horario',
        cancelText: 'Cancelar',
        onConfirm: async () => {
          try {
            setError('');
            setSuccessMessage('');
            setDeletingId(schedule.id);

            const response = await deleteSchedule(schedule.id);

            setSuccessMessage(response.message || 'Horario eliminado correctamente.');

            if (selectedSchedule?.id === schedule.id) {
              setSelectedSchedule(null);
            }

            await loadData({ silent: true });
          } catch (error) {
            setError(
              error?.response?.data?.error ||
              'No se pudo eliminar el horario.'
            );
          } finally {
            setDeletingId(null);
            closeConfirmModal();
          }
        }
      });
    };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando horarios...
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
              Organización académica
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              Gestión de Horarios
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Programa horarios usando asignaciones reales de docente, curso y aula.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => loadData({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              Actualizar
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 bg-gold-500 text-brand-950 px-4 py-3 rounded-xl font-extrabold hover:bg-gold-100 transition"
            >
              <Plus size={18} />
              Nuevo horario
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <CounterCard icon={CalendarDays} label="Horarios" value={counters.total} description="Registros programados" />
        <CounterCard icon={LayoutGrid} label="Aulas" value={counters.aulas} description="Aulas con horario" />
        <CounterCard icon={UserRoundCheck} label="Docentes" value={counters.docentes} description="Docentes programados" />
        <CounterCard icon={Clock} label="Días" value={counters.dias} description="Días con clases" />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="relative lg:col-span-4">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value
                }))
              }
              placeholder="Buscar por curso, docente o aula..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </div>

          <select
            value={filters.dia_semana}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                dia_semana: e.target.value
              }))
            }
            className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="todos">Todos los días</option>
            {days.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>

          <select
            value={filters.turno}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                turno: e.target.value
              }))
            }
            className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="todos">Todos los turnos</option>
            <option value="Mañana">Mañana</option>
            <option value="Tarde">Tarde</option>
          </select>

          <select
            value={filters.aula_id}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                aula_id: e.target.value
              }))
            }
            className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="todos">Todas las aulas</option>
            {uniqueClassrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.label}
              </option>
            ))}
          </select>

          <select
            value={filters.docente_id}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                docente_id: e.target.value
              }))
            }
            className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="todos">Todos los docentes</option>
            {uniqueTeachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-brand-950">
              Listado de horarios
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Horarios registrados por docente, curso, aula y día.
            </p>
          </div>

          <span className="hidden sm:inline-flex rounded-full px-3 py-1 text-xs font-extrabold bg-brand-50 text-brand-900 border border-brand-100">
            {filteredSchedules.length} resultado(s)
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[calc(100vh-360px)] min-h-[420px] overflow-y-auto">
          {filteredSchedules.length > 0 ? (
            filteredSchedules.map((schedule) => (
              <ScheduleRow
                key={schedule.id}
                schedule={schedule}
                active={selectedSchedule?.id === schedule.id}
                deleting={deletingId === schedule.id}
                onSelect={() => handleSelectSchedule(schedule)}
                onDelete={() => handleDelete(schedule)}
              />
            ))
          ) : (
            <EmptyBlock text="No se encontraron horarios con los filtros aplicados." />
          )}
        </div>
      </section>

      {(showCreate || selectedSchedule) && (
        <ScheduleModal onClose={closeScheduleModal}>
          <ScheduleFormPanel
            mode={showCreate ? 'create' : 'edit'}
            schedule={selectedSchedule}
            form={form}
            assignmentOptions={assignmentOptions}
            saving={saving}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </ScheduleModal>
      )}

      {confirmModal && (
        <ConfirmModal
          config={confirmModal}
          onClose={closeConfirmModal}
        />
      )}
    </main>
  );
}

function ScheduleModal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] bg-brand-950/70 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6">
      <section className="relative w-full lg:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 flex items-center justify-center transition shadow-sm"
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        {children}
      </section>
    </div>
  );
}

function ConfirmModal({ config, onClose }) {
  const danger = config.type === 'danger';

  const handleConfirm = async () => {
    if (config.onConfirm) {
      await config.onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-brand-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <section className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-soft border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              danger
                ? 'bg-red-50 text-danger'
                : 'bg-brand-50 text-brand-900'
            }`}
          >
            {danger ? <Trash2 size={24} /> : <AlertCircle size={24} />}
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-brand-950">
              {config.title || 'Confirmar acción'}
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              {config.description || '¿Deseas continuar?'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-extrabold hover:bg-slate-100 transition"
          >
            {config.cancelText || 'Cancelar'}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`inline-flex items-center justify-center px-4 py-3 rounded-xl font-extrabold transition ${
              danger
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-brand-900 text-white hover:bg-brand-800'
            }`}
          >
            {config.confirmText || 'Confirmar'}
          </button>
        </div>
      </section>
    </div>
  );
}

function ScheduleRow({
  schedule,
  active,
  deleting,
  onSelect,
  onDelete
}) {
  return (
    <div className={`p-5 hover:bg-slate-50 transition ${active ? 'bg-brand-50' : ''}`}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_190px_180px] lg:items-center gap-4">
        <button
          type="button"
          onClick={onSelect}
          className="text-left flex items-start gap-3 min-w-0"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-900 text-white flex items-center justify-center shrink-0">
            <CalendarDays size={24} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-extrabold text-brand-950 truncate">
                {schedule.curso}
              </p>

              <span className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold bg-brand-50 text-brand-900 border border-brand-100">
                {schedule.dia_semana}
              </span>
            </div>

            <p className="text-sm text-slate-500 mt-1">
              {schedule.docente}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              {schedule.grado} {schedule.seccion} · {schedule.turno}
            </p>
          </div>
        </button>

        <MiniMetric
          label="Horario"
          value={`${formatTime(schedule.hora_inicio)} - ${formatTime(schedule.hora_fin)}`}
          text
        />

        <div className="flex justify-start lg:justify-end gap-2">
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-brand-50 text-brand-900 font-extrabold text-xs hover:bg-brand-100 transition"
          >
            <Edit3 size={16} />
            Editar
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-danger font-extrabold text-xs hover:bg-red-100 disabled:opacity-40 transition"
          >
            {deleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleFormPanel({
  mode,
  schedule,
  form,
  assignmentOptions,
  saving,
  onChange,
  onSubmit
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6 space-y-5"
    >
      <div className="flex items-center gap-3 pr-10">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
          <Clock size={23} />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-brand-950">
            {mode === 'create' ? 'Nuevo horario' : 'Editar horario'}
          </h2>

          <p className="text-sm text-slate-500">
            {mode === 'create'
              ? 'Programa un horario desde una asignación real.'
              : `Horario #${schedule?.id || ''}`}
          </p>
        </div>
      </div>

      <SelectField
        label="Asignación docente-curso-aula"
        value={form.assignment_key}
        onChange={(value) => onChange('assignment_key', value)}
        options={[
          { value: '', label: 'Selecciona una asignación' },
          ...assignmentOptions.map((assignment) => ({
            value: assignment.key,
            label: assignment.label
          }))
        ]}
      />

      <SelectField
        label="Día"
        value={form.dia_semana}
        onChange={(value) => onChange('dia_semana', value)}
        options={days.map((day) => ({
          value: day,
          label: day
        }))}
      />

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Hora inicio"
          type="time"
          value={form.hora_inicio}
          onChange={(value) => onChange('hora_inicio', value)}
        />

        <InputField
          label="Hora fin"
          type="time"
          value={form.hora_fin}
          onChange={(value) => onChange('hora_fin', value)}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
      >
        {saving ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <CheckCircle2 size={18} />
        )}
        {mode === 'create' ? 'Crear horario' : 'Guardar cambios'}
      </button>

      <p className="text-xs text-slate-500">
        Solo se pueden programar combinaciones previamente registradas en docente-curso-aula.
      </p>
    </form>
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

function MiniMetric({ label, value, text = false }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-3 text-center">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className={`${text ? 'text-sm' : 'text-lg'} font-extrabold text-brand-950 mt-1`}>
        {text ? value : Number(value || 0).toLocaleString('es-PE')}
      </p>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </span>

      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
      >
        {options.map((item) => (
          <option key={`${item.value}-${item.label}`} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyBlock({ text }) {
  return (
    <div className="p-8 text-center">
      <CalendarDays className="mx-auto text-slate-300" size={42} />
      <p className="text-sm text-slate-500 mt-3">
        {text}
      </p>
    </div>
  );
}

function normalizeTimeInput(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

function formatTime(value) {
  if (!value) return 'No precisa';
  return String(value).slice(0, 5);
}

export default SchedulesAdmin;