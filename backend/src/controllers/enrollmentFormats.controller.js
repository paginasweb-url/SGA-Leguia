import crypto from 'crypto';

import supabase from '../config/supabase.js';

import {
  createEnrollmentFormat,
  getEnrollmentFormats,
  getPublicEnrollmentFormats,
  getEnrollmentFormatById,
  updateEnrollmentFormat,
  updateEnrollmentFormatStatus
} from '../services/enrollmentFormats.service.js';

const bucketName = process.env.SUPABASE_FORMATS_BUCKET || 'matricula-formatos';

const sanitizeFileName = (fileName) => {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
};

export const uploadEnrollmentFormat = async (req, res) => {
  try {
    const { titulo, descripcion } = req.body;

    if (!titulo) {
      return res.status(400).json({
        success: false,
        error: 'El título es obligatorio'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'El archivo PDF es obligatorio'
      });
    }

    const fileExtension = req.file.originalname
        .split('.')
        .pop()
        ?.toLowerCase();

        const allowedMimeTypes = [
        'application/pdf',
        'application/octet-stream'
        ];

        if (
        fileExtension !== 'pdf' ||
        !allowedMimeTypes.includes(req.file.mimetype)
        ) {
        return res.status(400).json({
            success: false,
            error: 'Solo se permiten archivos PDF'
        });
    }

    const originalName = sanitizeFileName(req.file.originalname);
    const fileId = crypto.randomUUID();
    const storagePath = `formatos/${fileId}-${originalName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      return res.status(500).json({
        success: false,
        error: uploadError.message
      });
    }

    const format = await createEnrollmentFormat({
      titulo,
      descripcion: descripcion || null,
      nombre_archivo: originalName,
      storage_path: storagePath,
      publicado_por: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Formato de matrícula publicado correctamente',
      data: format
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const listEnrollmentFormats = async (req, res) => {
  try {
    const {
      estado,
      usuario,
      page,
      limit
    } = req.query;

    const result = await getEnrollmentFormats({
      estado,
      usuario,
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

export const listPublicEnrollmentFormats = async (req, res) => {
  try {
    const formats = await getPublicEnrollmentFormats();

    res.json({
      success: true,
      data: formats
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getEnrollmentFormatDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const format = await getEnrollmentFormatById(id);

    if (!format) {
      return res.status(404).json({
        success: false,
        error: 'Formato no encontrado'
      });
    }

    res.json({
      success: true,
      data: format
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateEnrollmentFormatData = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;

    const existingFormat = await getEnrollmentFormatById(id);

    if (!existingFormat) {
      return res.status(404).json({
        success: false,
        error: 'Formato no encontrado'
      });
    }

    const updatedFormat = await updateEnrollmentFormat({
      id,
      titulo,
      descripcion
    });

    res.json({
      success: true,
      message: 'Formato actualizado correctamente',
      data: updatedFormat
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateEnrollmentFormatStatusData = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'El estado debe ser activo o inactivo'
      });
    }

    const existingFormat = await getEnrollmentFormatById(id);

    if (!existingFormat) {
      return res.status(404).json({
        success: false,
        error: 'Formato no encontrado'
      });
    }

    const updatedFormat = await updateEnrollmentFormatStatus({
      id,
      estado
    });

    res.json({
      success: true,
      message: 'Estado del formato actualizado correctamente',
      data: updatedFormat
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const downloadEnrollmentFormat = async (req, res) => {
  try {
    const { id } = req.params;

    const format = await getEnrollmentFormatById(id);

    if (!format) {
      return res.status(404).json({
        success: false,
        error: 'Formato no encontrado'
      });
    }

    if (format.estado !== 'activo') {
      return res.status(403).json({
        success: false,
        error: 'El formato no está disponible para descarga'
      });
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(format.storage_path);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${format.nombre_archivo}"`
    );

    res.send(buffer);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};