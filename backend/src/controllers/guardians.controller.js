import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import {
  getGuardians,
  getGuardianById,
  createGuardian,
  updateGuardian,
  deactivateGuardian
} from '../services/guardians.service.js';

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

export const getAllGuardians = async (req, res) => {
  try {
    const guardians = await getGuardians();

    res.json({
      success: true,
      data: guardians
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getGuardian = async (req, res) => {
  try {
    const { id } = req.params;

    const guardian = await getGuardianById(id);

    res.json({
      success: true,
      data: guardian
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewGuardian = async (req, res) => {
  return res.status(403).json({
    success: false,
    error: 'Los apoderados se crean únicamente mediante una matrícula aprobada'
  });
};

export const updateExistingGuardian = async (req, res) => {
  try {
    const { id } = req.params;

    const guardian = await updateGuardian(id, req.body);

    res.json({
      success: true,
      data: guardian
    });

  } catch (error) {
    console.error(error);
    handleDuplicateError(error, res);
  }
};

export const deactivateExistingGuardian = async (req, res) => {
  try {
    const { id } = req.params;

    const guardian = await deactivateGuardian(id);

    res.json({
      success: true,
      message: 'Apoderado desactivado correctamente',
      data: guardian
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};