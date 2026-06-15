import {
  createEnrollmentRequest,
  getEnrollmentRequests,
  getEnrollmentRequestById,
  uploadEnrollmentDocument,
  getDocumentsByEnrollmentRequest,
  updateEnrollmentRequestStatus,
  approveEnrollmentRequest,
  trackEnrollmentRequest
} from '../services/enrollmentRequests.service.js';

export const createNewEnrollmentRequest = async (req, res) => {
  try {
    const {
      estudiante_dni,
      estudiante_nombres,
      estudiante_apellidos,
      apoderado_dni,
      apoderado_nombres,
      apoderado_apellidos,
      parentesco
    } = req.body;

    if (
      !estudiante_dni ||
      !estudiante_nombres ||
      !estudiante_apellidos ||
      !apoderado_dni ||
      !apoderado_nombres ||
      !apoderado_apellidos ||
      !parentesco
    ) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos obligatorios de estudiante o apoderado'
      });
    }

    const request = await createEnrollmentRequest(req.body);

    res.status(201).json({
      success: true,
      message: 'Solicitud de matrícula registrada correctamente',
      codigo_seguimiento: request.codigo_seguimiento,
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

export const getAllEnrollmentRequests = async (req, res) => {
  try {
    const requests = await getEnrollmentRequests();

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getEnrollmentRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await getEnrollmentRequestById(id);

    res.json({
      success: true,
      data: request
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const uploadDocumentToEnrollmentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_documento } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Debe subir un archivo'
      });
    }

    if (!tipo_documento) {
      return res.status(400).json({
        success: false,
        error: 'El tipo de documento es obligatorio'
      });
    }

    const document = await uploadEnrollmentDocument(
      id,
      req.file,
      tipo_documento
    );

    res.status(201).json({
      success: true,
      message: 'Documento subido correctamente',
      data: document
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getEnrollmentRequestDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    const documents = await getDocumentsByEnrollmentRequest(id);

    res.json({
      success: true,
      data: documents
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const trackRequestStatus = async (req, res) => {
  try {

    const {
      codigo_seguimiento,
      estudiante_dni,
      apoderado_dni
    } = req.body;

    if (
      !codigo_seguimiento ||
      !estudiante_dni ||
      !apoderado_dni
    ) {
      return res.status(400).json({
        success: false,
        error: 'Código de seguimiento, DNI del estudiante y DNI del apoderado son obligatorios'
      });
    }

    const request = await trackEnrollmentRequest({
      codigo_seguimiento,
      estudiante_dni,
      apoderado_dni
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró una solicitud con los datos ingresados'
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

export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observacion } = req.body;

    const allowedStates = [
      'pendiente',
      'observado',
      'aprobado',
      'rechazado'
    ];

    if (!allowedStates.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado no válido'
      });
    }

    if (estado === 'aprobado') {
      const result = await approveEnrollmentRequest(id);

      return res.json({
        success: true,
        message: 'Solicitud aprobada y matrícula generada correctamente',
        data: result
      });
    }

    const request = await updateEnrollmentRequestStatus(
      id,
      estado,
      observacion || null
    );

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
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