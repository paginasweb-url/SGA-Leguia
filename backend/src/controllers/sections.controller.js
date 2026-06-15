import {
  getSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection
} from '../services/sections.service.js';

export const getAllSections = async (req, res) => {
  try {
    const sections = await getSections();

    res.json({
      success: true,
      data: sections
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getSection = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await getSectionById(id);

    res.json({
      success: true,
      data: section
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewSection = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        error: 'El nombre de la sección es obligatorio'
      });
    }

    const section = await createSection(nombre);

    res.status(201).json({
      success: true,
      data: section
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    const section = await updateSection(id, nombre);

    res.json({
      success: true,
      data: section
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteExistingSection = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await deleteSection(id);

    res.json({
      success: true,
      data: section
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};