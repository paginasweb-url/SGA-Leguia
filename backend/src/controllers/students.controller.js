import {
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deactivateStudent
} from '../services/students.service.js';

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

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

    if (error.constraint === 'estudiantes_codigo_estudiante_key') {
      message = 'El código de estudiante ya está registrado';
    }

    return res.status(409).json({
      success: false,
      error: message
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Error interno al registrar estudiante'
  });
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await getStudents();

    res.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewStudent = async (req, res) => {
  return res.status(403).json({
    success: false,
    error: 'Los estudiantes se crean únicamente mediante una matrícula aprobada'
  });
};

export const getStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await getStudentById(id);

    res.json({
      success: true,
      data: student
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await updateStudent(id, req.body);

    res.json({
      success: true,
      data: student
    });

  } catch (error) {
    console.error(error);
    handleDuplicateError(error, res);
  }
};

export const deactivateExistingStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await deactivateStudent(id);

    res.json({
      success: true,
      message: 'Estudiante desactivado correctamente',
      data: student
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};