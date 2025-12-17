import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';

// Reuse transporter to avoid reconnects
export const mailer = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
});

export async function sendResetPasswordEmail(to: string, resetLink: string) {
  const fromEmail = process.env.SMTP_FROM || smtpUser || 'no-reply@fitplanner.com';
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2>Recuperar contraseña</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 18px;background:#0ea5e9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Restablecer contraseña
        </a>
      </p>
      <p>O copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all; color:#0ea5e9;">${resetLink}</p>
      <p style="color:#475569;font-size:13px;">Este enlace expirará en 1 hora.</p>
    </div>
  `;

  await mailer.sendMail({
    from: fromEmail,
    to,
    subject: 'Recupera tu contraseña - FitPlanner',
    html,
  });
}