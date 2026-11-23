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
      `Seu código temporário é: ${token}`,
      'Digite este código na tela de recuperação para escolher uma nova senha. Ele é válido por 1 hora e pode ser usado apenas uma vez.',
      '',
      'Se você não solicitou a redefinição, ignore este e-mail.'
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0f172a;border:1px solid #e2e8f0;border-radius:16px">
        <h1 style="font-size:24px;margin:0 0 16px">Redefinição de senha</h1>
        <p>Olá, <strong>${safeName}</strong>.</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta ConstruTec. Digite o código abaixo na tela de recuperação para criar uma nova senha.</p>
        <p style="margin:28px 0">
          <strong style="display:inline-block;padding:13px 22px;background:#fef3c7;color:#0f172a;font-size:20px;letter-spacing:2px;border-radius:10px">${escapeHtml(token)}</strong>
        </p>
        <p>O código expira em 1 hora e pode ser usado apenas uma vez. Não o compartilhe.</p>
        <p style="font-size:13px;color:#475569">Se você não solicitou essa alteração, ignore este e-mail. Sua senha atual continuará funcionando.</p>
      </div>
    `
  });
}
