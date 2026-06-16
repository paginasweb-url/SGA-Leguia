import bcrypt from 'bcrypt';
import crypto from 'crypto';

import {
  findStudentForRecovery,
  findGuardianForRecovery,
  hasPendingPasswordRecovery,
  createPasswordRecoveryRequest,
  getPasswordRecoveryRequests,
  getPasswordRecoveryRequestById,
  updateUserTemporaryPassword,
  approvePasswordRecoveryRequest,
  rejectPasswordRecoveryRequest,
  getUserForManualPasswordReset,
  createManualPasswordResetRecord,
  closePendingPasswordRecoveryRequestsByUser
} from '../services/passwordRecovery.service.js';

const genericRecoveryMessage =
  'Si los datos ingresados coinciden con los registros del colegio, la solicitud será revisada por el área administrativa.';

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

const generateTemporaryPassword = () => {
  return `Temp-${crypto.randomInt(100000, 999999)}`;
};

export const requestPasswordRecovery = async (req, res) => {
  try {
    const {
      tipo,
      usuario,
      dni,
      fecha_nacimiento,
      apoderado_dni,
      estudiante_dni
    } = req.body;

    if (!tipo || !usuario || !dni) {
      return res.status(400).json({
        success: false,
        error: 'El tipo, usuario y DNI son obligatorios'
      });
    }

    if (!['estudiante', 'apoderado'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: 'El tipo de solicitante no es válido'
      });
    }

    let matchedUser = null;
    let dniValidacionSecundaria = null;

    if (tipo === 'estudiante') {
      if (!fecha_nacimiento || !apoderado_dni) {
        return res.status(400).json({
          success: false,
          error: 'La fecha de nacimiento y el DNI del apoderado son obligatorios'
        });
      }

      matchedUser = await findStudentForRecovery({
        usuario,
        dni,
        fecha_nacimiento,
        apoderado_dni
      });

      dniValidacionSecundaria = apoderado_dni;
    }

    if (tipo === 'apoderado') {
      if (!estudiante_dni) {
        return res.status(400).json({
          success: false,
          error: 'El DNI del estudiante vinculado es obligatorio'
        });
      }

      matchedUser = await findGuardianForRecovery({
        usuario,
        dni,
        estudiante_dni
      });

      dniValidacionSecundaria = estudiante_dni;
    }

    if (!matchedUser) {
      return res.json({
        success: true,
        message: genericRecoveryMessage
      });
    }

    const hasPendingRequest = await hasPendingPasswordRecovery(
      matchedUser.user_id
    );

    if (!hasPendingRequest) {
      await createPasswordRecoveryRequest({
        tipo_solicitante: tipo,
        usuario_ingresado: usuario,
        dni_ingresado: dni,
        estudiante_dni_validacion: dniValidacionSecundaria,
        user_id: matchedUser.user_id,
        ip: getClientIp(req),
        user_agent: getUserAgent(req)
      });
    }

    res.json({
      success: true,
      message: genericRecoveryMessage
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const listPasswordRecoveryRequests = async (req, res) => {
  try {
    const {
      estado,
      tipo,
      usuario,
      fechaInicio,
      fechaFin,
      page,
      limit
    } = req.query;

    const result = await getPasswordRecoveryRequests({
      estado,
      tipo,
      usuario,
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

export const getPasswordRecoveryRequestDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await getPasswordRecoveryRequestById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      });
    }

    res.json({
      success: true,
      data: request
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const approveRecoveryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { observacion } = req.body;
    const adminUserId = req.user.id;

    const request = await getPasswordRecoveryRequestById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      });
    }

    if (request.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden aprobar solicitudes pendientes'
      });
    }

    if (!request.user_id) {
      return res.status(400).json({
        success: false,
        error: 'La solicitud no tiene un usuario asociado'
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const updatedUser = await updateUserTemporaryPassword(
      request.user_id,
      hashedPassword
    );

    const updatedRequest = await approvePasswordRecoveryRequest({
      requestId: id,
      reviewedBy: adminUserId,
      observacion
    });

    res.json({
      success: true,
      message: 'Solicitud aprobada. Se generó una contraseña temporal.',
      temporary_password: temporaryPassword,
      user: updatedUser,
      request: updatedRequest
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const rejectRecoveryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { observacion } = req.body;
    const adminUserId = req.user.id;

    const request = await getPasswordRecoveryRequestById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      });
    }

    if (request.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden rechazar solicitudes pendientes'
      });
    }

    const updatedRequest = await rejectPasswordRecoveryRequest({
      requestId: id,
      reviewedBy: adminUserId,
      observacion
    });

    res.json({
      success: true,
      message: 'Solicitud rechazada correctamente',
      data: updatedRequest
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const manualPasswordReset = async (req, res) => {
  try {
    const { userId } = req.params;
    const { observacion } = req.body;
    const adminUserId = req.user.id;

    const user = await getUserForManualPasswordReset(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const updatedUser = await updateUserTemporaryPassword(
      user.id,
      hashedPassword
    );

    const record = await createManualPasswordResetRecord({
        user,
        reviewedBy: adminUserId,
        observacion,
        ip: getClientIp(req),
        user_agent: getUserAgent(req)
    });

    const closedPendingRequests = await closePendingPasswordRecoveryRequestsByUser({
        userId: user.id,
        reviewedBy: adminUserId,
        observacion: 'Solicitud atendida mediante restablecimiento manual de contraseña.'
    });

    res.json({
        success: true,
        message: 'Contraseña restablecida correctamente. Se generó una contraseña temporal.',
        temporary_password: temporaryPassword,
        user: updatedUser,
        record,
        closed_pending_requests: closedPendingRequests
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};