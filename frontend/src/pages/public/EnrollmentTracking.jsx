import { useState } from 'react';
import {
  Search,
  FileSearch,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  FileText,
  User,
  Users,
  GraduationCap,
  CalendarDays,
  ClipboardList,
  KeyRound,
  Copy,
  Info
} from 'lucide-react';

import { trackEnrollmentRequest } from '../../services/enrollmentRequests.service';

const statusConfig = {
  pendiente: {
    label: 'Pendiente',
    icon: Clock,
    className: 'bg-yellow-50 text-warning border-yellow-100',
    description: 'La solicitud fue registrada y está esperando revisión administrativa.'
  },
  observado: {
    label: 'Observado',
    icon: Eye,
    className: 'bg-orange-50 text-warning border-orange-100',
    description: 'La solicitud requiere corrección o revisión de información.'
  },
  aprobado: {
    label: 'Aprobado',
    icon: CheckCircle2,
    className: 'bg-green-50 text-success border-green-100',
    description: 'La solicitud fue aprobada y la matrícula fue generada.'
  },
  rechazado: {
    label: 'Rechazado',
    icon: XCircle,
    className: 'bg-red-50 text-danger border-red-100',
    description: 'La solicitud fue rechazada por el área administrativa.'
  }
};

function EnrollmentTracking() {
  const [form, setForm] = useState({
    codigo_seguimiento: '',
    estudiante_dni: '',
    apoderado_dni: ''
  });

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setRequest(null);
      setLoading(true);

      const response = await trackEnrollmentRequest(form);
      setRequest(response.data);

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo consultar la solicitud.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text) => {
    if (!text) return;
    await navigator.clipboard.writeText(String(text));
  };

  const formatDate = (value) => {
    if (!value) return 'No precisa';

    return new Date(value).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const currentStatus = statusConfig[request?.estado] || statusConfig.pendiente;
  const StatusIcon = currentStatus.icon;

  const credentials = request?.credenciales_generadas;

  return (
    <main className="bg-[#F7F9FB]">
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white relative overflow-hidden">
        <div className="absolute -top-28 -right-24 w-96 h-96 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-28 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-14 lg:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-5">
              <FileSearch size={16} />
              Seguimiento de trámite
            </span>

            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              Consulta tu solicitud de matrícula
            </h1>

            <p className="mt-5 text-blue-100 text-lg leading-relaxed">
              Ingresa el código de seguimiento y los DNI registrados para revisar el estado actualizado de tu solicitud.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
        <div className="grid lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center mb-5">
                <Search size={25} />
              </div>

              <h2 className="font-extrabold text-brand-950 text-xl">
                Datos para consultar
              </h2>

              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Usa el código generado al registrar la solicitud. También se validará el DNI del estudiante y apoderado.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Input
                  label="Código de seguimiento"
                  name="codigo_seguimiento"
                  value={form.codigo_seguimiento}
                  onChange={handleChange}
                  placeholder="SOL-2026-000005"
                />

                <Input
                  label="DNI del estudiante"
                  name="estudiante_dni"
                  value={form.estudiante_dni}
                  onChange={handleChange}
                  placeholder="12341234"
                  maxLength={8}
                />

                <Input
                  label="DNI del apoderado"
                  name="apoderado_dni"
                  value={form.apoderado_dni}
                  onChange={handleChange}
                  placeholder="43214321"
                  maxLength={8}
                />

                {error && (
                  <div className="bg-red-50 border border-red-100 text-danger rounded-2xl p-3 flex gap-2">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
                >
                  {loading ? 'Consultando...' : 'Consultar estado'}
                  {!loading && <Search size={18} />}
                </button>
              </form>
            </div>

            <div className="bg-gold-50 border border-gold-100 rounded-3xl p-6">
              <div className="flex gap-3">
                <Info className="text-gold-600 shrink-0 mt-0.5" size={22} />
                <div>
                  <h3 className="font-extrabold text-brand-950">
                    Importante
                  </h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Si tu solicitud fue observada, revisa la observación administrativa y comunícate con el colegio para regularizarla.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-2 space-y-5">
            {!request && (
              <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center mb-4">
                  <ClipboardList size={32} />
                </div>

                <h2 className="text-xl font-extrabold text-brand-950">
                  Esperando consulta
                </h2>

                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  Ingresa los datos solicitados para ver el estado, documentos y observaciones de la matrícula.
                </p>
              </div>
            )}

            {request && (
              <>
                <div className={`border rounded-3xl p-6 shadow-soft ${currentStatus.className}`}>
                  <div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center shrink-0">
                        <StatusIcon size={28} />
                      </div>

                      <div>
                        <p className="text-sm font-bold opacity-80">
                          Estado actual
                        </p>

                        <h2 className="text-2xl font-extrabold">
                          {currentStatus.label}
                        </h2>

                        <p className="text-sm mt-1">
                          {currentStatus.description}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/70 rounded-2xl px-4 py-3">
                      <p className="text-xs font-bold opacity-70">
                        Código de seguimiento
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-extrabold text-brand-950">
                          {request.codigo_seguimiento}
                        </p>

                        <button
                          type="button"
                          onClick={() => copyText(request.codigo_seguimiento)}
                          className="text-brand-800"
                        >
                          <Copy size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {request.observacion && (
                  <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
                    <div className="flex gap-3">
                      <AlertCircle className="text-warning shrink-0 mt-0.5" size={22} />

                      <div>
                        <h3 className="font-extrabold text-brand-950">
                          Observación administrativa
                        </h3>

                        <p className="text-sm text-slate-600 mt-2">
                          {request.observacion}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-5">
                  <InfoCard
                    icon={User}
                    title="Estudiante"
                    items={[
                      ['DNI', request.estudiante_dni],
                      ['Nombres', request.estudiante_nombres],
                      ['Apellidos', request.estudiante_apellidos],
                      ['Fecha de nacimiento', formatDate(request.estudiante_fecha_nacimiento)],
                      ['Dirección', request.estudiante_direccion]
                    ]}
                  />

                  <InfoCard
                    icon={Users}
                    title="Apoderado"
                    items={[
                      ['DNI', request.apoderado_dni],
                      ['Nombres', request.apoderado_nombres],
                      ['Apellidos', request.apoderado_apellidos],
                      ['Teléfono', request.apoderado_telefono],
                      ['Parentesco', request.parentesco],
                      ['Dirección', request.apoderado_direccion]
                    ]}
                  />
                </div>

                <InfoCard
                  icon={GraduationCap}
                  title="Datos académicos"
                  items={[
                    ['Grado solicitado', request.grado],
                    ['Turno solicitado', request.turno],
                    ['Periodo académico', request.periodo],
                    [
                      'Sección asignada',
                      request.seccion_asignada ||
                      request.seccion ||
                      'Pendiente de asignación por el colegio'
                    ],
                    [
                      'Aula asignada',
                      request.aula_asignada_id
                        ? `Aula ID ${request.aula_asignada_id}`
                        : 'Pendiente'
                    ],
                    ['Fecha de registro', formatDate(request.created_at)]
                  ]}
                />

                <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
                      <FileText size={23} />
                    </div>

                    <div>
                      <h3 className="font-extrabold text-brand-950 text-lg">
                        Documentos enviados
                      </h3>

                      <p className="text-sm text-slate-500">
                        Archivos asociados a la solicitud.
                      </p>
                    </div>
                  </div>

                  {request.documentos?.length > 0 ? (
                    <div className="space-y-3">
                      {request.documentos.map((doc) => (
                        <div
                          key={doc.id}
                          className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col md:flex-row gap-3 md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-bold text-slate-900">
                              {doc.tipo_documento}
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                              {doc.nombre_archivo}
                            </p>

                            {doc.observacion && (
                              <p className="text-xs text-warning font-semibold mt-1">
                                {doc.observacion}
                              </p>
                            )}
                          </div>

                          <span className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-extrabold bg-white border border-slate-200 text-slate-600">
                            {doc.estado}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
                      <p className="text-sm text-slate-500">
                        No se registraron documentos adjuntos para esta solicitud.
                      </p>
                    </div>
                  )}
                </div>

                {credentials && request.estado === 'aprobado' && (
                  <div className="bg-brand-950 text-white rounded-3xl p-6 shadow-soft">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-2xl bg-white/10 text-gold-500 flex items-center justify-center">
                        <KeyRound size={24} />
                      </div>

                      <div>
                        <h3 className="font-extrabold text-lg">
                          Credenciales generadas
                        </h3>

                        <p className="text-sm text-blue-100">
                          Usa estas credenciales iniciales para acceder al sistema. El usuario deberá cambiar su contraseña al iniciar sesión.
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <CredentialBox
                        title="Estudiante"
                        data={credentials.estudiante}
                        onCopy={copyText}
                      />

                      <CredentialBox
                        title="Apoderado"
                        data={credentials.apoderado}
                        onCopy={copyText}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  maxLength
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
        maxLength={maxLength}
        required
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
      />
    </label>
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

function CredentialBox({ title, data, onCopy }) {
  if (!data) {
    return (
      <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
        <p className="font-bold">
          {title}
        </p>

        <p className="text-sm text-blue-100 mt-2">
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
    <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
      <p className="font-extrabold mb-3">
        {title}
      </p>

      <div className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-blue-100 font-bold">
              {label}
            </p>

            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm font-semibold truncate">
                {value || 'No precisa'}
              </p>

              {value && (
                <button
                  type="button"
                  onClick={() => onCopy(value)}
                  className="text-gold-500 shrink-0"
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

export default EnrollmentTracking;