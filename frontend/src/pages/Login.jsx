import { useState } from 'react';
import { Mail, Lock, Eye, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginRequest } from '../services/auth.service';

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);

      const data = await loginRequest({
        correo,
        password
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/dashboard');

    } catch (error) {
      setError('Correo o contraseña incorrectos');

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-md">

        <div className="text-center mb-6">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-white shadow-md flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full border-4 border-blue-800 flex items-center justify-center">
              <ShieldCheck className="text-blue-800" size={28} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-blue-900">
            Augusto B. Leguía
          </h1>

          <p className="text-sm text-slate-600 mt-1">
            Sistema de Gestión Académica
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Correo institucional
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={20} />

                <input
                  type="email"
                  placeholder="director@leguia.edu.pe"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Contraseña
                </label>

                <button
                  type="button"
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <Eye size={20} />
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300"
              />
              Recordar este dispositivo
            </label>

            {error && (
              <p className="text-sm text-red-600 text-center font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl shadow-md hover:bg-blue-800 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Validando...' : 'Iniciar sesión'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Acceso exclusivo para la comunidad educativa
            </p>

            <p className="text-xs text-slate-400 mt-3 tracking-widest">
              EXCELENCIA EN EDUCACIÓN
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 I.E. Augusto B. Leguía
        </p>

      </section>
    </main>
  );
}

export default Login;