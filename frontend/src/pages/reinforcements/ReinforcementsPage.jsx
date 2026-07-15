import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  School,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle
} from 'lucide-react';

import toast from 'react-hot-toast';

import { getClassrooms } from '../../services/classrooms.service';
import { getCourses } from '../../services/courses.service';
import {
  BIMESTERS,
  getAcademicPeriodsForGrades
} from '../../services/gradesNotes.service';

import {
  cancelReinforcement,
  completeReinforcement,
  createReinforcement,
  getAvailableReinforcementClassrooms,
  getAvailableReinforcementTeachers,
  getReinforcementById,
  getReinforcementCandidates,
  getReinforcements,
  respondReinforcementAssignment,
  saveReinforcementAttendance,
  updateReinforcement
} from '../../services/reinforcement.service';

import { getRole } from '../../utils/storage';

const stateStyles = {
  pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  en_proceso: 'bg-blue-50 text-blue-700 border-blue-100',
  completado: 'bg-green-50 text-green-700 border-green-100',
  cancelado: 'bg-red-50 text-red-700 border-red-100'
};

const guardianStateStyles = {
  pendiente_apoderado: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  aceptado: 'bg-green-50 text-green-700 border-green-100',
  rechazado: 'bg-red-50 text-red-700 border-red-100'
};

const attendanceStates = [
  { value: 'presente', label: 'Presente' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'falta', label: 'Falta' }
];

const getToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const map = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${map.year}-${map.month}-${map.day}`;
};

const isPastDate = (value) => {
  if (!value) return false;

  return getDateOnly(value) < getToday();
};

const initialForm = {
  origen: 'manual',
  curso_id: '',
  periodo_id: '',
  bimestre: 'B1',
  aula_origen_id: '',
  aula_reforzamiento_id: '',
  docente_id: '',
  titulo: '',
  descripcion: '',
  actividad_recomendada: '',
  fecha: getToday(),
  hora_inicio: '14:00',
  hora_fin: '15:30',
  notificar: true,
  estudiantes: []
};

function ReinforcementsPage() {
  const role = getRole();

  const canManage = ['Director', 'Administrativo'].includes(role);
  const canTakeAttendance = role === 'Auxiliar';
  const canRespond = role === 'Apoderado';

  const [reinforcements, setReinforcements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [periods, setPeriods] = useState([]);

  const [filters, setFilters] = useState({
    estado: 'todos',
    desde: '',
    hasta: '',
    curso_id: ''
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const [candidates, setCandidates] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [availableClassrooms, setAvailableClassrooms] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [canceling, setCanceling] = useState(false);

  const [completeTarget, setCompleteTarget] = useState(null);
  const [completeObservation, setCompleteObservation] = useState('');
  const [completing, setCompleting] = useState(false);

  const [attendanceForm, setAttendanceForm] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      if (!canManage) {
        const reinforcementsResponse = await getReinforcements(filters);

        setReinforcements(reinforcementsResponse.data || []);
        setCourses([]);
        setClassrooms([]);
        setPeriods([]);

        return;
      }

      const [
        reinforcementsResponse,
        coursesResponse,
        classroomsResponse,
        periodsResponse
      ] = await Promise.all([
        getReinforcements(filters),
        getCourses(),
        getClassrooms({ estado: 'activo' }),
        getAcademicPeriodsForGrades()
      ]);

      setReinforcements(reinforcementsResponse.data || []);
      setCourses(coursesResponse.data || []);
      setClassrooms(classroomsResponse.data || []);
      setPeriods(periodsResponse.data || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudo cargar el módulo de reforzamiento.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadReinforcements = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getReinforcements(filters);
      setReinforcements(response.data || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudieron cargar los reforzamientos.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const counters = useMemo(() => {
    return reinforcements.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.estado] = (acc[item.estado] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        pendiente: 0,
        en_proceso: 0,
        completado: 0,
        cancelado: 0
      }
    );
  }, [reinforcements]);

  const selectedOriginClassroom = useMemo(() => {
    return classrooms.find((item) => Number(item.id || item.aula_id) === Number(form.aula_origen_id));
  }, [classrooms, form.aula_origen_id]);

  const reinforcementShift = useMemo(() => {
    if (!selectedOriginClassroom?.turno) return '';

    if (selectedOriginClassroom.turno === 'Mañana') return 'Tarde';
    if (selectedOriginClassroom.turno === 'Tarde') return 'Mañana';

    return '';
  }, [selectedOriginClassroom]);

  const openDetail = async (id) => {
    try {
      setLoadingDetail(true);

      const response = await getReinforcementById(id);
      setSelected(response.data || null);

      const nextAttendanceForm = {};
      (response.data?.estudiantes || []).forEach((item) => {
        nextAttendanceForm[item.reforzamiento_estudiante_id] = {
          estado: item.estado_asistencia || 'presente',
          observacion: item.observacion_asistencia || ''
        };
      });

      setAttendanceForm(nextAttendanceForm);
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudo cargar el detalle del reforzamiento.'
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const openCreateModal = () => {
    setEditing(null);
    setForm(initialForm);
    setCandidates([]);
    setAvailableTeachers([]);
    setAvailableClassrooms([]);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditing(item);

    setForm({
      origen: item.origen || 'manual',
      curso_id: item.curso_id ? String(item.curso_id) : '',
      periodo_id: item.periodo_id ? String(item.periodo_id) : '',
      bimestre: item.bimestre || 'B1',
      aula_origen_id: item.aula_origen_id ? String(item.aula_origen_id) : '',
      aula_reforzamiento_id: item.aula_reforzamiento_id ? String(item.aula_reforzamiento_id) : '',
      docente_id: item.docente_id ? String(item.docente_id) : '',
      titulo: item.titulo || '',
      descripcion: item.descripcion || '',
      actividad_recomendada: item.actividad_recomendada || '',
      fecha: getDateOnly(item.fecha),
      hora_inicio: normalizeTime(item.hora_inicio),
      hora_fin: normalizeTime(item.hora_fin),
      notificar: Boolean(item.notificar),
      estudiantes: []
    });

    setCandidates([]);
    setAvailableTeachers([]);
    setAvailableClassrooms([]);
    setModalOpen(true);
  };

  const loadCandidates = async () => {
    if (!form.aula_origen_id || !form.curso_id || !form.periodo_id) {
      toast.error('Selecciona aula origen, curso y período.');
      return;
    }

    try {
      setLoadingCandidates(true);

      const response = await getReinforcementCandidates({
        aula_origen_id: form.aula_origen_id,
        curso_id: form.curso_id,
        periodo_id: form.periodo_id,
        bimestre: form.bimestre
      });

      setCandidates(response.data || []);

      const suggested = (response.data || [])
        .filter((item) => item.alerta_academica_id || item.nota === 'C')
        .map((item) => ({
          estudiante_id: item.estudiante_id,
          alerta_academica_id: item.alerta_academica_id || null
        }));

      setForm((prev) => ({
        ...prev,
        origen: suggested.some((item) => item.alerta_academica_id)
          ? 'alerta_academica'
          : prev.origen,
        estudiantes: suggested
      }));

      if ((response.data || []).length === 0) {
        toast('No se encontraron estudiantes candidatos.', {
          icon: 'ℹ️'
        });
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudieron cargar los estudiantes candidatos.'
      );
    } finally {
      setLoadingCandidates(false);
    }
  };

  const loadAvailability = async () => {
    if (!form.curso_id || !form.fecha || !form.hora_inicio || !form.hora_fin) {
      toast.error('Selecciona curso, fecha y horario.');
      return;
    }

    if (isPastDate(form.fecha)) {
      toast.error('No se puede consultar disponibilidad para una fecha pasada.');
      return;
    }

    if (!reinforcementShift) {
      toast.error('Selecciona un aula de origen para calcular el turno opuesto.');
      return;
    }

    try {
      setLoadingAvailability(true);

      const [teachersResponse, classroomsResponse] = await Promise.all([
        getAvailableReinforcementTeachers({
          curso_id: form.curso_id,
          fecha: form.fecha,
          hora_inicio: form.hora_inicio,
          hora_fin: form.hora_fin
        }),
        getAvailableReinforcementClassrooms({
          turno: reinforcementShift,
          fecha: form.fecha,
          hora_inicio: form.hora_inicio,
          hora_fin: form.hora_fin
        })
      ]);

      setAvailableTeachers(teachersResponse.data || []);
      setAvailableClassrooms(classroomsResponse.data || []);

      toast.success('Disponibilidad actualizada.');
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudo consultar la disponibilidad.'
      );
    } finally {
      setLoadingAvailability(false);
    }
  };

  const toggleStudent = (candidate) => {
    setForm((prev) => {
      const exists = prev.estudiantes.some(
        (item) => Number(item.estudiante_id) === Number(candidate.estudiante_id)
      );

      if (exists) {
        return {
          ...prev,
          estudiantes: prev.estudiantes.filter(
            (item) => Number(item.estudiante_id) !== Number(candidate.estudiante_id)
          )
        };
      }

      return {
        ...prev,
        estudiantes: [
          ...prev.estudiantes,
          {
            estudiante_id: candidate.estudiante_id,
            alerta_academica_id: candidate.alerta_academica_id || null
          }
        ]
      };
    });
  };

  const buildPayload = () => ({
    origen: form.origen,
    curso_id: Number(form.curso_id),
    periodo_id: Number(form.periodo_id),
    bimestre: form.bimestre || null,
    aula_origen_id: Number(form.aula_origen_id),
    aula_reforzamiento_id: Number(form.aula_reforzamiento_id),
    docente_id: Number(form.docente_id),
    titulo: form.titulo.trim(),
    descripcion: form.descripcion.trim() || null,
    actividad_recomendada: form.actividad_recomendada.trim() || null,
    fecha: form.fecha,
    hora_inicio: form.hora_inicio,
    hora_fin: form.hora_fin,
    notificar: Boolean(form.notificar),
    estudiantes: form.estudiantes
  });

  const handleSave = async (event) => {
    event.preventDefault();

    if (isPastDate(form.fecha)) {
      toast.error('No se puede crear o actualizar un reforzamiento con una fecha pasada.');
      return;
    }

    try {
      setSaving(true);

      const payload = buildPayload();

      const response = editing
        ? await updateReinforcement({
          id: editing.id,
          payload
        })
        : await createReinforcement(payload);

      toast.success(
        response.message ||
        (editing ? 'Reforzamiento actualizado correctamente.' : 'Reforzamiento creado correctamente.')
      );

      setModalOpen(false);
      setEditing(null);
      setForm(initialForm);

      await loadReinforcements({ silent: true });
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudo guardar el reforzamiento.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;

    try {
      setCanceling(true);

      const response = await cancelReinforcement({
        id: cancelTarget.id,
        motivo: cancelMotivo.trim() || null
      });

      toast.success(response.message || 'Reforzamiento cancelado correctamente.');

      setCancelTarget(null);
      setCancelMotivo('');

      await loadReinforcements({ silent: true });

      if (selected?.id === cancelTarget.id) {
        setSelected(null);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudo cancelar el reforzamiento.'
      );
    } finally {
      setCanceling(false);
    }
  };

  const handleComplete = async () => {
    if (!completeTarget) return;

    try {
      setCompleting(true);

      const response = await completeReinforcement({
        id: completeTarget.id,
        observacion: completeObservation.trim() || null
      });

      toast.success(response.message || 'Reforzamiento completado correctamente.');

      setCompleteTarget(null);
      setCompleteObservation('');

      await loadReinforcements({ silent: true });

      if (selected?.id === completeTarget.id) {
        await openDetail(completeTarget.id);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudo completar el reforzamiento.'
      );
    } finally {
      setCompleting(false);
    }
  };

  const handleRespond = async ({
    assignmentId,
    estado
  }) => {
    try {
      const response = await respondReinforcementAssignment({
        id: assignmentId,
        estado,
        respuesta: estado === 'aceptado'
          ? 'Acepto la participación del estudiante en el reforzamiento.'
          : 'No autorizo la participación del estudiante en el reforzamiento.'
      });

      toast.success(response.message || 'Respuesta registrada correctamente.');

      if (selected?.id) {
        await openDetail(selected.id);
      }

      await loadReinforcements({ silent: true });
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudo registrar la respuesta.'
      );
    }
  };

  const handleSaveAttendance = async () => {
    if (!selected?.id) return;

    const acceptedStudents = (selected.estudiantes || []).filter(
      (item) => item.estado_apoderado === 'aceptado'
    );

    if (acceptedStudents.length === 0) {
      toast.error('No hay estudiantes aceptados para registrar asistencia.');
      return;
    }

    try {
      setSavingAttendance(true);

      const asistencias = acceptedStudents.map((item) => ({
        reforzamiento_estudiante_id: item.reforzamiento_estudiante_id,
        estado: attendanceForm[item.reforzamiento_estudiante_id]?.estado || 'presente',
        observacion: attendanceForm[item.reforzamiento_estudiante_id]?.observacion || null
      }));

      const response = await saveReinforcementAttendance({
        id: selected.id,
        asistencias
      });

      toast.success(response.message || 'Asistencia registrada correctamente.');

      await openDetail(selected.id);
      await loadReinforcements({ silent: true });
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudo registrar la asistencia.'
      );
    } finally {
      setSavingAttendance(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={38} />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando reforzamientos académicos...
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
              Seguimiento académico
            </p>

            <h1 className="text-3xl sm:text-4xl font-extrabold mt-2">
              Reforzamiento académico
            </h1>

            <p className="text-blue-100 mt-3 max-w-3xl">
              Gestiona sesiones de reforzamiento, aceptación del apoderado y asistencia de estudiantes con bajo rendimiento.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => loadReinforcements({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              Actualizar
            </button>

            {canManage && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 bg-gold-500 text-brand-950 px-5 py-3 rounded-xl font-extrabold hover:bg-gold-400 transition"
              >
                <Plus size={18} />
                Nuevo reforzamiento
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <CounterCard icon={GraduationCap} label="Total" value={counters.total} />
        <CounterCard icon={Clock3} label="Pendientes" value={counters.pendiente} />
        <CounterCard icon={UserCheck} label="En proceso" value={counters.en_proceso} />
        <CounterCard icon={CheckCircle2} label="Completados" value={counters.completado} />
        <CounterCard icon={XCircle} label="Cancelados" value={counters.cancelado} />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">Estado</span>
            <select
              value={filters.estado}
              onChange={(event) => setFilters((prev) => ({ ...prev, estado: event.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_proceso">En proceso</option>
              <option value="completado">Completados</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">Curso</span>
            <select
              value={filters.curso_id}
              onChange={(event) => setFilters((prev) => ({ ...prev, curso_id: event.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            >
              <option value="">Todos</option>
              {courses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">Desde</span>
            <input
              type="date"
              value={filters.desde}
              onChange={(event) => setFilters((prev) => ({ ...prev, desde: event.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">Hasta</span>
            <input
              type="date"
              value={filters.hasta}
              onChange={(event) => setFilters((prev) => ({ ...prev, hasta: event.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => loadReinforcements({ silent: true })}
              disabled={refreshing}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
            >
              <Search size={18} />
              Filtrar
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {reinforcements.length > 0 ? (
          reinforcements.map((item) => (
            <ReinforcementCard
              key={item.id}
              item={item}
              canManage={canManage}
              onDetail={() => openDetail(item.id)}
              onEdit={() => openEditModal(item)}
              onCancel={() => {
                setCancelTarget(item);
                setCancelMotivo('');
              }}
              onComplete={() => {
                setCompleteTarget(item);
                setCompleteObservation('');
              }}
            />
          ))
        ) : (
          <section className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-soft p-10 text-center">
            <AlertCircle className="mx-auto text-slate-300" size={46} />
            <h2 className="text-xl font-extrabold text-brand-950 mt-4">
              No hay reforzamientos registrados
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              No se encontraron reforzamientos para los filtros seleccionados.
            </p>
          </section>
        )}
      </section>

      {selected && (
        <ReinforcementDetailModal
          item={selected}
          role={role}
          canManage={canManage}
          canTakeAttendance={canTakeAttendance}
          canRespond={canRespond}
          loading={loadingDetail}
          attendanceForm={attendanceForm}
          setAttendanceForm={setAttendanceForm}
          savingAttendance={savingAttendance}
          onClose={() => setSelected(null)}
          onSaveAttendance={handleSaveAttendance}
          onRespond={handleRespond}
          onComplete={() => {
            setCompleteTarget(selected);
            setCompleteObservation('');
          }}
        />
      )}

      {modalOpen && (
        <ReinforcementFormModal
          editing={editing}
          form={form}
          setForm={setForm}
          courses={courses}
          classrooms={classrooms}
          periods={periods}
          candidates={candidates}
          availableTeachers={availableTeachers}
          availableClassrooms={availableClassrooms}
          reinforcementShift={reinforcementShift}
          saving={saving}
          loadingCandidates={loadingCandidates}
          loadingAvailability={loadingAvailability}
          onClose={() => {
            if (!saving) {
              setModalOpen(false);
              setEditing(null);
            }
          }}
          onSubmit={handleSave}
          onLoadCandidates={loadCandidates}
          onLoadAvailability={loadAvailability}
          onToggleStudent={toggleStudent}
        />
      )}

      {cancelTarget && (
        <ActionModal
          title="Cancelar reforzamiento"
          description="El reforzamiento quedará como cancelado."
          value={cancelMotivo}
          setValue={setCancelMotivo}
          loading={canceling}
          buttonLabel="Confirmar cancelación"
          buttonClass="bg-red-600 hover:bg-red-700"
          onClose={() => {
            if (!canceling) {
              setCancelTarget(null);
              setCancelMotivo('');
            }
          }}
          onConfirm={handleCancel}
        />
      )}

      {completeTarget && (
        <ActionModal
          title="Completar reforzamiento"
          description="Al completar, las alertas académicas relacionadas serán resueltas automáticamente."
          value={completeObservation}
          setValue={setCompleteObservation}
          loading={completing}
          buttonLabel="Completar reforzamiento"
          buttonClass="bg-green-600 hover:bg-green-700"
          onClose={() => {
            if (!completing) {
              setCompleteTarget(null);
              setCompleteObservation('');
            }
          }}
          onConfirm={handleComplete}
        />
      )}
    </main>
  );
}

function ReinforcementCard({
  item,
  canManage,
  onDetail,
  onEdit,
  onCancel,
  onComplete
}) {
  const statusClass = stateStyles[item.estado] || stateStyles.pendiente;
  const canModify = canManage && !['completado', 'cancelado'].includes(item.estado);

  return (
    <article className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5 hover:-translate-y-1 hover:shadow-lg transition">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border capitalize ${statusClass}`}>
              {formatState(item.estado)}
            </span>

            <span className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold border bg-brand-50 text-brand-900 border-brand-100">
              {item.origen === 'alerta_academica' ? 'Desde alerta' : 'Manual'}
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-brand-950 mt-3">
            {item.titulo}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {item.curso} · {formatBimester(item.bimestre)} · {item.periodo}
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
          <GraduationCap size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        <MiniInfo icon={CalendarDays} label="Fecha" value={formatDate(item.fecha)} />
        <MiniInfo icon={Clock3} label="Horario" value={`${normalizeTime(item.hora_inicio)} - ${normalizeTime(item.hora_fin)}`} />
        <MiniInfo icon={School} label="Aula origen" value={`${item.grado_origen || ''} ${item.seccion_origen || ''} ${item.turno_aula_origen || ''}`.trim()} />
        <MiniInfo icon={School} label="Aula refuerzo" value={`${item.grado_reforzamiento || ''} ${item.seccion_reforzamiento || ''} ${item.turno_aula_reforzamiento || ''}`.trim()} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-bold text-brand-950">
          Docente asignado
        </p>
        <p className="text-sm text-slate-500 mt-1">
          {item.docente || 'No precisa'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <MiniCounter label="Total" value={item.total_estudiantes} />
        <MiniCounter label="Aceptados" value={item.total_aceptados} />
        <MiniCounter label="Pendientes" value={item.total_pendientes_apoderado} />
        <MiniCounter label="Rechazados" value={item.total_rechazados} />
      </div>

      <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          onClick={onDetail}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-extrabold hover:bg-brand-800 transition"
        >
          <Eye size={16} />
          Ver detalle
        </button>

        {canModify && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-extrabold hover:bg-slate-200 transition"
            >
              <Edit3 size={16} />
              Editar
            </button>

            <button
              type="button"
              onClick={onComplete}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-extrabold hover:bg-green-700 transition"
            >
              <CheckCircle2 size={16} />
              Completar
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
    </article>
  );
}

function ReinforcementFormModal({
  editing,
  form,
  setForm,
  courses,
  classrooms,
  periods,
  candidates,
  availableTeachers,
  availableClassrooms,
  reinforcementShift,
  saving,
  loadingCandidates,
  loadingAvailability,
  onClose,
  onSubmit,
  onLoadCandidates,
  onLoadAvailability,
  onToggleStudent
}) {
  const isEditing = Boolean(editing);

  const selectedPastDate = isPastDate(form.fecha);

  return (
    <div className="fixed inset-0 z-[90] bg-brand-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <section className="relative bg-white w-full sm:max-w-5xl rounded-t-3xl sm:rounded-3xl shadow-soft border border-slate-200 max-h-[92vh] overflow-y-auto">
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
              Reforzamiento académico
            </p>

            <h2 className="text-2xl font-extrabold mt-2">
              {isEditing ? 'Editar reforzamiento' : 'Nuevo reforzamiento'}
            </h2>

            <p className="text-sm text-blue-100 mt-2">
              Los estudiantes de turno mañana reciben reforzamiento en la tarde, y los de turno tarde en la mañana.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SelectField
              label="Período"
              value={form.periodo_id}
              onChange={(value) => setForm((prev) => ({ ...prev, periodo_id: value }))}
              disabled={saving}
              required
              options={periods.map((item) => ({ value: item.id, label: item.nombre }))}
            />

            <SelectField
              label="Bimestre"
              value={form.bimestre}
              onChange={(value) => setForm((prev) => ({ ...prev, bimestre: value }))}
              disabled={saving}
              required
              options={BIMESTERS.map((item) => ({ value: item.value, label: item.label }))}
            />

            <SelectField
              label="Curso"
              value={form.curso_id}
              onChange={(value) => setForm((prev) => ({ ...prev, curso_id: value, docente_id: '' }))}
              disabled={saving}
              required
              options={courses.map((item) => ({ value: item.id, label: item.nombre }))}
            />

            <SelectField
              label="Origen"
              value={form.origen}
              onChange={(value) => setForm((prev) => ({ ...prev, origen: value }))}
              disabled={saving || isEditing}
              options={[
                { value: 'manual', label: 'Manual' },
                { value: 'alerta_academica', label: 'Desde alerta académica' }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField
              label="Aula origen"
              value={form.aula_origen_id}
              onChange={(value) => setForm((prev) => ({
                ...prev,
                aula_origen_id: value,
                aula_reforzamiento_id: ''
              }))}
              disabled={saving}
              required
              options={classrooms.map((item) => ({
                value: item.id || item.aula_id,
                label: `${item.grado || ''} ${item.seccion || ''} ${item.turno || ''}`.trim()
              }))}
            />

            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">
                Turno de reforzamiento
              </span>

              <input
                type="text"
                value={reinforcementShift || 'Selecciona aula origen'}
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-100 text-slate-600"
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={onLoadAvailability}
                disabled={saving || loadingAvailability}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
              >
                {loadingAvailability ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                Buscar disponibilidad
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">Fecha</span>
              <input
                type="date"
                value={form.fecha}
                min={getToday()}
                onChange={(event) => setForm((prev) => ({ ...prev, fecha: event.target.value }))}
                required
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">Hora inicio</span>
              <input
                type="time"
                value={form.hora_inicio}
                onChange={(event) => setForm((prev) => ({ ...prev, hora_inicio: event.target.value }))}
                required
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">Hora fin</span>
              <input
                type="time"
                value={form.hora_fin}
                onChange={(event) => setForm((prev) => ({ ...prev, hora_fin: event.target.value }))}
                required
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
              />
            </label>
          </div>

            {selectedPastDate && (
              <div className="bg-red-50 border border-red-100 text-danger rounded-2xl p-4 flex gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />

                <p className="text-sm font-semibold">
                  La fecha seleccionada corresponde a un día pasado. Selecciona la fecha actual o una fecha futura para programar el reforzamiento.
                </p>
              </div>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Docente disponible"
              value={form.docente_id}
              onChange={(value) => setForm((prev) => ({ ...prev, docente_id: value }))}
              disabled={saving}
              required
              options={availableTeachers.map((item) => ({
                value: item.docente_id,
                label: `${item.docente} ${item.especialidad ? `· ${item.especialidad}` : ''}`
              }))}
              placeholder="Busca disponibilidad primero"
            />

            <SelectField
              label="Aula disponible para reforzamiento"
              value={form.aula_reforzamiento_id}
              onChange={(value) => setForm((prev) => ({ ...prev, aula_reforzamiento_id: value }))}
              disabled={saving}
              required
              options={availableClassrooms.map((item) => ({
                value: item.aula_id,
                label: `${item.grado || ''} ${item.seccion || ''} ${item.turno || ''} · Capacidad ${item.capacidad || 'N/P'}`
              }))}
              placeholder="Busca disponibilidad primero"
            />
          </div>

          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">Título</span>
            <input
              type="text"
              value={form.titulo}
              onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))}
              maxLength={150}
              required
              disabled={saving}
              placeholder="Ejemplo: Reforzamiento de Matemática - Bimestre 1"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">Descripción</span>
              <textarea
                value={form.descripcion}
                onChange={(event) => setForm((prev) => ({ ...prev, descripcion: event.target.value }))}
                rows={4}
                disabled={saving}
                placeholder="Detalle de la sesión de reforzamiento..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 resize-none disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">Actividad recomendada</span>
              <textarea
                value={form.actividad_recomendada}
                onChange={(event) => setForm((prev) => ({ ...prev, actividad_recomendada: event.target.value }))}
                rows={4}
                disabled={saving}
                placeholder="Ficha, ejercicios, lectura o práctica sugerida..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 resize-none disabled:opacity-60"
              />
            </label>
          </div>

          {!isEditing && (
            <section className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-brand-950">
                    Estudiantes candidatos
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Selecciona los estudiantes que serán asignados al reforzamiento.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onLoadCandidates}
                  disabled={saving || loadingCandidates}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
                >
                  {loadingCandidates ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  Buscar estudiantes
                </button>
              </div>

              <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-200">
                {candidates.length > 0 ? (
                  candidates.map((item) => {
                    const checked = form.estudiantes.some(
                      (student) => Number(student.estudiante_id) === Number(item.estudiante_id)
                    );

                    return (
                      <label
                        key={item.estudiante_id}
                        className="flex items-start gap-3 p-4 hover:bg-white cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleStudent(item)}
                          disabled={saving}
                          className="mt-1"
                        />

                        <div className="min-w-0">
                          <p className="font-extrabold text-brand-950">
                            {item.estudiante}
                          </p>

                          <p className="text-sm text-slate-500">
                            DNI: {item.dni || 'No precisa'} · Nota: {item.nota || 'Sin nota'}
                          </p>

                          {item.alerta_academica_id && (
                            <p className="text-xs font-bold text-red-600 mt-1">
                              Tiene alerta académica activa.
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <Users className="mx-auto text-slate-300" size={38} />
                    <p className="text-sm text-slate-500 mt-3">
                      Busca estudiantes candidatos para asignarlos.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={form.notificar}
              onChange={(event) => setForm((prev) => ({ ...prev, notificar: event.target.checked }))}
              disabled={saving}
              className="mt-1"
            />

            <span>
              <span className="block font-extrabold text-brand-950">
                Notificar por campanita
              </span>

              <span className="block text-sm text-slate-500 mt-1">
                Notifica a estudiantes, apoderados y docente asignado.
              </span>
            </span>
          </label>

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
              disabled={saving || selectedPastDate}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-900 text-white font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isEditing ? 'Guardar cambios' : 'Crear reforzamiento'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ReinforcementDetailModal({
  item,
  role,
  canTakeAttendance,
  canRespond,
  attendanceForm,
  setAttendanceForm,
  savingAttendance,
  onClose,
  onSaveAttendance,
  onRespond,
  onComplete
}) {
  const acceptedStudents = (item.estudiantes || []).filter(
    (student) => student.estado_apoderado === 'aceptado'
  );

  return (
    <div className="fixed inset-0 z-[90] bg-brand-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <section className="relative bg-white w-full sm:max-w-5xl rounded-t-3xl sm:rounded-3xl shadow-soft border border-slate-200 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 flex items-center justify-center transition"
        >
          <X size={20} />
        </button>

        <div className="bg-brand-950 text-white p-6 rounded-t-3xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-gold-500/20 rounded-full blur-3xl" />

          <div className="relative pr-10">
            <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.18em]">
              Detalle del reforzamiento
            </p>

            <h2 className="text-2xl font-extrabold mt-2">
              {item.titulo}
            </h2>

            <p className="text-sm text-blue-100 mt-2">
              {item.curso} · {formatDate(item.fecha)} · {normalizeTime(item.hora_inicio)} - {normalizeTime(item.hora_fin)}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <DetailBox label="Estado" value={formatState(item.estado)} />
            <DetailBox label="Curso" value={item.curso} />
            <DetailBox label="Bimestre" value={formatBimester(item.bimestre)} />
            <DetailBox label="Docente" value={item.docente} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailBox
              label="Aula origen"
              value={`${item.grado_origen || ''} ${item.seccion_origen || ''} ${item.turno_origen || ''}`.trim()}
            />

            <DetailBox
              label="Aula reforzamiento"
              value={`${item.grado_reforzamiento || ''} ${item.seccion_reforzamiento || ''} ${item.turno_reforzamiento || ''}`.trim()}
            />
          </div>

          {(item.descripcion || item.actividad_recomendada) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextBox label="Descripción" value={item.descripcion} />
              <TextBox label="Actividad recomendada" value={item.actividad_recomendada} />
            </div>
          )}

          <section className="rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-brand-950">
                  Estudiantes asignados
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  El apoderado debe aceptar para habilitar asistencia.
                </p>
              </div>

              {canTakeAttendance && item.estado !== 'completado' && item.estado !== 'cancelado' && (
                <button
                  type="button"
                  onClick={onSaveAttendance}
                  disabled={savingAttendance || acceptedStudents.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
                >
                  {savingAttendance ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Guardar asistencia
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-200">
              {(item.estudiantes || []).map((student) => (
                <StudentAssignmentRow
                  key={student.reforzamiento_estudiante_id}
                  student={student}
                  role={role}
                  canTakeAttendance={canTakeAttendance}
                  canRespond={canRespond}
                  attendanceForm={attendanceForm}
                  setAttendanceForm={setAttendanceForm}
                  onRespond={onRespond}
                  disabledAttendance={item.estado === 'completado' || item.estado === 'cancelado'}
                />
              ))}
            </div>
          </section>

          {['Director', 'Administrativo'].includes(role) && !['completado', 'cancelado'].includes(item.estado) && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onComplete}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-extrabold hover:bg-green-700 transition"
              >
                <CheckCircle2 size={18} />
                Completar reforzamiento
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StudentAssignmentRow({
  student,
  canTakeAttendance,
  canRespond,
  attendanceForm,
  setAttendanceForm,
  onRespond,
  disabledAttendance
}) {
  const guardianClass =
    guardianStateStyles[student.estado_apoderado] ||
    guardianStateStyles.pendiente_apoderado;

  const canRegisterAttendance =
    canTakeAttendance &&
    student.estado_apoderado === 'aceptado' &&
    !disabledAttendance;

  return (
    <article className="p-4 hover:bg-slate-50 transition">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-extrabold text-brand-950">
              {student.estudiante}
            </p>

            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border ${guardianClass}`}>
              {formatGuardianState(student.estado_apoderado)}
            </span>

            {student.estado_asistencia && (
              <span className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold border bg-blue-50 text-blue-700 border-blue-100">
                Asistencia: {student.estado_asistencia}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-1">
            DNI: {student.estudiante_dni || 'No precisa'} · Apoderado: {student.apoderado || 'No asignado'}
          </p>

          {student.respuesta_apoderado && (
            <p className="text-sm text-slate-600 mt-2">
              Respuesta: {student.respuesta_apoderado}
            </p>
          )}
        </div>

        {canRespond && student.estado_apoderado === 'pendiente_apoderado' && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => onRespond({
                assignmentId: student.reforzamiento_estudiante_id,
                estado: 'aceptado'
              })}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-extrabold hover:bg-green-700 transition"
            >
              <CheckCircle2 size={16} />
              Aceptar
            </button>

            <button
              type="button"
              onClick={() => onRespond({
                assignmentId: student.reforzamiento_estudiante_id,
                estado: 'rechazado'
              })}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-extrabold hover:bg-red-700 transition"
            >
              <XCircle size={16} />
              Rechazar
            </button>
          </div>
        )}
      </div>

      {canRegisterAttendance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <label className="block">
            <span className="block text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-2">
              Asistencia
            </span>

            <select
              value={attendanceForm[student.reforzamiento_estudiante_id]?.estado || 'presente'}
              onChange={(event) => setAttendanceForm((prev) => ({
                ...prev,
                [student.reforzamiento_estudiante_id]: {
                  ...(prev[student.reforzamiento_estudiante_id] || {}),
                  estado: event.target.value
                }
              }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            >
              {attendanceStates.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="block text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-2">
              Observación
            </span>

            <input
              type="text"
              value={attendanceForm[student.reforzamiento_estudiante_id]?.observacion || ''}
              onChange={(event) => setAttendanceForm((prev) => ({
                ...prev,
                [student.reforzamiento_estudiante_id]: {
                  ...(prev[student.reforzamiento_estudiante_id] || {}),
                  observacion: event.target.value
                }
              }))}
              placeholder="Observación opcional"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </label>
        </div>
      )}
    </article>
  );
}

function ActionModal({
  title,
  description,
  value,
  setValue,
  loading,
  buttonLabel,
  buttonClass,
  onClose,
  onConfirm
}) {
  return (
    <div className="fixed inset-0 z-[95] bg-brand-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <section className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-soft border border-slate-200 overflow-hidden">
        <div className="bg-brand-950 text-white p-6">
          <h2 className="text-2xl font-extrabold">
            {title}
          </h2>

          <p className="text-blue-100 mt-2">
            {description}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">
              Observación
            </span>

            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              rows={4}
              disabled={loading}
              placeholder="Escribe una observación..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 resize-none disabled:opacity-60"
            />
          </label>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-extrabold hover:bg-slate-50 disabled:opacity-60 transition"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-extrabold disabled:opacity-60 transition ${buttonClass}`}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {buttonLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecciona',
  disabled,
  required
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={16} />
        <p className="text-xs font-extrabold uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p className="text-sm font-bold text-brand-950 mt-2">
        {value || 'No precisa'}
      </p>
    </div>
  );
}

function MiniCounter({
  label,
  value
}) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
      <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
        {label}
      </p>

      <p className="text-xl font-extrabold text-brand-950 mt-1">
        {Number(value || 0)}
      </p>
    </div>
  );
}

function DetailBox({
  label,
  value
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
        {label}
      </p>

      <p className="text-sm font-bold text-brand-950 mt-2">
        {value || 'No precisa'}
      </p>
    </div>
  );
}

function TextBox({
  label,
  value
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
        {label}
      </p>

      <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">
        {value || 'Sin información registrada.'}
      </p>
    </div>
  );
}

function getDateOnly(value) {
  if (!value) return '';

  const text = String(value).trim();
  const match = text.match(/^\d{4}-\d{2}-\d{2}/);

  if (match) return match[0];

  const date = new Date(text);

  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  return text.slice(0, 10);
}

function normalizeTime(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

function formatDate(value) {
  const dateOnly = getDateOnly(value);

  if (!dateOnly) return 'Sin fecha';

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

function formatBimester(value) {
  const found = BIMESTERS.find((item) => item.value === value);
  return found?.label || value || 'Sin bimestre';
}

function formatState(value) {
  const labels = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    completado: 'Completado',
    cancelado: 'Cancelado'
  };

  return labels[value] || value || 'Sin estado';
}

function formatGuardianState(value) {
  const labels = {
    pendiente_apoderado: 'Pendiente apoderado',
    aceptado: 'Aceptado',
    rechazado: 'Rechazado'
  };

  return labels[value] || value || 'Sin respuesta';
}

export default ReinforcementsPage;