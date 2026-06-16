import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Save } from 'lucide-react';
import { changePasswordRequest } from '../../services/auth.service';
import { getStoredUser } from '../../utils/storage';

function ChangePassword() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');

      if (newPassword.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (newPassword !== confirm) {
        setError('Las contraseñas no coinciden');
        return;
      }

      setLoading(true);

      await changePasswordRequest({
        currentPassword,
        newPassword
      });

      const updatedUser = {
        ...user,
        must_change_password: false
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));

      navigate('/dashboard');

    } catch (error) {
      setError(error?.response?.data?.error || 'No se pudo cambiar la contraseña');

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mb-3">
            <Lock size={28} />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Cambiar contraseña
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Por seguridad, debes actualizar tu contraseña antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Contraseña actual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
          />

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
          />

          <input
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
          />

          {error && (
            <p className="text-sm text-red-600 text-center font-medium">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Save size={18} />
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ChangePassword;