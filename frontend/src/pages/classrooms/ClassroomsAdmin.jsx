import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Edit3,
  Eye,
  GraduationCap,
  Layers,
  LayoutGrid,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  UserCheck,
  X
} from 'lucide-react';

import {
  createClassroom,
  deactivateClassroom,
  getClassrooms,
  updateClassroom
} from '../../services/classrooms.service';

import {
  createGrade,
  deleteGrade,
  getGrades,
  updateGrade
} from '../../services/grades.service';

import {
  createSection,
  deleteSection,
  getSections,
  updateSection
} from '../../services/sections.service';

const turnOptions = ['Mañana', 'Tarde'];

const tabs = [
  { id: 'aulas', label: 'Aulas', icon: Building2 },
  { id: 'grados', label: 'Grados', icon: GraduationCap },
  { id: 'secciones', label: 'Secciones', icon: Layers }
];

const statusStyles = {
  activo: 'bg-green-50 text-success border-green-100',
  inactivo: 'bg-red-50 text-danger border-red-100'
};

function ClassroomsAdmin() {
  const [activeTab, setActiveTab] = useState('aulas');

  const [classrooms, setClassrooms] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);

  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  const [showCreateClassroom, setShowCreateClassroom] = useState(false);
  const [showCreateGrade, setShowCreateGrade] = useState(false);
  const [showCreateSection, setShowCreateSection] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    estado: 'todos',
    turno: 'todos',
    grado_id: 'todos'
  });

  const [classroomForm, setClassroomForm] = useState({
    grado_id: '',
    seccion_id: '',
    turno: 'Mañana',
    capacidad: 35,
    estado: 'activo'
  });

  const [gradeForm, setGradeForm] = useState({
    nombre: ''
  });

  const [sectionForm, setSectionForm] = useState({
    nombre: ''
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [savingClassroom, setSavingClassroom] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);
  const [savingSection, setSavingSection] = useState(false);

  const [deactivatingClassroomId, setDeactivatingClassroomId] = useState(null);
  const [deletingGradeId, setDeletingGradeId] = useState(null);
  const [deletingSectionId, setDeletingSectionId] = useState(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [classroomsResponse, gradesResponse, sectionsResponse] =
        await Promise.all([
          getClassrooms(),
          getGrades(),
          getSections()
        ]);

      setClassrooms(classroomsResponse.data || []);
      setGrades(gradesResponse.data || []);
      setSections(sectionsResponse.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar los datos académicos.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const counters = useMemo(() => {
    return classrooms.reduce(
      (acc, classroom) => {
        acc.total += 1;
        acc.capacidad += Number(classroom.capacidad || 0);
        acc.matriculados += Number(classroom.matriculados || 0);
        acc.vacantes += Number(classroom.vacantes || 0);

        if (classroom.estado === 'activo') acc.activos += 1;
        if (classroom.estado === 'inactivo') acc.inactivos += 1;
        if (classroom.turno === 'Mañana') acc.manana += 1;
        if (classroom.turno === 'Tarde') acc.tarde += 1;

        return acc;
      },
      {
        total: 0,
        activos: 0,
        inactivos: 0,
        manana: 0,
        tarde: 0,
        capacidad: 0,
        matriculados: 0,
        vacantes: 0
      }
    );
  }, [classrooms]);

  const filteredClassrooms = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    return classrooms.filter((classroom) => {
      const composed = [
        classroom.grado,
        classroom.seccion,
        classroom.turno,
        classroom.estado
      ].join(' ').toLowerCase();

      const matchesSearch =
        !term ||
        composed.includes(term) ||
        String(classroom.id).includes(term);

      const matchesStatus =
        filters.estado === 'todos' ||
        classroom.estado === filters.estado;

      const matchesTurn =
        filters.turno === 'todos' ||
        classroom.turno === filters.turno;

      const matchesGrade =
        filters.grado_id === 'todos' ||
        Number(classroom.grado_id) === Number(filters.grado_id);

      return matchesSearch && matchesStatus && matchesTurn && matchesGrade;
    });
  }, [classrooms, filters]);

  const filteredGrades = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    return grades.filter((grade) =>
      !term ||
      String(grade.nombre || '').toLowerCase().includes(term) ||
      String(grade.id).includes(term)
    );
  }, [grades, filters.search]);

  const filteredSections = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    return sections.filter((section) =>
      !term ||
      String(section.nombre || '').toLowerCase().includes(term) ||
      String(section.id).includes(term)
    );
  }, [sections, filters.search]);

  const openCreatePanel = () => {
    setError('');
    setSuccessMessage('');

    if (activeTab === 'aulas') {
      setShowCreateClassroom(true);
      setSelectedClassroom(null);

      setClassroomForm({
        grado_id: grades[0]?.id || '',
        seccion_id: sections[0]?.id || '',
        turno: 'Mañana',
        capacidad: 35,
        estado: 'activo'
      });

      return;
    }

    if (activeTab === 'grados') {
      setShowCreateGrade(true);
      setSelectedGrade(null);
      setGradeForm({ nombre: '' });
      return;
    }

    if (activeTab === 'secciones') {
      setShowCreateSection(true);
      setSelectedSection(null);
      setSectionForm({ nombre: '' });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccessMessage('');

    setSelectedClassroom(null);
    setSelectedGrade(null);
    setSelectedSection(null);

    setShowCreateClassroom(false);
    setShowCreateGrade(false);
    setShowCreateSection(false);

    setFilters((prev) => ({
      ...prev,
      search: ''
    }));
  };

  const handleSelectClassroom = (classroom) => {
    setSelectedClassroom(classroom);
    setShowCreateClassroom(false);
    setError('');
    setSuccessMessage('');

    setClassroomForm({
      grado_id: classroom.grado_id || '',
      seccion_id: classroom.seccion_id || '',
      turno: classroom.turno || 'Mañana',
      capacidad: classroom.capacidad || 35,
      estado: classroom.estado || 'activo'
    });
  };

  const handleSelectGrade = (grade) => {
    setSelectedGrade(grade);
    setShowCreateGrade(false);
    setError('');
    setSuccessMessage('');
    setGradeForm({ nombre: grade.nombre || '' });
  };

  const handleSelectSection = (section) => {
    setSelectedSection(section);
    setShowCreateSection(false);
    setError('');
    setSuccessMessage('');
    setSectionForm({ nombre: section.nombre || '' });
  };

  const handleClassroomChange = (name, value) => {
    setClassroomForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateClassroomForm = () => {
    if (!classroomForm.grado_id || !classroomForm.seccion_id || !classroomForm.turno) {
      return 'Grado, sección y turno son obligatorios.';
    }

    if (Number(classroomForm.capacidad) <= 0) {
      return 'La capacidad debe ser mayor a 0.';
    }

    if (
      selectedClassroom &&
      Number(classroomForm.capacidad) < Number(selectedClassroom.matriculados || 0)
    ) {
      return `La capacidad no puede ser menor a los estudiantes matriculados (${selectedClassroom.matriculados}).`;
    }

    return '';
  };

  const handleSubmitClassroom = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setSuccessMessage('');

      const validationError = validateClassroomForm();

      if (validationError) {
        setError(validationError);
        return;
      }

      setSavingClassroom(true);

      const payload = {
        grado_id: Number(classroomForm.grado_id),
        seccion_id: Number(classroomForm.seccion_id),
        turno: classroomForm.turno,
        capacidad: Number(classroomForm.capacidad),
        estado: classroomForm.estado
      };

      if (showCreateClassroom) {
        const response = await createClassroom(payload);
        setSuccessMessage(response.message || 'Aula creada correctamente.');
      } else if (selectedClassroom) {
        const response = await updateClassroom({
          id: selectedClassroom.id,
          payload
        });

        setSuccessMessage(response.message || 'Aula actualizada correctamente.');
      }

      setShowCreateClassroom(false);
      setSelectedClassroom(null);

      await loadData({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo guardar el aula.'
      );
    } finally {
      setSavingClassroom(false);
    }
  };

  const handleDeactivateClassroom = async (classroom) => {
    const confirmed = window.confirm(
      `¿Deseas desactivar el aula ${classroom.grado} ${classroom.seccion} - ${classroom.turno}?`
    );

    if (!confirmed) return;

    try {
      setError('');
      setSuccessMessage('');
      setDeactivatingClassroomId(classroom.id);

      const response = await deactivateClassroom(classroom.id);

      setSuccessMessage(response.message || 'Aula desactivada correctamente.');

      if (selectedClassroom?.id === classroom.id) {
        setSelectedClassroom(null);
      }

      await loadData({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo desactivar el aula.'
      );
    } finally {
      setDeactivatingClassroomId(null);
    }
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setSuccessMessage('');

      if (!gradeForm.nombre.trim()) {
        setError('El nombre del grado es obligatorio.');
        return;
      }

      setSavingGrade(true);

      if (showCreateGrade) {
        const response = await createGrade({
          nombre: gradeForm.nombre.trim()
        });

        setSuccessMessage(response.message || 'Grado creado correctamente.');
      } else if (selectedGrade) {
        const response = await updateGrade({
          id: selectedGrade.id,
          payload: {
            nombre: gradeForm.nombre.trim()
          }
        });

        setSuccessMessage(response.message || 'Grado actualizado correctamente.');
      }

      setShowCreateGrade(false);
      setSelectedGrade(null);
      setGradeForm({ nombre: '' });

      await loadData({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo guardar el grado.'
      );
    } finally {
      setSavingGrade(false);
    }
  };

  const handleSubmitSection = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setSuccessMessage('');

      if (!sectionForm.nombre.trim()) {
        setError('El nombre de la sección es obligatorio.');
        return;
      }

      setSavingSection(true);

      if (showCreateSection) {
        const response = await createSection({
          nombre: sectionForm.nombre.trim()
        });

        setSuccessMessage(response.message || 'Sección creada correctamente.');
      } else if (selectedSection) {
        const response = await updateSection({
          id: selectedSection.id,
          payload: {
            nombre: sectionForm.nombre.trim()
          }
        });

        setSuccessMessage(response.message || 'Sección actualizada correctamente.');
      }

      setShowCreateSection(false);
      setSelectedSection(null);
      setSectionForm({ nombre: '' });

      await loadData({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo guardar la sección.'
      );
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteGrade = async (grade) => {
    const usedByClassrooms = classrooms.some(
      (classroom) => Number(classroom.grado_id) === Number(grade.id)
    );

    if (usedByClassrooms) {
      setError('No se puede eliminar un grado que está siendo usado por aulas.');
      return;
    }

    const confirmed = window.confirm(`¿Deseas eliminar el grado ${grade.nombre}?`);

    if (!confirmed) return;

    try {
      setError('');
      setSuccessMessage('');
      setDeletingGradeId(grade.id);

      const response = await deleteGrade(grade.id);

      setSuccessMessage(response.message || 'Grado eliminado correctamente.');

      if (selectedGrade?.id === grade.id) {
        setSelectedGrade(null);
      }

      await loadData({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo eliminar el grado.'
      );
    } finally {
      setDeletingGradeId(null);
    }
  };

  const handleDeleteSection = async (section) => {
    const usedByClassrooms = classrooms.some(
      (classroom) => Number(classroom.seccion_id) === Number(section.id)
    );

    if (usedByClassrooms) {
      setError('No se puede eliminar una sección que está siendo usada por aulas.');
      return;
    }

    const confirmed = window.confirm(`¿Deseas eliminar la sección ${section.nombre}?`);

    if (!confirmed) return;

    try {
      setError('');
      setSuccessMessage('');
      setDeletingSectionId(section.id);

      const response = await deleteSection(section.id);

      setSuccessMessage(response.message || 'Sección eliminada correctamente.');

      if (selectedSection?.id === section.id) {
        setSelectedSection(null);
      }

      await loadData({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo eliminar la sección.'
      );
    } finally {
      setDeletingSectionId(null);
    }
  };

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab);
  const ActiveIcon = activeTabMeta?.icon || Building2;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando gestión académica...
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
              Aulas, Grados y Secciones
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Administra aulas, catálogos de grados y secciones usados por matrícula, cursos y horarios.
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
              onClick={openCreatePanel}
              className="inline-flex items-center justify-center gap-2 bg-gold-500 text-brand-950 px-4 py-3 rounded-xl font-extrabold hover:bg-gold-100 transition"
            >
              <Plus size={18} />
              {activeTab === 'aulas' && 'Nueva aula'}
              {activeTab === 'grados' && 'Nuevo grado'}
              {activeTab === 'secciones' && 'Nueva sección'}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <MessageBox type="error" message={error} onClose={() => setError('')} />
      )}

      {successMessage && (
        <MessageBox type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
      )}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <CounterCard icon={Building2} label="Aulas" value={counters.total} description="Aulas registradas" />
        <CounterCard icon={GraduationCap} label="Grados" value={grades.length} description="Grados disponibles" />
        <CounterCard icon={Layers} label="Secciones" value={sections.length} description="Secciones disponibles" />
        <CounterCard icon={UserCheck} label="Vacantes" value={counters.vacantes} description="Cupos disponibles" />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-2">
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-extrabold transition ${
                  active
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-brand-50 hover:text-brand-950'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className={`relative ${activeTab === 'aulas' ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />

            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value
                }))
              }
              placeholder={
                activeTab === 'aulas'
                  ? 'Buscar por grado, sección, turno...'
                  : activeTab === 'grados'
                    ? 'Buscar grado...'
                    : 'Buscar sección...'
              }
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </div>

          {activeTab === 'aulas' && (
            <>
              <select
                value={filters.grado_id}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    grado_id: e.target.value
                  }))
                }
                className="lg:col-span-3 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
              >
                <option value="todos">Todos los grados</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.nombre}
                  </option>
                ))}
              </select>

              <select
                value={filters.turno}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    turno: e.target.value
                  }))
                }
                className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
              >
                <option value="todos">Todos los turnos</option>
                {turnOptions.map((turn) => (
                  <option key={turn} value={turn}>
                    {turn}
                  </option>
                ))}
              </select>

              <select
                value={filters.estado}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    estado: e.target.value
                  }))
                }
                className="lg:col-span-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activas</option>
                <option value="inactivo">Inactivas</option>
              </select>
            </>
          )}
        </div>
      </section>

      {activeTab === 'aulas' && (
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-7 bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
            <PanelHeader
              title="Listado de aulas"
              description="Aulas registradas con capacidad, matriculados y vacantes."
              count={filteredClassrooms.length}
            />

            <div className="divide-y divide-slate-100 max-h-[calc(100vh-360px)] min-h-[360px] overflow-y-auto">
              {filteredClassrooms.length > 0 ? (
                filteredClassrooms.map((classroom) => (
                  <ClassroomRow
                    key={classroom.id}
                    classroom={classroom}
                    active={selectedClassroom?.id === classroom.id}
                    deactivating={deactivatingClassroomId === classroom.id}
                    onSelect={() => handleSelectClassroom(classroom)}
                    onDeactivate={() => handleDeactivateClassroom(classroom)}
                  />
                ))
              ) : (
                <EmptyBlock icon={Building2} text="No se encontraron aulas con los filtros aplicados." />
              )}
            </div>
          </div>

          <div className="xl:col-span-5">
            {showCreateClassroom || selectedClassroom ? (
              <ClassroomFormPanel
                mode={showCreateClassroom ? 'create' : 'edit'}
                classroom={selectedClassroom}
                form={classroomForm}
                grades={grades}
                sections={sections}
                saving={savingClassroom}
                onChange={handleClassroomChange}
                onSubmit={handleSubmitClassroom}
              />
            ) : (
              <EmptyDetail
                icon={Building2}
                title="Selecciona un aula"
                description="Aquí podrás editar capacidad, estado o registrar una nueva aula."
              />
            )}
          </div>
        </section>
      )}

      {activeTab === 'grados' && (
        <CatalogSection
          title="Listado de grados"
          description="Catálogo dinámico de grados usados por las aulas."
          items={filteredGrades}
          selectedItem={selectedGrade}
          showCreate={showCreateGrade}
          form={gradeForm}
          formTitle={showCreateGrade ? 'Nuevo grado' : 'Editar grado'}
          formDescription={showCreateGrade ? 'Registra un grado académico.' : `Grado #${selectedGrade?.id || ''}`}
          icon={GraduationCap}
          saving={savingGrade}
          deletingId={deletingGradeId}
          onSelect={handleSelectGrade}
          onDelete={handleDeleteGrade}
          onChange={(value) => setGradeForm({ nombre: value })}
          onSubmit={handleSubmitGrade}
          emptyTitle="Selecciona un grado"
          emptyDescription="Aquí podrás crear o editar grados disponibles para las aulas."
        />
      )}

      {activeTab === 'secciones' && (
        <CatalogSection
          title="Listado de secciones"
          description="Catálogo dinámico de secciones usadas por las aulas."
          items={filteredSections}
          selectedItem={selectedSection}
          showCreate={showCreateSection}
          form={sectionForm}
          formTitle={showCreateSection ? 'Nueva sección' : 'Editar sección'}
          formDescription={showCreateSection ? 'Registra una sección académica.' : `Sección #${selectedSection?.id || ''}`}
          icon={Layers}
          saving={savingSection}
          deletingId={deletingSectionId}
          onSelect={handleSelectSection}
          onDelete={handleDeleteSection}
          onChange={(value) => setSectionForm({ nombre: value })}
          onSubmit={handleSubmitSection}
          emptyTitle="Selecciona una sección"
          emptyDescription="Aquí podrás crear o editar secciones disponibles para las aulas."
        />
      )}
    </main>
  );
}

function CatalogSection({
  title,
  description,
  items,
  selectedItem,
  showCreate,
  form,
  formTitle,
  formDescription,
  icon: Icon,
  saving,
  deletingId,
  onSelect,
  onDelete,
  onChange,
  onSubmit,
  emptyTitle,
  emptyDescription
}) {
  return (
    <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      <div className="xl:col-span-7 bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
        <PanelHeader title={title} description={description} count={items.length} />

        <div className="divide-y divide-slate-100 max-h-[calc(100vh-360px)] min-h-[360px] overflow-y-auto">
          {items.length > 0 ? (
            items.map((item) => (
              <CatalogRow
                key={item.id}
                item={item}
                icon={Icon}
                active={selectedItem?.id === item.id}
                deleting={deletingId === item.id}
                onSelect={() => onSelect(item)}
                onDelete={() => onDelete(item)}
              />
            ))
          ) : (
            <EmptyBlock icon={Icon} text="No se encontraron registros." />
          )}
        </div>
      </div>

      <div className="xl:col-span-5">
        {showCreate || selectedItem ? (
          <CatalogFormPanel
            icon={Icon}
            title={formTitle}
            description={formDescription}
            value={form.nombre}
            saving={saving}
            onChange={onChange}
            onSubmit={onSubmit}
          />
        ) : (
          <EmptyDetail
            icon={Icon}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </div>
    </section>
  );
}

function PanelHeader({ title, description, count }) {
  return (
    <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold text-brand-950">
          {title}
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          {description}
        </p>
      </div>

      <span className="hidden sm:inline-flex rounded-full px-3 py-1 text-xs font-extrabold bg-brand-50 text-brand-900 border border-brand-100">
        {count} resultado(s)
      </span>
    </div>
  );
}

function ClassroomRow({
  classroom,
  active,
  deactivating,
  onSelect,
  onDeactivate
}) {
  const statusClass = statusStyles[classroom.estado] || 'bg-slate-50 text-slate-700 border-slate-200';
  const occupancyPercent = getOccupancyPercent(classroom);

  return (
    <div className={`p-5 hover:bg-slate-50 transition ${active ? 'bg-brand-50' : ''}`}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px_120px] lg:items-center gap-4">
        <button
          type="button"
          onClick={onSelect}
          className="text-left flex items-start gap-3 min-w-0"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-900 text-white flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-extrabold text-brand-950">
                {classroom.grado} {classroom.seccion}
              </p>

              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border ${statusClass}`}>
                {classroom.estado}
              </span>
            </div>

            <p className="text-sm text-slate-500 mt-1">
              Turno {classroom.turno} · Capacidad {classroom.capacidad}
            </p>

            <div className="mt-3 w-full max-w-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Ocupación</span>
                <span>{classroom.matriculados}/{classroom.capacidad}</span>
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-900 rounded-full"
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
            </div>
          </div>
        </button>

        <div className="grid grid-cols-3 gap-3 w-full">
          <MiniMetric label="Matric." value={classroom.matriculados} />
          <MiniMetric label="Vacantes" value={classroom.vacantes} />
          <MiniMetric label="ID" value={classroom.id} />
        </div>

        <div className="flex justify-start lg:justify-end gap-2">
          <button
            type="button"
            onClick={onSelect}
            className="p-2 text-brand-900 hover:bg-brand-50 rounded-xl transition"
            title="Ver detalle"
          >
            <Eye size={18} />
          </button>

          <button
            type="button"
            onClick={onSelect}
            className="p-2 text-slate-600 hover:text-brand-900 hover:bg-brand-50 rounded-xl transition"
            title="Editar"
          >
            <Edit3 size={18} />
          </button>

          <button
            type="button"
            onClick={onDeactivate}
            disabled={deactivating || classroom.estado === 'inactivo'}
            className="p-2 text-slate-600 hover:text-danger hover:bg-red-50 rounded-xl transition disabled:opacity-40"
            title="Desactivar"
          >
            {deactivating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <X size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CatalogRow({
  item,
  icon: Icon,
  active,
  deleting,
  onSelect,
  onDelete
}) {
  return (
    <div className={`p-5 hover:bg-slate-50 transition ${active ? 'bg-brand-50' : ''}`}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_120px] lg:items-center gap-4">
        <button
          type="button"
          onClick={onSelect}
          className="text-left flex items-start gap-3 min-w-0"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-900 text-white flex items-center justify-center shrink-0">
            <Icon size={24} />
          </div>

          <div className="min-w-0">
            <p className="font-extrabold text-brand-950">
              {item.nombre}
            </p>

            <p className="text-sm text-slate-500 mt-1">
              Registro #{item.id}
            </p>
          </div>
        </button>

        <div className="flex justify-start lg:justify-end gap-2">
          <button
            type="button"
            onClick={onSelect}
            className="p-2 text-brand-900 hover:bg-brand-50 rounded-xl transition"
            title="Ver detalle"
          >
            <Eye size={18} />
          </button>

          <button
            type="button"
            onClick={onSelect}
            className="p-2 text-slate-600 hover:text-brand-900 hover:bg-brand-50 rounded-xl transition"
            title="Editar"
          >
            <Edit3 size={18} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="p-2 text-slate-600 hover:text-danger hover:bg-red-50 rounded-xl transition disabled:opacity-40"
            title="Eliminar"
          >
            {deleting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClassroomFormPanel({
  mode,
  classroom,
  form,
  grades,
  sections,
  saving,
  onChange,
  onSubmit
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
          <LayoutGrid size={23} />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-brand-950">
            {mode === 'create' ? 'Nueva aula' : 'Editar aula'}
          </h2>

          <p className="text-sm text-slate-500">
            {mode === 'create'
              ? 'Registra un aula por grado, sección y turno.'
              : `Aula #${classroom?.id || ''}`}
          </p>
        </div>
      </div>

      <SelectField
        label="Grado"
        value={form.grado_id}
        onChange={(value) => onChange('grado_id', value)}
        options={[
          { value: '', label: 'Selecciona un grado' },
          ...grades.map((grade) => ({
            value: grade.id,
            label: grade.nombre
          }))
        ]}
      />

      <SelectField
        label="Sección"
        value={form.seccion_id}
        onChange={(value) => onChange('seccion_id', value)}
        options={[
          { value: '', label: 'Selecciona una sección' },
          ...sections.map((section) => ({
            value: section.id,
            label: section.nombre
          }))
        ]}
      />

      <SelectField
        label="Turno"
        value={form.turno}
        onChange={(value) => onChange('turno', value)}
        options={turnOptions.map((turn) => ({
          value: turn,
          label: turn
        }))}
      />

      <InputField
        label="Capacidad"
        type="number"
        value={form.capacidad}
        onChange={(value) => onChange('capacidad', value)}
      />

      <SelectField
        label="Estado"
        value={form.estado}
        onChange={(value) => onChange('estado', value)}
        options={[
          { value: 'activo', label: 'Activo' },
          { value: 'inactivo', label: 'Inactivo' }
        ]}
      />

      {mode === 'edit' && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-2 gap-3">
          <MiniMetric label="Matriculados" value={classroom?.matriculados} />
          <MiniMetric label="Vacantes" value={classroom?.vacantes} />
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
      >
        {saving ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <CheckCircle2 size={18} />
        )}
        {mode === 'create' ? 'Crear aula' : 'Guardar cambios'}
      </button>

      <p className="text-xs text-slate-500">
        Las aulas inactivas no estarán disponibles para matrícula ni comunicados.
      </p>
    </form>
  );
}

function CatalogFormPanel({
  icon: Icon,
  title,
  description,
  value,
  saving,
  onChange,
  onSubmit
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center">
          <Icon size={23} />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-brand-950">
            {title}
          </h2>

          <p className="text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <InputField
        label="Nombre"
        value={value}
        onChange={onChange}
        placeholder="Escribe el nombre"
      />

      <button
        type="submit"
        disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
      >
        {saving ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <CheckCircle2 size={18} />
        )}
        Guardar
      </button>

      <p className="text-xs text-slate-500">
        Si el registro está siendo usado por aulas, no podrá eliminarse.
      </p>
    </form>
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
  placeholder,
  type = 'text'
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </span>

      <input
        type={type}
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

      <button
        type="button"
        onClick={onClose}
        className="font-extrabold"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function EmptyBlock({ icon: Icon, text }) {
  return (
    <div className="p-8 text-center">
      <Icon className="mx-auto text-slate-300" size={42} />

      <p className="text-sm text-slate-500 mt-3">
        {text}
      </p>
    </div>
  );
}

function EmptyDetail({
  icon: Icon,
  title,
  description
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-8 text-center">
      <Icon className="mx-auto text-slate-300" size={46} />

      <h2 className="text-xl font-extrabold text-brand-950 mt-4">
        {title}
      </h2>

      <p className="text-sm text-slate-500 mt-2">
        {description}
      </p>
    </div>
  );
}

function getOccupancyPercent(classroom) {
  const capacidad = Number(classroom.capacidad || 0);
  const matriculados = Number(classroom.matriculados || 0);

  if (capacidad <= 0) return 0;

  return Math.min(Math.round((matriculados / capacidad) * 100), 100);
}

export default ClassroomsAdmin;