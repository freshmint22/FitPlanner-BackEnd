import Member from "../models/member.model";
import Payment from "../models/payment.model";
import Membership from "../models/membership.model";

/* ============================================
   SERVICIO EXISTENTE — REPORTE DE INGRESOS
============================================ */

interface Params {
  startDate?: string;
  endDate?: string;
}

export const getIncomeService = async ({ startDate, endDate }: Params) => {
  const match: any = {};

  if (startDate && endDate) {
    match.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const incomes = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          month: { $month: "$date" },
          year: { $year: "$date" }
        },
        total: { $sum: "$amount" }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const totalAcumulado = incomes.reduce((sum, i) => sum + i.total, 0);

  return {
    mensual: incomes.map(i => ({
      mes: i._id.month,
      año: i._id.year,
      total: i.total
    })),
    totalAcumulado
  };
};

/* ================================
   CÁLCULO DEL ESTADO DEL MIEMBRO
================================ */
const calcularEstadoMiembro = (fecha: Date | null): string => {
  if (!fecha) return "Sin pagos registrados";

  const hoy = new Date();
  const fechaPago = new Date(fecha);

  const diferencia = fechaPago.getTime() - hoy.getTime();
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

  if (dias < 0) return "Vencida";
  if (dias <= 3) return "Por vencer";
  return "Activa";
};

/* ================================
   REPORTE DE MIEMBROS ACTIVOS
================================ */
interface MemberFilters {
  search?: string;
  plan?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export const getActiveMembersReportService = async ({
  search,
  fechaInicio,
  fechaFin
}: MemberFilters) => {

  const query: any = {};

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  if (fechaInicio && fechaFin) {
    query.createdAt = {
      $gte: new Date(fechaInicio),
      $lte: new Date(fechaFin)
    };
  }

  const miembros = await Member.find(query).lean();

  const data = await Promise.all(
    miembros.map(async (m) => {
      const ultimoPago = await Payment.findOne({ memberId: m._id })
        .sort({ date: -1 })
        .lean();

      let proximoPago = null;
      if (ultimoPago) {
        proximoPago = new Date(ultimoPago.date);
        proximoPago.setDate(proximoPago.getDate() + 30);
      }

      return {
        nombre: `${m.firstName} ${m.lastName}`,
        correo: m.email,
        plan: "General",
        fechaIngreso: m.createdAt,
        proximoPago,
        estado: calcularEstadoMiembro(proximoPago)
      };
    })
  );

  return data;
};

/* ==========================================================
   KPI DEL DASHBOARD
========================================================== */
import Attendance from "../models/attendance.model";

export const getDashboardKPIsService = async () => {
  // Count active members only
  const totalMiembros = await Member.countDocuments({ estado: 'activo' });

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const finMes = new Date();
  finMes.setMonth(finMes.getMonth() + 1);
  finMes.setDate(0);
  finMes.setHours(23, 59, 59, 999);

  // Sum payments for current month
  const ingresosMesAgg = await Payment.aggregate([
    { $match: { date: { $gte: inicioMes, $lte: finMes } } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  const ingresosMes = ingresosMesAgg.length > 0 ? ingresosMesAgg[0].total : 0;

  // Total accumulated income from all payments
  const totalIngresosAgg = await Payment.aggregate([
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  const ingresosTotales = totalIngresosAgg.length > 0 ? totalIngresosAgg[0].total : 0;

  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);

  const hoyFin = new Date();
  hoyFin.setHours(23, 59, 59, 999);

  const checkinsHoy = await Attendance.countDocuments({
    date: { $gte: hoyInicio, $lte: hoyFin }
  });

  const activos = totalMiembros;
  const totalMiembrosDB = await Member.countDocuments();
  const retencion = totalMiembrosDB > 0 ? Math.round((activos / totalMiembrosDB) * 100) : 0;

  return {
    totalMiembros: activos,
    ingresosMes,
    ingresosTotales,
    checkinsHoy,
    retencion
  };
};

/* ==========================================================
   INGRESOS MENSUALES (12 MESES)
========================================================== */
export const getIngresosMensualesService = async () => {
  // Aggregate payments by month/year for the last 12 months
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const pagos = await Payment.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { month: { $month: "$date" }, year: { $year: "$date" } },
        monto: { $sum: "$amount" },
        pagos: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  // Map aggregation to a simpler array ordered by year/month
  const result = pagos.map((p: any) => ({
    mes: p._id.month,
    año: p._id.year,
    monto: p.monto,
    pagos: p.pagos
  }));

  return result;
};

/* ==========================================================
   NUEVOS MIEMBROS POR MES (CORREGIDO)
========================================================== */
export const getNuevosMiembrosPorMesService = async (createdBy?: string) => {
  const hace12meses = new Date();
  hace12meses.setMonth(hace12meses.getMonth() - 12);

  const match: any = { createdAt: { $gte: hace12meses } };
  if (createdBy) match.createdBy = createdBy;

  const datos = await Member.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" }
        },
        total: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0 }));
  datos.forEach((d) => { meses[d._id.month - 1].total = d.total; });
  return meses;
};

/** Devuelve el número de membresías activas actualmente */
export const getActiveMembershipsCountService = async () => {
  const count = await Membership.countDocuments({ active: true });
  return count;
};


