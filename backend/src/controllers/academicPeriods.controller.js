import {
  getAcademicPeriods,
  getAcademicPeriodById,
  createAcademicPeriod,
  updateAcademicPeriod,
  activateAcademicPeriod
} from '../services/academicPeriods.service.js';

export const getAllAcademicPeriods = async (req, res) => {
  try {
    const periods = await getAcademicPeriods();

    res.json({
      success: true,
      data: periods
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getAcademicPeriod = async (req, res) => {
  try {
    const { id } = req.params;

    const period = await getAcademicPeriodById(id);

    res.json({
      success: true,
      data: period
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewAcademicPeriod = async (req, res) => {
  try {
    const { nombre, fecha_inicio, fecha_fin } = req.body;

    if (!nombre || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, fecha de inicio y fecha de fin son obligatorios'
      });
    }

    const period = await createAcademicPeriod({
      ...req.body,
      estado: req.body.estado || 'inactivo'
    });

    res.status(201).json({
      success: true,
      data: period
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingAcademicPeriod = async (req, res) => {
  try {
    const { id } = req.params;

    const period = await updateAcademicPeriod(id, req.body);

    res.json({
      success: true,
      data: period
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const activateExistingAcademicPeriod = async (req, res) => {
  try {
    const { id } = req.params;

    const period = await activateAcademicPeriod(id);

    res.json({
      success: true,
      message: 'Periodo académico activado correctamente',
      data: period
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};