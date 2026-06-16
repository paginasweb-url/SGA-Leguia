import { getAllRoles } from '../services/roles.service.js';

export const listRoles = async (req, res) => {
  try {
    const roles = await getAllRoles();

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};