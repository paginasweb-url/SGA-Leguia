import { getUsers, createUser, getUserById, updateUser, deactivateUser} from '../services/users.service.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { generateCredentials } from '../utils/generateCredentials.js';

export const getAllUsers = async (req, res) => {

  try {

    const users = await getUsers();

    res.json({
      success: true,
      data: users
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
};

export const createNewUser = async (req, res) => {

  const hashedPassword = await bcrypt.hash(req.body.password_hash, 10);

  try {
    const roleMap = {
    1: 'Director',
    2: 'Administrativo',
    3: 'Auxiliar',
    4: 'Docente',
    5: 'Estudiante',
    6: 'Apoderado'
  };

  const roleName = roleMap[req.body.rol_id];

  const credentials = generateCredentials(roleName, req.body.dni);

    const userData = {
      id: uuidv4(),
      ...req.body,
      username: credentials.username,
      correo: credentials.correo,
      password_hash: hashedPassword
    };

    const user = await createUser(userData);

    res.status(201).json({
      success: true,
      data: user
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
};

export const getUser = async (req, res) => {

  try {

    const { id } = req.params;

    const user = await getUserById(id);

    res.json({
      success: true,
      data: user
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
};

export const updateExistingUser = async (req, res) => {

  try {

    const { id } = req.params;

    const updatedUser = await updateUser(id, req.body);

    res.json({
      success: true,
      data: updatedUser
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
};

export const deactivateExistingUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await deactivateUser(id);

    res.json({
      success: true,
      message: 'Usuario desactivado correctamente',
      data: user
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};