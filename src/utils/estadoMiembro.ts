export function calcularEstadoMiembro(fecha: Date | null): string {
  if (!fecha) return "Sin plan";

  const hoy = new Date();
  const fechaPago = new Date(fecha);

  const diferencia = fechaPago.getTime() - hoy.getTime();
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

  if (dias < 0) return "Vencida";
  if (dias <= 3) return "Por vencer";
  return "Activa";
}
