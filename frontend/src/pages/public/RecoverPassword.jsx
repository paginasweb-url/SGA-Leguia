import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  IdCard,
  Info,
  KeyRound,
  Mail,
  Send,
  ShieldCheck,
  User,
  Users
} from 'lucide-react';

import { requestPasswordRecovery } from '../../services/passwordRecovery.service';

const initialForm = {
  tipo: 'estudiante',
  usuario: '',
  dni: '',
  fecha_nacimiento: '',
  apoderado_dni: '',
  estudiante_dni: ''
};

function RecoverPassword() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isStudent = form.tipo === 'estudiante';
  const isGuardian = form.tipo === 'apoderado';

  const handleTypeChange = (tipo) => {
    setError('');
    setSuccessMessage('');

    setForm((prev) => ({
      ...prev,
      tipo,
      fecha_nacimiento: '',
      apoderado_dni: '',
      estudiante_dni: ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!form.tipo || !form.usuario || !form.dni) {
      return 'Completa el usuario institucional y el DNI.';
    }

    if (isStudent && (!form.fecha_nacimiento || !form.apoderado_dni)) {
      return 'Para estudiante, la fecha de nacimiento y el DNI del apoderado son obligatorios.';
    }

    if (isGuardian && !form.estudiante_dni) {
      return 'Para apoderado, el DNI del estudiante vinculado es obligatorio.';
    }

    return null;
  };

  const buildPayload = () => {
    if (isStudent) {
      return {
        tipo: 'estudiante',
        usuario: form.usuario.trim(),
        dni: form.dni.trim(),
        fecha_nacimiento: form.fecha_nacimiento,
        apoderado_dni: form.apoderado_dni.trim()
      };
    }

    return {
      tipo: 'apoderado',
      usuario: form.usuario.trim(),
      dni: form.dni.trim(),
      estudiante_dni: form.estudiante_dni.trim()
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setSuccessMessage('');

      const validationError = validateForm();

      if (validationError) {
        setError(validationError);
        return;
      }

      setLoading(true);

      const response = await requestPasswordRecovery(buildPayload());

      setSuccessMessage(
        response?.message ||
        'Si los datos ingresados coinciden con los registros del colegio, la solicitud será revisada por el área administrativa.'
      );

      setForm(initialForm);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo registrar la solicitud de recuperación.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9FB]">
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white relative overflow-hidden">
        <div className="absolute -top-28 -right-24 w-96 h-96 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-28 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-14 lg:py-20">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white font-bold mb-8"
          >
            <ArrowLeft size={18} />
            Volver al inicio de sesión
          </Link>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-5">
              <KeyRound size={16} />
              Recuperación de acceso
            </span>

            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              Recupera tu contraseña institucional
            </h1>

            <p className="mt-5 text-blue-100 text-lg leading-relaxed">
              Registra una solicitud de recuperación. El área administrativa verificará tus datos y generará una contraseña temporal si corresponde.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
        <div className="grid lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center mb-5">
                <ShieldCheck size={26} />
              </div>

              <h2 className="font-extrabold text-brand-950 text-xl">
                Validación segura
              </h2>

              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Para proteger las cuentas, el sistema no informa si los datos pertenecen o no a un usuario. La solicitud será revisada internamente.
              </p>

              <div className="mt-6 space-y-4">
                <Step number="1" text="Ingresa tus datos institucionales." />
                <Step number="2" text="El colegio revisa la solicitud." />
                <Step number="3" text="Si procede, se genera una contraseña temporal." />
                <Step number="4" text="Al iniciar sesión, deberás cambiar tu contraseña." />
              </div>
            </div>

            <div className="bg-gold-50 border border-gold-100 rounded-3xl p-6">
              <div className="flex gap-3">
                <Info className="text-gold-600 shrink-0 mt-0.5" size={22} />

                <div>
                  <h3 className="font-extrabold text-brand-950">
                    Importante
                  </h3>

                  <p className="text-sm text-slate-600 mt-2">
                    Este formulario no cambia la contraseña de forma inmediata. Solo registra una solicitud para revisión administrativa.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5 lg:p-7 space-y-7"
            >
              <div>
                <h2 className="text-xl font-extrabold text-brand-950">
                  Tipo de usuario
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Selecciona el tipo de cuenta que deseas recuperar.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mt-5">
                  <TypeButton
                    active={isStudent}
                    icon={GraduationCap}
                    title="Estudiante"
                    description="Validación con fecha de nacimiento y DNI del apoderado."
                    onClick={() => handleTypeChange('estudiante')}
                  />

                  <TypeButton
                    active={isGuardian}
                    icon={Users}
                    title="Apoderado"
                    description="Validación con DNI del estudiante vinculado."
                    onClick={() => handleTypeChange('apoderado')}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-danger rounded-2xl p-4 flex gap-3">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold">
                    {error}
                  </p>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-100 text-success rounded-2xl p-4 flex gap-3">
                  <CheckCircle2 size={21} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-extrabold">
                      Solicitud registrada
                    </p>
                    <p className="text-sm mt-1">
                      {successMessage}
                    </p>
                  </div>
                </div>
              )}

              <section>
                <div className="flex gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
                    <User size={23} />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-brand-950 text-lg">
                      Datos de la cuenta
                    </h3>

                    <p className="text-sm text-slate-500">
                      Ingresa tu usuario o correo institucional y tu DNI.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Usuario o correo institucional"
                    name="usuario"
                    value={form.usuario}
                    onChange={handleChange}
                    placeholder={isStudent ? 'E12345678 o E12345678@abl.edu.pe' : 'A12345678 o A12345678@abl.edu.pe'}
                    icon={Mail}
                  />

                  <Input
                    label={isStudent ? 'DNI del estudiante' : 'DNI del apoderado'}
                    name="dni"
                    value={form.dni}
                    onChange={handleChange}
                    placeholder="12345678"
                    maxLength={8}
                    icon={IdCard}
                  />
                </div>
              </section>

              <section>
                <div className="flex gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
                    {isStudent ? <CalendarDays size={23} /> : <GraduationCap size={23} />}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-brand-950 text-lg">
                      Datos de validación
                    </h3>

                    <p className="text-sm text-slate-500">
                      Estos datos ayudan a confirmar la relación con el estudiante o apoderado.
                    </p>
                  </div>
                </div>

                {isStudent && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Fecha de nacimiento del estudiante"
                      name="fecha_nacimiento"
                      value={form.fecha_nacimiento}
                      onChange={handleChange}
                      type="date"
                      icon={CalendarDays}
                    />

                    <Input
                      label="DNI del apoderado vinculado"
                      name="apoderado_dni"
                      value={form.apoderado_dni}
                      onChange={handleChange}
                      placeholder="87654321"
                      maxLength={8}
                      icon={IdCard}
                    />
                  </div>
                )}

                {isGuardian && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="DNI del estudiante vinculado"
                      name="estudiante_dni"
                      value={form.estudiante_dni}
                      onChange={handleChange}
                      placeholder="12345678"
                      maxLength={8}
                      icon={IdCard}
                    />

                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex gap-3">
                      <Info className="text-brand-800 shrink-0 mt-0.5" size={20} />
                      <p className="text-sm text-slate-600">
                        El estudiante debe estar vinculado al apoderado registrado en el sistema.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-slate-200 pt-6">
                <p className="text-xs text-slate-500">
                  La solicitud será atendida por Director o Administrativo.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-6 py-3.5 rounded-xl font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
                >
                  {loading ? 'Registrando solicitud...' : 'Enviar solicitud'}
                  {!loading && <Send size={18} />}
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function TypeButton({
  active,
  icon: Icon,
  title,
  description,
  onClick
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border p-5 transition ${
        active
          ? 'border-brand-900 bg-brand-50 ring-2 ring-brand-900/10'
          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-brand-200'
      }`}
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${
        active ? 'bg-brand-900 text-white' : 'bg-white text-brand-900'
      }`}>
        <Icon size={23} />
      </div>

      <h3 className="font-extrabold text-brand-950">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-2">
        {description}
      </p>
    </button>
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
          required
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800`}
        />
      </div>
    </label>
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

export default RecoverPassword;