import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  History,
  KeyRound,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  User,
  X
} from 'lucide-react';

import {
  approvePasswordRecoveryRequest,
  getAccessHistory,
  getPasswordRecoveryRequestById,
  getPasswordRecoveryRequests,
  manualPasswordReset,
  rejectPasswordRecoveryRequest
} from '../../services/security.service';

import PageHeader from '../../components/PageHeader';
import { getRoles } from '../../services/roles.service';  

const recoveryStatusStyles = {
  pendiente: 'bg-yellow-50 text-warning border-yellow-100',
  aprobada: 'bg-green-50 text-success border-green-100',
  rechazada: 'bg-red-50 text-danger border-red-100'
};

const accessStatusStyles = {
  exitoso: 'bg-green-50 text-success border-green-100',
  fallido: 'bg-red-50 text-danger border-red-100'
};

function SecurityAdmin() {
  const [activeTab, setActiveTab] = useState('recovery');

  const [recoveryRequests, setRecoveryRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [accessHistory, setAccessHistory] = useState([]);
  const [accessSummary, setAccessSummary] = useState({
    total: 0,
    exitoso: 0,
    fallido: 0
  });

  const [recoveryFilters, setRecoveryFilters] = useState({
    estado: 'todos',
    tipo: 'todos',
    usuario: ''
  });

  const [accessFilters, setAccessFilters] = useState({
    resultado: 'todos',
    rol: '',
    usuario: ''
  });

  const [observation, setObservation] = useState('');
  const [temporaryPasswordResult, setTemporaryPasswordResult] = useState(null);

  const [loadingRecovery, setLoadingRecovery] = useState(true);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [roles, setRoles] = useState([]);

  const loadRecoveryRequests = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoadingRecovery(true);
      }

      const response = await getPasswordRecoveryRequests({
        estado: recoveryFilters.estado === 'todos' ? undefined : recoveryFilters.estado,
        tipo: recoveryFilters.tipo === 'todos' ? undefined : recoveryFilters.tipo,
        usuario: recoveryFilters.usuario,
        page: 1,
        limit: 50
      });

      setRecoveryRequests(response.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar las solicitudes de recuperación.'
      );
    } finally {
      setLoadingRecovery(false);
      setRefreshing(false);
    }
  };

  const getTotalFromAccessResponse = (response) => {
    return Number(
      response?.pagination?.total ??
      response?.total ??
      response?.data?.length ??
      0
    );
  };

  const loadRoles = async () => {
    try {
      const response = await getRoles();
      setRoles(response.data || []);
    } catch (error) {
      console.error('No se pudieron cargar los roles:', error);
    }
  };

  const loadAccessHistory = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoadingAccess(true);
      }

      const baseFilters = {
        rol: accessFilters.rol || undefined,
        usuario: accessFilters.usuario || undefined
      };

      const tableRequest = getAccessHistory({
        ...baseFilters,
        resultado: accessFilters.resultado === 'todos'
          ? undefined
          : accessFilters.resultado,
        page: 1,
        limit: 50
      });

      const totalRequest = getAccessHistory({
        ...baseFilters,
        page: 1,
        limit: 1
      });

      const successRequest = getAccessHistory({
        ...baseFilters,
        resultado: 'exitoso',
        page: 1,
        limit: 1
      });

      const failedRequest = getAccessHistory({
        ...baseFilters,
        resultado: 'fallido',
        page: 1,
        limit: 1
      });

      const [
        tableResponse,
        totalResponse,
        successResponse,
        failedResponse
      ] = await Promise.all([
        tableRequest,
        totalRequest,
        successRequest,
        failedRequest
      ]);

      setAccessHistory(tableResponse.data || []);

      setAccessSummary({
        total: getTotalFromAccessResponse(totalResponse),
        exitoso: getTotalFromAccessResponse(successResponse),
        fallido: getTotalFromAccessResponse(failedResponse)
      });

    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo cargar el historial de accesos.'
      );
    } finally {
      setLoadingAccess(false);
      setRefreshing(false);
    }
  };

  const loadRecoveryDetail = async (id) => {
    try {
      setError('');
      setSuccessMessage('');
      setTemporaryPasswordResult(null);
      setObservation('');
      setLoadingDetail(true);

      const response = await getPasswordRecoveryRequestById(id);
      setSelectedRequest(response.data);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo cargar el detalle de la solicitud.'
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadRecoveryRequests();
  }, [recoveryFilters.estado, recoveryFilters.tipo]);

  useEffect(() => {
    loadAccessHistory();
  }, [accessFilters.resultado]);

  useEffect(() => {
    loadRoles();
  }, []);

  const recoveryCounters = useMemo(() => {
    return recoveryRequests.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.estado] = (acc[item.estado] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        pendiente: 0,
        aprobada: 0,
        rechazada: 0
      }
    );
  }, [recoveryRequests]);

  const handleRecoverySearch = async (e) => {
    e.preventDefault();
    await loadRecoveryRequests({ silent: true });
  };

  const handleAccessSearch = async (e) => {
    e.preventDefault();
    await loadAccessHistory({ silent: true });
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setError('');
      setSuccessMessage('');
      setTemporaryPasswordResult(null);
      setProcessingAction(true);

      const response = await approvePasswordRecoveryRequest({
        id: selectedRequest.id,
        observacion: observation.trim() || undefined
      });

      setTemporaryPasswordResult({
        temporary_password: response.temporary_password,
        user: response.user
      });

      setSuccessMessage(response.message || 'Solicitud aprobada correctamente.');

      await loadRecoveryRequests({ silent: true });
      await loadRecoveryDetail(selectedRequest.id);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo aprobar la solicitud.'
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!observation.trim()) {
      setError('Ingresa una observación o motivo para rechazar la solicitud.');
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      setTemporaryPasswordResult(null);
      setProcessingAction(true);

      const response = await rejectPasswordRecoveryRequest({
        id: selectedRequest.id,
        observacion: observation.trim()
      });

      setSuccessMessage(response.message || 'Solicitud rechazada correctamente.');

      await loadRecoveryRequests({ silent: true });
      await loadRecoveryDetail(selectedRequest.id);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo rechazar la solicitud.'
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const handleManualReset = async () => {
    if (!selectedRequest?.user_id) {
      setError('La solicitud no tiene un usuario asociado para restablecer contraseña.');
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      setTemporaryPasswordResult(null);
      setProcessingAction(true);

      const response = await manualPasswordReset({
        userId: selectedRequest.user_id,
        observacion: observation.trim() || undefined
      });

      setTemporaryPasswordResult({
        temporary_password: response.temporary_password,
        user: response.user
      });

      setSuccessMessage(response.message || 'Contraseña restablecida correctamente.');

      await loadRecoveryRequests({ silent: true });
      await loadRecoveryDetail(selectedRequest.id);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo restablecer la contraseña.'
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const copyText = async (text) => {
    if (!text) return;
    await navigator.clipboard.writeText(String(text));
  };

  const canManageRecovery = selectedRequest?.estado === 'pendiente';

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Seguridad institucional"
        title="Seguridad y accesos"
        description="Gestiona solicitudes de recuperación de contraseña y revisa el historial de autenticación."
      >
        <button
          type="button"
          onClick={() =>
            activeTab === 'recovery'
              ? loadRecoveryRequests({ silent: true })
              : loadAccessHistory({ silent: true })
          }
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </PageHeader>

      {error && (
        <MessageBox type="error" message={error} onClose={() => setError('')} />
      )}

      {successMessage && (
        <MessageBox type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
      )}

      {temporaryPasswordResult && (
        <TemporaryPasswordBox
          result={temporaryPasswordResult}
          onCopy={copyText}
        />
      )}

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-2 flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('recovery')}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-extrabold transition ${
            activeTab === 'recovery'
              ? 'bg-brand-900 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <KeyRound size={18} />
          Recuperación de contraseña
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('access')}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-extrabold transition ${
            activeTab === 'access'
              ? 'bg-brand-900 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <History size={18} />
          Historial de accesos
        </button>
      </section>

      {activeTab === 'recovery' && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <CounterCard label="Total" value={recoveryCounters.total} />
            <CounterCard label="Pendientes" value={recoveryCounters.pendiente} status="pendiente" />
            <CounterCard label="Aprobadas" value={recoveryCounters.aprobada} status="aprobada" />
            <CounterCard label="Rechazadas" value={recoveryCounters.rechazada} status="rechazada" />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-5 bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
              <div className="p-5 border-b border-slate-100 space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-brand-950">
                    Solicitudes registradas
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Solicitudes creadas desde el formulario público.
                  </p>
                </div>

                <form onSubmit={handleRecoverySearch} className="space-y-3">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    <input
                      value={recoveryFilters.usuario}
                      onChange={(e) =>
                        setRecoveryFilters((prev) => ({
                          ...prev,
                          usuario: e.target.value
                        }))
                      }
                      placeholder="Buscar por usuario ingresado"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <select
                      value={recoveryFilters.estado}
                      onChange={(e) =>
                        setRecoveryFilters((prev) => ({
                          ...prev,
                          estado: e.target.value
                        }))
                      }
                      className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
                    >
                      <option value="todos">Todos</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="aprobada">Aprobadas</option>
                      <option value="rechazada">Rechazadas</option>
                    </select>

                    <select
                      value={recoveryFilters.tipo}
                      onChange={(e) =>
                        setRecoveryFilters((prev) => ({
                          ...prev,
                          tipo: e.target.value
                        }))
                      }
                      className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
                    >
                      <option value="todos">Todos los tipos</option>
                      <option value="estudiante">Estudiante</option>
                      <option value="apoderado">Apoderado</option>
                      <option value="manual">Manual</option>
                    </select>

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-brand-800 transition"
                    >
                      Buscar
                    </button>
                  </div>
                </form>
              </div>

              <div className="divide-y divide-slate-100 max-h-[760px] overflow-y-auto">
                {loadingRecovery ? (
                  <LoadingBlock text="Cargando solicitudes..." />
                ) : recoveryRequests.length > 0 ? (
                  recoveryRequests.map((item) => (
                    <RecoveryRequestItem
                      key={item.id}
                      item={item}
                      active={selectedRequest?.id === item.id}
                      onClick={() => loadRecoveryDetail(item.id)}
                    />
                  ))
                ) : (
                  <EmptyBlock text="No se encontraron solicitudes de recuperación." />
                )}
              </div>
            </div>

            <div className="xl:col-span-7">
              {!selectedRequest && (
                <EmptyDetail
                  icon={KeyRound}
                  title="Selecciona una solicitud"
                  text="Aquí se mostrará el detalle de validación y acciones administrativas."
                />
              )}

              {loadingDetail && (
                <LoadingCard text="Cargando detalle de la solicitud..." />
              )}

              {selectedRequest && !loadingDetail && (
                <div className="space-y-5">
                  <RecoveryDetailHeader request={selectedRequest} />

                  <div className="grid md:grid-cols-2 gap-5">
                    <InfoCard
                      icon={User}
                      title="Usuario asociado"
                      items={[
                        ['Usuario ingresado', selectedRequest.usuario_ingresado],
                        ['DNI ingresado', selectedRequest.dni_ingresado],
                        ['Usuario encontrado', selectedRequest.username],
                        ['Correo', selectedRequest.correo],
                        ['Rol', selectedRequest.rol],
                        ['Estado de usuario', selectedRequest.user_estado]
                      ]}
                    />

                    <InfoCard
                      icon={ShieldCheck}
                      title="Validación y registro"
                      items={[
                        ['Tipo solicitante', selectedRequest.tipo_solicitante],
                        ['DNI validación secundaria', selectedRequest.estudiante_dni_validacion],
                        ['IP', selectedRequest.ip],
                        ['Fecha solicitud', formatDateTime(selectedRequest.created_at)],
                        ['Fecha revisión', formatDateTime(selectedRequest.reviewed_at)],
                        ['Fecha reset', formatDateTime(selectedRequest.password_reset_at)]
                      ]}
                    />
                  </div>

                  {selectedRequest.user_agent && (
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
                      <h3 className="font-extrabold text-brand-950 text-lg">
                        Navegador / dispositivo
                      </h3>

                      <p className="text-sm text-slate-600 mt-2 break-all">
                        {selectedRequest.user_agent}
                      </p>
                    </div>
                  )}

                  {selectedRequest.observacion_admin && (
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
                      <div className="flex gap-3">
                        <AlertCircle className="text-warning shrink-0 mt-0.5" size={22} />

                        <div>
                          <h3 className="font-extrabold text-brand-950">
                            Observación administrativa
                          </h3>

                          <p className="text-sm text-slate-600 mt-2">
                            {selectedRequest.observacion_admin}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
                        <LockKeyhole size={23} />
                      </div>

                      <div>
                        <h3 className="font-extrabold text-brand-950 text-lg">
                          Acciones administrativas
                        </h3>

                        <p className="text-sm text-slate-500">
                          Aprueba, rechaza o realiza un restablecimiento manual.
                        </p>
                      </div>
                    </div>

                    <textarea
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      rows={4}
                      placeholder="Escribe una observación administrativa..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 resize-none"
                    />

                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={!canManageRecovery || processingAction}
                        className="inline-flex items-center justify-center gap-2 bg-success text-white px-5 py-3 rounded-xl font-extrabold hover:opacity-90 disabled:opacity-50 transition"
                      >
                        <CheckCircle2 size={18} />
                        Aprobar y generar temporal
                      </button>

                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={!canManageRecovery || processingAction}
                        className="inline-flex items-center justify-center gap-2 bg-red-50 border border-red-100 text-danger px-5 py-3 rounded-xl font-extrabold hover:bg-red-100 disabled:opacity-50 transition"
                      >
                        <ShieldX size={18} />
                        Rechazar
                      </button>

                      <button
                        type="button"
                        onClick={handleManualReset}
                        disabled={!selectedRequest.user_id || processingAction}
                        className="inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-brand-800 disabled:opacity-50 transition"
                      >
                        <KeyRound size={18} />
                        Reset manual
                      </button>
                    </div>

                    {selectedRequest.estado !== 'pendiente' && (
                      <p className="text-xs text-slate-500 mt-3">
                        Las solicitudes atendidas no pueden aprobarse o rechazarse nuevamente. Puedes usar reset manual si el usuario existe.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === 'access' && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AccessCounterCard label="Total" value={accessSummary.total} />
            <AccessCounterCard label="Exitosos" value={accessSummary.exitoso} status="exitoso" />
            <AccessCounterCard label="Fallidos" value={accessSummary.fallido} status="fallido" />
          </section>

          <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
            <div className="p-5 border-b border-slate-100 space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-brand-950">
                  Historial de accesos
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Registros de intentos de inicio de sesión exitosos y fallidos.
                </p>
              </div>

              <form onSubmit={handleAccessSearch} className="grid md:grid-cols-4 gap-3">
                <div className="relative md:col-span-2">
                  <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />

                  <input
                    value={accessFilters.usuario}
                    onChange={(e) =>
                      setAccessFilters((prev) => ({
                        ...prev,
                        usuario: e.target.value
                      }))
                    }
                    placeholder="Buscar usuario ingresado"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
                  />
                </div>

                <select
                  value={accessFilters.rol}
                  onChange={(e) =>
                    setAccessFilters({
                      ...accessFilters,
                      rol: e.target.value
                    })
                  }
                  className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
                >
                  <option value="">Todos los roles</option>

                  {roles.map((role) => (
                    <option key={role.id} value={role.nombre}>
                      {role.nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={accessFilters.resultado}
                  onChange={(e) =>
                    setAccessFilters((prev) => ({
                      ...prev,
                      resultado: e.target.value
                    }))
                  }
                  className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
                >
                  <option value="todos">Todos</option>
                  <option value="exitoso">Exitosos</option>
                  <option value="fallido">Fallidos</option>
                </select>

                <button
                  type="submit"
                  className="md:col-span-4 inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-brand-800 transition"
                >
                  Buscar historial
                </button>
              </form>
            </div>

            {loadingAccess ? (
              <LoadingBlock text="Cargando historial..." />
            ) : accessHistory.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {accessHistory.map((item) => (
                  <AccessHistoryItem key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyBlock text="No se encontraron registros de acceso." />
            )}
          </section>
        </>
      )}
    </main>
  );
}

function TemporaryPasswordBox({ result, onCopy }) {
  return (
    <div className="bg-brand-950 text-white rounded-3xl shadow-soft p-6 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold-500/20 blur-3xl" />

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h2 className="text-xl font-extrabold">
            Contraseña temporal generada
          </h2>

          <p className="text-sm text-blue-100 mt-2">
            Entrégala al usuario de forma segura. Al iniciar sesión deberá cambiarla.
          </p>

          <p className="text-sm text-blue-100 mt-2">
            Usuario: <span className="font-extrabold">{result.user?.username || result.user?.correo || 'No precisa'}</span>
          </p>
        </div>

        <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-blue-100 font-bold">
            Contraseña temporal
          </p>

          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-extrabold text-gold-500">
              {result.temporary_password}
            </p>

            <button
              type="button"
              onClick={() => onCopy(result.temporary_password)}
              className="text-gold-500"
            >
              <Copy size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecoveryRequestItem({ item, active, onClick }) {
  const statusClass = recoveryStatusStyles[item.estado] || 'bg-slate-50 text-slate-600 border-slate-100';
  const fullName = `${item.nombres || ''} ${item.apellidos || ''}`.trim();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-5 transition ${active ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-extrabold text-brand-950 truncate">
              {item.usuario_ingresado}
            </p>

            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border ${statusClass}`}>
              {item.estado}
            </span>
          </div>

          <p className="text-sm text-slate-600 mt-2">
            {fullName || 'Usuario asociado no visible'}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Tipo: {item.tipo_solicitante} · Rol: {item.rol || 'No precisa'}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            Registro: {formatDateTime(item.created_at)}
          </p>
        </div>

        <Eye size={18} className="text-slate-300 shrink-0" />
      </div>
    </button>
  );
}

function RecoveryDetailHeader({ request }) {
  const statusClass = recoveryStatusStyles[request.estado] || 'bg-slate-50 text-slate-600 border-slate-100';

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border ${statusClass}`}>
            {request.estado}
          </span>

          <h2 className="text-2xl font-extrabold text-brand-950 mt-4">
            {request.usuario_ingresado}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Solicitud #{request.id} · {request.tipo_solicitante}
          </p>
        </div>

        <div className="bg-brand-50 rounded-2xl px-4 py-3">
          <p className="text-xs font-bold text-brand-900">
            Fecha de solicitud
          </p>

          <p className="font-extrabold text-brand-950 mt-1">
            {formatDateTime(request.created_at)}
          </p>
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

            <p className="text-sm text-slate-900 sm:text-right font-semibold break-all">
              {value || 'No precisa'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccessHistoryItem({ item }) {
  const statusClass = accessStatusStyles[item.resultado] || 'bg-slate-50 text-slate-600 border-slate-100';

  return (
    <div className="p-5 hover:bg-slate-50 transition">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-extrabold text-brand-950">
              {item.usuario_ingresado}
            </p>

            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border ${statusClass}`}>
              {item.resultado}
            </span>
          </div>

          <p className="text-sm text-slate-600 mt-2">
            Motivo: {item.motivo || 'No precisa'}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Rol: {item.rol || 'No precisa'} · IP: {item.ip || 'No precisa'}
          </p>

          {item.user_agent && (
            <p className="text-xs text-slate-400 mt-2 break-all">
              {item.user_agent}
            </p>
          )}
        </div>

        <p className="text-sm font-semibold text-slate-500">
          {formatDateTime(item.created_at)}
        </p>
      </div>
    </div>
  );
}

function CounterCard({ label, value, status }) {
  const statusClass = status
    ? recoveryStatusStyles[status]
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

function AccessCounterCard({ label, value, status }) {
  const statusClass = status
    ? accessStatusStyles[status]
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
        Accesos
      </p>
    </div>
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

      <button type="button" onClick={onClose} className="font-extrabold">
        <X size={18} />
      </button>
    </div>
  );
}

function LoadingBlock({ text }) {
  return (
    <div className="p-8 text-center">
      <Loader2 className="mx-auto animate-spin text-brand-900" size={32} />
      <p className="text-sm font-semibold text-slate-500 mt-4">
        {text}
      </p>
    </div>
  );
}

function LoadingCard({ text }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-8 text-center">
      <Loader2 className="mx-auto animate-spin text-brand-900" size={32} />
      <p className="text-sm font-semibold text-slate-500 mt-4">
        {text}
      </p>
    </div>
  );
}

function EmptyBlock({ text }) {
  return (
    <div className="p-8 text-center">
      <Clock className="mx-auto text-slate-300" size={42} />
      <p className="text-sm text-slate-500 mt-3">
        {text}
      </p>
    </div>
  );
}

function EmptyDetail({ icon: Icon, title, text }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-8 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center mb-4">
        <Icon size={32} />
      </div>

      <h2 className="text-xl font-extrabold text-brand-950">
        {title}
      </h2>

      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
        {text}
      </p>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return 'No precisa';

  return new Date(value).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default SecurityAdmin;