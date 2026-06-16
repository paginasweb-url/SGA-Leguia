import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Save,
  Search,
  UserCheck,
  Users,
  X,
  XCircle
} from 'lucide-react';

import {
  getAttendanceClassrooms,
  getClassroomAttendanceByDate,
  getClassroomStudentsForAttendance,
  registerClassroomAttendance
} from '../../services/attendance.service';

import { getRole } from '../../utils/storage';

const attendanceStates = [
  {
    value: 'presente',
    label: 'Presente'
  },
  {
    value: 'tarde',
    label: 'Tarde'
  },
  {
    value: 'falta',
    label: 'Falta'
  },
  {
    value: 'justificado',
    label: 'Justificado'
  }
];

const stateStyles = {
  presente: 'bg-green-50 text-success border-green-100',
  tarde: 'bg-yellow-50 text-warning border-yellow-100',
  falta: 'bg-red-50 text-danger border-red-100',
  justificado: 'bg-blue-50 text-blue-700 border-blue-100',
  sin_registro: 'bg-slate-50 text-slate-600 border-slate-200'
};

function AttendanceAdmin() {
  const role = getRole();
  const canRegister = role === 'Auxiliar';

  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [registeredAttendance, setRegisteredAttendance] = useState([]);

  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getToday());

  const today = getToday();
  const isTodaySelected = selectedDate === today;
  const canEditAttendance = canRegister && isTodaySelected;

  const [attendanceForm, setAttendanceForm] = useState({});
  const [studentSearch, setStudentSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedClassroom = useMemo(() => {
    return classrooms.find(
      (classroom) => Number(classroom.id) === Number(selectedClassroomId)
    );
  }, [classrooms, selectedClassroomId]);

  const loadClassrooms = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getAttendanceClassrooms();
      const data = response.data || [];

      setClassrooms(data);

      if (!selectedClassroomId && data.length > 0) {
        setSelectedClassroomId(String(data[0].id));
      }
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar las aulas para asistencia.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadClassroomDetail = async () => {
    if (!selectedClassroomId || !selectedDate) return;

    try {
      setError('');
      setSuccessMessage('');
      setLoadingDetail(true);

      const [studentsResponse, attendanceResponse] = await Promise.all([
        getClassroomStudentsForAttendance(selectedClassroomId),
        getClassroomAttendanceByDate({
          aulaId: selectedClassroomId,
          fecha: selectedDate
        })
      ]);

      const studentsData = studentsResponse.data || [];
      const attendanceData = attendanceResponse.data || [];

      setStudents(studentsData);
      setRegisteredAttendance(attendanceData);

      const registeredMap = new Map(
        attendanceData.map((item) => [Number(item.estudiante_id), item])
      );

      const initialForm = {};

      studentsData.forEach((student) => {
        const registered = registeredMap.get(Number(student.estudiante_id));

        initialForm[student.estudiante_id] = {
          estado: registered?.estado || '',
          observacion: registered?.observacion || ''
        };
      });

      setAttendanceForm(initialForm);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo cargar el detalle de asistencia.'
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  useEffect(() => {
    loadClassroomDetail();
  }, [selectedClassroomId, selectedDate]);

  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();

    return students.filter((student) => {
      const fullName = `${student.nombres || ''} ${student.apellidos || ''}`.toLowerCase();

      return (
        !term ||
        fullName.includes(term) ||
        String(student.dni || '').includes(term) ||
        String(student.codigo_estudiante || '').toLowerCase().includes(term)
      );
    });
  }, [students, studentSearch]);

  const summary = useMemo(() => {
    return students.reduce(
      (acc, student) => {
        const estado = attendanceForm[student.estudiante_id]?.estado;

        if (!estado) {
          acc.sin_registro += 1;
        } else {
          acc[estado] = (acc[estado] || 0) + 1;
        }

        return acc;
      },
      {
        presente: 0,
        tarde: 0,
        falta: 0,
        justificado: 0,
        sin_registro: 0
      }
    );
  }, [students, attendanceForm]);

  const handleAttendanceChange = (studentId, field, value) => {
    setAttendanceForm((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const markAll = (estado) => {
    const nextForm = {};

    students.forEach((student) => {
      nextForm[student.estudiante_id] = {
        ...attendanceForm[student.estudiante_id],
        estado
      };
    });

    setAttendanceForm(nextForm);
  };

  const handleSaveAttendance = async () => {
    try {
      setError('');
      setSuccessMessage('');

      if (!canRegister) {
        setError('Solo el Auxiliar puede registrar asistencia.');
        return;
      }
      if (!isTodaySelected) {
        setError('Solo se puede registrar o modificar asistencia del día actual.');
        return;
      }

      if (!selectedClassroomId || !selectedDate) {
        setError('Selecciona aula y fecha.');
        return;
      }

      const missingStudents = students.filter(
        (student) => !attendanceForm[student.estudiante_id]?.estado
      );

      if (missingStudents.length > 0) {
        setError('Todos los estudiantes deben tener un estado de asistencia.');
        return;
      }

      const withoutJustification = students.filter((student) => {
        const item = attendanceForm[student.estudiante_id];

        return (
          item?.estado === 'justificado' &&
          !String(item?.observacion || '').trim()
        );
      });

      if (withoutJustification.length > 0) {
        setError('Toda asistencia justificada debe tener observación.');
        return;
      }

      setSaving(true);

      const payload = {
        aula_id: Number(selectedClassroomId),
        fecha: selectedDate,
        asistencias: students.map((student) => ({
          estudiante_id: Number(student.estudiante_id),
          estado: attendanceForm[student.estudiante_id].estado,
          observacion:
            attendanceForm[student.estudiante_id].observacion?.trim() || null
        }))
      };

      const response = await registerClassroomAttendance(payload);

      setSuccessMessage(response.message || 'Asistencia registrada correctamente.');

      await loadClassroomDetail();
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo registrar la asistencia.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando asistencia...
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
              Control diario
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              Gestión de Asistencia
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              {canRegister
                ? 'Registra asistencia diaria por aula y fecha.'
                : 'Supervisa la asistencia registrada por aula y fecha.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadClassrooms({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      {error && (
        <MessageBox type="error" message={error} onClose={() => setError('')} />
      )}

      {successMessage && (
        <MessageBox type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
      )}

      <section className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <CounterCard icon={Users} label="Estudiantes" value={students.length} description="En aula seleccionada" />
        <CounterCard icon={CheckCircle2} label="Presentes" value={summary.presente} description="Asistencia registrada" />
        <CounterCard icon={Clock3} label="Tardes" value={summary.tarde} description="Llegadas tarde" />
        <CounterCard icon={XCircle} label="Faltas" value={summary.falta} description="No asistieron" />
        <CounterCard icon={FileCheck2} label="Justificados" value={summary.justificado} description="Con observación" />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <select
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="lg:col-span-5 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="">Selecciona un aula</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.grado} {classroom.seccion} - {classroom.turno} · {classroom.matriculados} estudiantes
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="lg:col-span-3 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          />

          <div className="relative lg:col-span-4">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />

            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Buscar estudiante..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </div>
        </div>
      </section>
      {canRegister && !isTodaySelected && (
          <div className="bg-yellow-50 border border-yellow-100 text-warning rounded-2xl p-4 flex gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />

            <p className="text-sm font-semibold">
              La fecha seleccionada corresponde a un día pasado. Solo puedes consultar la asistencia registrada; no se permite modificarla.
            </p>
          </div>
        )}     

      {selectedClassroom && (
        <section className="bg-brand-950 text-white rounded-3xl shadow-soft p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.18em]">
                Aula seleccionada
              </p>

              <h2 className="text-2xl font-extrabold mt-2">
                {selectedClassroom.grado} {selectedClassroom.seccion} · {selectedClassroom.turno}
              </h2>

              <p className="text-sm text-blue-100 mt-1">
                Fecha: {formatDate(selectedDate)} · Registros guardados: {registeredAttendance.length}
              </p>
            </div>

            {canRegister && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => markAll('presente')}
                  disabled={!canEditAttendance}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
                >
                  <CheckCircle2 size={18} />
                  Todos presentes
                </button>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={saving || loadingDetail || !canEditAttendance}
                  className="inline-flex items-center justify-center gap-2 bg-gold-500 text-brand-950 px-4 py-3 rounded-xl font-extrabold hover:bg-gold-100 disabled:opacity-60 transition"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Guardar asistencia
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-brand-950">
              Estudiantes del aula
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Estados permitidos: presente, tarde, falta y justificado.
            </p>
          </div>

          <span className="hidden sm:inline-flex rounded-full px-3 py-1 text-xs font-extrabold bg-brand-50 text-brand-900 border border-brand-100">
            {filteredStudents.length} resultado(s)
          </span>
        </div>

        {loadingDetail ? (
          <div className="p-10 text-center">
            <Loader2 className="mx-auto animate-spin text-brand-900" size={34} />
            <p className="text-sm text-slate-500 mt-3 font-semibold">
              Cargando estudiantes...
            </p>
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="divide-y divide-slate-100 max-h-[calc(100vh-360px)] min-h-[380px] overflow-y-auto">
            {filteredStudents.map((student) => (
              <StudentAttendanceRow
                key={student.estudiante_id}
                student={student}
                value={attendanceForm[student.estudiante_id]}
                disabled={!canEditAttendance}
                onChange={(field, value) =>
                  handleAttendanceChange(student.estudiante_id, field, value)
                }
              />
            ))}
          </div>
        ) : (
          <EmptyBlock text="No se encontraron estudiantes para esta aula." />
        )}
      </section>
    </main>
  );
}

function StudentAttendanceRow({
  student,
  value,
  disabled,
  onChange
}) {
  const estado = value?.estado || '';
  const statusClass = stateStyles[estado || 'sin_registro'];

  return (
    <div className="p-5 hover:bg-slate-50 transition">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px_minmax(220px,1fr)] gap-4 xl:items-center">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-brand-900 text-white flex items-center justify-center shrink-0">
            <UserCheck size={23} />
          </div>

          <div className="min-w-0">
            <p className="font-extrabold text-brand-950">
              {student.apellidos}, {student.nombres}
            </p>

            <p className="text-sm text-slate-500 mt-1">
              DNI {student.dni} · Código {student.codigo_estudiante || 'No precisa'}
            </p>

            <span className={`inline-flex mt-2 rounded-full px-3 py-1 text-xs font-extrabold border ${statusClass}`}>
              {estado || 'Sin registro'}
            </span>
          </div>
        </div>

        <select
          value={estado}
          onChange={(e) => onChange('estado', e.target.value)}
          disabled={disabled}
          className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-70"
        >
          <option value="">Sin registro</option>
          {attendanceStates.map((state) => (
            <option key={state.value} value={state.value}>
              {state.label}
            </option>
          ))}
        </select>

        <input
          value={value?.observacion || ''}
          onChange={(e) => onChange('observacion', e.target.value)}
          disabled={disabled}
          placeholder="Observación opcional"
          className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-70"
        />
      </div>
    </div>
  );
}

function CounterCard({ icon: Icon, label, value, description }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6 hover:-translate-y-1 hover:shadow-lg transition">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
        <Icon size={24} />
      </div>

      <p className="text-sm font-bold text-slate-500 mt-5">
        {label}
      </p>

      <p className="text-3xl font-extrabold text-brand-950 mt-2">
        {Number(value || 0).toLocaleString('es-PE')}
      </p>

      <p className="text-sm text-slate-500 mt-2">
        {description}
      </p>
    </div>
  );
}

function MessageBox({ type, message, onClose }) {
  const success = type === 'success';

  return (
    <div className={`${success ? 'bg-green-50 border-green-100 text-success' : 'bg-red-50 border-red-100 text-danger'} border rounded-2xl p-4 flex items-start justify-between gap-3`}>
      <div className="flex gap-3">
        {success ? (
          <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
        ) : (
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
        )}

        <p className="text-sm font-semibold">
          {message}
        </p>
      </div>

      <button type="button" onClick={onClose} className="font-extrabold">
        <X size={18} />
      </button>
    </div>
  );
}

function EmptyBlock({ text }) {
  return (
    <div className="p-10 text-center">
      <LayoutGrid className="mx-auto text-slate-300" size={42} />
      <p className="text-sm text-slate-500 mt-3">
        {text}
      </p>
    </div>
  );
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return 'No precisa';

  return new Date(`${value}T00:00:00`).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

export default AttendanceAdmin;