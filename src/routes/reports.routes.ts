import { Router } from "express";
import {
  getIncomeReport,
  obtenerMiembrosActivos,
  obtenerMiembrosActivosCount,
  exportarMiembrosActivosExcel,
  obtenerReporteClases,
  exportarReporteClasesExcel,
  obtenerDashboardKPIs,
  obtenerIngresosMensuales,
  obtenerNuevosMiembrosPorMes,
  obtenerRetencion,
  exportarDashboardCSV,
  exportarDashboardPDF
} from "../controllers/reports.controller";


const router = Router();

router.get("/ingresos", getIncomeReport);

router.get("/miembros-activos", obtenerMiembrosActivos);
router.get("/miembros-activos/count", obtenerMiembrosActivosCount);

router.get("/miembros-activos/excel", exportarMiembrosActivosExcel);

router.get("/clases", obtenerReporteClases);

router.get("/clases/excel", exportarReporteClasesExcel);

router.get("/dashboard-kpis", obtenerDashboardKPIs);

router.get("/ingresos-mensuales", obtenerIngresosMensuales);

router.get("/nuevos-miembros-mes", obtenerNuevosMiembrosPorMes);

router.get("/retencion", obtenerRetencion);

router.get("/dashboard-export-csv", exportarDashboardCSV);

router.get("/dashboard-export-pdf", exportarDashboardPDF);

export default router;
