import { Request, Response } from 'express';
import { generateRoutineWithAI } from '../services/openai.service';

export async function createRoutineAI(req: Request, res: Response) {
  try {
    const { objective, level, daysPerWeek, focus, restrictions } = req.body;
    const prompt = `Genera una rutina de entrenamiento. Objetivo: ${objective || 'No especificado'}. Nivel: ${level || 'No especificado'}. Días/semana: ${daysPerWeek || '3'}. Enfoque: ${focus || 'General'}. Restricciones: ${restrictions || 'ninguna'}. Entrega: título, lista de días con ejercicios y repeticiones. Breve explicación.`;

    const aiText = await generateRoutineWithAI(prompt);
    return res.json({ routineText: aiText });
  } catch (err: any) {
    console.error('AI routine error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Error generating routine' });
  }
}

export default createRoutineAI;
import { Request, Response } from 'express';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function buildPrompt(payload: any) {
  const { objective, level, targets, restrictions, daysPerWeek } = payload;

  return `Eres un entrenador experto. Genera una rutina de entrenamiento estructurada en español en formato claro.
  Requerimientos:
  - Objetivo: ${objective}
  - Nivel: ${level}
  - Días por semana: ${daysPerWeek}
  - Enfoque: ${Array.isArray(targets) ? targets.join(', ') : targets}
  - Restricciones: ${restrictions || 'Ninguna'}

  Devuelve una rutina dividida por día con ejercicios, series, repeticiones o duración, y una breve nota de recomendaciones. Responde únicamente con texto (puedes usar formato Markdown).`;
}

export async function generateRoutine(req: Request, res: Response) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });
    }

    const payload = req.body || {};
    const prompt = buildPrompt(payload);

    const body = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Eres un asistente que genera rutinas de entrenamiento concisas y útiles.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.7,
    };

    const r = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ error: 'OpenAI API error', details: text });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || null;

    return res.json({ routine: content });
  } catch (e: any) {
    return res.status(500).json({ error: 'server_error', message: e?.message || String(e) });
  }
}

export async function generateRestrictionAdvice(req: Request, res: Response) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });

    const { restriction, context } = req.body || {};
    if (!restriction || String(restriction).trim().length === 0) return res.status(400).json({ error: 'restriction is required' });

    const userContext = context || {};
    const prompt = `Eres un entrenador profesional. Un usuario tiene la siguiente restricción o molestia: "${restriction}". Provee en español:
1) Un consejo claro y visual (2-3 bullets) sobre cómo adaptar el entrenamiento y qué evitar.
2) 2-3 alternativas de ejercicios seguros para reemplazar movimientos que podrían dañarlo.
3) Señala precauciones y cuándo recomendar consultar a un profesional médico.

Incluye títulos en negrita para cada sección y sé conciso.`;

    const body = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Eres un entrenador profesional, da consejos claros y breves en español.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.6,
    };

    const r = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ error: 'OpenAI API error', details: text });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
    return res.json({ advice: content });
  } catch (e: any) {
    console.error('generateRestrictionAdvice error', e?.message || e);
    return res.status(500).json({ error: 'server_error', message: e?.message || String(e) });
  }
}
