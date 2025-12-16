import { generateRoutineWithAI } from './openai.service';

export async function generarRutinaIA(params: {
  diasPorSemana: number;
  objetivo: string;
  enfoque: string[];
  nivel: string;
}) {
  // Build a prompt asking the model to return a JSON structure with days and ejercicios
  const prompt = `Genera una rutina de entrenamiento para una persona con las siguientes características:\n- Nivel: ${params.nivel}\n- Objetivo: ${params.objetivo}\n- Enfoque: ${Array.isArray(params.enfoque) ? params.enfoque.join(', ') : params.enfoque}\n- Días por semana: ${params.diasPorSemana}\n\nResponde únicamente con un objeto JSON con la forma:{\n  "dias": [{ "dia": 1, "ejercicios": [ { "name": "Press banca", "sets": "4x10", "rest": "90s" }, ... ] }, ... ]\n}\nAsegúrate de incluir los nombres de los ejercicios (no etiquetas genéricas), y para cada ejercicio intenta proveer 'sets' (p. ej. "4x10") y 'rest' (p. ej. "90s") cuando sea posible. Si no puedes proporcionar sets o rest, déjalos como null o omite la propiedad. No incluyas texto explicativo fuera del JSON.`;

  const raw = await generateRoutineWithAI(prompt);

  // Try to extract JSON block from the raw text
  let jsonText = raw;
  try {
    // look for ```json ... ``` block
    const codeBlockMatch = raw.match(/```json\s*([\s\S]*?)```/i);
    
    if (codeBlockMatch && codeBlockMatch[1]) jsonText = codeBlockMatch[1];
    else {
      // try to find first { ... } substring
      const firstBrace = raw.indexOf('{');
      const lastBrace = raw.lastIndexOf('}');
      if (firstBrace >= 0 && lastBrace > firstBrace) jsonText = raw.substring(firstBrace, lastBrace + 1);
    }
  } catch (e) {
    // fallback below
  }

  try {
    const parsed = JSON.parse(jsonText);
    // Ensure structure: parsed.dias is array and each dia has ejercicios array
    if (parsed && Array.isArray(parsed.dias)) {
      const dias = parsed.dias.map((d: any, i: number) => ({
        dia: d.dia || i + 1,
        ejercicios: Array.isArray(d.ejercicios) ? d.ejercicios.map((ex: any) => {
          if (typeof ex === 'string') return { name: ex };
          return { name: ex.name || ex.nombre || String(ex), sets: ex.sets || null, rest: ex.rest || ex.descanso || null };
        }) : []
      }));
      return { dias, generatedText: raw };
    }
  } catch (e) {
    // parsing failed, continue to heuristic parsing
  }

  // Heuristic parsing fallback: split by lines and collect exercises per day
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const dias: any[] = [];
  let currentDay = 1;
  let currentExercises: any[] = [];
  for (const line of lines) {
    // detect day headers like "Día 1" or "Day 1" or "-- Día 1"
    const dayMatch = line.match(/^(?:D[ií]a|Dia|Day)\s*(\d+)/i);
    if (dayMatch) {
      if (currentExercises.length > 0) dias.push({ dia: currentDay, ejercicios: currentExercises });
      currentDay = Number(dayMatch[1]);
      currentExercises = [];
      continue;
    }
    // ignore metadata lines
    if (/^Objetivo:|^Nivel:|^Enfoque:|^D[ií]as?\/?semana:/i.test(line)) continue;

    // treat lines that look like exercises: bullets, numbered or starting with a word
    const cleaned = line.replace(/^\d+\)\s*/, '').replace(/^[-•]\s*/, '');
    // extract sets and rest
    const setsMatch = cleaned.match(/(\d+x\d+)/i);
    const restMatch = cleaned.match(/Descanso[:]?\s*(\d+\s?s|\d+s|\d+\s?segundos)/i) || cleaned.match(/(\d+\s?s)/i);
    const nameOnly = cleaned.replace(/\|?\s*Descanso[:]?.*$/i, '').replace(/(\d+x\d+)/i, '').replace(/\(.*?\)/g, '').trim();
    if (nameOnly) {
      currentExercises.push({ name: nameOnly, sets: setsMatch ? setsMatch[1] : null, rest: restMatch ? restMatch[1] : null });
    }
  }
  if (currentExercises.length > 0) dias.push({ dia: currentDay, ejercicios: currentExercises });

  // If no dias found, create default days with simple placeholders matching requested count
  if (dias.length === 0) {
    for (let i = 0; i < params.diasPorSemana; i++) {
      dias.push({ dia: i + 1, ejercicios: [] });
    }
  }

  return { dias, generatedText: raw };
}
