import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  KeyRound,
  Laptop,
  Loader2,
  Moon,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sun,
  Monitor,
  CalendarDays
} from 'lucide-react';

import {
  getAcademicPeriodsForSettings,
  getMySettings
} from '../../services/settings.service';

import { useTheme } from '../../context/ThemeContext';
import { getStoredUser } from '../../utils/storage';

function getArray(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function SettingsAdmin() {
  const user = getStoredUser();
  const role = user?.rol || user?.role || '';

  const {
    themeMode,
    resolvedTheme,
    setThemeMode,
    refreshTheme,
    loadingTheme
  } = useTheme();

  const [settingsData, setSettingsData] = useState(null);
  const [periods, setPeriods] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingTheme, setSavingTheme] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isDirector = role === 'Director';

  const loadSettings = async () => {
    try {
      setError('');
      setLoading(true);

      const [settingsResponse, periodsResponse] = await Promise.all([
        getMySettings(),
        isDirector
          ? getAcademicPeriodsForSettings()
          : Promise.resolve({ data: [] })
      ]);

      setSettingsData(settingsResponse.data || null);
      setPeriods(getArray(periodsResponse));
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudo cargar la configuración.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleThemeChange = async (mode) => {
    try {
      setError('');
      setSuccessMessage('');
      setSavingTheme(mode);

      await setThemeMode(mode);
      await refreshTheme();

      setSuccessMessage('Preferencia visual actualizada correctamente.');
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudo actualizar la preferencia visual.'
      );
    } finally {
      setSavingTheme('');
    }
  };

  const activePeriod = useMemo(() => {
    return periods.find(
      (period) =>
        period.estado === 'activo' ||
        period.estado === 'actual' ||
        period.activo === true
    );
  }, [periods]);

  const visualOptions = settingsData?.visual_options || [];
  const passwordPolicy = settingsData?.password_policy || {};
  const academicSettings = settingsData?.academic_settings || {};

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando configuración...
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
              Configuración
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              Preferencias del sistema
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Personaliza la apariencia del sistema y consulta la configuración académica y políticas de seguridad.
            </p>

            <p className="text-sm text-blue-100 mt-4">
              Rol: <span className="font-extrabold text-white">{role || 'No precisa'}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={loadSettings}
            disabled={loadingTheme}
            className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
          >
            <RefreshCw size={18} className={loadingTheme ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      {error && <Message type="error" text={error} />}
      {successMessage && <Message type="success" text={successMessage} />}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
              <Laptop size={25} />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-brand-950">
                Preferencias visuales
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                La preferencia se guarda en tu usuario y se mantiene al iniciar sesión en otro equipo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {visualOptions.map((option) => (
              <ThemeOptionCard
                key={option.value}
                option={option}
                active={themeMode === option.value}
                saving={savingTheme === option.value}
                onClick={() => handleThemeChange(option.value)}
              />
            ))}
          </div>
        </article>

        <article className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
            {resolvedTheme === 'dark' ? <Moon size={25} /> : <Sun size={25} />}
          </div>

          <h2 className="text-xl font-extrabold text-brand-950 mt-5">
            Tema actual
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Preferencia: <span className="font-extrabold">{themeLabel(themeMode)}</span>
          </p>

          <p className="text-sm text-slate-500 mt-1">
            Aplicado: <span className="font-extrabold">{resolvedTheme === 'dark' ? 'Oscuro' : 'Claro'}</span>
          </p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-500">
              Vista previa
            </p>

            <div className="mt-3 rounded-2xl bg-brand-950 text-white p-4">
              <p className="text-sm font-extrabold text-gold-500">
                SGA Leguía
              </p>

              <p className="text-xs text-blue-100 mt-1">
                Azul institucional + acento dorado.
              </p>
            </div>
          </div>
        </article>
      </section>

      {isDirector && (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AcademicSettingsCard
            academicSettings={academicSettings}
            periods={periods}
            activePeriod={activePeriod}
          />

          <PasswordPolicyCard policy={passwordPolicy} />
        </section>
      )}

      {!isDirector && (
        <PasswordPolicyCard policy={passwordPolicy} />
      )}
    </main>
  );
}

function ThemeOptionCard({ option, active, saving, onClick }) {
  const Icon = getThemeIcon(option.value);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className={`text-left rounded-3xl border p-5 transition ${
        active
          ? 'border-brand-900 bg-brand-50 ring-2 ring-brand-900/10'
          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 text-brand-900 flex items-center justify-center">
          {saving ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <Icon size={22} />
          )}
        </div>

        {active && (
          <CheckCircle2 className="text-green-600" size={22} />
        )}
      </div>

      <h3 className="font-extrabold text-brand-950 mt-5">
        {option.label}
      </h3>

      <p className="text-sm text-slate-500 mt-2">
        {option.description}
      </p>
    </button>
  );
}

function AcademicSettingsCard({ academicSettings, periods, activePeriod }) {
  const bimestres = academicSettings?.bimestres || [];
  const gradeScale = academicSettings?.grade_scale || [];

  return (
    <article className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
          <BookOpen size={25} />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-brand-950">
            Configuración académica
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Períodos académicos, año escolar activo, bimestres y escala literal.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-5">
        <p className="text-xs font-extrabold text-slate-500 uppercase tracking-[0.16em]">
          Año escolar activo
        </p>

        <p className="text-2xl font-extrabold text-brand-950 mt-2">
          {activePeriod?.nombre || activePeriod?.anio || 'No configurado'}
        </p>

        <p className="text-sm text-slate-500 mt-1">
          Total de períodos registrados: {periods.length}
        </p>
      </div>

      <div className="mt-5">
        <h3 className="font-extrabold text-brand-950">
          Bimestres
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {bimestres.map((item) => (
            <div
              key={item.code}
              className="rounded-2xl bg-slate-50 border border-slate-100 p-4"
            >
              <p className="text-lg font-extrabold text-brand-950">
                {item.code}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="font-extrabold text-brand-950">
          Escala de notas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {gradeScale.map((item) => (
            <div
              key={item.code}
              className="rounded-2xl bg-slate-50 border border-slate-100 p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-extrabold text-brand-950">
                  {item.code} · {item.label}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Puntaje para mérito académico.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-gold-100 text-gold-700">
                {item.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function PasswordPolicyCard({ policy }) {
  const rules = policy?.rules || [];

  return (
    <article className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
          <KeyRound size={25} />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-brand-950">
            {policy?.title || 'Política de contraseña'}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Información de seguridad aplicada al acceso de usuarios.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {rules.map((rule, index) => (
          <div
            key={`${rule}-${index}`}
            className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-4"
          >
            <ShieldCheck className="text-green-600 shrink-0 mt-0.5" size={20} />

            <p className="text-sm text-slate-600">
              {rule}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function Message({ type, text }) {
  const isError = type === 'error';

  return (
    <div
      className={`rounded-2xl p-4 flex gap-3 border ${
        isError
          ? 'bg-red-50 border-red-100 text-danger'
          : 'bg-green-50 border-green-100 text-green-700'
      }`}
    >
      {isError ? (
        <AlertCircle size={20} className="shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
      )}

      <p className="text-sm font-semibold">{text}</p>
    </div>
  );
}

function getThemeIcon(value) {
  if (value === 'dark') return Moon;
  if (value === 'light') return Sun;
  return Monitor;
}

function themeLabel(value) {
  if (value === 'dark') return 'Modo oscuro';
  if (value === 'light') return 'Modo claro';
  return 'Usar sistema';
}

export default SettingsAdmin;