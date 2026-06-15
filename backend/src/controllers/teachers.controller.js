import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deactivateTeacher
} from '../services/teachers.service.js';

import { generateCredentials } from '../utils/generateCredentials.js';

const handleDuplicateError = (error, res) => {
  if (error.code === '23505') {
    let message = 'Ya existe un registro con esos datos';

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

export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await getTeachers();

    res.json({
      success: true,
      data: teachers
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await getTeacherById(id);

    res.json({
      success: true,
      data: teacher
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewTeacher = async (req, res) => {
  try {
    const { password_hash, dni } = req.body;

    if (!dni) {
      return res.status(400).json({
        success: false,
        error: 'El DNI es obligatorio'
      });
    }

    if (!password_hash) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña inicial es obligatoria'
      });
    }

    const credentials = generateCredentials('Docente', dni);
    const hashedPassword = await bcrypt.hash(password_hash, 10);

    const teacherData = {
      id: uuidv4(),
      rol_id: 4,
      ...req.body,
      username: credentials.username,
      correo: credentials.correo,
      password_hash: hashedPassword
    };

    const teacher = await createTeacher(teacherData);

    res.status(201).json({
      success: true,
      data: teacher
    });

  } catch (error) {
    console.error(error);
    handleDuplicateError(error, res);
  }
};

export const updateExistingTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await updateTeacher(id, req.body);

    res.json({
      success: true,
      data: teacher
    });

  } catch (error) {
    console.error(error);
    handleDuplicateError(error, res);
  }
};

export const deactivateExistingTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await deactivateTeacher(id);

    res.json({
      success: true,
      message: 'Docente desactivado correctamente',
      data: teacher
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};