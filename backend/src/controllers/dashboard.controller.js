import {
  getDashboardStats,
  getTeacherDashboardByUserId,
  getAuxiliaryDashboardByUserId
} from '../services/dashboard.service.js';

export const getStats = async (req, res) => {
  try {
    const stats = await getDashboardStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getTeacherDashboard = async (req, res) => {
  try {
    const dashboard = await getTeacherDashboardByUserId(req.user.id);

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró el perfil del docente'
      });
    }

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getAuxiliaryDashboard = async (req, res) => {
  try {
    const dashboard = await getAuxiliaryDashboardByUserId(req.user.id);

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró el usuario auxiliar'
      });
    }

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};