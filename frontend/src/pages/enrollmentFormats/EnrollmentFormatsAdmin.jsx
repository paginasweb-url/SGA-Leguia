import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Upload,
  X
} from 'lucide-react';

import toast from 'react-hot-toast';

import {
  createEnrollmentFormat,
  downloadEnrollmentFormat,
  getEnrollmentFormats,
  updateEnrollmentFormat,
  updateEnrollmentFormatStatus,
  viewEnrollmentFormat
} from '../../services/enrollmentFormats.service';

import PageHeader from '../../components/PageHeader';

const statusStyles = {
  activo: 'bg-green-50 text-success border-green-100',
  inactivo: 'bg-red-50 text-danger border-red-100'
};

function EnrollmentFormatsAdmin() {
  const [formats, setFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const [createForm, setCreateForm] = useState({
    titulo: '',
    descripcion: '',
    archivo: null
  });

  const [editForm, setEditForm] = useState({
    titulo: '',
    descripcion: ''
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [processingFileId, setProcessingFileId] = useState(null);
  const [processingStatusId, setProcessingStatusId] = useState(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const loadFormats = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getEnrollmentFormats({
        estado: statusFilter === 'todos' ? undefined : statusFilter,
        page: 1,
        limit: 50
      });

      const data = response.data || [];

      setFormats(data);

      if (selectedFormat) {
        const updatedSelected = data.find((item) => item.id === selectedFormat.id);
        setSelectedFormat(updatedSelected || null);

        if (updatedSelected) {
          setEditForm({
            titulo: updatedSelected.titulo || '',
            descripcion: updatedSelected.descripcion || ''
          });
        }
      }
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar los formatos de matrícula.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFormats();
  }, [statusFilter]);

  const counters = useMemo(() => {
    return formats.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.estado] = (acc[item.estado] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        activo: 0,
        inactivo: 0
      }
    );
  }, [formats]);

  const filteredFormats = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return formats;

    return formats.filter((item) => {
      const publisher = `${item.publicado_por_nombres || ''} ${item.publicado_por_apellidos || ''} ${item.publicado_por_username || ''}`.toLowerCase();

      return (
        String(item.titulo || '').toLowerCase().includes(term) ||
        String(item.descripcion || '').toLowerCase().includes(term) ||
        String(item.nombre_archivo || '').toLowerCase().includes(term) ||
        publisher.includes(term)
      );
    });
  }, [formats, searchTerm]);

  const handleSelectFormat = (format) => {
    setSelectedFormat(format);
    setEditForm({
      titulo: format.titulo || '',
      descripcion: format.descripcion || ''
    });
    setError('');
    setSuccessMessage('');
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setError('');
    setSuccessMessage('');
  };

  const closeDetailModal = () => {
    setSelectedFormat(null);
    setError('');
    setSuccessMessage('');
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;

    setCreateForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setSuccessMessage('');

      if (!createForm.titulo.trim()) {
        setError('El título del formato es obligatorio.');
        return;
      }

      if (!createForm.archivo) {
        setError('Selecciona un archivo PDF para publicar.');
        return;
      }

      setCreating(true);

      const response = await createEnrollmentFormat({
        titulo: createForm.titulo.trim(),
        descripcion: createForm.descripcion.trim(),
        archivo: createForm.archivo
      });

      setSuccessMessage(response.message || 'Formato publicado correctamente.');

      setCreateForm({
        titulo: '',
        descripcion: '',
        archivo: null
      });

      setFileInputKey(Date.now());
      setShowCreateModal(false);

      await loadFormats({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo publicar el formato.'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFormat) return;

    try {
      setError('');
      setSuccessMessage('');

      if (!editForm.titulo.trim()) {
        setError('El título del formato es obligatorio.');
        return;
      }

      setSavingEdit(true);

      const response = await updateEnrollmentFormat({
        id: selectedFormat.id,
        titulo: editForm.titulo.trim(),
        descripcion: editForm.descripcion.trim()
      });

      setSuccessMessage(response.message || 'Formato actualizado correctamente.');

      await loadFormats({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo actualizar el formato.'
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleStatus = async (format) => {
    try {
      setError('');
      setSuccessMessage('');
      setProcessingStatusId(format.id);

      const nextStatus = format.estado === 'activo' ? 'inactivo' : 'activo';

      const response = await updateEnrollmentFormatStatus({
        id: format.id,
        estado: nextStatus
      });

      setSuccessMessage(response.message || 'Estado actualizado correctamente.');

      await loadFormats({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo cambiar el estado del formato.'
      );
    } finally {
      setProcessingStatusId(null);
    }
  };

  const handleView = async (format) => {
    if (format.estado !== 'activo') {
      setError('Solo los formatos activos están disponibles para visualización.');
      return;
    }

    try {
      setError('');
      setProcessingFileId(`view-${format.id}`);

      await viewEnrollmentFormat({
        id: format.id
      });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo visualizar el formato.'
      );
    } finally {
      setProcessingFileId(null);
    }
  };

  const handleDownload = async (format) => {
    if (format.estado !== 'activo') {
      setError('Solo los formatos activos están disponibles para descarga.');
      return;
    }

    try {
      setError('');
      setProcessingFileId(`download-${format.id}`);

      await downloadEnrollmentFormat({
        id: format.id,
        fallbackFileName: format.nombre_archivo || 'formato_matricula.pdf'
      });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo descargar el formato.'
      );
    } finally {
      setProcessingFileId(null);
    }
  };

  const copyText = async (text) => {
    if (!text) return;

    await navigator.clipboard.writeText(String(text));
    toast.success('Copiado al portapapeles.');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando formatos de matrícula...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Gestión documental"
        title="Formatos de matrícula"
        description="Publica, actualiza y controla los formatos PDF visibles para los apoderados."
      >
        <button
          type="button"
          onClick={() => loadFormats({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </PageHeader>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CounterCard label="Total" value={counters.total} />
        <CounterCard label="Activos" value={counters.activo} status="activo" />
        <CounterCard label="Inactivos" value={counters.inactivo} status="inactivo" />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-brand-950">
                Formatos registrados
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Consulta, publica, edita y controla el estado de los formatos de matrícula.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-brand-950 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-brand-900 transition"
            >
              <Plus size={18} />
              Nuevo formato
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar formato"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[calc(100vh-430px)] min-h-[420px] overflow-y-auto">
          {filteredFormats.length > 0 ? (
            filteredFormats.map((format) => (
              <FormatItem
                key={format.id}
                format={format}
                active={selectedFormat?.id === format.id}
                onClick={() => handleSelectFormat(format)}
              />
            ))
          ) : (
            <div className="p-10 text-center">
              <FileText className="mx-auto text-slate-300" size={42} />
              <p className="text-sm text-slate-500 mt-3">
                No se encontraron formatos con los filtros aplicados.
              </p>
            </div>
          )}
        </div>
      </section>

      {showCreateModal && (
        <FormatModal onClose={closeCreateModal}>
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6 space-y-5"
          >
            <div className="flex items-center gap-3 pr-10">
              <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
                <Upload size={23} />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-brand-950">
                  Publicar nuevo formato
                </h2>

                <p className="text-sm text-slate-500">
                  El archivo será visible en la página pública si queda activo.
                </p>
              </div>
            </div>

            <Input
              label="Título"
              name="titulo"
              value={createForm.titulo}
              onChange={handleCreateChange}
              placeholder="Requisitos de matrícula 2026"
            />

            <Textarea
              label="Descripción"
              name="descripcion"
              value={createForm.descripcion}
              onChange={handleCreateChange}
              placeholder="Describe brevemente el contenido del formato..."
            />

            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-2">
                Archivo PDF
              </span>

              <input
                key={fileInputKey}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    archivo: e.target.files?.[0] || null
                  }))
                }
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-brand-50 file:text-brand-900 hover:file:bg-brand-100"
              />

              {createForm.archivo && (
                <p className="text-xs text-slate-500 mt-2">
                  Archivo seleccionado: <span className="font-bold">{createForm.archivo.name}</span>
                </p>
              )}
            </label>

            <button
              type="submit"
              disabled={creating}
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
            >
              {creating ? 'Publicando...' : 'Publicar formato'}
              {!creating && <Plus size={18} />}
            </button>
          </form>
        </FormatModal>
      )}

      {selectedFormat && (
        <FormatModal onClose={closeDetailModal}>
          <div className="space-y-5">
            <div className="bg-brand-950 text-white rounded-3xl shadow-soft p-6 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold-500/20 blur-3xl" />

              <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pr-10">
                <div className="min-w-0">
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold border bg-white/10 text-white border-white/20">
                    {selectedFormat.estado}
                  </span>

                  <h2 className="text-2xl font-extrabold mt-4">
                    {selectedFormat.titulo}
                  </h2>

                  <p className="text-sm text-blue-100 mt-2">
                    {selectedFormat.nombre_archivo}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => handleView(selectedFormat)}
                    disabled={selectedFormat.estado !== 'activo' || processingFileId === `view-${selectedFormat.id}`}
                    className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-50 transition"
                  >
                    {processingFileId === `view-${selectedFormat.id}` ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <ExternalLink size={18} />
                    )}
                    Ver PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(selectedFormat)}
                    disabled={selectedFormat.estado !== 'activo' || processingFileId === `download-${selectedFormat.id}`}
                    className="inline-flex items-center justify-center gap-2 bg-gold-500 text-brand-950 px-4 py-3 rounded-xl font-extrabold hover:bg-gold-100 disabled:opacity-50 transition"
                  >
                    {processingFileId === `download-${selectedFormat.id}` ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                    Descargar
                  </button>
                </div>
              </div>
            </div>

            {selectedFormat.estado !== 'activo' && (
              <div className="bg-yellow-50 border border-yellow-100 text-warning rounded-2xl p-4 flex gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm font-semibold">
                  Este formato está inactivo. Según el backend actual, solo los formatos activos pueden visualizarse o descargarse.
                </p>
              </div>
            )}

            <form
              onSubmit={handleUpdateSubmit}
              className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
                  <Edit3 size={23} />
                </div>

                <div>
                  <h3 className="font-extrabold text-brand-950 text-lg">
                    Editar información
                  </h3>

                  <p className="text-sm text-slate-500">
                    Actualiza el título y la descripción del formato.
                  </p>
                </div>
              </div>

              <Input
                label="Título"
                name="titulo"
                value={editForm.titulo}
                onChange={handleEditChange}
                placeholder="Título del formato"
              />

              <Textarea
                label="Descripción"
                name="descripcion"
                value={editForm.descripcion}
                onChange={handleEditChange}
                placeholder="Descripción del formato"
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
                >
                  {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                  {!savingEdit && <CheckCircle2 size={18} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedFormat)}
                  disabled={processingStatusId === selectedFormat.id}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-extrabold disabled:opacity-60 transition ${
                    selectedFormat.estado === 'activo'
                      ? 'bg-red-50 border border-red-100 text-danger hover:bg-red-100'
                      : 'bg-green-50 border border-green-100 text-success hover:bg-green-100'
                  }`}
                >
                  {processingStatusId === selectedFormat.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : selectedFormat.estado === 'activo' ? (
                    <ToggleLeft size={20} />
                  ) : (
                    <ToggleRight size={20} />
                  )}

                  {selectedFormat.estado === 'activo'
                    ? 'Desactivar formato'
                    : 'Activar formato'}
                </button>
              </div>
            </form>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
                  <FileText size={23} />
                </div>

                <h3 className="font-extrabold text-brand-950 text-lg">
                  Detalle del registro
                </h3>
              </div>

              <div className="space-y-3">
                <DetailRow label="ID" value={selectedFormat.id} onCopy={copyText} />
                <DetailRow label="Archivo" value={selectedFormat.nombre_archivo} onCopy={copyText} />
                <DetailRow label="Storage path" value={selectedFormat.storage_path} onCopy={copyText} />
                <DetailRow label="Publicado por" value={getPublisherName(selectedFormat)} />
                <DetailRow label="Creado" value={formatDate(selectedFormat.created_at)} />
                <DetailRow label="Actualizado" value={formatDate(selectedFormat.updated_at)} />
              </div>
            </div>
          </div>
        </FormatModal>
      )}
    </main>
  );
}

function FormatModal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] bg-brand-950/70 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6">
      <section className="relative w-full lg:max-w-5xl max-h-[92vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl">
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

function CounterCard({ label, value, status }) {
  const statusClass = status
    ? statusStyles[status]
    : 'bg-brand-50 text-brand-900 border-brand-100';

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${statusClass}`}>
        {label}
      </span>

      <p className="text-3xl font-extrabold text-brand-950 mt-4">
        {Number(value || 0).toLocaleString('es-PE')}
      </p>

      <p className="text-sm text-slate-500 mt-1">
        Formatos
      </p>
    </div>
  );
}

function FormatItem({ format, active, onClick }) {
  const statusClass = statusStyles[format.estado] || 'bg-slate-50 text-slate-600 border-slate-100';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-5 transition ${
        active ? 'bg-brand-50' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-extrabold text-brand-950 truncate">
              {format.titulo}
            </p>

            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border ${statusClass}`}>
              {format.estado}
            </span>
          </div>

          <p className="text-sm text-slate-500 mt-2 truncate">
            {format.nombre_archivo}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            Publicado por: {getPublisherName(format)}
          </p>
        </div>

        <FileText size={20} className="text-slate-300 shrink-0 mt-1" />
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Registro: {formatDate(format.created_at)}
      </p>
    </button>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  placeholder
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </span>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
      />
    </label>
  );
}

function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </span>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 resize-none"
      />
    </label>
  );
}

function DetailRow({ label, value, onCopy }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <p className="text-sm font-bold text-slate-500">
        {label}
      </p>

      <div className="flex items-center gap-2 min-w-0">
        <p className="text-sm text-slate-900 sm:text-right font-semibold break-all">
          {value || 'No precisa'}
        </p>

        {onCopy && value && (
          <button
            type="button"
            onClick={() => onCopy(value)}
            className="text-brand-900 shrink-0"
          >
            <Copy size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function getPublisherName(format) {
  const fullName = `${format.publicado_por_nombres || ''} ${format.publicado_por_apellidos || ''}`.trim();

  if (fullName) return fullName;

  return format.publicado_por_username || 'No precisa';
}

function formatDate(value) {
  if (!value) return 'No precisa';

  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export default EnrollmentFormatsAdmin;