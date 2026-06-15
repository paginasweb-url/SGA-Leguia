import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

import {
  loginUser,
  getUserAuthById,
  updateUserPassword
} from '../services/auth.service.js';

import {
  getAccessHistory,
  registerAccessAttempt
} from '../services/accessHistory.service.js';

dotenv.config();

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
};

const getUserAgent = (req) => {
  return req.headers['user-agent'] || null;
};

const registerAccessAttemptSafe = async (req, data) => {
  try {
    await registerAccessAttempt({
      usuario_ingresado: data.usuario_ingresado || 'No proporcionado',
      user_id: data.user_id || null,
      rol: data.rol || null,
      resultado: data.resultado,
      motivo: data.motivo,
      ip: getClientIp(req),
      user_agent: getUserAgent(req)
    });
  } catch (error) {
    console.error('Error registrando historial de acceso:', error.message);
  }
};

export const login = async (req, res) => {
  let usuarioIngresado = 'No proporcionado';
  let userForLog = null;

  try {
    const { usuario, password } = req.body;

    usuarioIngresado = usuario || 'No proporcionado';

    if (!usuario || !password) {
      await registerAccessAttemptSafe(req, {
        usuario_ingresado: usuarioIngresado,
        resultado: 'fallido',
        motivo: 'Usuario o contraseña no proporcionados'
      });

      return res.status(400).json({
        success: false,
        error: 'El usuario y la contraseña son obligatorios'
      });
    }

    const user = await loginUser(usuario);
    userForLog = user || null;

    if (!user) {
      await registerAccessAttemptSafe(req, {
        usuario_ingresado: usuarioIngresado,
        resultado: 'fallido',
        motivo: 'Usuario no encontrado'
      });

      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    if (String(user.estado).toLowerCase() !== 'activo') {
      await registerAccessAttemptSafe(req, {
        usuario_ingresado: usuarioIngresado,
        user_id: user.id,
        rol: user.rol,
        resultado: 'fallido',
        motivo: 'Usuario inactivo'
      });

      return res.status(403).json({
        success: false,
        error: 'Usuario inactivo'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      await registerAccessAttemptSafe(req, {
        usuario_ingresado: usuarioIngresado,
        user_id: user.id,
        rol: user.rol,
        resultado: 'fallido',
        motivo: 'Contraseña incorrecta'
      });

      return res.status(401).json({
        success: false,
        error: 'Contraseña incorrecta'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        correo: user.correo,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d'
      }
    );

    await registerAccessAttemptSafe(req, {
      usuario_ingresado: usuarioIngresado,
      user_id: user.id,
      rol: user.rol,
      resultado: 'exitoso',
      motivo: 'Login exitoso'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        username: user.username,
        correo: user.correo,
        rol: user.rol,
        must_change_password: user.must_change_password
      }
    });

  } catch (error) {
    console.error(error);

    await registerAccessAttemptSafe(req, {
      usuario_ingresado: usuarioIngresado,
      user_id: userForLog?.id || null,
      rol: userForLog?.rol || null,
      resultado: 'fallido',
      motivo: 'Error interno'
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      currentPassword,
      newPassword
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña actual y la nueva contraseña son obligatorias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña no puede ser igual a la actual'
      });
    }

    const user = await getUserAuthById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'La contraseña actual es incorrecta'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await updateUserPassword(
      userId,
      hashedPassword
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
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

export const accessHistory = async (req, res) => {
  try {
    const {
      usuario,
      rol,
      resultado,
      fechaInicio,
      fechaFin,
      page,
      limit
    } = req.query;

    const result = await getAccessHistory({
      usuario,
      rol,
      resultado,
      fechaInicio,
      fechaFin,
      page,
      limit
    });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};