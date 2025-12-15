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
