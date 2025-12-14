export async function generarRutinaIA(params: {
  diasPorSemana: number;
  objetivo: string;
  enfoque: string[];
  nivel: string;
}) {
  // MOCK TEMPORAL PARA TESTS
  return {
    dias: Array.from({ length: params.diasPorSemana }).map((_, i) => ({
      dia: i + 1,
      ejercicios: ["Ejercicio 1", "Ejercicio 2"]
    }))
  };
}
