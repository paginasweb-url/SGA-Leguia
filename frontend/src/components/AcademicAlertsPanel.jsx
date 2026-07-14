import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  GraduationCap,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react';

import toast from 'react-hot-toast';

import {
  getAcademicAlerts,
  resolveAcademicAlert
} from '../services/gradesNotes.service';

const academicAlertStateStyles = {
  activa: 'bg-red-50 text-danger border-red-100',
  resuelta: 'bg-green-50 text-success border-green-100'
};

function AcademicAlertsPanel({
  refreshKey = 0,
  title = 'Alertas académicas',
  description = 'Alertas generadas automáticamente cuando un estudiante obtiene C en un curso.'
}) {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('activa');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);

      const response = await getAcademicAlerts(filter);
      setAlerts(response.data || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudieron cargar las alertas académicas.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [filter, refreshKey]);

  const counters = useMemo(() => {
    return alerts.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.estado] = (acc[item.estado] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        activa: 0,
        resuelta: 0
      }
    );
  }, [alerts]);

  const handleResolve = async ({
    id,
    observacion
  }) => {
    try {
      setResolving(true);

      const response = await resolveAcademicAlert({
        id,
        observacion
      });

      toast.success(
        response.message ||
        'Alerta académica marcada como resuelta.'
      );

      setSelectedAlert(null);
      await loadAlerts();
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        'No se pudo resolver la alerta académica.'
      );
    } finally {
      setResolving(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-red-600 uppercase tracking-[0.18em]">
            Bajo rendimiento
          </p>

          <h2 className="text-xl font-extrabold text-brand-950 mt-1">
            {title}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="activa">Activas</option>
            <option value="resuelta">Resueltas</option>
            <option value="todos">Todas</option>
          </select>

          <button
            type="button"
            onClick={loadAlerts}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 border-b border-slate-100 bg-slate-50">
        <MiniAlertCounter label="Total mostrado" value={counters.total} />
        <MiniAlertCounter label="Activas" value={counters.activa} />
        <MiniAlertCounter label="Resueltas" value={counters.resuelta} />
      </div>

      <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="p-10 text-center">
            <Loader2 className="mx-auto animate-spin text-brand-900" size={34} />
            <p className="text-sm text-slate-500 mt-3 font-semibold">
              Cargando alertas académicas...
            </p>
          </div>
        ) : alerts.length > 0 ? (
          alerts.map((item) => (
            <AcademicAlertRow
              key={item.id}
              item={item}
              onOpen={() => setSelectedAlert(item)}
            />
          ))
        ) : (
          <EmptyAlertBlock text="No hay alertas académicas para el filtro seleccionado." />
        )}
      </div>

      {selectedAlert && (
        <AcademicAlertModal
          item={selectedAlert}
          resolving={resolving}
          onClose={() => setSelectedAlert(null)}
          onResolve={handleResolve}
        />
      )}
    </section>
  );
}

function AcademicAlertRow({
  item,
  onOpen
}) {
  const statusClass =
    academicAlertStateStyles[item.estado] ||
    academicAlertStateStyles.activa;

  return (
    <article className="p-5 hover:bg-slate-50 transition">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <button
          type="button"
          onClick={onOpen}
          className="text-left flex items-start gap-3 min-w-0 flex-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-danger flex items-center justify-center shrink-0">
            <GraduationCap size={23} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-extrabold text-brand-950">
                {item.estudiante || 'Estudiante'}
              </p>

              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border capitalize ${statusClass}`}>
                {item.estado}
              </span>
            </div>

            <p className="text-sm text-slate-500 mt-1">
              {item.curso || 'Curso'} · {formatBimesterLabel(item.bimestre)} · {item.grado || 'Grado'} {item.seccion || ''} {item.turno || ''}
            </p>

            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
              {item.mensaje || 'Alerta académica por bajo rendimiento.'}
            </p>

            {item.estado === 'resuelta' && (
              <p className="text-xs text-slate-400 mt-2">
                Resuelta por: {item.resuelta_por_nombre || 'No precisa'}
              </p>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-extrabold hover:bg-brand-800 transition shrink-0"
        >
          <Eye size={16} />
          Ver detalle
        </button>
      </div>
    </article>
  );
}

function AcademicAlertModal({
  item,
  resolving,
  onClose,
  onResolve
}) {
  const [observacion, setObservacion] = useState(item.observacion_resolucion || '');
  const statusClass =
    academicAlertStateStyles[item.estado] ||
    academicAlertStateStyles.activa;

  const isActive = item.estado === 'activa';

  const handleResolve = () => {
    onResolve({
      id: item.id,
      observacion: observacion.trim() || null
    });
  };

  return (
    <div className="fixed inset-0 z-[90] bg-brand-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <section className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-soft border border-slate-200 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          disabled={resolving}
          className="absolute right-4 top-4 z-20 w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 flex items-center justify-center transition shadow-sm disabled:opacity-60"
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        <div className="bg-brand-950 text-white p-6 rounded-t-3xl sm:rounded-t-3xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-red-500/20 rounded-full blur-3xl" />

          <div className="relative pr-10">
            <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.18em]">
              Alerta académica
            </p>

            <h2 className="text-2xl font-extrabold mt-2">
              {item.estudiante || 'Estudiante'}
            </h2>

            <p className="text-sm text-blue-100 mt-2">
              {item.curso || 'Curso'} · {formatBimesterLabel(item.bimestre)}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 border border-slate-200 rounded-2xl p-4">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
              Estado de alerta
            </span>

            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border capitalize ${statusClass}`}>
              {item.estado}
            </span>
          </div>

          <DetailRow label="DNI" value={item.estudiante_dni} />
          <DetailRow label="Curso" value={item.curso} />
          <DetailRow label="Bimestre" value={formatBimesterLabel(item.bimestre)} />
          <DetailRow label="Nota detectada" value={item.nota_detectada} />
          <DetailRow label="Aula" value={`${item.grado || ''} ${item.seccion || ''} ${item.turno || ''}`.trim()} />
          <DetailRow label="Período" value={item.periodo} />

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-extrabold text-danger uppercase tracking-wide">
              Mensaje de alerta
            </p>

            <p className="text-sm text-brand-950 mt-2 leading-relaxed whitespace-pre-line">
              {item.mensaje || 'Alerta académica por bajo rendimiento.'}
            </p>
          </div>

          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">
              Observación de resolución
            </span>

            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              rows={4}
              disabled={!isActive || resolving}
              placeholder="Ejemplo: Se coordinó reforzamiento académico con el docente..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 resize-none disabled:opacity-70"
            />
          </label>

          {!isActive && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                Resolución
              </p>

              <p className="text-sm text-brand-950 mt-2 leading-relaxed">
                {item.observacion_resolucion || 'Sin observación registrada.'}
              </p>

              <p className="text-xs text-slate-500 mt-2">
                Resuelta por: {item.resuelta_por_nombre || 'No precisa'}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={resolving}
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-extrabold hover:bg-slate-50 disabled:opacity-60 transition"
            >
              Cerrar
            </button>

            {isActive && (
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolving}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-extrabold hover:bg-green-700 disabled:opacity-60 transition"
              >
                {resolving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                Marcar como resuelta
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value
}) {
  return (
    <div className="flex items-start justify-between gap-4 border border-slate-200 rounded-2xl p-4">
      <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
        {label}
      </span>

      <span className="text-sm font-bold text-brand-950 text-right">
        {value || 'No precisa'}
      </span>
    </div>
  );
}

function MiniAlertCounter({
  label,
  value
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4">
      <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
        {label}
      </p>

      <p className="text-2xl font-extrabold text-brand-950 mt-1">
        {Number(value || 0)}
      </p>
    </div>
  );
}

function EmptyAlertBlock({
  text
}) {
  return (
    <div className="p-10 text-center">
      <AlertCircle className="mx-auto text-slate-300" size={42} />

      <p className="text-sm text-slate-500 mt-3">
        {text}
      </p>
    </div>
  );
}

function formatBimesterLabel(value) {
  const labels = {
    B1: 'Bimestre 1',
    B2: 'Bimestre 2',
    B3: 'Bimestre 3',
    B4: 'Bimestre 4'
  };

  return labels[value] || value || 'Bimestre no registrado';
}

export default AcademicAlertsPanel;