import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deactivateUser
} from '../services/users.service.js';

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { generateCredentials } from '../utils/generateCredentials.js';

const roleMap = {
  1: 'Director',
  2: 'Administrativo',
  3: 'Auxiliar',
  4: 'Docente',
  5: 'Estudiante',
  6: 'Apoderado'
};

const adminVisibleRoles = ['Estudiante', 'Docente', 'Apoderado'];

const handleDuplicateError = (error, res) => {
  if (error.code === '23505') {
    let message = 'Ya existe un usuario con esos datos';

    if (error.constraint === 'users_dni_key') {
      message = 'El DNI ingresado ya está registrado';
    }

    if (error.constraint === 'users_correo_key') {
      message = 'El correo institucional ya está registrado';
    }

    if (error.constraint === 'users_username_key') {
      message = 'El usuario institucional ya está registrado';
    }

    return res.status(409).json({
      success: false,
      error: message
    });
  }

  return res.status(500).json({
    success: false,
    error: error.message
  });
};

const canAdministrativoManageUser = (targetUser) => {
  return adminVisibleRoles.includes(targetUser?.rol);
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await getUsers({
      requesterRole: req.user.rol
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewUser = async (req, res) => {
  try {
    if (req.user.rol !== 'Director') {
      return res.status(403).json({
        success: false,
        error: 'Solo el Director puede crear administrativos o auxiliares'
      });
    }

    const {
      rol_id,
      nombres,
      apellidos,
      dni,
      telefono,
      password_hash,
      estado
    } = req.body;

    const parsedRoleId = Number(rol_id);
    const allowedRolesToCreate = [2, 3];

    if (!allowedRolesToCreate.includes(parsedRoleId)) {
      return res.status(403).json({
        success: false,
        error: 'Desde Usuarios solo se pueden crear Administrativos y Auxiliares. Los docentes se crean desde el módulo Docentes y los estudiantes/apoderados desde matrícula.'
      });
    }

    if (!nombres || !apellidos || !dni || !password_hash) {
      return res.status(400).json({
        success: false,
        error: 'Nombres, apellidos, DNI y contraseña inicial son obligatorios'
      });
    }

    const roleName = roleMap[parsedRoleId];
    const credentials = generateCredentials(roleName, dni);
    const hashedPassword = await bcrypt.hash(password_hash, 10);

    const userData = {
      id: uuidv4(),
      rol_id: parsedRoleId,
      nombres,
      apellidos,
      dni,
      telefono,
      estado: estado || 'activo',
      username: credentials.username,
      correo: credentials.correo,
      password_hash: hashedPassword
    };

    const user = await createUser(userData);

    res.status(201).json({
      success: true,
      message: `${roleName} creado correctamente`,
      data: user,
      credentials: {
        username: credentials.username,
        correo: credentials.correo,
        password_inicial: password_hash
      }
    });

  } catch (error) {
    console.error(error);
    handleDuplicateError(error, res);
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    if (
      req.user.rol === 'Administrativo' &&
      !canAdministrativoManageUser(user)
    ) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para consultar este usuario'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingUser = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await getUserById(id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    if (
      targetUser.rol === 'Director' &&
      req.body.estado &&
      req.body.estado !== 'activo'
    ) {
      return res.status(403).json({
        success: false,
        error: 'No se permite cambiar el estado de un usuario Director a inactivo'
      });
    }
    if (
      req.user.rol === 'Administrativo' &&
      !canAdministrativoManageUser(targetUser)
    ) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para editar este usuario'
      });
    }

    if (targetUser.rol === 'Director' && req.user.id !== targetUser.id) {
      return res.status(403).json({
        success: false,
        error: 'No se permite modificar datos de otro Director'
      });
    }

    const updatedUser = await updateUser(id, req.body);

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: updatedUser
    });

  } catch (error) {
    console.error(error);
    handleDuplicateError(error, res);
  }
};

export const deactivateExistingUser = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await getUserById(id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    if (
      req.user.rol === 'Administrativo' &&
      !canAdministrativoManageUser(targetUser)
    ) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para desactivar este usuario'
      });
    }

    if (targetUser.rol === 'Director') {
      return res.status(403).json({
        success: false,
        error: 'No se permite desactivar usuarios Directores'
      });
    }

    const user = await deactivateUser(id);

    res.json({
      success: true,
      message: 'Usuario desactivado correctamente',
      data: user
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};