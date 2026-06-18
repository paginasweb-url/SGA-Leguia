import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  Users,
  UserX,
  X
} from 'lucide-react';

import {
  createAdministrativeUser,
  createTeacher,
  deactivateGuardian,
  deactivateStudent,
  deactivateTeacher,
  deactivateUser,
  getGuardians,
  getStudents,
  getTeachers,
  getUsers,
  updateGuardian,
  updateStudent,
  updateTeacher,
  updateUser
} from '../../services/usersManagement.service';

import { getRole } from '../../utils/storage';

const roleIds = {
  Administrativo: 2,
  Auxiliar: 3
};

const rolePrefix = {
  Administrativo: 'AD',
  Auxiliar: 'AX',
  Docente: 'D'
};

const roleStyles = {
  Director: 'bg-brand-900 text-white border-brand-900',
  Administrativo: 'bg-gold-50 text-gold-700 border-gold-100',
  Auxiliar: 'bg-blue-50 text-blue-700 border-blue-100',
  Docente: 'bg-green-50 text-success border-green-100',
  Estudiante: 'bg-slate-50 text-slate-700 border-slate-200',
  Apoderado: 'bg-purple-50 text-purple-700 border-purple-100'
};

const statusStyles = {
  activo: 'bg-green-50 text-success border-green-100',
  inactivo: 'bg-red-50 text-danger border-red-100'
};

function UsersAdmin() {
  const role = getRole();
  const isDirector = role === 'Director';

  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [guardians, setGuardians] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    rol: 'todos',
    estado: 'todos'
  });

  const [createForm, setCreateForm] = useState({
    tipo: isDirector ? 'Docente' : 'Docente',
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    especialidad: '',
    password_hash: '',
    estado: 'activo'
  });

  const [editForm, setEditForm] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    estado: 'activo',
    especialidad: '',
    codigo_estudiante: '',
    fecha_nacimiento: '',
    direccion: ''
  });

  const [credentials, setCredentials] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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

  const availableCreateTypes = isDirector
    ? ['Docente', 'Administrativo', 'Auxiliar']
    : ['Docente'];

  const availableRoleFilters = isDirector
    ? ['Director', 'Administrativo', 'Auxiliar', 'Docente', 'Estudiante', 'Apoderado']
    : ['Docente', 'Estudiante', 'Apoderado'];

  const loadData = async ({ silent = false } = {}) => {
    try {
      setError('');

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [usersResponse, studentsResponse, teachersResponse, guardiansResponse] =
        await Promise.all([
          getUsers(),
          getStudents(),
          getTeachers(),
          getGuardians()
        ]);

      setUsers(usersResponse.data || []);
      setStudents(studentsResponse.data || []);
      setTeachers(teachersResponse.data || []);
      setGuardians(guardiansResponse.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudieron cargar los usuarios.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const teacherByUserId = useMemo(() => {
    return new Map(teachers.map((item) => [item.user_id, item]));
  }, [teachers]);

  const studentByUserId = useMemo(() => {
    return new Map(students.map((item) => [item.user_id, item]));
  }, [students]);

  const guardianByUserId = useMemo(() => {
    return new Map(guardians.map((item) => [item.user_id, item]));
  }, [guardians]);

  const enrichedUsers = useMemo(() => {
    return users.map((user) => {
      let profile = null;

      if (user.rol === 'Docente') {
        profile = teacherByUserId.get(user.id) || null;
      }

      if (user.rol === 'Estudiante') {
        profile = studentByUserId.get(user.id) || null;
      }

      if (user.rol === 'Apoderado') {
        profile = guardianByUserId.get(user.id) || null;
      }

      return {
        ...user,
        profile
      };
    });
  }, [users, teacherByUserId, studentByUserId, guardianByUserId]);

  const filteredUsers = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    return enrichedUsers.filter((user) => {
      const fullName = `${user.nombres || ''} ${user.apellidos || ''}`.toLowerCase();

      const matchesSearch =
        !term ||
        fullName.includes(term) ||
        String(user.dni || '').toLowerCase().includes(term) ||
        String(user.username || '').toLowerCase().includes(term) ||
        String(user.correo || '').toLowerCase().includes(term);

      const matchesRole =
        filters.rol === 'todos' ||
        user.rol === filters.rol;

      const matchesStatus =
        filters.estado === 'todos' ||
        String(user.estado || '').toLowerCase() === filters.estado;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [enrichedUsers, filters]);

  const counters = useMemo(() => {
    return filteredUsers.reduce(
      (acc, user) => {
        acc.total += 1;

        if (String(user.estado).toLowerCase() === 'activo') {
          acc.activos += 1;
        }

        if (String(user.estado).toLowerCase() === 'inactivo') {
          acc.inactivos += 1;
        }

        acc.roles.add(user.rol);

        return acc;
      },
      {
        total: 0,
        activos: 0,
        inactivos: 0,
        roles: new Set()
      }
    );
  }, [filteredUsers]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setShowCreate(false);
    setCredentials(null);
    setError('');
    setSuccessMessage('');

    setEditForm({
      nombres: user.nombres || '',
      apellidos: user.apellidos || '',
      telefono: user.telefono || '',
      estado: user.estado || 'activo',
      especialidad: user.profile?.especialidad || '',
      codigo_estudiante: user.profile?.codigo_estudiante || '',
      fecha_nacimiento: formatInputDate(user.profile?.fecha_nacimiento),
      direccion: user.profile?.direccion || ''
    });
  };

  const onlyDigits = (value) => {
    return String(value || '').replace(/\D/g, '');
  };

  const isValidDni = (value) => {
    return /^\d{8}$/.test(String(value || ''));
  };

  const isValidPeruvianPhone = (value) => {
    return /^9\d{8}$/.test(String(value || ''));
  };

  const numericFieldMaxLength = {
    dni: 8,
    telefono: 9
  };

  const handleCreateChange = (name, value) => {
    let nextValue = value;

    if (numericFieldMaxLength[name]) {
      nextValue = onlyDigits(value).slice(0, numericFieldMaxLength[name]);
    }

    setCreateForm((prev) => ({
      ...prev,
      [name]: nextValue
    }));
  };

  const handleEditChange = (name, value) => {
    setEditForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const buildCredentialPreview = ({ tipo, dni, password }) => {
    const prefix = rolePrefix[tipo];

    if (!prefix || !dni) return null;

    return {
      username: `${prefix}${dni}`,
      correo: `${prefix}${dni}@abl.edu.pe`,
      password_inicial: password
    };
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setSuccessMessage('');
      setCredentials(null);

      const {
        tipo,
        nombres,
        apellidos,
        dni,
        telefono,
        especialidad,
        password_hash,
        estado
      } = createForm;

      if (!nombres.trim() || !apellidos.trim() || !dni.trim()) {
        setError('Nombres, apellidos y DNI son obligatorios.');
        return;
      }

      if (!isValidDni(createForm.dni)) {
        setError('El DNI debe contener exactamente 8 números.');
        return;
      }

      if (createForm.telefono && !isValidPeruvianPhone(createForm.telefono)) {
        setError('El teléfono debe contener 9 dígitos y empezar con 9.');
        return;
      }

      const initialPassword = password_hash.trim() || dni.trim();

      if (tipo === 'Docente' && !especialidad.trim()) {
        setError('La especialidad del docente es obligatoria.');
        return;
      }

      setCreating(true);

      if (tipo === 'Docente') {
        await createTeacher({
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          dni: dni.trim(),
          telefono: telefono.trim() || null,
          especialidad: especialidad.trim(),
          password_hash: initialPassword,
          estado
        });
      } else {
        if (!isDirector) {
          setError('Solo el Director puede crear administrativos o auxiliares.');
          return;
        }

        await createAdministrativeUser({
          rol_id: roleIds[tipo],
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          dni: dni.trim(),
          telefono: telefono.trim() || null,
          password_hash: initialPassword,
          estado
        });
      }

      const preview = buildCredentialPreview({
        tipo,
        dni: dni.trim(),
        password: initialPassword
      });

      setCredentials(preview);
      setSuccessMessage(`${tipo} creado correctamente.`);

      setCreateForm({
        tipo: availableCreateTypes[0],
        nombres: '',
        apellidos: '',
        dni: '',
        telefono: '',
        especialidad: '',
        password_hash: '',
        estado: 'activo'
      });

      await loadData({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo crear el usuario.'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!selectedUser) return;

    try {
      setError('');
      setSuccessMessage('');
      if (selectedUser.rol === 'Director' && editForm.estado !== 'activo') {
        setError('No se permite cambiar el estado de un usuario Director a inactivo.');
        return;
      }
      setSaving(true);

      const basePayload = {
        nombres: editForm.nombres.trim(),
        apellidos: editForm.apellidos.trim(),
        telefono: editForm.telefono.trim() || null,
        estado: editForm.estado
      };

      if (!basePayload.nombres || !basePayload.apellidos) {
        setError('Nombres y apellidos son obligatorios.');
        return;
      }

      if (selectedUser.rol === 'Docente' && selectedUser.profile?.id) {
        await updateTeacher({
          id: selectedUser.profile.id,
          payload: {
            ...basePayload,
            especialidad: editForm.especialidad.trim()
          }
        });
      } else if (selectedUser.rol === 'Estudiante' && selectedUser.profile?.id) {
        await updateStudent({
          id: selectedUser.profile.id,
          payload: {
            ...basePayload,
            codigo_estudiante: editForm.codigo_estudiante,
            fecha_nacimiento: editForm.fecha_nacimiento || null,
            direccion: editForm.direccion.trim() || null
          }
        });
      } else if (selectedUser.rol === 'Apoderado' && selectedUser.profile?.id) {
        await updateGuardian({
          id: selectedUser.profile.id,
          payload: basePayload
        });
      } else {
        await updateUser({
          id: selectedUser.id,
          payload: basePayload
        });
      }

      setSuccessMessage('Usuario actualizado correctamente.');

      setSelectedUser(null);

      await loadData({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo actualizar el usuario.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (user) => {
    if (user.rol === 'Director') {
      setError('No se permite desactivar usuarios Directores.');
      return;
    }

    const confirmed = window.confirm(
      `¿Deseas desactivar a ${user.nombres} ${user.apellidos}?`
    );

    if (!confirmed) return;

    try {
      setError('');
      setSuccessMessage('');
      setDeactivatingId(user.id);

      if (user.rol === 'Docente' && user.profile?.id) {
        await deactivateTeacher(user.profile.id);
      } else if (user.rol === 'Estudiante' && user.profile?.id) {
        await deactivateStudent(user.profile.id);
      } else if (user.rol === 'Apoderado' && user.profile?.id) {
        await deactivateGuardian(user.profile.id);
      } else {
        await deactivateUser(user.id);
      }

      setSuccessMessage('Usuario desactivado correctamente.');

      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }

      await loadData({ silent: true });
    } catch (error) {
      setError(
        error?.response?.data?.error ||
        'No se pudo desactivar el usuario.'
      );
    } finally {
      setDeactivatingId(null);
    }
  };

  const copyText = async (text) => {
    if (!text) return;

    await navigator.clipboard.writeText(String(text));
    toast.success('Copiado al portapapeles.');
  };

  const openCreatePanel = () => {
    setShowCreate(true);
    setSelectedUser(null);
    setCredentials(null);
    setError('');
    setSuccessMessage('');
  };

  const closeUserModal = () => {
    setShowCreate(false);
    setSelectedUser(null);
    setCredentials(null);
    setError('');
    setSuccessMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-brand-900" size={36} />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Cargando usuarios...
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
              Gestión institucional
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold mt-3">
              Gestión de Usuarios
            </h1>

            <p className="text-blue-100 mt-3 max-w-2xl">
              Administra usuarios institucionales, estados y perfiles vinculados.
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
              Nuevo usuario
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <CounterCard icon={Users} label="Total" value={counters.total} description="Usuarios visibles" />
        <CounterCard icon={CheckCircle2} label="Activos" value={counters.activos} description="Usuarios activos" />
        <CounterCard icon={UserX} label="Inactivos" value={counters.inactivos} description="Usuarios inactivos" />
        <CounterCard icon={ShieldCheck} label="Roles" value={counters.roles.size} description="Roles en listado" />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="relative lg:col-span-6">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value
                }))
              }
              placeholder="Buscar por nombre, DNI, usuario o correo..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
            />
          </div>

          <select
            value={filters.rol}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                rol: e.target.value
              }))
            }
            className="lg:col-span-3 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="todos">Todos los roles</option>
            {availableRoleFilters.map((item) => (
              <option key={item} value={item}>
                {item}
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
            className="lg:col-span-3 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-soft overflow-hidden">
        <div className="hidden md:grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">Usuario</div>
          <div className="col-span-3">Correo</div>
          <div className="col-span-2 text-center">Rol</div>
          <div className="col-span-1 text-center">Estado</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[calc(100vh-420px)] min-h-[420px] overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                active={selectedUser?.id === user.id}
                deactivating={deactivatingId === user.id}
                onSelect={() => handleSelectUser(user)}
                onDeactivate={() => handleDeactivate(user)}
              />
            ))
          ) : (
            <EmptyBlock text="No se encontraron usuarios con los filtros aplicados." />
          )}
        </div>
      </section>

      {showCreate && (
        <UserModal onClose={closeUserModal}>
          <div className="space-y-4">
            {credentials && (
              <CredentialsBox credentials={credentials} onCopy={copyText} />
            )}

            <CreateUserPanel
              form={createForm}
              availableCreateTypes={availableCreateTypes}
              isDirector={isDirector}
              creating={creating}
              onChange={handleCreateChange}
              onSubmit={handleCreate}
            />
          </div>
        </UserModal>
      )}

      {selectedUser && (
        <UserModal onClose={closeUserModal}>
          <UserDetailPanel
            user={selectedUser}
            form={editForm}
            saving={saving}
            onChange={handleEditChange}
            onSubmit={handleUpdate}
            onCopy={copyText}
          />
        </UserModal>
      )}
    </main>
  );
}

function UserModal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] bg-brand-950/70 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6">
      <section className="relative w-full lg:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl">
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

function UserRow({
  user,
  active,
  deactivating,
  onSelect,
  onDeactivate
}) {
  const initials = getInitials(user);
  const roleClass = roleStyles[user.rol] || 'bg-slate-50 text-slate-700 border-slate-200';
  const statusClass = statusStyles[String(user.estado).toLowerCase()] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 px-5 md:px-6 py-5 items-center hover:bg-slate-50 transition ${active ? 'bg-brand-50' : ''}`}>
      <button
        type="button"
        onClick={onSelect}
        className="col-span-4 flex items-center gap-3 mb-4 md:mb-0 text-left min-w-0"
      >
        <div className="w-11 h-11 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-extrabold shrink-0">
          {initials}
        </div>

        <div className="min-w-0">
          <p className="font-extrabold text-brand-950 truncate">
            {user.nombres} {user.apellidos}
          </p>

          <p className="text-xs text-slate-500 truncate">
            {user.username || 'Sin usuario'} · DNI {user.dni}
          </p>

          <p className="text-xs text-slate-400 md:hidden mt-1">
            {user.rol} · {user.estado}
          </p>
        </div>
      </button>

      <div className="col-span-3 mb-3 md:mb-0 text-sm text-slate-600 break-all">
        {user.correo || 'No precisa'}
      </div>

      <div className="col-span-2 mb-3 md:mb-0 md:text-center">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border ${roleClass}`}>
          {user.rol}
        </span>
      </div>

      <div className="col-span-1 mb-4 md:mb-0 md:text-center">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold border ${statusClass}`}>
          {user.estado}
        </span>
      </div>

      <div className="col-span-2 flex justify-start md:justify-end gap-2">
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

        {user.rol !== 'Director' && (
          <button
            type="button"
            onClick={onDeactivate}
            disabled={deactivating || String(user.estado).toLowerCase() === 'inactivo'}
            className="p-2 text-slate-600 hover:text-danger hover:bg-red-50 rounded-xl transition disabled:opacity-40"
            title="Desactivar"
          >
            {deactivating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <UserX size={18} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function CreateUserPanel({
  form,
  availableCreateTypes,
  isDirector,
  creating,
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
          <UserCog size={23} />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-brand-950">
            Nuevo usuario
          </h2>

          <p className="text-sm text-slate-500">
            Crea docentes, administrativos o auxiliares según tu rol.
          </p>
        </div>
      </div>

      <SelectField
        label="Tipo de usuario"
        value={form.tipo}
        onChange={(value) => onChange('tipo', value)}
        options={availableCreateTypes.map((item) => ({
          value: item,
          label: item
        }))}
      />

      {!isDirector && form.tipo !== 'Docente' && (
        <div className="bg-yellow-50 border border-yellow-100 text-warning rounded-2xl p-4 text-sm font-semibold">
          Solo el Director puede crear administrativos o auxiliares.
        </div>
      )}

      <InputField label="Nombres" value={form.nombres} onChange={(value) => onChange('nombres', value)} />
      <InputField label="Apellidos" value={form.apellidos} onChange={(value) => onChange('apellidos', value)} />
      <InputField
        label="DNI"
        value={form.dni}
        onChange={(value) => onChange('dni', value)}
        placeholder="12345678"
        maxLength={8}
        inputMode="numeric"
        pattern="[0-9]{8}"
        helperText="Debe contener exactamente 8 dígitos."
      />

      <InputField
        label="Teléfono"
        value={form.telefono}
        onChange={(value) => onChange('telefono', value)}
        placeholder="987654321"
        maxLength={9}
        inputMode="numeric"
        pattern="9[0-9]{8}"
        helperText="Debe tener 9 dígitos y empezar con 9."
      />

      {form.tipo === 'Docente' && (
        <InputField
          label="Especialidad"
          value={form.especialidad}
          onChange={(value) => onChange('especialidad', value)}
          placeholder="Ej. Matemática"
        />
      )}

      <InputField
        label="Contraseña inicial"
        value={form.password_hash}
        onChange={(value) => onChange('password_hash', value)}
        placeholder="Si se deja vacío, se usará el DNI"
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

      <button
        type="submit"
        disabled={creating}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-brand-800 disabled:opacity-60 transition"
      >
        {creating ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Plus size={18} />
        )}
        Crear usuario
      </button>

      <p className="text-xs text-slate-500">
        Estudiantes y apoderados se crean únicamente desde matrícula aprobada.
      </p>
    </form>
  );
}

function UserDetailPanel({
  user,
  form,
  saving,
  onChange,
  onSubmit,
  onCopy
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-slate-200 rounded-3xl shadow-soft p-6 space-y-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-gold-600 uppercase tracking-[0.16em]">
            Detalle de usuario
          </p>

          <h2 className="text-2xl font-extrabold text-brand-950 mt-2">
            {user.nombres} {user.apellidos}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {user.rol} · {user.estado}
          </p>
        </div>

        <div className="w-12 h-12 rounded-full bg-brand-900 text-white flex items-center justify-center font-extrabold">
          {getInitials(user)}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
        <DetailRow label="Usuario" value={user.username} onCopy={onCopy} />
        <DetailRow label="Correo" value={user.correo} onCopy={onCopy} />
        <DetailRow label="DNI" value={user.dni} />
        <DetailRow label="Rol" value={user.rol} />
      </div>

      <InputField label="Nombres" value={form.nombres} onChange={(value) => onChange('nombres', value)} />
      <InputField label="Apellidos" value={form.apellidos} onChange={(value) => onChange('apellidos', value)} />
      <InputField label="Teléfono" value={form.telefono} onChange={(value) => onChange('telefono', value)} />

      {user.rol === 'Docente' && (
        <InputField
          label="Especialidad"
          value={form.especialidad}
          onChange={(value) => onChange('especialidad', value)}
        />
      )}

      {user.rol === 'Estudiante' && (
        <>
          <InputField
            label="Código estudiante"
            value={form.codigo_estudiante}
            onChange={(value) => onChange('codigo_estudiante', value)}
          />

          <InputField
            label="Fecha nacimiento"
            type="date"
            value={form.fecha_nacimiento}
            onChange={(value) => onChange('fecha_nacimiento', value)}
          />

          <InputField
            label="Dirección"
            value={form.direccion}
            onChange={(value) => onChange('direccion', value)}
          />
        </>
      )}

      {user.rol === 'Director' ? (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
          <p className="text-sm font-bold text-brand-950">
            Estado
          </p>

          <p className="text-sm text-slate-600 mt-1">
            El estado de un usuario Director no puede modificarse desde este módulo.
          </p>

          <span className="inline-flex mt-3 rounded-full px-3 py-1 text-xs font-extrabold bg-green-50 text-success border border-green-100">
            {user.estado || 'activo'}
          </span>
        </div>
      ) : (
        <SelectField
          label="Estado"
          value={form.estado}
          onChange={(value) => onChange('estado', value)}
          options={[
            { value: 'activo', label: 'Activo' },
            { value: 'inactivo', label: 'Inactivo' }
          ]}
        />
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
        Guardar cambios
      </button>

      <p className="text-xs text-slate-500">
        El restablecimiento de contraseña se realiza desde el módulo Seguridad.
      </p>
    </form>
  );
}

function CredentialsBox({ credentials, onCopy }) {
  return (
    <div className="bg-brand-950 text-white rounded-3xl shadow-soft p-6 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold-500/20 blur-3xl" />

      <div className="relative grid md:grid-cols-3 gap-4">
        <CredentialItem label="Usuario" value={credentials.username} onCopy={onCopy} />
        <CredentialItem label="Correo" value={credentials.correo} onCopy={onCopy} />
        <CredentialItem label="Contraseña inicial" value={credentials.password_inicial} onCopy={onCopy} />
      </div>
    </div>
  );
}

function CredentialItem({ label, value, onCopy }) {
  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
      <p className="text-xs text-blue-100 font-bold">
        {label}
      </p>

      <div className="flex items-center gap-2 mt-1">
        <p className="font-extrabold break-all">
          {value}
        </p>

        <button
          type="button"
          onClick={() => onCopy(value)}
          className="text-gold-500 shrink-0"
        >
          <Copy size={16} />
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

      <p className="text-sm text-slate-500 mt-2">
        {description}
      </p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  inputMode,
  pattern,
  helperText
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
        maxLength={maxLength}
        inputMode={inputMode}
        pattern={pattern}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-800"
      />

      {helperText && (
        <p className="text-xs text-slate-500 mt-1">
          {helperText}
        </p>
      )}
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
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DetailRow({ label, value, onCopy }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2 last:border-0 last:pb-0">
      <p className="text-sm font-bold text-slate-500">
        {label}
      </p>

      <div className="flex items-center gap-2 min-w-0">
        <p className="text-sm font-semibold text-brand-950 break-all">
          {value || 'No precisa'}
        </p>

        {onCopy && value && (
          <button
            type="button"
            onClick={() => onCopy(value)}
            className="text-brand-900 shrink-0"
          >
            <Copy size={15} />
          </button>
        )}
      </div>
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

function EmptyBlock({ text }) {
  return (
    <div className="p-8 text-center">
      <Users className="mx-auto text-slate-300" size={42} />
      <p className="text-sm text-slate-500 mt-3">
        {text}
      </p>
    </div>
  );
}

function EmptyDetail() {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-soft p-8 text-center">
      <GraduationCap className="mx-auto text-slate-300" size={46} />

      <h2 className="text-xl font-extrabold text-brand-950 mt-4">
        Selecciona un usuario
      </h2>

      <p className="text-sm text-slate-500 mt-2">
        Aquí podrás ver el detalle, editar datos básicos o crear nuevos usuarios permitidos.
      </p>
    </div>
  );
}

function getInitials(user) {
  const first = user?.nombres?.charAt(0) || '';
  const second = user?.apellidos?.charAt(0) || '';

  return `${first}${second}`.toUpperCase() || 'U';
}

function formatInputDate(value) {
  if (!value) return '';

  return String(value).slice(0, 10);
}

export default UsersAdmin;