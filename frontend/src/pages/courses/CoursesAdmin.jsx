import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Edit3,
  GraduationCap,
  LayoutGrid,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRoundCheck,
  Users,
  X
} from 'lucide-react';

import toast from 'react-hot-toast';

import {
  createCourse,
  deleteCourse,
  getCourses,
  updateCourse
} from '../../services/courses.service';

import {
  createTeacherCourse,
  deleteTeacherCourse,
  getTeacherCourses
} from '../../services/teacherCourses.service';

import { getTeachers } from '../../services/teachers.service';
import { getClassrooms } from '../../services/classrooms.service';

function CoursesAdmin() {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCreateCourse, setShowCreateCourse] = useState(false);

  const [filters, setFilters] = useState({
    search: ''
  });

  const [courseForm, setCourseForm] = useState({
    nombre: ''
  });

  const [assignmentForm, setAssignmentForm] = useState({
    docente_id: '',
    aula_id: ''
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [confirmModal, setConfirmModal] = useState(null);
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

  const loadData = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        coursesResponse,
        assignmentsResponse,
        teachersResponse,
        classroomsResponse
      ] = await Promise.all([
        getCourses(),
        getTeacherCourses(),
        getTeachers(),
        getClassrooms({ estado: 'activo' })
      ]);

      setCourses(coursesResponse.data || []);
      setAssignments(assignmentsResponse.data || []);
      setTeachers(teachersResponse.data || []);
      setClassrooms(classroomsResponse.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar los cursos.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeTeachers = useMemo(() => {
    return teachers.filter((teacher) => teacher.estado === 'activo');
  }, [teachers]);

  const assignmentsByCourse = useMemo(() => {
    return assignments.reduce((acc, assignment) => {
      const key = Number(assignment.curso_id);

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(assignment);
      return acc;
    }, {});
  }, [assignments]);

  const selectedCourseAssignments = useMemo(() => {
    if (!selectedCourse) return [];

    return assignmentsByCourse[Number(selectedCourse.id)] || [];
  }, [assignmentsByCourse, selectedCourse]);

  const filteredCourses = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !term ||
        String(course.nombre || '').toLowerCase().includes(term) ||
        String(course.id).includes(term);

      return matchesSearch;
    });
  }, [courses, filters]);

  const counters = useMemo(() => {
    const assignedCourses = new Set(
      assignments.map((assignment) => assignment.curso_id).filter(Boolean)
    );

    const assignedTeachers = new Set(
      assignments.map((assignment) => assignment.docente_id).filter(Boolean)
    );

    const assignedClassrooms = new Set(
      assignments.map((assignment) => assignment.aula_id).filter(Boolean)
    );

    return {
      totalCursos: courses.length,
      cursosAsignados: assignedCourses.size,
      totalAsignaciones: assignments.length,
      docentesAsignados: assignedTeachers.size,
      aulasAsignadas: assignedClassrooms.size
    };
  }, [courses, assignments]);

  const openCreateCourse = () => {
    setShowCreateCourse(true);
    setSelectedCourse(null);
    setSuccessMessage('');
    setError('');

    setCourseForm({
      nombre: ''
    });

    setAssignmentForm({
        docente_id: '',
        aula_id: ''
    });
  };

  const closeCourseModal = () => {
    setShowCreateCourse(false);
    setSelectedCourse(null);
    setCourseForm({ nombre: '' });
    setAssignmentForm({
      docente_id: '',
      aula_id: ''
    });
    setError('');
    setSuccessMessage('');
  };

  const closeConfirmModal = () => {
    setConfirmModal(null);
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setShowCreateCourse(false);
    setSuccessMessage('');
    setError('');

    setCourseForm({
      nombre: course.nombre || ''
    });

    setAssignmentForm({
        docente_id: '',
        aula_id: ''
    });
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setSuccessMessage('');

      if (!courseForm.nombre.trim()) {
        setError('El nombre del curso es obligatorio.');
        return;
      }

      setSavingCourse(true);

      if (showCreateCourse) {
        await createCourse({
          nombre: courseForm.nombre.trim()
        });

        setSuccessMessage('Curso creado correctamente.');
      } else if (selectedCourse) {
        await updateCourse({
          id: selectedCourse.id,
          payload: {
            nombre: courseForm.nombre.trim()
          }
        });

        setSuccessMessage('Curso actualizado correctamente.');
      }

      setShowCreateCourse(false);
      setSelectedCourse(null);

      await loadData({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo guardar el curso.'
      );
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = (course) => {
    const courseAssignments = assignmentsByCourse[Number(course.id)] || [];

    if (courseAssignments.length > 0) {
      setError(
        'No se puede eliminar un curso con asignaciones. Primero elimina sus asignaciones docente-curso-aula.'
      );
      return;
    }

    setConfirmModal({
      type: 'danger',
      title: 'Eliminar curso',
      description: `¿Deseas eliminar el curso ${course.nombre}? Esta acción no se podrá deshacer.`,
      confirmText: 'Eliminar curso',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          setError('');
          setSuccessMessage('');
          setDeletingCourseId(course.id);

          await deleteCourse(course.id);

          setSuccessMessage('Curso eliminado correctamente.');

          if (selectedCourse?.id === course.id) {
            setSelectedCourse(null);
          }

          await loadData({ silent: true });
        } catch (error) {
          setError(
            error?.response?.data?.error ||
            'No se pudo eliminar el curso.'
          );
        } finally {
          setDeletingCourseId(null);
          closeConfirmModal();
        }
      }
    });
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();

    if (!selectedCourse) {
      setError('Selecciona un curso para crear una asignación.');
      return;
    }

    try {
      setError('');
      setSuccessMessage('');

      if (!assignmentForm.docente_id || !assignmentForm.aula_id) {
        setError('Docente y aula son obligatorios para la asignación.');
        return;
      }

      setSavingAssignment(true);

      await createTeacherCourse({
        docente_id: Number(assignmentForm.docente_id),
        curso_id: Number(selectedCourse.id),
        aula_id: Number(assignmentForm.aula_id)
      });

      setSuccessMessage('Asignación creada correctamente.');

      setAssignmentForm({
        docente_id: '',
        aula_id: ''
        });

      await loadData({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo crear la asignación.'
      );
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = (assignment) => {
    setConfirmModal({
      type: 'danger',
      title: 'Eliminar asignación',
      description: `¿Deseas eliminar la asignación de ${assignment.docente} en ${assignment.grado} ${assignment.seccion} - ${assignment.turno}?`,
      confirmText: 'Eliminar asignación',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          setError('');
          setSuccessMessage('');
          setDeletingAssignmentId(assignment.id);

          await deleteTeacherCourse(assignment.id);

          setSuccessMessage('Asignación eliminada correctamente.');

          await loadData({ silent: true });
        } catch (error) {
          setError(
            error?.response?.data?.error ||
            'No se pudo eliminar la asignación.'
          );
        } finally {
          setDeletingAssignmentId(null);
          closeConfirmModal();
        }
      }
    });
  };

  const handleAssignmentChange = (name, value) => {
    setAssignmentForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando cursos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-brand-950 text-white shadow-soft p-6 lg:p-8">
        <div className="absolute -top-28 -right-24 w-80 h-80 bg-gold-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-28 -left-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div>
            <p className="text-sm font-extrabold text-gold-500 uppercase tracking-[0.2em]">
              Gestión académica
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              Cursos y Asignaciones
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Gestiona cursos y vincula docentes con cursos y aulas activas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => loadData({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-extrabold hover:bg-white/20 disabled:opacity-60 transition"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              Actualizar
            </button>

            <button
              type="button"
              onClick={openCreateCourse}
              className="inline-flex items-center justify-center gap-2 bg-gold-500 text-brand-950 px-4 py-3 rounded-xl font-extrabold hover:bg-gold-100 transition"
            >
              <Plus size={18} />
              Nuevo curso
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <CounterCard
          icon={BookOpen}
          label="Cursos"
          value={counters.totalCursos}
          description="Cursos registrados"
        />

        <CounterCard
          icon={ClipboardList}
          label="Asignaciones"
          value={counters.totalAsignaciones}
          description="Docente-curso-aula"
        />

        <CounterCard
          icon={UserRoundCheck}
          label="Docentes"
          value={counters.docentesAsignados}
          description="Docentes asignados"
        />

        <CounterCard
          icon={LayoutGrid}
          label="Aulas"
          value={counters.aulasAsignadas}
          description="Aulas con cursos"
        />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />

          <input
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                search: e.target.value
              }))
            }
            placeholder="Buscar curso por nombre o ID..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          />
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-brand-950">
              Listado de cursos
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Gestiona cursos y abre la edición en una ventana emergente.
            </p>
          </div>

          <span className="hidden sm:inline-flex rounded-full px-3 py-1 text-xs font-extrabold bg-brand-50 text-brand-900 border border-brand-100">
            {filteredCourses.length} resultado(s)
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[calc(100vh-360px)] min-h-[420px] overflow-y-auto">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                assignmentCount={(assignmentsByCourse[Number(course.id)] || []).length}
                active={selectedCourse?.id === course.id}
                deleting={deletingCourseId === course.id}
                onSelect={() => handleSelectCourse(course)}
                onDelete={() => handleDeleteCourse(course)}
              />
            ))
          ) : (
            <EmptyBlock text="No se encontraron cursos con los filtros aplicados." />
          )}
        </div>
      </section>

      {(showCreateCourse || selectedCourse) && (
        <CourseModal onClose={closeCourseModal}>
          <CourseDetailPanel
            mode={showCreateCourse ? 'create' : 'edit'}
            selectedCourse={selectedCourse}
            courseForm={courseForm}
            onCourseNameChange={(value) =>
              setCourseForm({
                nombre: value
              })
            }
            onSaveCourse={handleSaveCourse}
            savingCourse={savingCourse}
            assignments={selectedCourseAssignments}
            assignmentForm={assignmentForm}
            teachers={activeTeachers}
            classrooms={classrooms}
            savingAssignment={savingAssignment}
            deletingAssignmentId={deletingAssignmentId}
            onAssignmentChange={handleAssignmentChange}
            onCreateAssignment={handleCreateAssignment}
            onDeleteAssignment={handleDeleteAssignment}
          />
        </CourseModal>
      )}

      {confirmModal && (
        <ConfirmModal
          config={confirmModal}
          onClose={closeConfirmModal}
        />
      )}
    </main>
  );
}

function CourseModal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] bg-brand-950/70 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6">
      <section className="relative w-full lg:max-w-5xl max-h-[92vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 flex items-center justify-center transition shadow-sm"
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        {children}
      </section>
    </div>
  );
}

function ConfirmModal({ config, onClose }) {
  const danger = config.type === 'danger';

  const handleConfirm = async () => {
    if (config.onConfirm) {
      await config.onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-brand-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <section className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-soft border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              danger
                ? 'bg-red-50 text-danger'
                : 'bg-brand-50 text-brand-900'
            }`}
          >
            {danger ? <Trash2 size={24} /> : <AlertCircle size={24} />}
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-brand-950">
              {config.title || 'Confirmar acción'}
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              {config.description || '¿Deseas continuar?'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-extrabold hover:bg-slate-100 transition"
          >
            {config.cancelText || 'Cancelar'}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`inline-flex items-center justify-center px-4 py-3 rounded-xl font-extrabold transition ${
              danger
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-brand-900 text-white hover:bg-brand-800'
            }`}
          >
            {config.confirmText || 'Confirmar'}
          </button>
        </div>
      </section>
    </div>
  );
}

function CourseRow({
  course,
  assignmentCount,
  active,
  deleting,
  onSelect,
  onDelete
}) {
  return (
    <div className={`p-5 hover:bg-slate-50 transition ${active ? 'bg-brand-50' : ''}`}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px_180px] lg:items-center gap-4">
        <button
          type="button"
          onClick={onSelect}
          className="text-left flex items-start gap-3 min-w-0"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-900 text-white flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>

          <div className="min-w-0">
            <p className="font-extrabold text-brand-950 truncate">
              {course.nombre}
            </p>

            <p className="text-sm text-slate-500 mt-1">
              Curso #{course.id}
            </p>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3 w-full">
          <MiniMetric label="Asignaciones" value={assignmentCount} />
          <MiniMetric label="ID" value={course.id} />
        </div>

        <div className="flex justify-start lg:justify-end gap-2">
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-brand-50 text-brand-900 font-extrabold text-xs hover:bg-brand-100 transition"
          >
            <Edit3 size={16} />
            Editar
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting || assignmentCount > 0}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-danger font-extrabold text-xs hover:bg-red-100 disabled:opacity-40 transition"
            title={assignmentCount > 0 ? 'Elimina asignaciones primero' : 'Eliminar curso'}
          >
            {deleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function CourseDetailPanel({
  mode,
  selectedCourse,
  courseForm,
  onCourseNameChange,
  onSaveCourse,
  savingCourse,
  assignments,
  assignmentForm,
  teachers,
  classrooms,
  savingAssignment,
  deletingAssignmentId,
  onAssignmentChange,
  onCreateAssignment,
  onDeleteAssignment
}) {
  const canAssign = mode === 'edit' && selectedCourse;

  return (
    <div className="space-y-5">
      <form
        onSubmit={onSaveCourse}
        className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6 space-y-5"
      >
        <div className="flex items-center gap-3 pr-10">
          <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
            <GraduationCap size={23} />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-brand-950">
              {mode === 'create' ? 'Nuevo curso' : 'Editar curso'}
            </h2>

            <p className="text-sm text-slate-500">
              {mode === 'create'
                ? 'Registra un nuevo curso académico.'
                : `Curso #${selectedCourse?.id}`}
            </p>
          </div>
        </div>

        <InputField
          label="Nombre del curso"
          value={courseForm.nombre}
          onChange={onCourseNameChange}
          placeholder="Ej. Matemática"
        />

        <button
          type="submit"
          disabled={savingCourse}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
        >
          {savingCourse ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <CheckCircle2 size={18} />
          )}
          {mode === 'create' ? 'Crear curso' : 'Guardar curso'}
        </button>
      </form>

      {canAssign && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-brand-950">
              Asignaciones del curso
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Vincula este curso con un docente y un aula activa.
            </p>
          </div>

          <form onSubmit={onCreateAssignment} className="p-6 space-y-4 border-b border-slate-100">
            <SelectField
              label="Docente"
              value={assignmentForm.docente_id}
              onChange={(value) => onAssignmentChange('docente_id', value)}
              options={[
                { value: '', label: 'Selecciona un docente' },
                ...teachers.map((teacher) => ({
                  value: teacher.id,
                  label: `${teacher.nombres} ${teacher.apellidos} · ${teacher.especialidad || 'Sin especialidad'}`
                }))
              ]}
            />

            <SelectField
              label="Aula"
              value={assignmentForm.aula_id}
              onChange={(value) => onAssignmentChange('aula_id', value)}
              options={[
                { value: '', label: 'Selecciona un aula' },
                ...classrooms.map((classroom) => ({
                  value: classroom.id,
                  label: `${classroom.grado} ${classroom.seccion} - ${classroom.turno} · Vacantes ${classroom.vacantes}`
                }))
              ]}
            />

            <button
              type="submit"
              disabled={savingAssignment}
              className="w-full inline-flex items-center justify-center gap-2 bg-gold-500 text-brand-950 px-5 py-3 rounded-xl font-extrabold hover:bg-gold-100 disabled:opacity-60 transition"
            >
              {savingAssignment ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Plus size={18} />
              )}
              Crear asignación
            </button>
          </form>

          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  deleting={deletingAssignmentId === assignment.id}
                  onDelete={() => onDeleteAssignment(assignment)}
                />
              ))
            ) : (
              <EmptyBlock text="Este curso aún no tiene asignaciones." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentRow({
  assignment,
  deleting,
  onDelete
}) {
  return (
    <div className="p-5 hover:bg-slate-50 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>

          <div className="min-w-0">
            <p className="font-extrabold text-brand-950">
              {assignment.docente}
            </p>

            <p className="text-sm text-slate-500 mt-1">
              {assignment.grado} {assignment.seccion} · {assignment.turno}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Asignación #{assignment.id}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="p-2 text-slate-600 hover:text-danger hover:bg-red-50 rounded-xl transition disabled:opacity-40"
          title="Eliminar asignación"
        >
          {deleting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Trash2 size={18} />
          )}
        </button>
      </div>
    </div>
  );
}

function CounterCard({
  icon: Icon,
  label,
  value,
  description
}) {
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

function MiniMetric({ label, value }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-3 text-center">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="text-lg font-extrabold text-brand-950 mt-1">
        {Number(value || 0).toLocaleString('es-PE')}
      </p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </span>

      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
      >
        {options.map((item) => (
          <option key={`${item.value}-${item.label}`} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyBlock({ text }) {
  return (
    <div className="p-8 text-center">
      <BookOpen className="mx-auto text-slate-300" size={42} />
      <p className="text-sm text-slate-500 mt-3">
        {text}
      </p>
    </div>
  );
}

export default CoursesAdmin;