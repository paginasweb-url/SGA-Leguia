import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarCheck,
  Eye,
  GraduationCap,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
  Users,
  X
} from 'lucide-react';

import PageHeader from '../../components/PageHeader';
import {
  getAuxiliaryStudentsRequest,
  getStudentAttendanceForAuxiliary
} from '../../services/students.service';

function getArray(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function getDateOnly(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function formatDate(value) {
  const dateOnly = getDateOnly(value);

  if (!dateOnly) return 'Sin fecha';

  return new Date(`${dateOnly}T00:00:00`).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function statusClass(value) {
  if (value === 'presente') return 'bg-green-100 text-green-700';
  if (value === 'tarde') return 'bg-yellow-100 text-yellow-700';
  if (value === 'falta') return 'bg-red-100 text-red-700';
  if (value === 'justificado') return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-600';
}

function AuxiliaryStudents() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceRecent, setAttendanceRecent] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    grado: '',
    aula_id: '',
    turno: ''
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  const loadStudents = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getAuxiliaryStudentsRequest({
        search: filters.search || undefined,
        grado: filters.grado || undefined,
        aula_id: filters.aula_id || undefined,
        turno: filters.turno || undefined
      });

      setStudents(getArray(response));

    } catch (error) {
      setError(
        error?.response?.data?.error ||
          'No se pudieron cargar los estudiantes.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const grades = useMemo(() => {
    return [...new Set(students.map((item) => item.grado).filter(Boolean))];
  }, [students]);

  const classrooms = useMemo(() => {
    const map = new Map();

    students.forEach((item) => {
      if (item.aula_id) {
        map.set(item.aula_id, {
          aula_id: item.aula_id,
          label: `${item.grado || ''} ${item.seccion || ''} - ${item.turno || ''}`
        });
      }
    });

    return [...map.values()];
  }, [students]);

  const counters = useMemo(() => {
    return {
      total: students.length,
      manana: students.filter((item) => item.turno === 'Mañana').length,
      tarde: students.filter((item) => item.turno === 'Tarde').length,
      sinAula: students.filter((item) => !item.aula_id).length
    };
  }, [students]);

  const openStudentDetail = async (student) => {
    try {
      setSelectedStudent(student);
      setAttendanceRecent([]);
      setLoadingDetail(true);

      const response = await getStudentAttendanceForAuxiliary(student.estudiante_id);
      setAttendanceRecent(getArray(response).slice(0, 8));

    } catch {
      setAttendanceRecent([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return <Loading text="Cargando estudiantes..." />;
  }

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Seguimiento estudiantil"
        title="Estudiantes"
        description="Consulta estudiantes activos, aula asignada, apoderados y asistencia reciente para seguimiento auxiliar."
      >
        <button
          type="button"
          onClick={() => loadStudents({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </PageHeader>

      {error && <ErrorMessage text={error} />}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <CounterCard icon={Users} label="Estudiantes" value={counters.total} />
        <CounterCard icon={CalendarCheck} label="Turno mañana" value={counters.manana} />
        <CounterCard icon={CalendarCheck} label="Turno tarde" value={counters.tarde} />
        <CounterCard icon={LayoutGrid} label="Sin aula" value={counters.sinAula} />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="relative lg:col-span-4">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />

            <input
              value={filters.search}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  search: e.target.value
                })
              }
              placeholder="Buscar por nombre, DNI o código..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </div>

          <select
            value={filters.grado}
            onChange={(e) =>
              setFilters({
                ...filters,
                grado: e.target.value
              })
            }
            className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="">Todos los grados</option>
            {grades.map((grado) => (
              <option key={grado} value={grado}>
                {grado}
              </option>
            ))}
          </select>

          <select
            value={filters.aula_id}
            onChange={(e) =>
              setFilters({
                ...filters,
                aula_id: e.target.value
              })
            }
            className="lg:col-span-3 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="">Todas las aulas</option>
            {classrooms.map((classroom) => (
              <option key={classroom.aula_id} value={classroom.aula_id}>
                {classroom.label}
              </option>
            ))}
          </select>

          <select
            value={filters.turno}
            onChange={(e) =>
              setFilters({
                ...filters,
                turno: e.target.value
              })
            }
            className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="">Todos los turnos</option>
            <option value="Mañana">Mañana</option>
            <option value="Tarde">Tarde</option>
          </select>

          <button
            type="button"
            onClick={() => loadStudents({ silent: true })}
            disabled={refreshing}
            className="lg:col-span-1 inline-flex items-center justify-center rounded-xl bg-brand-950 text-white font-extrabold px-4 py-3 hover:bg-brand-900 disabled:opacity-60 transition"
          >
            Filtrar
          </button>
        </div>
      </section>

      {students.length > 0 ? (
        <>
          <section className="hidden xl:block bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-extrabold">Estudiante</th>
                    <th className="px-5 py-4 text-left font-extrabold">DNI</th>
                    <th className="px-5 py-4 text-left font-extrabold">Código</th>
                    <th className="px-5 py-4 text-left font-extrabold">Aula</th>
                    <th className="px-5 py-4 text-left font-extrabold">Turno</th>
                    <th className="px-5 py-4 text-left font-extrabold">Apoderado</th>
                    <th className="px-5 py-4 text-right font-extrabold">Acción</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.estudiante_id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4">
                        <p className="font-extrabold text-brand-950">
                          {student.apellidos}, {student.nombres}
                        </p>
                        <p className="text-xs text-slate-500">
                          {student.estado || 'Sin estado'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">{student.dni}</td>
                      <td className="px-5 py-4 text-slate-600">{student.codigo_estudiante}</td>

                      <td className="px-5 py-4 text-slate-600">
                        {student.grado && student.seccion
                          ? `${student.grado} ${student.seccion}`
                          : 'Sin aula'}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {student.turno || 'No precisa'}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {student.apoderados?.[0]
                          ? `${student.apoderados[0].nombres} ${student.apoderados[0].apellidos}`
                          : 'Sin apoderado'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openStudentDetail(student)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 text-brand-900 font-extrabold hover:bg-brand-900 hover:text-white transition"
                        >
                          <Eye size={16} />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-5 xl:hidden">
            {students.map((student) => (
              <StudentCardMobile
                key={student.estudiante_id}
                student={student}
                onView={() => openStudentDetail(student)}
              />
            ))}
          </section>
        </>
      ) : (
        <EmptyState text="No se encontraron estudiantes con los filtros aplicados." />
      )}

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          attendance={attendanceRecent}
          loading={loadingDetail}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </main>
  );
}

function StudentCardMobile({ student, onView }) {
  return (
    <article className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center font-extrabold shrink-0">
          {student.nombres?.charAt(0) || 'E'}
        </div>

        <div className="min-w-0">
          <h3 className="font-extrabold text-brand-950">
            {student.nombres} {student.apellidos}
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            DNI {student.dni} · {student.codigo_estudiante}
          </p>

          <p className="text-sm text-slate-500">
            {student.grado || 'Sin grado'} {student.seccion || ''} · {student.turno || 'Sin turno'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onView}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-950 text-white font-extrabold hover:bg-brand-900 transition"
      >
        <Eye size={17} />
        Ver detalle
      </button>
    </article>
  );
}

function StudentDetailModal({ student, attendance, loading, onClose }) {
  const guardians = student.apoderados || [];

  return (
    <div className="fixed inset-0 z-[80] bg-brand-950/70 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6">
      <section className="bg-white w-full lg:max-w-4xl max-h-[92vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl shadow-soft">
        <div className="sticky top-0 z-10 bg-brand-950 text-white p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold text-gold-500 uppercase tracking-[0.16em]">
              Detalle del estudiante
            </p>

            <h2 className="text-2xl font-extrabold mt-2">
              {student.nombres} {student.apellidos}
            </h2>

            <p className="text-sm text-blue-100 mt-1">
              {student.grado || 'Sin grado'} {student.seccion || ''} · {student.turno || 'Sin turno'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 lg:p-6 space-y-6">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoItem label="Código" value={student.codigo_estudiante || 'No precisa'} />
            <InfoItem label="DNI" value={student.dni || 'No precisa'} />
            <InfoItem label="Período" value={student.periodo || 'No precisa'} />
            <InfoItem label="Estado" value={student.estado || 'No precisa'} />
          </section>

          <section>
            <h3 className="font-extrabold text-brand-950 mb-3">
              Apoderados vinculados
            </h3>

            {guardians.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guardians.map((guardian) => (
                  <div
                    key={guardian.relacion_id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="font-extrabold text-brand-950">
                      {guardian.nombres} {guardian.apellidos}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      {guardian.parentesco} · DNI {guardian.dni || 'No precisa'}
                    </p>

                    <p className="text-sm text-slate-500">
                      Teléfono: {guardian.telefono || 'No precisa'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No hay apoderados vinculados.
              </p>
            )}
          </section>

          <section>
            <h3 className="font-extrabold text-brand-950 mb-3">
              Asistencia reciente
            </h3>

            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto animate-spin text-brand-900" size={28} />
                <p className="text-sm text-slate-500 mt-3">
                  Cargando asistencia...
                </p>
              </div>
            ) : attendance.length > 0 ? (
              <div className="space-y-3">
                {attendance.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <p className="font-extrabold text-brand-950">
                        {formatDate(item.fecha)}
                      </p>

                      <p className="text-sm text-slate-500">
                        {item.observacion || 'Sin observación'}
                      </p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${statusClass(item.estado)}`}>
                      {item.estado || 'Sin estado'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No hay asistencias recientes registradas.
              </p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function CounterCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
        <Icon size={24} />
      </div>

      <p className="text-sm font-bold text-slate-500 mt-5">
        {label}
      </p>

      <p className="text-3xl font-extrabold text-brand-950 mt-2">
        {Number(value || 0).toLocaleString('es-PE')}
      </p>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="font-extrabold text-brand-950 mt-1">
        {value}
      </p>
    </div>
  );
}

function Loading({ text }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
        <p className="mt-4 text-sm font-semibold text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}

function ErrorMessage({ text }) {
  return (
    <div className="bg-red-50 border border-red-100 text-danger rounded-2xl p-4 flex gap-3">
      <AlertCircle size={20} className="shrink-0 mt-0.5" />
      <p className="text-sm font-semibold">{text}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-10 text-center">
      <GraduationCap className="mx-auto text-slate-300" size={46} />
      <p className="text-sm text-slate-500 mt-3">{text}</p>
    </section>
  );
}

export default AuxiliaryStudents;