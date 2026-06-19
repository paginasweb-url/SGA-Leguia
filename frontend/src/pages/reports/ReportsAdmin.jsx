import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Users
} from 'lucide-react';

import toast from 'react-hot-toast';

import {
  exportAnnouncementsReport,
  exportAttendanceDetailReport,
  exportEnrollmentReport,
  exportGradesReport,
  exportRiskStudentsReport,
  getAnnouncementsReport,
  getAttendanceReport,
  getDashboardReport,
  getEnrollmentReport,
  getGradesReport,
  getRiskStudentsReport
} from '../../services/reports.service';

import { getStoredUser } from '../../utils/storage';

const BIMESTERS = [
  { value: 'B1', label: 'Bimestre 1' },
  { value: 'B2', label: 'Bimestre 2' },
  { value: 'B3', label: 'Bimestre 3' },
  { value: 'B4', label: 'Bimestre 4' }
];

const REPORTS_BY_ROLE = {
  Director: ['dashboard', 'enrollments', 'attendance', 'grades', 'risk', 'announcements'],
  Administrativo: ['dashboard', 'enrollments', 'announcements'],
  Auxiliar: ['dashboard', 'attendance', 'risk', 'announcements']
};

const REPORT_CONFIG = {
  dashboard: {
    label: 'Resumen',
    icon: BarChart3,
    description: 'Indicadores generales del sistema.'
  },
  enrollments: {
    label: 'Matrículas',
    icon: FileText,
    description: 'Reporte de matrículas aprobadas por aula.'
  },
  attendance: {
    label: 'Asistencia',
    icon: CalendarCheck,
    description: 'Reporte de asistencia por rango de fechas.'
  },
  grades: {
    label: 'Notas',
    icon: BookOpen,
    description: 'Distribución de notas por bimestre.'
  },
  risk: {
    label: 'Riesgo',
    icon: ShieldAlert,
    description: 'Estudiantes con nota C por bimestre.'
  },
  announcements: {
    label: 'Avisos',
    icon: Bell,
    description: 'Reporte de avisos y confirmaciones de lectura.'
  }
};

function getArray(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.rows)) return response.data.rows;
  if (Array.isArray(response)) return response;
  return [];
}

function getDataObject(response) {
  if (response?.data && !Array.isArray(response.data)) return response.data;
  return response || {};
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getFirstDayOfMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
}

function formatHeader(key) {
  return String(key)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return 'No precisa';

  if (typeof value === 'string' && value.includes('T') && !Number.isNaN(Date.parse(value))) {
    return value.slice(0, 10);
  }

  return String(value);
}

function shouldLimitPreview(activeReport, column) {
  const normalizedColumn = String(column || '').toLowerCase();

  return (
    activeReport === 'announcements' &&
    ['contenido', 'content', 'mensaje', 'descripcion'].includes(normalizedColumn)
  );
}

function formatPreviewValue(value, activeReport, column) {
  const formatted = formatValue(value);

  if (!shouldLimitPreview(activeReport, column)) {
    return formatted;
  }

  if (formatted === 'No precisa') {
    return formatted;
  }

  const maxLength = 90;

  return formatted.length > maxLength
    ? `${formatted.slice(0, maxLength)}...`
    : formatted;
}

function ReportsAdmin() {
  const user = getStoredUser();
  const role = user?.rol || user?.role || '';

  const allowedReports = REPORTS_BY_ROLE[role] || [];
  const [activeReport, setActiveReport] = useState(allowedReports[0] || 'dashboard');

  const [dashboard, setDashboard] = useState(null);
  const [reportRows, setReportRows] = useState([]);

  const [bimester, setBimester] = useState('B1');
  const [fechaInicio, setFechaInicio] = useState(getFirstDayOfMonth());
  const [fechaFin, setFechaFin] = useState(getToday());

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const activeConfig = REPORT_CONFIG[activeReport];

  const loadReport = async () => {
    if (!activeReport) return;

    try {
      setError('');
      setLoading(true);

      if (activeReport === 'dashboard') {
        const response = await getDashboardReport();
        setDashboard(getDataObject(response));
        setReportRows([]);
      }

      if (activeReport === 'enrollments') {
        const response = await getEnrollmentReport();
        setReportRows(getArray(response));
        setDashboard(null);
      }

      if (activeReport === 'attendance') {
        const response = await getAttendanceReport({
          fechaInicio,
          fechaFin
        });
        setReportRows(getArray(response));
        setDashboard(null);
      }

      if (activeReport === 'grades') {
        const response = await getGradesReport({ bimestre: bimester });
        setReportRows(getArray(response));
        setDashboard(null);
      }

      if (activeReport === 'risk') {
        const response = await getRiskStudentsReport({ bimestre: bimester });
        setReportRows(getArray(response));
        setDashboard(null);
      }

      if (activeReport === 'announcements') {
        const response = await getAnnouncementsReport();
        setReportRows(getArray(response));
        setDashboard(null);
      }
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudo cargar el reporte seleccionado.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReport]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    setError('');
  }, [error]);

  const handleExport = async () => {
    try {
      setError('');
      setExporting(true);

      if (activeReport === 'enrollments') {
        await exportEnrollmentReport();
      }

      if (activeReport === 'attendance') {
        await exportAttendanceDetailReport({
          fechaInicio,
          fechaFin
        });
      }

      if (activeReport === 'grades') {
        await exportGradesReport({ bimestre: bimester });
      }

      if (activeReport === 'risk') {
        await exportRiskStudentsReport({ bimestre: bimester });
      }

      if (activeReport === 'announcements') {
        await exportAnnouncementsReport();
      }

      toast.success('Reporte exportado correctamente.');

    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudo exportar el reporte a Excel.'
      );
    } finally {
      setExporting(false);
    }
  };

  const canExport = activeReport !== 'dashboard';

  const counters = useMemo(() => {
    if (activeReport === 'dashboard' && dashboard) {
      return Object.entries(dashboard)
        .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
        .slice(0, 4);
    }

    return [
      ['Registros', reportRows.length],
      ['Reporte', activeConfig?.label || 'Reporte'],
      ['Rol', role || 'No precisa'],
      ['Excel', canExport ? 'Disponible' : 'No aplica']
    ];
  }, [activeReport, dashboard, reportRows, activeConfig, role, canExport]);

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-brand-950 text-white shadow-soft p-6 lg:p-8">
        <div className="absolute -top-28 -right-24 w-80 h-80 bg-gold-500/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div>
            <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.2em]">
              Reportes
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              Panel de reportes
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Consulta información del sistema y exporta reportes en formato Excel.
            </p>

            <p className="text-sm text-blue-100 mt-4">
              Rol: <span className="font-extrabold text-white">{role || 'No precisa'}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={loadReport}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>

            {canExport && (
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center justify-center gap-2 bg-gold-500 text-brand-950 px-4 py-3 rounded-xl font-extrabold hover:bg-gold-400 disabled:opacity-60 transition"
              >
                {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                Exportar Excel
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {counters.map(([label, value]) => (
          <CounterCard
            key={label}
            label={formatHeader(label)}
            value={value}
          />
        ))}
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allowedReports.map((reportKey) => {
            const config = REPORT_CONFIG[reportKey];
            const Icon = config.icon;

            return (
              <button
                key={reportKey}
                type="button"
                onClick={() => setActiveReport(reportKey)}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-3 rounded-2xl font-extrabold text-sm transition ${
                  activeReport === reportKey
                    ? 'bg-brand-950 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={18} />
                {config.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-brand-950">
              {activeConfig?.label}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {activeConfig?.description}
            </p>
          </div>

          <ReportFilters
            activeReport={activeReport}
            bimester={bimester}
            setBimester={setBimester}
            fechaInicio={fechaInicio}
            setFechaInicio={setFechaInicio}
            fechaFin={fechaFin}
            setFechaFin={setFechaFin}
            onApply={loadReport}
            loading={loading}
          />
        </div>
      </section>

      {loading ? (
        <Loading />
      ) : activeReport === 'dashboard' ? (
        <DashboardReport data={dashboard} />
      ) : (
        <GenericReportTable rows={reportRows} activeReport={activeReport} />
      )}
    </main>
  );
}

function ReportFilters({
  activeReport,
  bimester,
  setBimester,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  onApply,
  loading
}) {
  if (activeReport === 'grades' || activeReport === 'risk') {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={bimester}
          onChange={(e) => setBimester(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
        >
          {BIMESTERS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 bg-brand-950 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-brand-900 disabled:opacity-60 transition"
        >
          Aplicar
        </button>
      </div>
    );
  }

  if (activeReport === 'attendance') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
        />

        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
        />

        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 bg-brand-950 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-brand-900 disabled:opacity-60 transition"
        >
          Aplicar
        </button>
      </div>
    );
  }

  return null;
}

function DashboardReport({ data }) {
  const entries = Object.entries(data || {});

  if (!entries.length) {
    return <EmptyState text="No hay indicadores disponibles." />;
  }

  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="border border-slate-100 rounded-2xl p-5 bg-slate-50"
          >
            <p className="text-sm font-bold text-slate-500">
              {formatHeader(key)}
            </p>

            <p className="text-2xl font-extrabold text-brand-950 mt-2">
              {formatValue(value)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GenericReportTable({ rows, activeReport }) {
  if (!rows.length) {
    return <EmptyState text="No hay registros para mostrar." />;
  }

  const columns = Object.keys(rows[0] || {});

  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <FileSpreadsheet className="text-brand-900" size={24} />

        <div>
          <h3 className="font-extrabold text-brand-950">
            Vista previa del reporte
          </h3>

          <p className="text-sm text-slate-500">
            {rows.length} registro(s) encontrados.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-5 py-4 text-left font-extrabold whitespace-nowrap"
                >
                  {formatHeader(column)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr
                key={`${activeReport}-${index}`}
                className="hover:bg-slate-50 transition"
              >
                {columns.map((column) => {
                  const limited = shouldLimitPreview(activeReport, column);
                  const fullValue = formatValue(row[column]);
                  const previewValue = formatPreviewValue(row[column], activeReport, column);

                  return (
                    <td
                      key={column}
                      title={limited ? fullValue : undefined}
                      className={`px-5 py-4 text-slate-700 align-top ${
                        limited
                          ? 'min-w-[280px] max-w-[420px] whitespace-normal break-words leading-relaxed'
                          : 'whitespace-nowrap'
                      }`}
                    >
                      {previewValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeReport === 'announcements' && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500">
            La vista previa limita el contenido largo para mantener la tabla ordenada.
            El archivo Excel se exporta con la información completa.
          </p>
        </div>
      )}
    </section>
  );
}

function CounterCard({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
        <Users size={24} />
      </div>

      <p className="text-sm font-bold text-slate-500 mt-5">
        {label}
      </p>

      <p className="text-2xl font-extrabold text-brand-950 mt-2">
        {formatValue(value)}
      </p>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-[45vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
        <p className="mt-4 text-sm font-semibold text-slate-500">
          Cargando reporte...
        </p>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-10 text-center">
      <FileSpreadsheet className="mx-auto text-slate-300" size={46} />
      <p className="text-sm text-slate-500 mt-3">{text}</p>
    </section>
  );
}

export default ReportsAdmin;