import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  UserRound,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

import DashboardLayout from '../layouts/DashboardLayout';

import {
  getStudentsRequest,
  createStudentRequest,
  updateStudentRequest,
  deactivateStudentRequest
} from '../services/students.service';

function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    correo: '',
    telefono: '',
    password_hash: '',
    codigo_estudiante: '',
    fecha_nacimiento: '',
    direccion: '',
    estado: 'activo'
  });

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await getStudentsRequest();
      setStudents(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const fullName = `${student.nombres} ${student.apellidos}`.toLowerCase();

      return (
        fullName.includes(search.toLowerCase()) ||
        student.codigo_estudiante?.toLowerCase().includes(search.toLowerCase()) ||
        student.dni?.includes(search)
      );
    });
  }, [students, search]);

  const resetForm = () => {
    setForm({
      nombres: '',
      apellidos: '',
      dni: '',
      correo: '',
      telefono: '',
      password_hash: '',
      codigo_estudiante: '',
      fecha_nacimiento: '',
      direccion: '',
      estado: 'activo'
    });

    setEditingStudent(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);

    setForm({
      nombres: student.nombres || '',
      apellidos: student.apellidos || '',
      dni: student.dni || '',
      correo: student.correo || '',
      telefono: student.telefono || '',
      password_hash: '',
      codigo_estudiante: student.codigo_estudiante || '',
      fecha_nacimiento: student.fecha_nacimiento
        ? student.fecha_nacimiento.split('T')[0]
        : '',
      direccion: student.direccion || '',
      estado: student.estado || 'activo'
    });

    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value
    });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingStudent) {
        const { password_hash, ...dataToUpdate } = form;
        await updateStudentRequest(editingStudent.id, dataToUpdate);
        toast.success('Estudiante actualizado correctamente');
      } else {
        await createStudentRequest(form);
        toast.success('Estudiante registrado correctamente');
      }

      setShowModal(false);
      resetForm();
      loadStudents();

    } catch (error) {
      const message =
        error.response?.data?.error || 'No se pudo guardar el estudiante';

      toast.error(message);
    }
  };

    const handleDeactivate = async (id) => {
    try {
      await deactivateStudentRequest(id);
      toast.success('Estudiante desactivado correctamente');
      loadStudents();

    } catch (error) {
      const message =
        error.response?.data?.error || 'No se pudo desactivar el estudiante';

      toast.error(message);
    }
  };

  return (
    <DashboardLayout>
      <section className="space-y-5">

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              Gestión de estudiantes
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Administración de estudiantes registrados en el sistema.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="hidden lg:flex items-center gap-2 bg-blue-900 text-white px-5 py-3 rounded-xl font-semibold shadow-sm hover:bg-blue-800"
          >
            <Plus size={18} />
            Nuevo estudiante
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />

            <input
              type="text"
              placeholder="Buscar por nombre, código o DNI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-300"
            />
          </div>
        </div>

        <div className="hidden lg:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Código</th>
                <th className="px-5 py-4">Estudiante</th>
                <th className="px-5 py-4">DNI</th>
                <th className="px-5 py-4">Correo</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-semibold text-blue-900">
                    {student.codigo_estudiante}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center text-xs font-bold">
                        {student.nombres?.charAt(0)}
                        {student.apellidos?.charAt(0)}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900">
                          {student.nombres} {student.apellidos}
                        </p>
                        <p className="text-xs text-slate-500">
                          {student.telefono || 'Sin teléfono'}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {student.dni}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {student.correo}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        student.estado === 'activo'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {student.estado}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(student)}
                        className="p-2 rounded-lg text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        onClick={() => handleDeactivate(student.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                    No se encontraron estudiantes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden space-y-3">
          {filteredStudents.map((student) => (
            <article
              key={student.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
                    <UserRound size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">
                      {student.nombres} {student.apellidos}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      {student.codigo_estudiante}
                    </p>

                    <p className="text-xs text-slate-500">
                      DNI: {student.dni}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                    student.estado === 'activo'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {student.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(student)}
                  className="py-2 rounded-lg bg-blue-50 text-blue-800 font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Pencil size={16} />
                  Editar
                </button>

                <button
                  onClick={() => handleDeactivate(student.id)}
                  className="py-2 rounded-lg bg-red-50 text-red-600 font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Desactivar
                </button>
              </div>
            </article>
          ))}
        </div>

        <button
          onClick={openCreateModal}
          className="lg:hidden fixed right-5 bottom-20 w-14 h-14 rounded-full bg-blue-900 text-white shadow-lg flex items-center justify-center z-40"
        >
          <Plus size={26} />
        </button>

        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[88vh] overflow-y-auto">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-bold text-lg text-slate-900">
                  {editingStudent ? 'Editar estudiante' : 'Nuevo estudiante'}
                </h2>

                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 pb-28 sm:pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  name="nombres"
                  placeholder="Nombres"
                  value={form.nombres}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-4 py-3"
                />

                <input
                  name="apellidos"
                  placeholder="Apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-4 py-3"
                />

                <input
                  name="dni"
                  placeholder="DNI"
                  value={form.dni}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-4 py-3"
                />

                <input
                  name="codigo_estudiante"
                  placeholder="Código estudiante"
                  value={form.codigo_estudiante}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-4 py-3"
                />

                <input
                  name="correo"
                  type="email"
                  placeholder="Correo"
                  value={form.correo}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-4 py-3"
                />

                <input
                  name="telefono"
                  placeholder="Teléfono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-3"
                />

                {!editingStudent && (
                  <input
                    name="password_hash"
                    type="password"
                    placeholder="Contraseña inicial"
                    value={form.password_hash}
                    onChange={handleChange}
                    required
                    className="border rounded-lg px-4 py-3"
                  />
                )}

                <input
                  name="fecha_nacimiento"
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-3"
                />

                <input
                  name="direccion"
                  placeholder="Dirección"
                  value={form.direccion}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-3 sm:col-span-2"
                />

                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-3 sm:col-span-2"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>

                <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-3 rounded-lg border border-slate-200 font-semibold"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-3 rounded-lg bg-blue-900 text-white font-semibold"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </section>
    </DashboardLayout>
  );
}

export default Students;