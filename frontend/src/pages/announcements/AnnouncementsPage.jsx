import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Send,
  Users,
  X
} from 'lucide-react';

import toast from 'react-hot-toast';

import {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementReadSummary,
  getMyAnnouncements,
  markAnnouncementAsRead
} from '../../services/announcements.service';

import { getRole, getStoredUser } from '../../utils/storage';
import { getClassrooms } from '../../services/classrooms.service';
import { getTeacherDashboardReport } from '../../services/dashboard.service';

import { useLocation, useNavigate } from 'react-router-dom';

const targetLabels = {
  general: 'General',
  directores: 'Directores',
  administrativos: 'Administrativos',
  docentes: 'Docentes',
  auxiliares: 'Auxiliares',
  estudiantes: 'Estudiantes',
  apoderados: 'Apoderados',
  aula: 'Aula específica'
};

const readStyles = {
  pendiente: 'bg-yellow-50 text-warning border-yellow-100',
  leido: 'bg-green-50 text-success border-green-100'
};

const targetOptionsAdmin = [
  { value: 'general', label: 'General' },
  { value: 'directores', label: 'Directores' },
  { value: 'administrativos', label: 'Administrativos' },
  { value: 'docentes', label: 'Docentes' },
  { value: 'auxiliares', label: 'Auxiliares' },
  { value: 'estudiantes', label: 'Estudiantes' },
  { value: 'apoderados', label: 'Apoderados' },
  { value: 'aula', label: 'Aula específica' }
];

const targetOptionsTeacher = [
  { value: 'aula', label: 'Aula específica' }
];

function AnnouncementsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = getRole();
  const user = getStoredUser();

  const isAdminView = ['Director', 'Administrativo'].includes(role);
  const canCreate = ['Director', 'Administrativo', 'Docente'].includes(role);

  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [readSummary, setReadSummary] = useState(null);
  const [classroomOptions, setClassroomOptions] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);

  const [filters, setFilters] = useState({
    estado: 'todos',
    destinatario: 'todos',
    search: ''
  });

  const [form, setForm] = useState({
    titulo: '',
    contenido: '',
    destinatario_tipo: role === 'Docente' ? 'aula' : 'general',
    aula_id: ''
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [adminReadCounters, setAdminReadCounters] = useState({
    totalConfirmaciones: 0,
    totalLeidos: 0,
    totalPendientes: 0
  });

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

    const loadClassroomOptions = async () => {
    if (!canCreate) return;

    try {
      setLoadingClassrooms(true);

      if (['Director', 'Administrativo'].includes(role)) {
        const response = await getClassrooms({
          estado: 'activo'
        });

        const options = (response.data || []).map((classroom) => ({
          id: classroom.id,
          label: `${classroom.grado} ${classroom.seccion} - ${classroom.turno}`,
          grado: classroom.grado,
          seccion: classroom.seccion,
          turno: classroom.turno
        }));

        setClassroomOptions(options);
        return;
      }

      if (role === 'Docente') {
        const response = await getTeacherDashboardReport();
        const assignments = response.data?.assignments || [];

        const uniqueClassrooms = new Map();

        assignments.forEach((assignment) => {
          if (!assignment.aula_id) return;

          uniqueClassrooms.set(assignment.aula_id, {
            id: assignment.aula_id,
            label: `${assignment.grado} ${assignment.seccion} - ${assignment.turno}`,
            grado: assignment.grado,
            seccion: assignment.seccion,
            turno: assignment.turno
          });
        });

        setClassroomOptions([...uniqueClassrooms.values()]);
      }
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar las aulas disponibles.'
      );
    } finally {
      setLoadingClassrooms(false);
    }
  };

  const loadAdminReadCounters = async (items = []) => {
    if (!isAdminView || items.length === 0) {
      setAdminReadCounters({
        totalConfirmaciones: 0,
        totalLeidos: 0,
        totalPendientes: 0
      });
      return;
    }

    try {
      const summaries = await Promise.all(
        items.map(async (item) => {
          try {
            const response = await getAnnouncementReadSummary(item.id);
            return response.data || {};
          } catch {
            return {};
          }
        })
      );

      const totals = summaries.reduce(
        (acc, item) => {
          const confirmaciones = Number(item.total_confirmaciones || 0);
          const leidos = Number(item.total_leidos || 0);

          acc.totalConfirmaciones += confirmaciones;
          acc.totalLeidos += leidos;
          acc.totalPendientes += Math.max(confirmaciones - leidos, 0);

          return acc;
        },
        {
          totalConfirmaciones: 0,
          totalLeidos: 0,
          totalPendientes: 0
        }
      );

      setAdminReadCounters(totals);
    } catch {
      setAdminReadCounters({
        totalConfirmaciones: 0,
        totalLeidos: 0,
        totalPendientes: 0
      });
    }
  };

  const loadAnnouncements = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = isAdminView
        ? await getAllAnnouncements()
        : await getMyAnnouncements();

      const data = response.data || [];

      setAnnouncements(data);

      if (isAdminView) {
        await loadAdminReadCounters(data);
      }
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar los avisos.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [role]);
    useEffect(() => {
    loadClassroomOptions();
  }, [role]);

  const counters = useMemo(() => {
    const total = announcements.length;
    const pendientes = announcements.filter((item) => !item.leido).length;
    const leidos = announcements.filter((item) => item.leido).length;

    return {
      total,
      pendientes,
      leidos
    };
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    return announcements.filter((item) => {
      const matchesSearch =
        !term ||
        String(item.titulo || '').toLowerCase().includes(term) ||
        String(item.contenido || '').toLowerCase().includes(term) ||
        String(item.publicado_por_nombre || '').toLowerCase().includes(term);

      const matchesStatus =
        isAdminView ||
        filters.estado === 'todos' ||
        (filters.estado === 'leido' && item.leido) ||
        (filters.estado === 'pendiente' && !item.leido);

      const matchesTarget =
        filters.destinatario === 'todos' ||
        item.destinatario_tipo === filters.destinatario;

      return matchesSearch && matchesStatus && matchesTarget;
    });
  }, [announcements, filters, isAdminView]);

  const handleSelectAnnouncement = async (announcement) => {
    setSelectedAnnouncement(announcement);
    setReadSummary(null);
    setError('');
    setSuccessMessage('');

    if (isAdminView) {
      try {
        setLoadingSummary(true);

        const response = await getAnnouncementReadSummary(announcement.id);
        setReadSummary(response.data || null);
      } catch (error) {
        setReadSummary(null);
      } finally {
        setLoadingSummary(false);
      }
    }
  };

  useEffect(() => {
    const openAnnouncementId = location.state?.openAnnouncementId;

    if (!openAnnouncementId || announcements.length === 0) return;

    const announcementToOpen = announcements.find(
      (item) => Number(item.id) === Number(openAnnouncementId)
    );

    if (!announcementToOpen) return;

    handleSelectAnnouncement(announcementToOpen);

    navigate(location.pathname, {
      replace: true,
      state: {}
    });
  }, [location.state, announcements]);

  const handleMarkAsRead = async (announcement) => {
    if (!announcement?.id || announcement.leido) return;

    try {
      setError('');
      setSuccessMessage('');
      setMarkingId(announcement.id);

      const response = await markAnnouncementAsRead(announcement.id);

      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === announcement.id
            ? {
                ...item,
                leido: true,
                fecha_lectura: response.data?.fecha_lectura || new Date().toISOString()
              }
            : item
        )
      );

      if (selectedAnnouncement?.id === announcement.id) {
        setSelectedAnnouncement((prev) => ({
          ...prev,
          leido: true,
          fecha_lectura: response.data?.fecha_lectura || new Date().toISOString()
        }));
      }

      setSuccessMessage(response.message || 'Lectura confirmada correctamente.');
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo confirmar la lectura.'
      );
    } finally {
      setMarkingId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setSuccessMessage('');

      if (!form.titulo.trim() || !form.contenido.trim()) {
        setError('El título y el contenido son obligatorios.');
        return;
      }

      if (form.destinatario_tipo === 'aula' && !form.aula_id) {
        setError('Selecciona un aula para publicar el aviso.');
        return;
      }

      setCreating(true);

      const response = await createAnnouncement({
        titulo: form.titulo.trim(),
        contenido: form.contenido.trim(),
        destinatario_tipo: form.destinatario_tipo,
        aula_id: form.destinatario_tipo === 'aula' ? form.aula_id : undefined
      });

      setSuccessMessage(response.message || 'Aviso publicado correctamente.');

      setForm({
        titulo: '',
        contenido: '',
        destinatario_tipo: role === 'Docente' ? 'aula' : 'general',
        aula_id: ''
      });

      setShowCreateModal(false);

      await loadAnnouncements({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo publicar el aviso.'
      );
    } finally {
      setCreating(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setError('');
    setSuccessMessage('');
  };

  const closeDetailModal = () => {
    setSelectedAnnouncement(null);
    setReadSummary(null);
    setError('');
    setSuccessMessage('');
  };

  const targetOptions = role === 'Docente'
    ? targetOptionsTeacher
    : targetOptionsAdmin;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando avisos...
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
              Avisos institucionales
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              Avisos
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              {isAdminView
                ? 'Publica avisos y revisa confirmaciones de lectura.'
                : 'Consulta los avisos dirigidos a tu rol o aula vinculada.'}
            </p>

            <p className="text-sm text-blue-100 mt-4">
              Sesión: <span className="font-extrabold text-white">{user?.nombres || user?.username}</span> · {role}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadAnnouncements({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <CounterCard
          icon={Megaphone}
          label="Total"
          value={counters.total}
          description="Avisos disponibles"
        />

        <CounterCard
          icon={Bell}
          label="Pendientes"
          value={isAdminView ? adminReadCounters.totalPendientes : counters.pendientes}
          description={isAdminView ? 'Lecturas pendientes' : 'Aún no confirmados'}
        />

        <CounterCard
          icon={ClipboardCheck}
          label="Leídos"
          value={isAdminView ? adminReadCounters.totalLeidos : counters.leidos}
          description={isAdminView ? 'Lecturas confirmadas' : 'Confirmados por tu usuario'}
        />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1">
            <Input
              label="Buscar"
              value={filters.search}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  search: value
                }))
              }
              placeholder="Título, contenido o autor"
            />

            {!isAdminView && (
              <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-2">
                  Estado de lectura
                </span>

                <select
                  value={filters.estado}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      estado: e.target.value
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="leido">Leídos</option>
                </select>
              </label>
            )}

            {isAdminView && (
              <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-2">
                  Destinatario
                </span>

                <select
                  value={filters.destinatario}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      destinatario: e.target.value
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
                >
                  <option value="todos">Todos</option>
                  {targetOptionsAdmin.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-brand-950 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-brand-900 transition"
            >
              <Plus size={18} />
              Nuevo aviso
            </button>
          )}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-brand-950">
              Listado de avisos
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {isAdminView
                ? 'Avisos publicados en el sistema.'
                : 'Avisos disponibles para tu usuario.'}
            </p>
          </div>

          <span className="hidden sm:inline-flex rounded-full px-3 py-1 text-xs font-extrabold bg-brand-50 text-brand-900 border border-brand-100">
            {filteredAnnouncements.length} resultado(s)
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[calc(100vh-390px)] min-h-[420px] overflow-y-auto">
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((item) => (
              <AnnouncementItem
                key={item.id}
                item={item}
                isAdminView={isAdminView}
                active={selectedAnnouncement?.id === item.id}
                marking={markingId === item.id}
                onSelect={() => handleSelectAnnouncement(item)}
                onMarkRead={() => handleMarkAsRead(item)}
              />
            ))
          ) : (
            <EmptyBlock text="No se encontraron avisos." />
          )}
        </div>
      </section>

      {showCreateModal && (
        <AnnouncementModal onClose={closeCreateModal}>
          <AnnouncementCreateForm
            form={form}
            role={role}
            targetOptions={targetOptions}
            classroomOptions={classroomOptions}
            loadingClassrooms={loadingClassrooms}
            creating={creating}
            setForm={setForm}
            onSubmit={handleCreate}
          />
        </AnnouncementModal>
      )}

      {selectedAnnouncement && (
        <AnnouncementModal onClose={closeDetailModal}>
          <AnnouncementDetail
            announcement={selectedAnnouncement}
            isAdminView={isAdminView}
            readSummary={readSummary}
            loadingSummary={loadingSummary}
            onMarkRead={() => handleMarkAsRead(selectedAnnouncement)}
            marking={markingId === selectedAnnouncement.id}
          />
        </AnnouncementModal>
      )}
    </main>
  );
}

function AnnouncementModal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] bg-brand-950/70 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6">
      <section className="relative w-full lg:max-w-4xl max-h-[92vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl">
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

function AnnouncementCreateForm({
  form,
  role,
  targetOptions,
  classroomOptions,
  loadingClassrooms,
  creating,
  setForm,
  onSubmit
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6 space-y-5"
    >
      <div className="flex items-center gap-3 pr-10">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
          <Send size={22} />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-brand-950">
            Publicar aviso
          </h2>

          <p className="text-sm text-slate-500">
            El aviso será visible para el destinatario seleccionado.
          </p>
        </div>
      </div>

      <Input
        label="Título"
        value={form.titulo}
        onChange={(value) =>
          setForm((prev) => ({
            ...prev,
            titulo: value
          }))
        }
        placeholder="Ej. Suspensión de clases"
      />

      <label className="block">
        <span className="block text-sm font-bold text-slate-700 mb-2">
          Destinatario
        </span>

        <select
          value={form.destinatario_tipo}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              destinatario_tipo: e.target.value,
              aula_id: e.target.value === 'aula' ? prev.aula_id : ''
            }))
          }
          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
        >
          {targetOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {form.destinatario_tipo === 'aula' && (
        <label className="block">
          <span className="block text-sm font-bold text-slate-700 mb-2">
            Aula
          </span>

          <select
            value={form.aula_id}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                aula_id: e.target.value
              }))
            }
            disabled={loadingClassrooms || classroomOptions.length === 0}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
          >
            <option value="">
              {loadingClassrooms
                ? 'Cargando aulas...'
                : classroomOptions.length > 0
                  ? 'Selecciona un aula'
                  : 'No hay aulas disponibles'}
            </option>

            {classroomOptions.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.label}
              </option>
            ))}
          </select>

          {role === 'Docente' && (
            <p className="text-xs text-slate-500 mt-2">
              Solo se muestran las aulas asignadas a tu usuario docente.
            </p>
          )}
        </label>
      )}

      <label className="block">
        <span className="block text-sm font-bold text-slate-700 mb-2">
          Contenido
        </span>

        <textarea
          value={form.contenido}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              contenido: e.target.value
            }))
          }
          rows={7}
          placeholder="Escribe el aviso..."
          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 resize-none"
        />
      </label>

      <button
        type="submit"
        disabled={creating}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
      >
        {creating ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Plus size={18} />
        )}
        Publicar aviso
      </button>
    </form>
  );
}

function AnnouncementItem({
  item,
  isAdminView,
  active,
  marking,
  onSelect,
  onMarkRead
}) {
  const readStatus = item.leido ? 'leido' : 'pendiente';
  const readClass = readStyles[readStatus];

  return (
    <div className={`p-5 transition ${active ? 'bg-brand-50' : 'hover:bg-slate-50'}`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <button
          type="button"
          onClick={onSelect}
          className="text-left min-w-0 flex-1"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-extrabold text-brand-950">
              {item.titulo || 'Aviso'}
            </p>

            <span className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold bg-slate-50 border border-slate-200 text-slate-600">
              {formatTarget(item)}
            </span>

            {!isAdminView && (
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border ${readClass}`}>
                {item.leido ? 'Leído' : 'Pendiente'}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-2 line-clamp-2">
            {item.contenido || 'Sin contenido adicional.'}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            {formatDateTime(item.fecha || item.created_at)}
            {item.publicado_por_nombre ? ` · Publicado por ${item.publicado_por_nombre}` : ''}
          </p>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-brand-900 px-3 py-2 rounded-xl text-xs font-extrabold hover:bg-slate-50 transition"
          >
            <Eye size={15} />
            Ver
          </button>

          {!isAdminView && !item.leido && (
            <button
              type="button"
              onClick={onMarkRead}
              disabled={marking}
              className="inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-3 py-2 rounded-xl text-xs font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
            >
              {marking ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              Leído
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AnnouncementDetail({
  announcement,
  isAdminView,
  readSummary,
  loadingSummary,
  onMarkRead,
  marking
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pr-10">
        <div>
          <p className="text-sm font-extrabold text-gold-600 uppercase tracking-[0.16em]">
            Detalle del aviso
          </p>

          <h2 className="text-2xl font-extrabold text-brand-950 mt-2">
            {announcement.titulo}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            {formatTarget(announcement)} · {formatDateTime(announcement.fecha || announcement.created_at)}
          </p>

          {announcement.publicado_por_nombre && (
            <p className="text-sm text-slate-500 mt-1">
              Publicado por {announcement.publicado_por_nombre}
            </p>
          )}
        </div>

        {!isAdminView && !announcement.leido && (
          <button
            type="button"
            onClick={onMarkRead}
            disabled={marking}
            className="inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
          >
            {marking ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            Confirmar lectura
          </button>
        )}
      </div>

      <div className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-5">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {announcement.contenido || 'Sin contenido adicional.'}
        </p>
      </div>

      {!isAdminView && (
        <div className="mt-5 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
            Estado de lectura
          </span>

          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border ${announcement.leido ? readStyles.leido : readStyles.pendiente}`}>
            {announcement.leido ? 'Leído' : 'Pendiente'}
          </span>
        </div>
      )}

      {isAdminView && (
        <div className="mt-5 bg-brand-950 text-white rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 text-gold-500 flex items-center justify-center">
              <Users size={22} />
            </div>

            <div>
              <h3 className="font-extrabold">
                Confirmaciones de lectura
              </h3>

              <p className="text-sm text-blue-100">
                Resumen de lecturas del aviso.
              </p>
            </div>
          </div>

          {loadingSummary ? (
            <div className="mt-5 flex items-center gap-2 text-blue-100">
              <Loader2 size={18} className="animate-spin" />
              Cargando resumen...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-5">
              <MiniStat
                label="Confirmaciones"
                value={readSummary?.total_confirmaciones}
              />

              <MiniStat
                label="Leídos"
                value={readSummary?.total_leidos}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CounterCard({
  icon: Icon,
  label,
  value,
  description
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
        <Icon size={24} />
      </div>

      <p className="text-sm font-bold text-slate-500 mt-5">
        {label}
      </p>

      <p className="text-3xl font-extrabold text-brand-950 mt-2">
        {typeof value === 'number'
          ? Number(value || 0).toLocaleString('es-PE')
          : value}
      </p>

      <p className="text-sm text-slate-500 mt-2">
        {description}
      </p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
      />
    </label>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
      <p className="text-xs text-blue-100 font-bold">
        {label}
      </p>

      <p className="text-2xl font-extrabold mt-1">
        {Number(value || 0).toLocaleString('es-PE')}
      </p>
    </div>
  );
}

function EmptyBlock({ text }) {
  return (
    <div className="p-8 text-center">
      <Bell className="mx-auto text-slate-300" size={42} />

      <p className="text-sm text-slate-500 mt-3">
        {text}
      </p>
    </div>
  );
}

function formatTarget(item) {
  if (item.destinatario_tipo === 'aula') {
    const aulaText = [
      item.grado,
      item.seccion,
      item.turno
    ].filter(Boolean).join(' ');

    return aulaText || `Aula #${item.aula_id}`;
  }

  return targetLabels[item.destinatario_tipo] || item.destinatario_tipo || 'General';
}

function formatDateTime(value) {
  if (!value) return 'Fecha no registrada';

  return new Date(value).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default AnnouncementsPage;