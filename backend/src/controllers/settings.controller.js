import {
  getSettingsPayload,
  updateUserPreferences
} from '../services/settings.service.js';

export const getMySettings = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const data = await getSettingsPayload(userId);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateMyPreferences = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { theme_mode } = req.body;

    if (!theme_mode) {
      return res.status(400).json({
        success: false,
        error: 'El modo de tema es obligatorio'
      });
    }

    const preferences = await updateUserPreferences(userId, {
      theme_mode
    });

    res.json({
      success: true,
      message: 'Preferencias actualizadas correctamente',
      data: preferences
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};