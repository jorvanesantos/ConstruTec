import nodemailer from 'nodemailer';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character] || character);
}

export async function sendPasswordResetEmail(toEmail: string, userName: string, token: string): Promise<void> {
  const user = process.env.EMAIL_USER?.trim() || process.env.SMTP_USER?.trim();
  const password = process.env.EMAIL_PASS?.trim() || process.env.SMTP_PASS?.trim();
  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);

  if (!user || !password) {
    throw new Error('Configure EMAIL_USER e EMAIL_PASS no arquivo .env para habilitar o envio de e-mail.');
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT deve ser uma porta válida entre 1 e 65535.');
  }

  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:4200').replace(/\/+$/, '');
  const resetUrl = `${frontendUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(userName);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password }
  });

  await transporter.sendMail({
    from: `"ConstruTec" <${process.env.SMTP_FROM?.trim() || user}>`,
    to: toEmail,
    subject: 'Redefinição de senha - ConstruTec',
    text: [
      `Olá, ${userName}!`,
      '',
      'Recebemos uma solicitação para redefinir a senha da sua conta ConstruTec.',
      `Acesse este link para escolher uma nova senha (válido por 1 hora): ${resetUrl}`,
      '',
      'Se você não solicitou a redefinição, ignore este e-mail.'
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0f172a;border:1px solid #e2e8f0;border-radius:16px">
        <h1 style="font-size:24px;margin:0 0 16px">Redefinição de senha</h1>
        <p>Olá, <strong>${safeName}</strong>.</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta ConstruTec. Use o botão abaixo para criar uma nova senha. O link expira em 1 hora.</p>
        <p style="margin:28px 0">
          <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:13px 22px;background:#f59e0b;color:#0f172a;text-decoration:none;font-weight:bold;border-radius:10px">Redefinir minha senha</a>
        </p>
        <p style="font-size:13px;color:#475569">Se você não solicitou essa alteração, ignore este e-mail. Sua senha atual continuará funcionando.</p>
      </div>
    `
  });
}
