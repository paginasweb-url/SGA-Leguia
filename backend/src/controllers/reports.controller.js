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