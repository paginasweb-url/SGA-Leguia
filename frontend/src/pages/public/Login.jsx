import { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  ShieldCheck,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loginRequest } from '../../services/auth.service';
import { saveSession } from '../../utils/storage';

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);

      const data = await loginRequest({
        usuario,
        password
      });

      saveSession({
        token: data.token,
        user: data.user
      });

      window.dispatchEvent(new Event('sga-auth-changed'));

      if (data.user?.must_change_password) {
        navigate('/cambiar-password');
        return;
      }

      navigate('/dashboard');

    } catch (error) {
      setError(error?.response?.data?.error || 'Usuario o contraseña incorrectos');

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-brand-50 via-white to-gold-50 px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-stretch">
        <div className="hidden lg:flex bg-brand-950 text-white rounded-[2rem] p-10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold-500/30 blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative flex flex-col justify-between">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                <GraduationCap size={34} />
              </div>

              <h1 className="text-4xl font-extrabold leading-tight">
                Portal académico institucional
              </h1>

              <p className="text-blue-100 mt-5 leading-relaxed max-w-md">
                Acceso seguro para director, administrativos, auxiliares, docentes,
                estudiantes y apoderados.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-10">
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
                <p className="text-2xl font-extrabold">JWT</p>
                <p className="text-xs text-blue-100">Acceso protegido</p>
              </div>

              <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
                <p className="text-2xl font-extrabold">Roles</p>
                <p className="text-xs text-blue-100">Menú personalizado</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-soft border border-slate-200 p-6 sm:p-8 lg:p-10">
          <div className="text-center mb-7">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center mb-4">
              <ShieldCheck size={32} />
            </div>

            <h1 className="text-2xl font-extrabold text-brand-950">
              Iniciar sesión
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Ingresa con tu usuario institucional o correo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Usuario o correo institucional
              </label>

              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-400" size={20} />

                <input
                  type="text"
                  placeholder="E77776666 / DIR11223344"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-700">
                  Contraseña
                </label>

                <Link
                  to="/recuperar-password"
                  className="text-xs font-bold text-brand-800 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-400" size={20} />

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  <Eye size={20} />
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-danger rounded-xl p-3 text-sm font-semibold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-900 text-white font-extrabold py-3.5 rounded-xl shadow-md hover:bg-brand-800 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Validando...' : 'Ingresar al sistema'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              Acceso exclusivo para la comunidad educativa.
            </p>

            <Link
              to="/"
              className="inline-block mt-3 text-sm font-bold text-brand-800 hover:underline"
            >
              Volver a la página principal
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;