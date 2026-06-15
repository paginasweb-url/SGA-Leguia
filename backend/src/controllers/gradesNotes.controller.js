import {
  getStudentsForGrades,
  saveGrades,
  getGradesByClassroomCourseBimester,
  getGradesByStudent,
  getGradesSummaryByClassroomCourse,
  getStudentsAtRisk
} from '../services/gradesNotes.service.js';

export const getClassroomStudentsForGrades = async (req, res) => {
  try {
    const { aulaId } = req.params;
    const { periodo_id } = req.query;

    if (!periodo_id) {
      return res.status(400).json({
        success: false,
        error: 'El período académico es obligatorio'
      });
    }

    const students = await getStudentsForGrades(aulaId, periodo_id);

    res.json({ success: true, data: students });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const registerGrades = async (req, res) => {
  try {
    const {
      aula_id,
      curso_id,
      periodo_id,
      bimestre,
      notas
    } = req.body;

    if (
      !aula_id ||
      !curso_id ||
      !periodo_id ||
      !bimestre ||
      !Array.isArray(notas)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Aula, curso, período, bimestre y lista de notas son obligatorios'
      });
    }

    if (notas.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'La lista de notas no puede estar vacía'
      });
    }

    const result = await saveGrades({
      aula_id,
      curso_id,
      periodo_id,
      bimestre,
      notas
    });

    res.status(201).json({
      success: true,
      message: 'Notas registradas correctamente',
      data: result
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getClassroomCourseGrades = async (req, res) => {
  try {
    const { aulaId, cursoId } = req.params;
    const { bimestre, periodo_id } = req.query;

    if (!bimestre || !periodo_id) {
      return res.status(400).json({
        success: false,
        error: 'El bimestre y el período académico son obligatorios'
      });
    }

    const grades = await getGradesByClassroomCourseBimester(
      aulaId,
      cursoId,
      bimestre,
      periodo_id
    );

    res.json({ success: true, data: grades });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { periodo_id } = req.query;

    const grades = await getGradesByStudent(studentId, periodo_id || null);

    res.json({ success: true, data: grades });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getClassroomCourseSummary = async (req, res) => {
  try {
    const { aulaId, cursoId } = req.params;
    const { bimestre, periodo_id } = req.query;

    if (!bimestre || !periodo_id) {
      return res.status(400).json({
        success: false,
        error: 'El bimestre y el período académico son obligatorios'
      });
    }

    const summary = await getGradesSummaryByClassroomCourse(
      aulaId,
      cursoId,
      bimestre,
      periodo_id
    );

    res.json({ success: true, data: summary });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getRiskStudents = async (req, res) => {
  try {
    const { aulaId } = req.params;
    const { bimestre, periodo_id } = req.query;

    if (!bimestre || !periodo_id) {
      return res.status(400).json({
        success: false,
        error: 'El bimestre y el período académico son obligatorios'
      });
    }

    const students = await getStudentsAtRisk(
      aulaId,
      bimestre,
      periodo_id
    );

    res.json({ success: true, data: students });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};