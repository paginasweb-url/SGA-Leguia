import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Copy,
  Eye,
  FileText,
  GraduationCap,
  Home,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  User,
  Users,
  XCircle,
  Download,
  ExternalLink
} from 'lucide-react';

import {
  getAvailableClassrooms,
  getEnrollmentRequestById,
  getEnrollmentRequestDocuments,
  getEnrollmentRequests,
  updateEnrollmentRequestStatus,
  downloadEnrollmentRequestDocument,
  viewEnrollmentRequestDocument
} from '../../services/enrollmentRequests.service';

import PageHeader from '../../components/PageHeader';

const statusStyles = {
  pendiente: 'bg-yellow-50 text-warning border-yellow-100',
  observado: 'bg-orange-50 text-warning border-orange-100',
  aprobado: 'bg-green-50 text-success border-green-100',
  rechazado: 'bg-red-50 text-danger border-red-100'
};

const statusLabels = {
  pendiente: 'Pendiente',
  observado: 'Observado',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado'
};

function EnrollmentRequestsAdmin() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [availableClassrooms, setAvailableClassrooms] = useState([]);

  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [observation, setObservation] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [processingDocumentId, setProcessingDocumentId] = useState(null);

  const handleViewDocument = async (document) => {
    if (!selectedRequest) return;

    try {
      setError('');
      setProcessingDocumentId(`view-${document.id}`);

      await viewEnrollmentRequestDocument({
        requestId: selectedRequest.id,
        documentId: document.id
      });

    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo visualizar el documento.'
      );
    } finally {
      setProcessingDocumentId(null);
    }
  };

  const handleDownloadDocument = async (document) => {
    if (!selectedRequest) return;

    try {
      setError('');
      setProcessingDocumentId(`download-${document.id}`);

      await downloadEnrollmentRequestDocument({
        requestId: selectedRequest.id,
        documentId: document.id,
        fallbackFileName: document.nombre_archivo || 'documento'
      });

    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo descargar el documento.'
      );
    } finally {
      setProcessingDocumentId(null);
    }
  };

  const loadRequests = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getEnrollmentRequests();
      setRequests(response.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar las solicitudes de matrícula.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRequestDetail = async (requestId) => {
    try {
      setError('');
      setSuccessMessage('');
      setLoadingDetail(true);
      setAvailableClassrooms([]);
      setSelectedClassroomId('');
      setObservation('');

      const [detailResponse, documentsResponse] = await Promise.all([
        getEnrollmentRequestById(requestId),
        getEnrollmentRequestDocuments(requestId)
      ]);

      const detail = detailResponse.data;
      const docs = documentsResponse.data || [];

      setSelectedRequest(detail);
      setDocuments(docs);

      if (
        detail?.estado !== 'aprobado' &&
        detail?.grado_id &&
        detail?.turno &&
        detail?.periodo_id
      ) {
        await loadClassrooms(detail);
      }
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo cargar el detalle de la solicitud.'
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadClassrooms = async (request) => {
    try {
      setLoadingClassrooms(true);

      const response = await getAvailableClassrooms({
        grado_id: request.grado_id,
        turno: request.turno,
        periodo_id: request.periodo_id
      });

      setAvailableClassrooms(response.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar las aulas disponibles.'
      );
    } finally {
      setLoadingClassrooms(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const counters = useMemo(() => {
    return requests.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.estado] = (acc[item.estado] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        pendiente: 0,
        observado: 0,
        aprobado: 0,
        rechazado: 0
      }
    );
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return requests.filter((item) => {
      const matchesStatus =
        selectedStatus === 'todos' || item.estado === selectedStatus;

      const fullName = `${item.estudiante_nombres || ''} ${item.estudiante_apellidos || ''}`.toLowerCase();

      const matchesSearch =
        !term ||
        fullName.includes(term) ||
        String(item.estudiante_dni || '').includes(term) ||
        String(item.apoderado_dni || '').includes(term) ||
        String(item.codigo_seguimiento || '').toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [requests, searchTerm, selectedStatus]);

  const handleApprove = async () => {
    if (!selectedRequest) return;

    if (!selectedClassroomId) {
      setError('Selecciona un aula disponible antes de aprobar la solicitud.');
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      setProcessingAction(true);

      const response = await updateEnrollmentRequestStatus({
        id: selectedRequest.id,
        estado: 'aprobado',
        aula_id: Number(selectedClassroomId)
      });

      setSuccessMessage('Solicitud aprobada y matrícula generada correctamente.');

      await loadRequests({ silent: true });

      if (response.data?.solicitud) {
        setSelectedRequest(response.data.solicitud);
      } else {
        await loadRequestDetail(selectedRequest.id);
      }

      setAvailableClassrooms([]);
      setSelectedClassroomId('');
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo aprobar la solicitud.'
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const handleObserveOrReject = async (estado) => {
    if (!selectedRequest) return;

    if (!observation.trim()) {
      setError(
        estado === 'observado'
          ? 'Ingresa una observación para marcar la solicitud como observada.'
          : 'Ingresa un motivo para rechazar la solicitud.'
      );
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      setProcessingAction(true);

      const response = await updateEnrollmentRequestStatus({
        id: selectedRequest.id,
        estado,
        observacion: observation.trim()
      });

      setSelectedRequest(response.data);
      setSuccessMessage(
        estado === 'observado'
          ? 'Solicitud marcada como observada.'
          : 'Solicitud rechazada correctamente.'
      );

      await loadRequests({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo actualizar el estado de la solicitud.'
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const copyText = async (text) => {
    if (!text) return;
    await navigator.clipboard.writeText(String(text));
  };

  const canManage =
    selectedRequest &&
    ['pendiente', 'observado'].includes(selectedRequest.estado);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando solicitudes de matrícula...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Gestión administrativa"
        title="Matrículas y solicitudes"
        description="Revisa solicitudes, valida documentos y asigna aula según vacantes disponibles."
      >
        <button
          type="button"
          onClick={() => loadRequests({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </PageHeader>

      {error && (
        <MessageBox
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {successMessage && (
        <MessageBox
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <CounterCard label="Total" value={counters.total} />
        <CounterCard label="Pendientes" value={counters.pendiente} status="pendiente" />
        <CounterCard label="Observadas" value={counters.observado} status="observado" />
        <CounterCard label="Aprobadas" value={counters.aprobado} status="aprobado" />
        <CounterCard label="Rechazadas" value={counters.rechazado} status="rechazado" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
          <div className="p-5 border-b border-slate-100 space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-brand-950">
                Solicitudes
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Selecciona una solicitud para revisar el detalle.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por código, DNI o estudiante"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="observado">Observadas</option>
                <option value="aprobado">Aprobadas</option>
                <option value="rechazado">Rechazadas</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[760px] overflow-y-auto">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <RequestItem
                  key={request.id}
                  request={request}
                  active={selectedRequest?.id === request.id}
                  onClick={() => loadRequestDetail(request.id)}
                />
              ))
            ) : (
              <div className="p-8 text-center">
                <ClipboardList className="mx-auto text-slate-300" size={42} />
                <p className="text-sm text-slate-500 mt-3">
                  No se encontraron solicitudes con los filtros aplicados.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-7">
          {!selectedRequest && (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center mb-4">
                <FileText size={32} />
              </div>

              <h2 className="text-xl font-extrabold text-brand-950">
                Selecciona una solicitud
              </h2>

              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Aquí se mostrará el detalle del estudiante, apoderado, documentos y acciones administrativas.
              </p>
            </div>
          )}

          {loadingDetail && (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-8 text-center">
              <Loader2 className="mx-auto animate-spin text-brand-900" size={34} />
              <p className="text-sm font-semibold text-slate-500 mt-4">
                Cargando detalle de la solicitud...
              </p>
            </div>
          )}

          {selectedRequest && !loadingDetail && (
            <div className="space-y-5">
              <DetailHeader
                request={selectedRequest}
                onCopy={copyText}
              />

              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  icon={User}
                  title="Estudiante"
                  items={[
                    ['DNI', selectedRequest.estudiante_dni],
                    ['Nombres', selectedRequest.estudiante_nombres],
                    ['Apellidos', selectedRequest.estudiante_apellidos],
                    ['Fecha de nacimiento', formatDate(selectedRequest.estudiante_fecha_nacimiento)],
                    ['Dirección', selectedRequest.estudiante_direccion]
                  ]}
                />

                <InfoCard
                  icon={Users}
                  title="Apoderado"
                  items={[
                    ['DNI', selectedRequest.apoderado_dni],
                    ['Nombres', selectedRequest.apoderado_nombres],
                    ['Apellidos', selectedRequest.apoderado_apellidos],
                    ['Teléfono', selectedRequest.apoderado_telefono],
                    ['Parentesco', selectedRequest.parentesco],
                    ['Dirección', selectedRequest.apoderado_direccion]
                  ]}
                />
              </div>

              <InfoCard
                icon={GraduationCap}
                title="Datos académicos"
                items={[
                  ['Grado solicitado', selectedRequest.grado],
                  ['Turno solicitado', selectedRequest.turno],
                  ['Periodo académico', selectedRequest.periodo],
                  [
                    'Sección asignada',
                    selectedRequest.seccion_asignada ||
                    selectedRequest.seccion ||
                    'Pendiente de asignación'
                  ],
                  [
                    'Aula asignada',
                    selectedRequest.aula_asignada_id
                      ? `Aula ID ${selectedRequest.aula_asignada_id}`
                      : selectedRequest.aula_id_asignada
                        ? `Aula ID ${selectedRequest.aula_id_asignada}`
                        : 'Pendiente'
                  ],
                  ['Fecha de registro', formatDate(selectedRequest.created_at)]
                ]}
              />

              {selectedRequest.observacion && (
                <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
                  <div className="flex gap-3">
                    <AlertCircle className="text-warning shrink-0 mt-0.5" size={22} />
                    <div>
                      <h3 className="font-extrabold text-brand-950">
                        Observación administrativa
                      </h3>
                      <p className="text-sm text-slate-600 mt-2">
                        {selectedRequest.observacion}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <DocumentsPanel
                documents={documents}
                onView={handleViewDocument}
                onDownload={handleDownloadDocument}
                processingDocumentId={processingDocumentId}
              />

              {selectedRequest.credenciales_generadas && (
                <CredentialsPanel
                  credentials={selectedRequest.credenciales_generadas}
                  onCopy={copyText}
                />
              )}

              {canManage && (
                <AdminActionsPanel
                  request={selectedRequest}
                  classrooms={availableClassrooms}
                  selectedClassroomId={selectedClassroomId}
                  setSelectedClassroomId={setSelectedClassroomId}
                  observation={observation}
                  setObservation={setObservation}
                  loadingClassrooms={loadingClassrooms}
                  processingAction={processingAction}
                  onApprove={handleApprove}
                  onObserve={() => handleObserveOrReject('observado')}
                  onReject={() => handleObserveOrReject('rechazado')}
                />
              )}
            </div>
          )}
        </div>
      </section>
    </main>
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
        Solicitudes
      </p>
    </div>
  );
}

function RequestItem({ request, active, onClick }) {
  const fullName = `${request.estudiante_nombres || ''} ${request.estudiante_apellidos || ''}`.trim();
  const statusClass = statusStyles[request.estado] || 'bg-slate-50 text-slate-600 border-slate-100';

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
              {request.codigo_seguimiento || `Solicitud #${request.id}`}
            </p>

            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border ${statusClass}`}>
              {statusLabels[request.estado] || request.estado}
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-700 mt-2">
            {fullName || 'Estudiante sin nombre'}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            DNI: {request.estudiante_dni || 'No precisa'}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {request.grado || 'Grado no definido'} · {request.turno || 'Turno no definido'} · {request.periodo || 'Periodo no definido'}
          </p>
        </div>

        <ArrowRight size={18} className="text-slate-300 shrink-0 mt-1" />
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Registro: {formatDate(request.created_at)}
      </p>
    </button>
  );
}

function DetailHeader({ request, onCopy }) {
  const statusClass = statusStyles[request.estado] || 'bg-slate-50 text-slate-600 border-slate-100';
  const fullName = `${request.estudiante_nombres || ''} ${request.estudiante_apellidos || ''}`.trim();

  return (
    <div className="bg-brand-950 text-white rounded-3xl shadow-soft p-6 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold-500/20 blur-3xl" />

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border bg-white/10 text-white border-white/20`}>
            {statusLabels[request.estado] || request.estado}
          </span>

          <h2 className="text-2xl font-extrabold mt-4">
            {fullName || 'Solicitud de matrícula'}
          </h2>

          <p className="text-sm text-blue-100 mt-2">
            {request.grado || 'Grado no definido'} · {request.turno || 'Turno no definido'} · {request.periodo || 'Periodo no definido'}
          </p>
        </div>

        <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-blue-100 font-bold">
            Código de seguimiento
          </p>

          <div className="flex items-center gap-2 mt-1">
            <p className="font-extrabold">
              {request.codigo_seguimiento || `Solicitud #${request.id}`}
            </p>

            {request.codigo_seguimiento && (
              <button
                type="button"
                onClick={() => onCopy(request.codigo_seguimiento)}
                className="text-gold-500"
              >
                <Copy size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, items }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
          <Icon size={23} />
        </div>

        <h3 className="font-extrabold text-brand-950 text-lg">
          {title}
        </h3>
      </div>

      <div className="space-y-3">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
          >
            <p className="text-sm font-bold text-slate-500">
              {label}
            </p>

            <p className="text-sm text-slate-900 sm:text-right font-semibold">
              {value || 'No precisa'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

  function DocumentsPanel({
    documents,
    onView,
    onDownload,
    processingDocumentId
  }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
          <FileText size={23} />
        </div>

        <div>
          <h3 className="font-extrabold text-brand-950 text-lg">
            Documentos adjuntos
          </h3>

          <p className="text-sm text-slate-500">
            Documentos enviados por el apoderado.
          </p>
        </div>
      </div>

      {documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-extrabold text-brand-950">
                  {doc.tipo_documento}
                </p>

                <p className="text-sm text-slate-500 mt-1 truncate">
                  {doc.nombre_archivo || 'Archivo registrado'}
                </p>

                {doc.observacion && (
                  <p className="text-xs text-warning font-semibold mt-1">
                    {doc.observacion}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-extrabold bg-white border border-slate-200 text-slate-600">
                  {doc.estado || 'pendiente'}
                </span>

                <button
                  type="button"
                  onClick={() => onView(doc)}
                  disabled={processingDocumentId === `view-${doc.id}`}
                  className="inline-flex items-center justify-center gap-2 bg-brand-50 text-brand-900 px-3 py-2 rounded-xl text-xs font-extrabold hover:bg-brand-100 disabled:opacity-60 transition"
                >
                  {processingDocumentId === `view-${doc.id}` ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ExternalLink size={15} />
                  )}
                  Ver
                </button>

                <button
                  type="button"
                  onClick={() => onDownload(doc)}
                  disabled={processingDocumentId === `download-${doc.id}`}
                  className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-extrabold hover:bg-slate-100 disabled:opacity-60 transition"
                >
                  {processingDocumentId === `download-${doc.id}` ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Download size={15} />
                  )}
                  Descargar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
          <p className="text-sm text-slate-500">
            No hay documentos adjuntos para esta solicitud.
          </p>
        </div>
      )}
    </div>
  );
}

function CredentialsPanel({ credentials, onCopy }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-green-50 text-success flex items-center justify-center">
          <KeyRound size={23} />
        </div>

        <div>
          <h3 className="font-extrabold text-brand-950 text-lg">
            Credenciales generadas
          </h3>

          <p className="text-sm text-slate-500">
            Credenciales iniciales creadas al aprobar la solicitud.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <CredentialBox title="Estudiante" data={credentials.estudiante} onCopy={onCopy} />
        <CredentialBox title="Apoderado" data={credentials.apoderado} onCopy={onCopy} />
      </div>
    </div>
  );
}

function CredentialBox({ title, data, onCopy }) {
  if (!data) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <p className="font-extrabold text-brand-950">
          {title}
        </p>

        <p className="text-sm text-slate-500 mt-2">
          No se generaron credenciales.
        </p>
      </div>
    );
  }

  const rows = [
    ['Usuario', data.username],
    ['Correo', data.correo],
    ['Contraseña inicial', data.password_inicial]
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <p className="font-extrabold text-brand-950 mb-3">
        {title}
      </p>

      <div className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-slate-500 font-bold">
              {label}
            </p>

            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {value || 'No precisa'}
              </p>

              {value && (
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
        ))}
      </div>
    </div>
  );
}

function AdminActionsPanel({
  request,
  classrooms,
  selectedClassroomId,
  setSelectedClassroomId,
  observation,
  setObservation,
  loadingClassrooms,
  processingAction,
  onApprove,
  onObserve,
  onReject
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
          <ClipboardList size={23} />
        </div>

        <div>
          <h3 className="font-extrabold text-brand-950 text-lg">
            Acciones administrativas
          </h3>

          <p className="text-sm text-slate-500">
            Observa, rechaza o aprueba asignando un aula disponible.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Observación administrativa
          </label>

          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={4}
            placeholder="Escribe una observación o motivo de rechazo..."
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onObserve}
            disabled={processingAction}
            className="inline-flex items-center justify-center gap-2 bg-yellow-50 border border-yellow-100 text-warning px-5 py-3 rounded-xl font-extrabold hover:bg-yellow-100 disabled:opacity-60 transition"
          >
            <Eye size={18} />
            Observar
          </button>

          <button
            type="button"
            onClick={onReject}
            disabled={processingAction}
            className="inline-flex items-center justify-center gap-2 bg-red-50 border border-red-100 text-danger px-5 py-3 rounded-xl font-extrabold hover:bg-red-100 disabled:opacity-60 transition"
          >
            <XCircle size={18} />
            Rechazar
          </button>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-green-50 text-success flex items-center justify-center">
              <Home size={21} />
            </div>

            <div>
              <h4 className="font-extrabold text-brand-950">
                Aprobar con aula asignada
              </h4>

              <p className="text-sm text-slate-500">
                Aulas disponibles para {request.grado} - {request.turno}.
              </p>
            </div>
          </div>

          {loadingClassrooms ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-3">
              <Loader2 className="animate-spin text-brand-900" size={22} />
              <p className="text-sm font-semibold text-slate-500">
                Cargando aulas disponibles...
              </p>
            </div>
          ) : classrooms.length > 0 ? (
            <div className="space-y-3">
              {classrooms.map((classroom) => {
                const disabled = Number(classroom.vacantes || 0) <= 0;
                const active = String(selectedClassroomId) === String(classroom.aula_id);

                return (
                  <button
                    key={classroom.aula_id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedClassroomId(String(classroom.aula_id))}
                    className={`w-full text-left border rounded-2xl p-4 transition ${
                      active
                        ? 'border-success bg-green-50 ring-2 ring-green-100'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                    } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="font-extrabold text-brand-950">
                          {classroom.grado} - Sección {classroom.seccion} - {classroom.turno}
                        </p>

                        <p className="text-sm text-slate-500 mt-1">
                          Aula ID {classroom.aula_id}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge label={`${classroom.matriculados}/${classroom.capacidad} matriculados`} />
                        <Badge
                          label={`${classroom.vacantes} vacantes`}
                          variant={disabled ? 'danger' : 'success'}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={onApprove}
                disabled={processingAction || !selectedClassroomId}
                className="w-full inline-flex items-center justify-center gap-2 bg-success text-white px-5 py-3 rounded-xl font-extrabold hover:opacity-90 disabled:opacity-60 transition"
              >
                {processingAction ? 'Procesando...' : 'Aprobar y generar matrícula'}
                {!processingAction && <CheckCircle2 size={18} />}
              </button>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-danger">
              <p className="text-sm font-semibold">
                No hay aulas disponibles para el grado, turno y periodo de esta solicitud.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ label, variant }) {
  const className =
    variant === 'success'
      ? 'bg-green-50 text-success border-green-100'
      : variant === 'danger'
        ? 'bg-red-50 text-danger border-red-100'
        : 'bg-white text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${className}`}>
      {label}
    </span>
  );
}

function MessageBox({ type, message, onClose }) {
  const success = type === 'success';

  return (
    <div className={`${success ? 'bg-green-50 border-green-100 text-success' : 'bg-red-50 border-red-100 text-danger'} border rounded-2xl p-4 flex items-start justify-between gap-3`}>
      <div className="flex gap-3">
        {success ? (
          <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
        ) : (
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
        )}

        <p className="text-sm font-semibold">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="font-extrabold"
      >
        ×
      </button>
    </div>
  );
}

function formatDate(value) {
  if (!value) return 'No precisa';

  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export default EnrollmentRequestsAdmin;