import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
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

import toast from 'react-hot-toast';

import {
  downloadAttendanceJustificationDocument,
  getAttendanceAlerts,
  getAttendanceClassrooms,
  getAttendanceJustifications,
  getClassroomAttendanceByDate,
  getClassroomAttendanceByRange,
  getClassroomStudentsForAttendance,
  registerClassroomAttendance,
  resolveAttendanceAlert,
  reviewAttendanceJustification,
  viewAttendanceJustificationDocument
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

const justificationStateStyles = {
  pendiente: 'bg-yellow-50 text-warning border-yellow-100',
  aprobado: 'bg-green-50 text-success border-green-100',
  rechazado: 'bg-red-50 text-danger border-red-100'
};

const attendanceAlertStateStyles = {
  activa: 'bg-red-50 text-danger border-red-100',
  resuelta: 'bg-green-50 text-success border-green-100'
};

function AttendanceAdmin() {
  const role = getRole();
  const canRegister = role === 'Auxiliar';
  const canReviewJustifications = ['Auxiliar', 'Director', 'Administrativo'].includes(role);

  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [registeredAttendance, setRegisteredAttendance] = useState([]);

  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getToday());

  const [attendanceMode, setAttendanceMode] = useState('day');
  const [dateFrom, setDateFrom] = useState(getToday());
  const [dateTo, setDateTo] = useState(getToday());
  const [rangeRecords, setRangeRecords] = useState([]);
  const [rangeSummary, setRangeSummary] = useState([]);
  const [selectedRangeRecord, setSelectedRangeRecord] = useState(null);

  const [justifications, setJustifications] = useState([]);
  const [justificationFilter, setJustificationFilter] = useState('pendiente');
  const [selectedJustification, setSelectedJustification] = useState(null);
  const [reviewingJustification, setReviewingJustification] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] = useState(null);

  const [attendanceAlerts, setAttendanceAlerts] = useState([]);
  const [attendanceAlertFilter, setAttendanceAlertFilter] = useState('activa');
  const [selectedAttendanceAlert, setSelectedAttendanceAlert] = useState(null);
  const [resolvingAttendanceAlert, setResolvingAttendanceAlert] = useState(false);

  const today = getToday();
  const isDayMode = attendanceMode === 'day';
  const isRangeMode = attendanceMode === 'range';
  const isTodaySelected = selectedDate === today;
  const canEditAttendance = canRegister && isDayMode && isTodaySelected;

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

  const loadJustifications = async () => {
    if (!canReviewJustifications) return;

    try {
      const response = await getAttendanceJustifications();
      setJustifications(response.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar las justificaciones de asistencia.'
      );
    }
  };

  const loadAttendanceAlerts = async () => {
    if (!canReviewJustifications) return;

    try {
      const response = await getAttendanceAlerts(attendanceAlertFilter);
      setAttendanceAlerts(response.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar las alertas de asistencia.'
      );
    }
  };

  const loadClassroomDetail = async () => {
    if (!selectedClassroomId) return;

    try {
      setError('');
      setSuccessMessage('');
      setLoadingDetail(true);

      if (isRangeMode) {
        if (!dateFrom || !dateTo) return;

        if (dateFrom > dateTo) {
          setError('La fecha de inicio no puede ser mayor que la fecha fin.');
          return;
        }

        const response = await getClassroomAttendanceByRange({
          aulaId: selectedClassroomId,
          fechaInicio: dateFrom,
          fechaFin: dateTo
        });

        setRangeRecords(response.data || []);
        setRangeSummary(response.summary || []);
        setStudents([]);
        setRegisteredAttendance([]);
        setAttendanceForm({});

        return;
      }

      if (!selectedDate) return;

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
      setRangeRecords([]);
      setRangeSummary([]);

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
    loadJustifications();
    loadAttendanceAlerts();
  }, []);

  useEffect(() => {
    loadAttendanceAlerts();
  }, [attendanceAlertFilter]);

  useEffect(() => {
    loadClassroomDetail();
  }, [selectedClassroomId, selectedDate, attendanceMode, dateFrom, dateTo]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    setError('');
  }, [error]);

  useEffect(() => {
    if (!successMessage) return;

    toast.success(successMessage);
    setSuccessMessage('');
  }, [successMessage]);

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

  const rangeCounters = useMemo(() => {
  return rangeSummary.reduce(
    (acc, item) => {
      acc.total += Number(item.total || 0);
      acc.presente += Number(item.presente || 0);
      acc.tarde += Number(item.tarde || 0);
      acc.falta += Number(item.falta || 0);
      acc.justificado += Number(item.justificado || 0);
      return acc;
    },
    {
      total: 0,
      presente: 0,
      tarde: 0,
      falta: 0,
      justificado: 0
    }
  );
}, [rangeSummary]);

const displayedSummary = isRangeMode ? rangeCounters : summary;
const displayedStudentCount = isRangeMode ? rangeSummary.length : students.length;

const justificationCounters = useMemo(() => {
  return justifications.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.estado] = (acc[item.estado] || 0) + 1;
      return acc;
    },
    {
      total: 0,
      pendiente: 0,
      aprobado: 0,
      rechazado: 0
    }
  );
}, [justifications]);

const filteredJustifications = useMemo(() => {
  if (justificationFilter === 'todos') return justifications;

  return justifications.filter(
    (item) => item.estado === justificationFilter
  );
}, [justifications, justificationFilter]);

const attendanceAlertCounters = useMemo(() => {
  return attendanceAlerts.reduce(
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
}, [attendanceAlerts]);

const filteredAttendanceAlerts = useMemo(() => {
  return attendanceAlerts;
}, [attendanceAlerts]);

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

      const generatedAlerts = Number(response.data?.alertas_generadas || 0);

        setSuccessMessage(
          generatedAlerts > 0
            ? `Asistencia registrada correctamente. Se generó ${generatedAlerts} alerta(s) por inasistencias consecutivas.`
            : response.message || 'Asistencia registrada correctamente.'
        );

        await Promise.all([
          loadJustifications(),
          loadClassroomDetail(),
          loadAttendanceAlerts()
        ]);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo registrar la asistencia.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReviewJustification = async ({
      id,
      estado,
      respuesta
    }) => {
      try {
        setError('');
        setSuccessMessage('');
        setReviewingJustification(true);

        const response = await reviewAttendanceJustification({
          id,
          estado,
          respuesta
        });

        setSuccessMessage(response.message || 'Justificación revisada correctamente.');
        setSelectedJustification(null);

        await Promise.all([
          loadJustifications(),
          loadClassroomDetail()
        ]);

      } catch (error) {
        setError(
          error?.response?.data?.error ||
          'No se pudo revisar la justificación.'
        );
      } finally {
        setReviewingJustification(false);
      }
    };

    const handleViewJustificationDocument = async (justification) => {
      try {
        if (!justification?.id) return;

        setOpeningDocumentId(justification.id);
        await viewAttendanceJustificationDocument(justification.id);

      } catch (error) {
        setError(
          error?.response?.data?.error ||
          'No se pudo abrir el archivo de la justificación.'
        );
      } finally {
        setOpeningDocumentId(null);
      }
    };

    const handleDownloadJustificationDocument = async (justification) => {
      try {
        if (!justification?.id) return;

        setOpeningDocumentId(justification.id);

        await downloadAttendanceJustificationDocument({
          id: justification.id,
          fallbackFileName: justification.archivo_nombre || `justificacion-${justification.id}`
        });

      } catch (error) {
        setError(
          error?.response?.data?.error ||
          'No se pudo descargar el archivo de la justificación.'
        );
      } finally {
        setOpeningDocumentId(null);
      }
    };

    const handleResolveAttendanceAlert = async ({
    id,
    observacion
  }) => {
    try {
      setError('');
      setSuccessMessage('');
      setResolvingAttendanceAlert(true);

      const response = await resolveAttendanceAlert({
        id,
        observacion
      });

      setSuccessMessage(response.message || 'Alerta marcada como resuelta.');
      setSelectedAttendanceAlert(null);

      await loadAttendanceAlerts();

    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo resolver la alerta de asistencia.'
      );
    } finally {
      setResolvingAttendanceAlert(false);
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

      <section className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <CounterCard icon={Users} label="Estudiantes" value={displayedStudentCount} description="En aula seleccionada" />
        <CounterCard icon={CheckCircle2} label="Presentes" value={displayedSummary.presente} description="Asistencia registrada" />
        <CounterCard icon={Clock3} label="Tardes" value={displayedSummary.tarde} description="Llegadas tarde" />
        <CounterCard icon={XCircle} label="Faltas" value={displayedSummary.falta} description="No asistieron" />
        <CounterCard icon={FileCheck2} label="Justificados" value={displayedSummary.justificado} description="Con observación" />
      </section>

      {canReviewJustifications && (
        <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-gold-600 uppercase tracking-[0.18em]">
                Revisión de solicitudes
              </p>

              <h2 className="text-xl font-extrabold text-brand-950 mt-1">
                Justificaciones de asistencia
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Revisa, aprueba o rechaza las justificaciones enviadas por apoderados o auxiliares.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={justificationFilter}
                onChange={(e) => setJustificationFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
              >
                <option value="pendiente">Pendientes</option>
                <option value="aprobado">Aprobadas</option>
                <option value="rechazado">Rechazadas</option>
                <option value="todos">Todas</option>
              </select>

              <button
                type="button"
                onClick={loadJustifications}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white font-extrabold hover:bg-brand-800 transition"
              >
                <RefreshCw size={18} />
                Actualizar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-5 border-b border-slate-100 bg-slate-50">
            <MiniJustificationCounter label="Total" value={justificationCounters.total} />
            <MiniJustificationCounter label="Pendientes" value={justificationCounters.pendiente} />
            <MiniJustificationCounter label="Aprobadas" value={justificationCounters.aprobado} />
            <MiniJustificationCounter label="Rechazadas" value={justificationCounters.rechazado} />
          </div>

          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
            {filteredJustifications.length > 0 ? (
              filteredJustifications.map((item) => (
                <JustificationRequestRow
                  key={item.id}
                  item={item}
                  openingDocumentId={openingDocumentId}
                  onOpen={() => setSelectedJustification(item)}
                  onViewDocument={() => handleViewJustificationDocument(item)}
                  onDownloadDocument={() => handleDownloadJustificationDocument(item)}
                />
              ))
            ) : (
              <EmptyBlock text="No hay justificaciones para el filtro seleccionado." />
            )}
          </div>
        </section>
      )}

      {canReviewJustifications && (
  <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
    <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <p className="text-sm font-extrabold text-red-600 uppercase tracking-[0.18em]">
          Alertas automáticas
        </p>

        <h2 className="text-xl font-extrabold text-brand-950 mt-1">
          Inasistencias consecutivas
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Alertas generadas automáticamente cuando un estudiante acumula 3 faltas consecutivas.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={attendanceAlertFilter}
          onChange={(e) => setAttendanceAlertFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
        >
          <option value="activa">Activas</option>
          <option value="resuelta">Resueltas</option>
          <option value="todos">Todas</option>
        </select>

        <button
          type="button"
          onClick={loadAttendanceAlerts}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white font-extrabold hover:bg-brand-800 transition"
        >
          <RefreshCw size={18} />
          Actualizar
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 border-b border-slate-100 bg-slate-50">
      <MiniAlertCounter label="Total mostrado" value={attendanceAlertCounters.total} />
      <MiniAlertCounter label="Activas" value={attendanceAlertCounters.activa} />
      <MiniAlertCounter label="Resueltas" value={attendanceAlertCounters.resuelta} />
    </div>

    <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
      {filteredAttendanceAlerts.length > 0 ? (
        filteredAttendanceAlerts.map((item) => (
          <AttendanceAlertRow
            key={item.id}
            item={item}
            onOpen={() => setSelectedAttendanceAlert(item)}
          />
        ))
      ) : (
        <EmptyBlock text="No hay alertas de asistencia para el filtro seleccionado." />
      )}
    </div>
  </section>
)}

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <select
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className={`${isRangeMode ? 'lg:col-span-3' : 'lg:col-span-4'} px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800`}
          >
            <option value="">Selecciona un aula</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.grado} {classroom.seccion} - {classroom.turno} · {classroom.matriculados} estudiantes
              </option>
            ))}
          </select>

          <select
            value={attendanceMode}
            onChange={(e) => setAttendanceMode(e.target.value)}
            className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="day">Día exacto</option>
            <option value="range">Rango de fechas</option>
          </select>

          {isDayMode ? (
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          ) : (
            <>
              <input
                type="date"
                value={dateFrom}
                max={today}
                onChange={(e) => setDateFrom(e.target.value)}
                className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
              />

              <input
                type="date"
                value={dateTo}
                max={today}
                onChange={(e) => setDateTo(e.target.value)}
                className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
              />
            </>
          )}

          <div className={`relative ${isRangeMode ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
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
      {canRegister && isDayMode && !isTodaySelected && (
          <div className="bg-yellow-50 border border-yellow-100 text-warning rounded-2xl p-4 flex gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />

            <p className="text-sm font-semibold">
              La fecha seleccionada corresponde a un día pasado. Solo puedes consultar la asistencia registrada; no se permite modificarla.
            </p>
          </div>
        )}

      {isRangeMode && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl p-4 flex gap-3">
          <CalendarDays size={20} className="shrink-0 mt-0.5" />

          <p className="text-sm font-semibold">
            El rango de fechas es solo para consulta. Para registrar o modificar asistencia usa el modo Día exacto.
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
                {isRangeMode
                ? `Rango: ${formatDate(dateFrom)} hasta ${formatDate(dateTo)} · Registros encontrados: ${rangeRecords.length}`
                : `Fecha: ${formatDate(selectedDate)} · Registros guardados: ${registeredAttendance.length}`}
              </p>
            </div>

            {canRegister && isDayMode && (
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
              {isRangeMode ? 'Resumen del rango' : 'Estudiantes del aula'}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {isRangeMode
                ? 'Consulta acumulada de asistencia por estudiante.'
                : 'Estados permitidos: presente, tarde, falta y justificado.'}
            </p>
          </div>

          <span className="hidden sm:inline-flex rounded-full px-3 py-1 text-xs font-extrabold bg-brand-50 text-brand-900 border border-brand-100">
            {isRangeMode ? rangeSummary.length : filteredStudents.length} resultado(s)
          </span>
        </div>

        {loadingDetail ? (
          <div className="p-10 text-center">
            <Loader2 className="mx-auto animate-spin text-brand-900" size={34} />
            <p className="text-sm text-slate-500 mt-3 font-semibold">
              Cargando asistencia...
            </p>
          </div>
        ) : isRangeMode ? (
          <RangeAttendanceView
            summary={rangeSummary}
            records={rangeRecords}
            search={studentSearch}
            onOpenRecord={setSelectedRangeRecord}
          />
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

      {selectedRangeRecord && (
        <AttendanceRecordModal
          item={selectedRangeRecord}
          onClose={() => setSelectedRangeRecord(null)}
        />
      )}

      {selectedJustification && (
        <JustificationReviewModal
          item={selectedJustification}
          reviewing={reviewingJustification}
          openingDocumentId={openingDocumentId}
          onClose={() => setSelectedJustification(null)}
          onReview={handleReviewJustification}
          onViewDocument={() => handleViewJustificationDocument(selectedJustification)}
          onDownloadDocument={() => handleDownloadJustificationDocument(selectedJustification)}
        />
      )}

      {selectedAttendanceAlert && (
        <AttendanceAlertModal
          item={selectedAttendanceAlert}
          resolving={resolvingAttendanceAlert}
          onClose={() => setSelectedAttendanceAlert(null)}
          onResolve={handleResolveAttendanceAlert}
        />
      )}
    </main>
  );
}

function RangeAttendanceView({ summary, records, search, onOpenRecord }) {
  const term = search.trim().toLowerCase();

  const filteredSummary = summary.filter((item) => {
    const fullName = `${item.nombres || ''} ${item.apellidos || ''}`.toLowerCase();

    return (
      !term ||
      fullName.includes(term) ||
      String(item.dni || '').includes(term) ||
      String(item.codigo_estudiante || '').toLowerCase().includes(term)
    );
  });

  const filteredRecords = records.filter((item) => {
    const fullName = `${item.nombres || ''} ${item.apellidos || ''}`.toLowerCase();

    return (
      !term ||
      fullName.includes(term) ||
      String(item.dni || '').includes(term) ||
      String(item.codigo_estudiante || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 xl:gap-5">
      <div className="divide-y divide-slate-100 max-h-[calc(100vh-360px)] min-h-[380px] overflow-y-auto">
        {filteredSummary.length > 0 ? (
          filteredSummary.map((item) => (
            <RangeSummaryRow key={item.estudiante_id} item={item} />
          ))
        ) : (
          <EmptyBlock text="No se encontraron estudiantes en el rango." />
        )}
      </div>

      <div className="border-t xl:border-t-0 xl:border-l border-slate-100 divide-y divide-slate-100 max-h-[calc(100vh-360px)] min-h-[380px] overflow-y-auto">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((item) => (
            <RangeRecordRow
              key={item.id}
              item={item}
              onClick={() => onOpenRecord(item)}
            />
          ))
        ) : (
          <EmptyBlock text="No hay registros de asistencia en este rango." />
        )}
      </div>
    </div>
  );
}

function RangeSummaryRow({ item }) {
  return (
    <div className="p-5 hover:bg-slate-50 transition">
      <p className="font-extrabold text-brand-950">
        {item.apellidos}, {item.nombres}
      </p>

      <p className="text-sm text-slate-500 mt-1">
        DNI {item.dni} · Código {item.codigo_estudiante || 'No precisa'}
      </p>

      <div className="grid grid-cols-5 gap-2 mt-4">
        <MiniState label="Total" value={item.total} />
        <MiniState label="Pres." value={item.presente} />
        <MiniState label="Tarde" value={item.tarde} />
        <MiniState label="Falta" value={item.falta} />
        <MiniState label="Just." value={item.justificado} />
      </div>
    </div>
  );
}

function RangeRecordRow({ item, onClick }) {
  const statusClass = stateStyles[item.estado] || stateStyles.sin_registro;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-5 hover:bg-slate-50 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-extrabold text-brand-950">
            {item.apellidos}, {item.nombres}
          </p>

          <p className="text-sm text-slate-500 mt-1">
            {formatDate(item.fecha)}
          </p>
        </div>

        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border capitalize ${statusClass}`}>
          {item.estado}
        </span>
      </div>

      {item.observacion && (
        <p className="text-xs text-slate-500 mt-3 line-clamp-2">
          {item.observacion}
        </p>
      )}
    </button>
  );
}

function MiniState({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-center">
      <p className="text-[10px] font-extrabold text-slate-500 uppercase">
        {label}
      </p>

      <p className="text-lg font-extrabold text-brand-950 mt-1">
        {Number(value || 0)}
      </p>
    </div>
  );
}

function AttendanceRecordModal({ item, onClose }) {
  const statusClass = stateStyles[item.estado] || stateStyles.sin_registro;

  return (
    <div className="fixed inset-0 z-[80] bg-brand-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <section className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-soft border border-slate-200 p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 flex items-center justify-center transition shadow-sm"
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        <div className="pr-10">
          <p className="text-sm font-extrabold text-slate-500 uppercase tracking-[0.16em]">
            Detalle de asistencia
          </p>

          <h2 className="text-2xl font-extrabold text-brand-950 mt-2">
            {item.apellidos}, {item.nombres}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {formatDate(item.fecha)}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <DetailRow label="DNI" value={item.dni} />
          <DetailRow label="Código" value={item.codigo_estudiante} />

          <div className="flex items-center justify-between gap-4 border border-slate-200 rounded-2xl p-4">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
              Estado
            </span>

            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border capitalize ${statusClass}`}>
              {item.estado}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
              Observación
            </p>

            <p className="text-sm text-brand-950 mt-2 leading-relaxed">
              {item.observacion?.trim() || 'Sin observación registrada.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function JustificationRequestRow({
  item,
  openingDocumentId,
  onOpen,
  onViewDocument,
  onDownloadDocument
}) {
  const statusClass = justificationStateStyles[item.estado] || justificationStateStyles.pendiente;
  const isOpeningDocument = openingDocumentId === item.id;

  return (
    <article className="p-5 hover:bg-slate-50 transition">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <button
          type="button"
          onClick={onOpen}
          className="text-left flex items-start gap-3 min-w-0 flex-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
            <FileText size={23} />
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
              {formatDate(item.fecha_asistencia)} · {item.grado || 'Grado'} {item.seccion || ''} · {item.turno || 'Turno'}
            </p>

            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
              {item.motivo || 'Sin motivo registrado.'}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Registrado por: {item.registrado_por_nombre || 'No precisa'}
            </p>
          </div>
        </button>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-extrabold hover:bg-brand-800 transition"
          >
            <Eye size={16} />
            Revisar
          </button>

          {item.archivo_url && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onViewDocument}
                disabled={isOpeningDocument}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-extrabold hover:bg-slate-50 disabled:opacity-60 transition"
              >
                {isOpeningDocument ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Eye size={16} />
                )}
                Ver
              </button>

              <button
                type="button"
                onClick={onDownloadDocument}
                disabled={isOpeningDocument}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-extrabold hover:bg-slate-50 disabled:opacity-60 transition"
              >
                <Download size={16} />
                Descargar
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function JustificationReviewModal({
  item,
  reviewing,
  openingDocumentId,
  onClose,
  onReview,
  onViewDocument,
  onDownloadDocument
}) {
  const [respuesta, setRespuesta] = useState(item.respuesta || '');
  const statusClass = justificationStateStyles[item.estado] || justificationStateStyles.pendiente;
  const isPending = item.estado === 'pendiente';
  const isOpeningDocument = openingDocumentId === item.id;

  const handleSubmit = (estado) => {
    onReview({
      id: item.id,
      estado,
      respuesta: respuesta.trim() || null
    });
  };

  return (
    <div className="fixed inset-0 z-[90] bg-brand-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <section className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-soft border border-slate-200 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          disabled={reviewing}
          className="absolute right-4 top-4 z-20 w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 flex items-center justify-center transition shadow-sm disabled:opacity-60"
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        <div className="bg-brand-950 text-white p-6 rounded-t-3xl sm:rounded-t-3xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-gold-500/20 rounded-full blur-3xl" />

          <div className="relative pr-10">
            <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.18em]">
              Revisión de justificación
            </p>

            <h2 className="text-2xl font-extrabold mt-2">
              {item.estudiante || 'Estudiante'}
            </h2>

            <p className="text-sm text-blue-100 mt-2">
              {formatDate(item.fecha_asistencia)} · {item.grado || 'Grado'} {item.seccion || ''} · {item.turno || 'Turno'}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 border border-slate-200 rounded-2xl p-4">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
              Estado de solicitud
            </span>

            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border capitalize ${statusClass}`}>
              {item.estado}
            </span>
          </div>

          <DetailRow label="DNI" value={item.estudiante_dni} />
          <DetailRow label="Registrado por" value={item.registrado_por_nombre} />
          <DetailRow label="Fecha de asistencia" value={formatDate(item.fecha_asistencia)} />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
              Motivo presentado
            </p>

            <p className="text-sm text-brand-950 mt-2 leading-relaxed whitespace-pre-line">
              {item.motivo || 'Sin motivo registrado.'}
            </p>
          </div>

          {item.archivo_url ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-extrabold text-blue-700 uppercase tracking-wide">
                Archivo adjunto
              </p>

              <p className="text-sm font-semibold text-brand-950 mt-2 truncate">
                {item.archivo_nombre || 'Archivo de justificación'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={onViewDocument}
                  disabled={isOpeningDocument}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
                >
                  {isOpeningDocument ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Eye size={18} />
                  )}
                  Ver archivo
                </button>

                <button
                  type="button"
                  onClick={onDownloadDocument}
                  disabled={isOpeningDocument}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-extrabold hover:bg-slate-50 disabled:opacity-60 transition"
                >
                  <Download size={18} />
                  Descargar
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">
                Esta justificación no tiene archivo adjunto.
              </p>
            </div>
          )}

          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">
              Respuesta de revisión
            </span>

            <textarea
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              rows={4}
              disabled={!isPending || reviewing}
              placeholder="Escribe una respuesta u observación de revisión..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 resize-none disabled:opacity-70"
            />
          </label>

          {!isPending && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                Resultado de revisión
              </p>

              <p className="text-sm text-brand-950 mt-2 leading-relaxed">
                {item.respuesta || 'Sin respuesta registrada.'}
              </p>

              <p className="text-xs text-slate-500 mt-2">
                Revisado por: {item.revisado_por_nombre || 'No precisa'}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={reviewing}
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-extrabold hover:bg-slate-50 disabled:opacity-60 transition"
            >
              Cerrar
            </button>

            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit('rechazado')}
                  disabled={reviewing}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 text-white font-extrabold hover:bg-red-700 disabled:opacity-60 transition"
                >
                  {reviewing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <XCircle size={18} />
                  )}
                  Rechazar
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit('aprobado')}
                  disabled={reviewing}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-extrabold hover:bg-green-700 disabled:opacity-60 transition"
                >
                  {reviewing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  Aprobar
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function AttendanceAlertRow({
  item,
  onOpen
}) {
  const statusClass = attendanceAlertStateStyles[item.estado] || attendanceAlertStateStyles.activa;

  return (
    <article className="p-5 hover:bg-slate-50 transition">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <button
          type="button"
          onClick={onOpen}
          className="text-left flex items-start gap-3 min-w-0 flex-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-danger flex items-center justify-center shrink-0">
            <AlertCircle size={23} />
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
              {item.grado || 'Grado'} {item.seccion || ''} · {item.turno || 'Turno'} · {formatDate(item.fecha_inicio)} - {formatDate(item.fecha_fin)}
            </p>

            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
              {item.mensaje || 'Alerta de inasistencias consecutivas.'}
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

function AttendanceAlertModal({
  item,
  resolving,
  onClose,
  onResolve
}) {
  const [observacion, setObservacion] = useState(item.observacion_resolucion || '');
  const statusClass = attendanceAlertStateStyles[item.estado] || attendanceAlertStateStyles.activa;
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
              Alerta de asistencia
            </p>

            <h2 className="text-2xl font-extrabold mt-2">
              {item.estudiante || 'Estudiante'}
            </h2>

            <p className="text-sm text-blue-100 mt-2">
              {item.grado || 'Grado'} {item.seccion || ''} · {item.turno || 'Turno'}
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
          <DetailRow label="Cantidad de faltas" value={item.cantidad_faltas} />
          <DetailRow label="Fecha inicial" value={formatDate(item.fecha_inicio)} />
          <DetailRow label="Fecha final" value={formatDate(item.fecha_fin)} />

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-extrabold text-danger uppercase tracking-wide">
              Mensaje de alerta
            </p>

            <p className="text-sm text-brand-950 mt-2 leading-relaxed whitespace-pre-line">
              {item.mensaje || 'Alerta de inasistencias consecutivas.'}
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
              placeholder="Ejemplo: Se realizó seguimiento con el apoderado..."
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

function MiniAlertCounter({ label, value }) {
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

function MiniJustificationCounter({ label, value }) {
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

function DetailRow({ label, value }) {
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

function getDateOnly(value) {
  if (!value) return '';

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  const isoDateMatch = text.match(/^\d{4}-\d{2}-\d{2}/);

  if (isoDateMatch) {
    return isoDateMatch[0];
  }

  const parsedDate = new Date(text);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().slice(0, 10);
  }

  return text.slice(0, 10);
}

function formatDate(value) {
  const dateOnly = getDateOnly(value);

  if (!dateOnly) return 'Sin fecha';

  const date = new Date(`${dateOnly}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export default AttendanceAdmin;