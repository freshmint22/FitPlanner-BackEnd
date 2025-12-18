// Lazily require nodemailer so server can start even if the package
// wasn't installed (useful during local dev). If missing, we expose
// a no-op send function that logs a warning.
let nodemailer: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  // @ts-expect-error require is used for lazy loading
  nodemailer = require('nodemailer');
} catch {
  // nodemailer not installed
  nodemailer = null;
}

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'FitPlanner';
const FROM_EMAIL = process.env.EMAIL_FROM || SMTP_USER || 'no-reply@fitplanner.local';
let transporter: any = null;

function getTransporter() {
  if (!nodemailer) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST || undefined,
    port: SMTP_PORT || undefined,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  } as any);
  return transporter;
}

export async function sendResetEmail(to: string, token: string) {
  try {
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontend.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111;">
        <h2 style="color:#0f172a">Restablecer contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el botón abajo para establecer una nueva contraseña. El enlace expira en 1 hora.</p>
        <p style="text-align:center;margin:28px 0">
          <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;border-radius:999px;background:#06b6d4;color:white;text-decoration:none;font-weight:600;">Restablecer contraseña</a>
        </p>
        <p style="font-size:12px;color:#6b7280">Si no solicitaste este cambio, ignora este mensaje.</p>
      </div>
    `;

    const tr = getTransporter();
    if (!tr) {
      console.warn('nodemailer not available — skipping sending reset email.');
      return Promise.resolve({ ok: false, info: 'nodemailer-not-installed' });
    }

    const info = await tr.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: 'Restablece tu contraseña — FitPlanner',
      html,
      text: `Abre el siguiente enlace para restablecer tu contraseña: ${resetUrl}`,
    });

    return info;
  } catch (err) {
    console.warn('Failed to send reset email', err);
    throw err;
  }
}

export default { sendResetEmail };
