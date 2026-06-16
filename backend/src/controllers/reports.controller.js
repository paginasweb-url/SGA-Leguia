import ExcelJS from 'exceljs';

import {
  getDashboardReport,
  getEnrollmentReport,
  getAttendanceReport,
  getGradesReport,
  getRiskStudentsReport,
  getAnnouncementsReport,
  getAttendanceExportDetail
} from '../services/reports.service.js';

export const dashboardReport = async (req, res) => {
  const data = await getDashboardReport();
  res.json({ success: true, data });
};

export const enrollmentReport = async (req, res) => {
  const data = await getEnrollmentReport();
  res.json({ success: true, data });
};

export const attendanceReport = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  const data = await getAttendanceReport(fechaInicio, fechaFin);
  res.json({ success: true, data });
};

export const gradesReport = async (req, res) => {

  const { bimestre } = req.query;

  if (!bimestre) {
    return res.status(400).json({
      success: false,
      error: 'El bimestre es obligatorio'
    });
  }

  const data = await getGradesReport(bimestre);
  res.json({ success: true, data });
};

export const riskStudentsReport = async (req, res) => {
  const { bimestre } = req.query;

  if (!bimestre) {
    return res.status(400).json({
      success: false,
      error: 'El bimestre es obligatorio'
    });
  }

  const data = await getRiskStudentsReport(bimestre);
  res.json({ success: true, data });
};

export const announcementsReport = async (req, res) => {
  const data = await getAnnouncementsReport();
  res.json({ success: true, data });
};

export const exportAttendanceDetailReport = async (req, res) => {
  try {
    const {
      fechaInicio,
      fechaFin,
      format = 'xlsx'
    } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: 'La fecha de inicio y la fecha de fin son obligatorias'
      });
    }

    if (format !== 'xlsx') {
      return res.status(400).json({
        success: false,
        error: 'Formato no soportado. Use format=xlsx'
      });
    }

    const data = await getAttendanceExportDetail({
      fechaInicio,
      fechaFin
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asistencia');

    worksheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Código estudiante', key: 'codigo_estudiante', width: 22 },
      { header: 'Estudiante', key: 'estudiante', width: 30 },
      { header: 'DNI', key: 'dni', width: 15 },
      { header: 'Grado', key: 'grado', width: 20 },
      { header: 'Sección', key: 'seccion', width: 12 },
      { header: 'Turno', key: 'turno', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Observación', key: 'observacion', width: 35 }
    ];

    worksheet.getRow(1).font = { bold: true };

    data.forEach((item) => {
      worksheet.addRow({
        fecha: item.fecha
          ? new Date(item.fecha).toISOString().split('T')[0]
          : '',
        codigo_estudiante: item.codigo_estudiante,
        estudiante: item.estudiante,
        dni: item.dni,
        grado: item.grado,
        seccion: item.seccion,
        turno: item.turno,
        estado: item.estado,
        observacion: item.observacion || ''
      });
    });

    worksheet.addRow([]);

    worksheet.addRow({
      fecha: 'Fecha inicio',
      codigo_estudiante: fechaInicio
    });

    worksheet.addRow({
      fecha: 'Fecha fin',
      codigo_estudiante: fechaFin
    });

    worksheet.addRow({
      fecha: 'Generado',
      codigo_estudiante: new Date().toLocaleString('es-PE')
    });

    const fileName = `reporte_asistencia_${fechaInicio}_${fechaFin}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().split('T')[0];
};

const sendWorkbook = async ({ res, workbook, fileName }) => {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${fileName}"`
  );

  await workbook.xlsx.write(res);
  res.end();
};

const addMetaRows = (worksheet, meta = {}) => {
  worksheet.addRow([]);

  Object.entries(meta).forEach(([key, value]) => {
    worksheet.addRow({
      columna_1: key,
      columna_2: value
    });
  });

  worksheet.addRow({
    columna_1: 'Generado',
    columna_2: new Date().toLocaleString('es-PE')
  });
};

export const exportEnrollmentReport = async (req, res) => {
  try {
    const data = await getEnrollmentReport();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Matrículas');

    worksheet.columns = [
      { header: 'Grado', key: 'grado', width: 25 },
      { header: 'Sección', key: 'seccion', width: 15 },
      { header: 'Turno', key: 'turno', width: 18 },
      { header: 'Total matriculados', key: 'total_matriculados', width: 22 },
      { header: '', key: 'columna_1', width: 22 },
      { header: '', key: 'columna_2', width: 28 }
    ];

    worksheet.getRow(1).font = { bold: true };

    data.forEach((item) => {
      worksheet.addRow({
        grado: item.grado,
        seccion: item.seccion,
        turno: item.turno,
        total_matriculados: item.total_matriculados
      });
    });

    addMetaRows(worksheet, {
      Reporte: 'Matrículas aprobadas'
    });

    await sendWorkbook({
      res,
      workbook,
      fileName: 'reporte_matriculas.xlsx'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const exportGradesReport = async (req, res) => {
  try {
    const { bimestre } = req.query;

    if (!bimestre) {
      return res.status(400).json({
        success: false,
        error: 'El bimestre es obligatorio'
      });
    }

    const data = await getGradesReport(bimestre);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Notas');

    worksheet.columns = [
      { header: 'Grado', key: 'grado', width: 25 },
      { header: 'Sección', key: 'seccion', width: 15 },
      { header: 'Turno', key: 'turno', width: 18 },
      { header: 'Curso', key: 'curso', width: 30 },
      { header: 'Nota', key: 'nota', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
      { header: '', key: 'columna_1', width: 22 },
      { header: '', key: 'columna_2', width: 28 }
    ];

    worksheet.getRow(1).font = { bold: true };

    data.forEach((item) => {
      worksheet.addRow({
        grado: item.grado,
        seccion: item.seccion,
        turno: item.turno,
        curso: item.curso,
        nota: item.nota,
        total: item.total
      });
    });

    addMetaRows(worksheet, {
      Reporte: 'Distribución de notas',
      Bimestre: bimestre
    });

    await sendWorkbook({
      res,
      workbook,
      fileName: `reporte_notas_${bimestre}.xlsx`
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const exportRiskStudentsReport = async (req, res) => {
  try {
    const { bimestre } = req.query;

    if (!bimestre) {
      return res.status(400).json({
        success: false,
        error: 'El bimestre es obligatorio'
      });
    }

    const data = await getRiskStudentsReport(bimestre);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Estudiantes en riesgo');

    worksheet.columns = [
      { header: 'Código estudiante', key: 'codigo_estudiante', width: 22 },
      { header: 'Estudiante', key: 'estudiante', width: 35 },
      { header: 'DNI', key: 'dni', width: 15 },
      { header: 'Grado', key: 'grado', width: 25 },
      { header: 'Sección', key: 'seccion', width: 15 },
      { header: 'Turno', key: 'turno', width: 18 },
      { header: 'Curso', key: 'curso', width: 30 },
      { header: 'Bimestre', key: 'bimestre', width: 15 },
      { header: 'Nota', key: 'nota', width: 12 },
      { header: 'Comentario', key: 'comentario', width: 40 },
      { header: '', key: 'columna_1', width: 22 },
      { header: '', key: 'columna_2', width: 28 }
    ];

    worksheet.getRow(1).font = { bold: true };

    data.forEach((item) => {
      worksheet.addRow({
        codigo_estudiante: item.codigo_estudiante,
        estudiante: `${item.nombres} ${item.apellidos}`,
        dni: item.dni || '',
        grado: item.grado,
        seccion: item.seccion,
        turno: item.turno,
        curso: item.curso,
        bimestre: item.bimestre,
        nota: item.nota,
        comentario: item.comentario || ''
      });
    });

    addMetaRows(worksheet, {
      Reporte: 'Estudiantes en riesgo',
      Bimestre: bimestre
    });

    await sendWorkbook({
      res,
      workbook,
      fileName: `reporte_estudiantes_riesgo_${bimestre}.xlsx`
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const exportAnnouncementsReport = async (req, res) => {
  try {
    const data = await getAnnouncementsReport();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Comunicados');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Título', key: 'titulo', width: 40 },
      { header: 'Contenido', key: 'contenido', width: 60 },
      { header: 'Destinatario', key: 'destinatario_tipo', width: 22 },
      { header: 'Fecha', key: 'fecha', width: 18 },
      { header: 'Confirmaciones', key: 'confirmaciones', width: 18 },
      { header: 'Leídos', key: 'leidos', width: 14 },
      { header: '', key: 'columna_1', width: 22 },
      { header: '', key: 'columna_2', width: 28 }
    ];

    worksheet.getRow(1).font = { bold: true };

    worksheet.getColumn('contenido').alignment = {
      wrapText: true,
      vertical: 'top'
    };

    worksheet.getColumn('titulo').alignment = {
      wrapText: true,
      vertical: 'top'
    };

    data.forEach((item) => {
      const row = worksheet.addRow({
        id: item.id,
        titulo: item.titulo,
        contenido: item.contenido || '',
        destinatario_tipo: item.destinatario_tipo,
        fecha: formatDate(item.fecha),
        confirmaciones: item.confirmaciones,
        leidos: item.leidos
      });

      row.alignment = {
        vertical: 'top',
        wrapText: true
      };
    });

    addMetaRows(worksheet, {
      Reporte: 'Comunicados'
    });

    await sendWorkbook({
      res,
      workbook,
      fileName: 'reporte_comunicados.xlsx'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};