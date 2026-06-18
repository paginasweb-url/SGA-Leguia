import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GraduationCap,
  User,
  Users,
  Home,
  Phone,
  CalendarDays,
  AlertCircle,
  Copy,
  Search,
  Upload,
  Info,
  X
} from 'lucide-react';

import { Link } from 'react-router-dom';

import {
  createEnrollmentRequest,
  getEnrollmentPublicOptions,
  uploadEnrollmentRequestDocument
} from '../../services/enrollmentRequests.service';

const initialForm = {
  estudiante_dni: '',
  estudiante_nombres: '',
  estudiante_apellidos: '',
  estudiante_fecha_nacimiento: '',
  estudiante_direccion: '',

  apoderado_dni: '',
  apoderado_nombres: '',
  apoderado_apellidos: '',
  apoderado_telefono: '',
  apoderado_direccion: '',
  parentesco: '',

  grado_id: '',
  turno: '',
  periodo_id: ''
};

const documentTypes = [
  {
    key: 'dni_estudiante',
    label: 'DNI del estudiante'
  },
  {
    key: 'dni_apoderado',
    label: 'DNI del apoderado'
  },
  {
    key: 'partida_nacimiento',
    label: 'Partida de nacimiento'
  },
  {
    key: 'constancia_estudios',
    label: 'Constancia o certificado de estudios'
  }
];

const onlyDigits = (value) => {
  return String(value || '').replace(/\D/g, '');
};

const isValidDni = (value) => {
  return /^\d{8}$/.test(String(value || ''));
};

const isValidPeruvianPhone = (value) => {
  return /^9\d{8}$/.test(String(value || ''));
};

const numericFieldMaxLength = {
  estudiante_dni: 8,
  apoderado_dni: 8,
  apoderado_telefono: 9
};

function EnrollmentRequest() {
  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState({
    grados: [],
    turnos: [],
    periodos: []
  });

  const [documents, setDocuments] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [uploadSummary, setUploadSummary] = useState([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);

        const response = await getEnrollmentPublicOptions();

        setOptions({
          grados: response.data?.grados || [],
          turnos: response.data?.turnos || [],
          periodos: response.data?.periodos || []
        });

        const periods = response.data?.periodos || [];

        if (periods.length > 0) {
          setForm((prev) => ({
            ...prev,
            periodo_id: String(periods[0].id)
          }));
        }
      } catch (error) {
        setError(
          error?.response?.data?.error ||
          'No se pudieron cargar las opciones de matrícula.'
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let nextValue = value;

    if (numericFieldMaxLength[name]) {
      nextValue = onlyDigits(value).slice(0, numericFieldMaxLength[name]);
    }

    setForm((prev) => ({
      ...prev,
      [name]: nextValue
    }));
  };

  const handleDocumentChange = (tipo, file) => {
    setDocuments((prev) => ({
      ...prev,
      [tipo]: file
    }));
  };

  const removeDocument = (tipo) => {
    setDocuments((prev) => {
      const copy = { ...prev };
      delete copy[tipo];
      return copy;
    });
  };

  const getFormValidationError = () => {
    const requiredFields = [
      'estudiante_dni',
      'estudiante_nombres',
      'estudiante_apellidos',
      'estudiante_fecha_nacimiento',
      'estudiante_direccion',
      'apoderado_dni',
      'apoderado_nombres',
      'apoderado_apellidos',
      'apoderado_telefono',
      'apoderado_direccion',
      'parentesco',
      'grado_id',
      'turno',
      'periodo_id'
    ];

    const hasEmptyRequiredField = requiredFields.some((field) => !form[field]);

    if (hasEmptyRequiredField) {
      return 'Completa todos los campos obligatorios.';
    }

    if (!isValidDni(form.estudiante_dni)) {
      return 'El DNI del estudiante debe contener exactamente 8 números.';
    }

    if (!isValidDni(form.apoderado_dni)) {
      return 'El DNI del apoderado debe contener exactamente 8 números.';
    }

    if (!isValidPeruvianPhone(form.apoderado_telefono)) {
      return 'El teléfono del apoderado debe contener 9 dígitos y empezar con 9.';
    }

    return null;
  };

  const uploadSelectedDocuments = async (requestId) => {
    const entries = Object.entries(documents).filter(([, file]) => Boolean(file));
    const results = [];

    if (entries.length === 0) {
      return results;
    }

    setUploadingDocs(true);

    for (const [tipo_documento, file] of entries) {
      try {
        const response = await uploadEnrollmentRequestDocument({
          requestId,
          tipo_documento,
          file
        });

        results.push({
          tipo_documento,
          success: true,
          data: response.data
        });
      } catch (error) {
        results.push({
          tipo_documento,
          success: false,
          error:
            error?.response?.data?.error ||
            `No se pudo subir el documento ${tipo_documento}`
        });
      }
    }

    setUploadingDocs(false);
    return results;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setResult(null);
      setUploadSummary([]);

      const validationError = getFormValidationError();

      if (validationError) {
        setError(validationError);
        return;
      }

      setLoading(true);

      const payload = {
        ...form,
        grado_id: Number(form.grado_id),
        periodo_id: Number(form.periodo_id)
      };

      const response = await createEnrollmentRequest(payload);

      const createdRequest = response.data;
      const docResults = await uploadSelectedDocuments(createdRequest.id);

      setResult({
        ...createdRequest,
        codigo_seguimiento: response.codigo_seguimiento || createdRequest.codigo_seguimiento
      });

      setUploadSummary(docResults);
      setForm((prev) => ({
        ...initialForm,
        periodo_id: prev.periodo_id
      }));
      setDocuments({});

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo registrar la solicitud de matrícula.'
      );
    } finally {
      setLoading(false);
      setUploadingDocs(false);
    }
  };

  const copyTrackingCode = async () => {
    const code = result?.codigo_seguimiento;

    if (!code) return;

    await navigator.clipboard.writeText(String(code));
  };

  const hasDocuments = Object.values(documents).some(Boolean);

  return (
    <main className="bg-[#F7F9FB]">
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white relative overflow-hidden">
        <div className="absolute -top-28 -right-24 w-96 h-96 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-28 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-14 lg:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-5">
              <FileText size={16} />
              Matrícula digital
            </span>

            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              Solicitud de matrícula 2026
            </h1>

            <p className="mt-5 text-blue-100 text-lg leading-relaxed">
              Completa los datos del estudiante y apoderado. La sección será asignada por el colegio según disponibilidad de vacantes.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
        {result && (
          <div className="mb-8 bg-green-50 border border-green-100 rounded-3xl p-6 shadow-soft">
            <div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 text-success flex items-center justify-center shrink-0">
                  <CheckCircle2 size={28} />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-success">
                    Solicitud registrada correctamente
                  </h2>

                  <p className="text-sm text-slate-600 mt-1">
                    Guarda tu código de seguimiento para consultar el estado de tu solicitud.
                  </p>

                  <div className="mt-4 inline-flex items-center gap-3 bg-white border border-green-100 rounded-2xl px-4 py-3">
                    <span className="text-sm text-slate-500">
                      Código:
                    </span>

                    <span className="font-extrabold text-brand-950">
                      {result.codigo_seguimiento}
                    </span>

                    <button
                      type="button"
                      onClick={copyTrackingCode}
                      className="text-brand-800 hover:text-brand-950"
                      title="Copiar código"
                    >
                      <Copy size={18} />
                    </button>
                  </div>

                  {uploadSummary.length > 0 && (
                    <div className="mt-4 space-y-1">
                      {uploadSummary.map((item) => (
                        <p
                          key={item.tipo_documento}
                          className={`text-xs font-semibold ${
                            item.success ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {item.tipo_documento}: {item.success ? 'Documento subido' : item.error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Link
                to="/matricula/seguimiento"
                className="inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-brand-800 transition"
              >
                Consultar seguimiento
                <Search size={18} />
              </Link>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center mb-5">
                <GraduationCap size={26} />
              </div>

              <h2 className="font-extrabold text-brand-950 text-xl">
                Proceso de matrícula
              </h2>

              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                El colegio revisará la solicitud, validará documentos y asignará el aula correspondiente.
              </p>

              <div className="mt-6 space-y-4">
                <Step number="1" text="Completa el formulario." />
                <Step number="2" text="Adjunta los documentos disponibles." />
                <Step number="3" text="Guarda el código de seguimiento." />
                <Step number="4" text="Espera la revisión administrativa." />
              </div>
            </div>

            <div className="bg-gold-50 border border-gold-100 rounded-3xl p-6">
              <div className="flex gap-3">
                <Info className="text-gold-600 shrink-0 mt-0.5" size={22} />
                <div>
                  <h3 className="font-extrabold text-brand-950">
                    Asignación de sección
                  </h3>
                  <p className="text-sm text-slate-600 mt-2">
                    El apoderado no elige sección. El colegio asignará el aula y sección según vacantes disponibles.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-brand-950 text-white rounded-3xl p-6 shadow-soft">
              <h3 className="font-extrabold text-lg">
                ¿Necesitas formatos?
              </h3>

              <p className="text-sm text-blue-100 mt-2">
                Descarga los requisitos publicados antes de continuar.
              </p>

              <Link
                to="/matricula/formatos"
                className="mt-5 inline-flex items-center justify-center w-full bg-gold-500 text-brand-950 px-4 py-3 rounded-xl font-extrabold hover:bg-gold-100 transition"
              >
                Ver formatos
              </Link>
            </div>
          </aside>

          <section className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5 lg:p-7 space-y-8"
            >
              {error && (
                <div className="bg-red-50 border border-red-100 text-danger rounded-2xl p-4 flex gap-3">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold">
                    {error}
                  </p>
                </div>
              )}

              <FormSection
                icon={User}
                title="Datos del estudiante"
                description="Información personal del estudiante postulante."
              >
                <Input
                  label="DNI del estudiante"
                  name="estudiante_dni"
                  value={form.estudiante_dni}
                  onChange={handleChange}
                  placeholder="12341234"
                  maxLength={8}
                  inputMode="numeric"
                  pattern="[0-9]{8}"
                  helperText="Debe contener exactamente 8 dígitos."
                />

                <Input
                  label="Nombres"
                  name="estudiante_nombres"
                  value={form.estudiante_nombres}
                  onChange={handleChange}
                  placeholder="Carlos"
                />

                <Input
                  label="Apellidos"
                  name="estudiante_apellidos"
                  value={form.estudiante_apellidos}
                  onChange={handleChange}
                  placeholder="Mendoza"
                />

                <Input
                  label="Fecha de nacimiento"
                  name="estudiante_fecha_nacimiento"
                  value={form.estudiante_fecha_nacimiento}
                  onChange={handleChange}
                  type="date"
                  icon={CalendarDays}
                />

                <div className="md:col-span-2">
                  <Input
                    label="Dirección del estudiante"
                    name="estudiante_direccion"
                    value={form.estudiante_direccion}
                    onChange={handleChange}
                    placeholder="Av. Los Pinos 123"
                    icon={Home}
                  />
                </div>
              </FormSection>

              <FormSection
                icon={Users}
                title="Datos del apoderado"
                description="Información del responsable del estudiante."
              >
                <Input
                  label="DNI del apoderado"
                  name="apoderado_dni"
                  value={form.apoderado_dni}
                  onChange={handleChange}
                  placeholder="43214321"
                  maxLength={8}
                  inputMode="numeric"
                  pattern="[0-9]{8}"
                  helperText="Debe contener exactamente 8 dígitos."
                />

                <Input
                  label="Nombres"
                  name="apoderado_nombres"
                  value={form.apoderado_nombres}
                  onChange={handleChange}
                  placeholder="Ana"
                />

                <Input
                  label="Apellidos"
                  name="apoderado_apellidos"
                  value={form.apoderado_apellidos}
                  onChange={handleChange}
                  placeholder="Mendoza"
                />

                <Input
                  label="Teléfono"
                  name="apoderado_telefono"
                  value={form.apoderado_telefono}
                  onChange={handleChange}
                  placeholder="987654321"
                  icon={Phone}
                  maxLength={9}
                  inputMode="numeric"
                  pattern="9[0-9]{8}"
                  helperText="Debe tener 9 dígitos y empezar con 9."
                />

                <Input
                  label="Parentesco"
                  name="parentesco"
                  value={form.parentesco}
                  onChange={handleChange}
                  placeholder="Madre / Padre / Tutor"
                />

                <Input
                  label="Dirección del apoderado"
                  name="apoderado_direccion"
                  value={form.apoderado_direccion}
                  onChange={handleChange}
                  placeholder="Av. Los Pinos 123"
                  icon={Home}
                />
              </FormSection>

              <FormSection
                icon={GraduationCap}
                title="Datos académicos"
                description="Selecciona la información solicitada. La sección será asignada por el colegio."
              >
                <Select
                  label="Grado solicitado"
                  name="grado_id"
                  value={form.grado_id}
                  onChange={handleChange}
                  disabled={loadingOptions}
                >
                  <option value="">
                    {loadingOptions ? 'Cargando grados...' : 'Seleccionar grado'}
                  </option>

                  {options.grados.map((grado) => (
                    <option key={grado.id} value={grado.id}>
                      {grado.nombre}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Turno solicitado"
                  name="turno"
                  value={form.turno}
                  onChange={handleChange}
                  disabled={loadingOptions}
                >
                  <option value="">
                    {loadingOptions ? 'Cargando turnos...' : 'Seleccionar turno'}
                  </option>

                  {options.turnos.map((turno) => (
                    <option key={turno} value={turno}>
                      {turno}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Periodo académico"
                  name="periodo_id"
                  value={form.periodo_id}
                  onChange={handleChange}
                  disabled={loadingOptions}
                >
                  <option value="">
                    {loadingOptions ? 'Cargando periodos...' : 'Seleccionar periodo'}
                  </option>

                  {options.periodos.map((periodo) => (
                    <option key={periodo.id} value={periodo.id}>
                      {periodo.nombre}
                    </option>
                  ))}
                </Select>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex gap-3">
                  <Info className="text-brand-800 shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-slate-600">
                    La sección y aula serán definidas por el colegio al aprobar la solicitud.
                  </p>
                </div>
              </FormSection>

              <section>
                <div className="flex gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
                    <Upload size={23} />
                  </div>

                  <div>
                    <h2 className="font-extrabold text-brand-950 text-lg">
                      Documentos
                    </h2>
                    <p className="text-sm text-slate-500">
                      Adjunta los documentos disponibles. Puedes completar la solicitud aunque algún documento quede pendiente.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {documentTypes.map((doc) => {
                    const file = documents[doc.key];

                    return (
                      <div
                        key={doc.key}
                        className="border border-slate-200 rounded-2xl p-4 bg-slate-50"
                      >
                        <label className="block">
                          <span className="block text-sm font-bold text-slate-700 mb-2">
                            {doc.label}
                          </span>

                          {!file ? (
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleDocumentChange(doc.key, e.target.files?.[0])
                              }
                              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-brand-50 file:text-brand-900 hover:file:bg-brand-100"
                            />
                          ) : (
                            <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2">
                              <span className="text-sm font-semibold text-slate-700 truncate">
                                {file.name}
                              </span>

                              <button
                                type="button"
                                onClick={() => removeDocument(doc.key)}
                                className="text-danger shrink-0"
                              >
                                <X size={17} />
                              </button>
                            </div>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>

                {!hasDocuments && (
                  <p className="text-xs text-slate-400 mt-3">
                    Los documentos pueden adjuntarse ahora para facilitar la revisión administrativa.
                  </p>
                )}
              </section>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-slate-200 pt-6">
                <p className="text-xs text-slate-500">
                  Al enviar la solicitud, los datos serán revisados por el colegio.
                </p>

                <button
                  type="submit"
                  disabled={loading || uploadingDocs || loadingOptions}
                  className="inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-6 py-3.5 rounded-xl font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
                >
                  {loading || uploadingDocs
                    ? uploadingDocs
                      ? 'Subiendo documentos...'
                      : 'Registrando...'
                    : 'Registrar solicitud'}
                  {!loading && !uploadingDocs && <ArrowRight size={18} />}
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function Step({ number, text }) {
  return (
    <div className="flex gap-3">
      <span className="w-7 h-7 rounded-full bg-gold-500 text-brand-950 font-extrabold text-sm flex items-center justify-center shrink-0">
        {number}
      </span>
      <p className="text-sm text-slate-600">
        {text}
      </p>
    </div>
  );
}

function FormSection({ icon: Icon, title, description, children }) {
  return (
    <section>
      <div className="flex gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
          <Icon size={23} />
        </div>

        <div>
          <h2 className="font-extrabold text-brand-950 text-lg">
            {title}
          </h2>

          <p className="text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {children}
      </div>
    </section>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  minLength,
  inputMode,
  pattern,
  helperText,
  icon: Icon
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </span>

      <div className="relative">
        {Icon && (
          <Icon size={18} className="absolute left-3 top-3.5 text-slate-400" />
        )}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          minLength={minLength}
          inputMode={inputMode}
          pattern={pattern}
          required
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800`}
        />
      </div>
      {helperText && (
        <p className="text-xs text-slate-500 mt-1">
          {helperText}
        </p>
      )}
    </label>
  );
}

function Select({
  label,
  name,
  value,
  onChange,
  children,
  disabled = false
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  );
}

export default EnrollmentRequest;