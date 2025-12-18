import { Request, Response } from "express";

import { 
  getIncomeService, 
  getActiveMembersReportService,
  getDashboardKPIsService,
  getIngresosMensualesService
  , getActiveMembershipsCountService
} from "../services/reports.service";

import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

/* ==========================================================
   CONTROLADOR EXISTENTE — REPORTE DE INGRESOS
   ========================================================== */
export const getIncomeReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const report = await getIncomeService({
      startDate: startDate?.toString(),
      endDate: endDate?.toString()
    });

    res.json({
      status: "success",
      data: report
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};


/* ==========================================================
   MIEMBROS ACTIVOS — SOLO BÚSQUEDA POR NOMBRE O CORREO
   ========================================================== */
export const obtenerMiembrosActivos = async (req: Request, res: Response) => {
  try {
    const filtros = {
      search: req.query.search?.toString(), 
    };

    const data = await getActiveMembersReportService(filtros);

    return res.status(200).json({
      ok: true,
      miembros: data
    });

  } catch (error) {
    console.error("Error en reporte miembros activos:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error generando reporte"
    });
  }
};

export const obtenerMiembrosActivosCount = async (req: Request, res: Response) => {
  try {
    const count = await getActiveMembershipsCountService();
    return res.status(200).json({ ok: true, activeMemberships: count });
  } catch (error) {
    console.error('Error getting active memberships count:', error);
    return res.status(500).json({ ok: false, msg: 'Error obteniendo conteo' });
  }
};


/* ==========================================================
   EXPORTAR MIEMBROS ACTIVOS A EXCEL
   ========================================================== */
export const exportarMiembrosActivosExcel = async (req: Request, res: Response) => {
  try {
    const filtros = {
      search: req.query.search?.toString(), 
    };

    const miembros = await getActiveMembersReportService(filtros);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Miembros Activos");

    worksheet.addRow(["Nombre", "Correo", "Plan", "Fecha Ingreso", "Próximo Pago", "Estado"]);

    miembros.forEach(m => {
      worksheet.addRow([
        m.nombre,
        m.correo,
        m.plan,
        m.fechaIngreso ? new Date(m.fechaIngreso).toLocaleDateString() : "",
        m.proximoPago ? new Date(m.proximoPago).toLocaleDateString() : "",
        m.estado
      ]);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=miembros_activos.xlsx");

    await workbook.xlsx.write(res);
    return res.status(200).end();

  } catch (error) {
    console.error("Error generando Excel:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al generar archivo Excel"
    });
  }
};




/* ==========================================================
   🔵 AGREGADO — REPORTE DE CLASES IMPARTIDAS Y ASISTENCIA
   (NO SE MODIFICÓ NADA DE LO QUE YA EXISTÍA)
   ========================================================== */

import ClassModel from "../models/class.model";
import Attendance from "../models/attendance.model";

/* ==========================================================
   NUEVA FUNCIÓN — REPORTE DE CLASES
   ========================================================== */
export const obtenerReporteClases = async (req: Request, res: Response) => {
  try {
    const { entrenador } = req.query;

    const pipeline: any[] = [
      { $match: { classId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$classId",
          asistentes: { $sum: 1 },
        },
      },
      { $sort: { asistentes: -1 } },
      {
        $lookup: {
          from: "classes",
          localField: "_id",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      { $unwind: { path: "$classInfo", preserveNullAndEmptyArrays: true } },
    ];

    if (entrenador) {
      pipeline.push({
        $match: {
          "classInfo.instructorName": { $regex: entrenador.toString(), $options: "i" },
        },
      });
    }

    pipeline.push({
      $project: {
        nombre: {
          $ifNull: ["$classInfo.name", { $ifNull: ["$classInfo.title", "Clase"] }],
        },
        entrenador: "$classInfo.instructorName",
        fecha: { $ifNull: ["$classInfo.date", "$classInfo.schedule"] },
        cupos: { $ifNull: ["$classInfo.capacity", 0] },
        asistentes: 1,
        ocupacion: {
          $cond: [
            { $gt: [{ $ifNull: ["$classInfo.capacity", 0] }, 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$asistentes", { $ifNull: ["$classInfo.capacity", 1] }] },
                    100,
                  ],
                },
                0,
              ],
            },
            0,
          ],
        },
      },
    });

    const reporte = await Attendance.aggregate(pipeline);

    return res.json({ ok: true, reporte });

  } catch (error) {
    console.error("Error generando reporte de clases:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error generando reporte de clases",
    });
  }
};


/* ==========================================================
   NUEVA FUNCIÓN — EXPORTAR REPORTE DE CLASES A EXCEL
   ========================================================== */
export const exportarReporteClasesExcel = async (req: Request, res: Response) => {
  try {
    const { entrenador } = req.query;

    const query: any = {};
    if (entrenador) {
      query.instructorName = { $regex: entrenador.toString(), $options: "i" };
    }

    const clases = await ClassModel.find(query).lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Clases Impartidas");

    worksheet.addRow([
      "Clase",
      "Entrenador",
      "Fecha",
      "Cupos",
      "Asistentes",
      "Ocupación (%)"
    ]);

    for (const clase of clases) {
      const asistentes = await Attendance.countDocuments({ classId: clase._id });

      const ocupacion =
        clase.capacity > 0 ? Math.round((asistentes / clase.capacity) * 100) : 0;

      worksheet.addRow([
        clase.name,
        clase.instructorName,
        clase.date ? new Date(clase.date).toLocaleDateString() : "",
        clase.capacity,
        asistentes,
        ocupacion
      ]);
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=reporte_clases.xlsx");

    await workbook.xlsx.write(res);
    return res.status(200).end();

  } catch (error) {
    console.error("Error generando Excel de clases:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al generar archivo Excel"
    });
  }
};



/* ==========================================================
   KPI DASHBOARD
   ========================================================== */
export const obtenerDashboardKPIs = async (req: Request, res: Response) => {
  try {
    const data = await getDashboardKPIsService();
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    console.error("Error obteniendo KPIs del dashboard:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error obteniendo KPIs"
    });
  }
};


/* ==========================================================
   INGRESOS MENSUALES (12 MESES)
   ========================================================== */
export const obtenerIngresosMensuales = async (req: Request, res: Response) => {
  try {
    const data = await getIngresosMensualesService();

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Error obteniendo ingresos mensuales:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error obteniendo ingresos mensuales"
    });
  }
};
import { getNuevosMiembrosPorMesService } from "../services/reports.service";

export const obtenerNuevosMiembrosPorMes = async (req: Request, res: Response) => {
  try {
    const createdBy = req.query.createdBy?.toString();
    const data = await getNuevosMiembrosPorMesService(createdBy);

    return res.status(200).json({ ok: true, data });

  } catch (error) {
    console.error("Error obteniendo nuevos miembros por mes:", error);
    return res.status(500).json({ ok: false, msg: "Error obteniendo nuevos miembros por mes" });
  }
};
import Member from "../models/member.model";  // 👈 AGREGA ESTO ANTES DE USAR Member

export const obtenerRetencion = async (req: Request, res: Response) => {
  try {
    const hoy = new Date();

    const totalMiembros = await Member.countDocuments({});
    const activos = await Member.countDocuments({ estado: "activo" });

    const retencion =
      totalMiembros > 0 ? Math.round((activos / totalMiembros) * 100) : 0;

    return res.status(200).json({
      ok: true,
      retencion,
      totalMiembros,
      activos,
    });

  } catch (error) {
    console.error("Error obteniendo retención:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error obteniendo retención",
    });
  }
};

/* ==========================================================
   EXPORTAR DASHBOARD A CSV
   ========================================================== */
export const exportarDashboardCSV = async (req: Request, res: Response) => {
  try {
    // Reutilizamos el servicio que ya tienes
    const data = await getDashboardKPIsService();

    // Construimos el CSV en memoria
    const csv =
      "Métrica,Valor\n" +
      `Total miembros,${data.totalMiembros}\n` +
      `Ingresos del mes,${data.ingresosMes}\n` +
      `Check-ins hoy,${data.checkinsHoy}\n` +
      `Retención (%),${data.retencion}\n`;

    // Cabeceras de descarga
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=dashboard.csv"
    );

    return res.status(200).send(csv);

  } catch (error) {
    console.error("Error exportando CSV del dashboard:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error exportando CSV del dashboard",
    });
  }
};

/* ==========================================================
   EXPORTAR DASHBOARD A PDF
   ========================================================== */
export const exportarDashboardPDF = async (req: Request, res: Response) => {
  try {
    const data = await getDashboardKPIsService();

    // Creamos documento PDF
    const doc = new PDFDocument();

    // Cabeceras para descarga
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=dashboard.pdf"
    );

    // Enviamos el PDF por streaming
    doc.pipe(res);

    // Contenido del PDF
    doc.fontSize(20).text("Reporte del Dashboard", { underline: true });
    doc.moveDown();

    doc.fontSize(14).text(`Total de miembros: ${data.totalMiembros}`);
    doc.text(`Ingresos del mes: ${data.ingresosMes}`);
    doc.text(`Check-ins hoy: ${data.checkinsHoy}`);
    doc.text(`Retención: ${data.retencion}%`);

    doc.end(); // cerramos el PDF

  } catch (error) {
    console.error("Error exportando PDF del dashboard:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error exportando PDF del dashboard",
    });
  }
};
