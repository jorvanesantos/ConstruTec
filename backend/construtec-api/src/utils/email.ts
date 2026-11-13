import crypto from 'crypto';
import nodemailer from 'nodemailer';

export function generateProvisionalPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let randomPart = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    randomPart += chars[bytes[i] % chars.length];
  }
  return `CT${randomPart}`;
}

export async function sendProvisionalPasswordEmail(
  toEmail: string,
  userName: string,
  provisionalPassword: string
): Promise<{ sent: boolean; channel: 'smtp' | 'fallback' }> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const from = process.env.SMTP_FROM?.trim() || user || 'no-reply@construtec.com.br';

  if (!host || !user || !pass) {
    console.log(`[ConstruTec Mail] Senha provisória gerada para ${toEmail}: ${provisionalPassword} (SMTP não configurado; usando entrega local segura)`);
    return { sent: false, channel: 'fallback' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: `"ConstruTec" <${from}>`,
      to: toEmail,
      subject: 'ConstruTec - Sua Senha Provisória de Acesso',
      text: [
        `Olá, ${userName}!`,
        '',
        'Recebemos uma solicitação de recuperação de senha para a sua conta no ConstruTec.',
        `Sua nova senha provisória é: ${provisionalPassword}`,
        '',
        'Acesse o sistema usando esta senha provisória e altere-a na opção "Alterar Senha" no menu do usuário.',
        '',
        'Atenciosamente,',
        'Equipe ConstruTec'
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-top: 0;">Recuperação de Senha - ConstruTec</h2>
          <p style="color: #334155;">Olá, <strong>${userName}</strong>!</p>
          <p style="color: #334155;">Geramos uma senha provisória para você acessar sua conta:</p>
          <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 14px 18px; border-radius: 8px; text-align: center; margin: 18px 0;">
            <span style="font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #92400e;">${provisionalPassword}</span>
          </div>
          <p style="color: #475569; font-size: 13px;">Após fazer login com esta senha provisória, recomendamos alterá-la no menu do seu perfil em <strong>Alterar Senha</strong>.</p>
        </div>
      `
    });

    console.log(`[ConstruTec Mail] Senha provisória enviada via SMTP para ${toEmail}`);
    return { sent: true, channel: 'smtp' };
  } catch (err: any) {
    console.warn(`[ConstruTec Mail] Falha ao enviar SMTP para ${toEmail}: ${err.message}`);
    return { sent: false, channel: 'fallback' };
  }
}
