import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} from '../services/courses.service.js';

export const getAllCourses = async (req, res) => {
  try {
    const courses = await getCourses();

    res.json({
      success: true,
      data: courses
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await getCourseById(id);

    res.json({
      success: true,
      data: course
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewCourse = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del curso es obligatorio'
      });
    }

    const course = await createCourse(nombre);

    res.status(201).json({
      success: true,
      data: course
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    const course = await updateCourse(id, nombre);

    res.json({
      success: true,
      data: course
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteExistingCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await deleteCourse(id);

    res.json({
      success: true,
      data: course
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};