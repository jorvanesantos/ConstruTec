import { Request, Response } from 'express';
import { getDbPool, getDbState } from '../config/database';
import { REGIONAL_LOCATIONS } from '../models/catalog.data';
import { AdminUser, UserType } from '../models/types';
import {
  masterRequestsStore,
  passwordResetStore,
  recordAuditLog,
  sanitizeUser,
  usersStore
} from '../repositories/data.repository';
import { hashPassword, signJwtToken, verifyPassword } from '../utils/security';
import { generateProvisionalPassword, sendProvisionalPasswordEmail } from '../utils/email';
import { isValidEmail, isValidPassword, sanitizeString } from '../validators/request.validator';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

function buildUserResponse(user: AdminUser) {
  const token = signJwtToken({
    id: user.id,
    email: user.email,
    name: user.name,
    userType: user.userType,
    role: user.role
  });
  const loc = REGIONAL_LOCATIONS.find(l => l.uf === (user.uf || 'SP')) || REGIONAL_LOCATIONS[0];
  const pendingMasterRequestsCount = masterRequestsStore.filter(
    r => r.targetUserId === user.id && r.status === 'PENDENTE'
  ).length;
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      userType: user.userType,
      active: user.active,
      pendingMasterRequestsCount,
      defaultLocation: loc,
      isLoggedIn: true,
      createdAt: user.createdAt
    }
  };
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const email = sanitizeString(req.body?.email).toLowerCase();
    const password = String(req.body?.password || '');

    if (!isValidEmail(email) || !isValidPassword(password)) {
      res.status(400).json({ error: 'E-mail inválido ou senha com menos de 6 caracteres.' });
      return;
    }

    const user = usersStore.find(u => u.email.toLowerCase() === email);
    if (!user) {
      await recordAuditLog('LOGIN_FALHA', `Tentativa de login com e-mail não cadastrado: ${email}`, { name: email, email, userType: 'USUARIO' }, req.ip);
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    if (!user.active) {
      await recordAuditLog('LOGIN_FALHA', `Tentativa de acesso em conta inativa: ${email}`, { id: user.id, name: user.name, email, userType: user.userType }, req.ip);
      res.status(403).json({ error: 'Esta conta foi desativada pelo administrador.' });
      return;
    }

    if (!verifyPassword(password, user.passwordHash)) {
      await recordAuditLog('LOGIN_FALHA', `Senha incorreta para o usuário ${user.email}`, { id: user.id, name: user.name, email: user.email, userType: user.userType }, req.ip);
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    await recordAuditLog('LOGIN', `Login realizado com sucesso por ${user.name} (${user.userType})`, { id: user.id, name: user.name, email: user.email, userType: user.userType }, req.ip);
    res.json(buildUserResponse(user));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro interno ao autenticar.' });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const name = sanitizeString(req.body?.name);
    const email = sanitizeString(req.body?.email).toLowerCase();
    const password = String(req.body?.password || '');
    const role = sanitizeString(req.body?.role, 'cliente');
    const phone = sanitizeString(req.body?.phone);
    const city = sanitizeString(req.body?.city, 'São Paulo');
    const uf = sanitizeString(req.body?.uf, 'SP').toUpperCase();

    if (!name || name.length < 2) {
      res.status(400).json({ error: 'Informe seu nome completo.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'E-mail inválido. Use o formato exemplo@dominio.com.' });
      return;
    }
    if (!isValidPassword(password)) {
      res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (usersStore.some(u => u.email.toLowerCase() === email)) {
      res.status(409).json({ error: 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.' });
      return;
    }

    const pwHash = hashPassword(password);
    let userId = `usr_${Date.now()}`;

    const dbPool = getDbPool();
    const dbState = getDbState();
    if (dbState.connected && dbPool) {
      try {
        const [result]: any = await dbPool.query(
          `INSERT INTO usuario (nome, email, senha_hash, perfil, tipo_usuario, telefone, uf_padrao, cidade_padrao, ativo)
           VALUES (?, ?, ?, ?, 'USUARIO', ?, ?, ?, 1)`,
          [name, email, pwHash, role, phone || null, uf, city]
        );
        if (result?.insertId) {
          userId = String(result.insertId);
        }
      } catch (err: any) {
        console.warn('[MySQL] Erro ao inserir novo usuário:', err.message);
      }
    }

    const newUser: AdminUser = {
      id: userId,
      name,
      email,
      userType: 'USUARIO',
      role,
      active: true,
      createdAt: new Date().toISOString(),
      phone: phone || undefined,
      city,
      uf,
      passwordHash: pwHash
    };

    usersStore.unshift(newUser);
    await recordAuditLog('CADASTRAR_USUARIO', `Novo cadastro público realizado: ${name} (${email})`, { id: newUser.id, name, email, userType: 'USUARIO' }, req.ip);

    res.status(201).json(buildUserResponse(newUser));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro interno ao registrar usuário.' });
  }
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  try {
    const email = sanitizeString(req.body?.email, 'visitante.google@gmail.com').toLowerCase();
    const name = sanitizeString(req.body?.name, 'Usuário Google');
    const avatarUrl = sanitizeString(req.body?.avatarUrl);

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'E-mail Google inválido.' });
      return;
    }

    let user = usersStore.find(u => u.email.toLowerCase() === email);
    if (!user) {
      user = {
        id: `usr_g_${Date.now()}`,
        name,
        email,
        avatarUrl: avatarUrl || undefined,
        userType: 'USUARIO',
        role: 'cliente',
        active: true,
        createdAt: new Date().toISOString(),
        city: 'São Paulo',
        uf: 'SP',
        passwordHash: hashPassword('google_oauth_placeholder_123456')
      };
      usersStore.unshift(user);
    }

    if (!user.active) {
      res.status(403).json({ error: 'Esta conta foi desativada.' });
      return;
    }

    await recordAuditLog('LOGIN', `Login via Google para ${user.name} (${user.email})`, { id: user.id, name: user.name, email: user.email, userType: user.userType }, req.ip);
    res.json(buildUserResponse(user));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro no login Google.' });
  }
}

export function getMe(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  const found = usersStore.find(u => u.id === req.user!.id || u.email.toLowerCase() === req.user!.email.toLowerCase());
  if (!found) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }
  const pendingMasterRequestsCount = masterRequestsStore.filter(
    r => r.targetUserId === found.id && r.status === 'PENDENTE'
  ).length;
  res.json({ user: { ...sanitizeUser(found), pendingMasterRequestsCount } });
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }

    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!isValidPassword(newPassword)) {
      res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    const user = usersStore.find(u => u.id === req.user!.id || u.email.toLowerCase() === req.user!.email.toLowerCase());
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      res.status(401).json({ error: 'A senha atual informada está incorreta.' });
      return;
    }

    const newHash = hashPassword(newPassword);
    user.passwordHash = newHash;

    const dbPool = getDbPool();
    const dbState = getDbState();
    if (dbState.connected && dbPool) {
      await dbPool.query('UPDATE usuario SET senha_hash = ? WHERE email = ?', [newHash, user.email]).catch(() => {});
    }

    await recordAuditLog('ALTERAR_SENHA', `Senha alterada pelo usuário ${user.email}`, { id: user.id, name: user.name, email: user.email, userType: user.userType }, req.ip);
    res.json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao alterar senha.' });
  }
}

export async function updateAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }

    const user = usersStore.find(u => u.id === req.user!.id || u.email.toLowerCase() === req.user!.email.toLowerCase());
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const rawAvatar = req.body?.avatarUrl;
    let nextAvatar: string | undefined;

    if (rawAvatar === null || rawAvatar === undefined || String(rawAvatar).trim() === '') {
      nextAvatar = undefined;
    } else {
      const value = String(rawAvatar).trim();
      const isDataImage = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(value);
      const isHttpUrl = /^https?:\/\/.+/i.test(value);
      if (!isDataImage && !isHttpUrl) {
        res.status(400).json({ error: 'Formato de imagem inválido. Envie JPG, PNG ou WebP.' });
        return;
      }
      if (value.length > 1_500_000) {
        res.status(400).json({ error: 'A imagem é muito grande. Reduza o tamanho do arquivo.' });
        return;
      }
      nextAvatar = value;
    }

    user.avatarUrl = nextAvatar;

    const dbPool = getDbPool();
    const dbState = getDbState();
    if (dbState.connected && dbPool) {
      await dbPool.query('UPDATE usuario SET avatar_url = ? WHERE email = ?', [nextAvatar || null, user.email]).catch(() => {});
    }

    await recordAuditLog(
      'EDITAR_USUARIO',
      nextAvatar ? `Foto de perfil atualizada por ${user.name} (${user.email})` : `Foto de perfil removida por ${user.name} (${user.email})`,
      { id: user.id, name: user.name, email: user.email, userType: user.userType },
      req.ip
    );

    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao atualizar foto de perfil.' });
  }
}

export async function requestPasswordRecovery(req: Request, res: Response): Promise<void> {
  try {
    const email = sanitizeString(req.body?.email).toLowerCase();
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Informe um e-mail válido.' });
      return;
    }

    const user = usersStore.find(u => u.email.toLowerCase() === email);
    if (!user) {
      res.status(404).json({ error: 'Nenhuma conta localizada para este e-mail.' });
      return;
    }

    if (!user.active) {
      res.status(403).json({ error: 'Esta conta está bloqueada. Procure o administrador.' });
      return;
    }

    const provisionalPassword = generateProvisionalPassword();
    const newHash = hashPassword(provisionalPassword);
    user.passwordHash = newHash;

    const dbPool = getDbPool();
    const dbState = getDbState();
    if (dbState.connected && dbPool) {
      await dbPool.query('UPDATE usuario SET senha_hash = ? WHERE email = ?', [newHash, user.email]).catch(() => {});
    }

    const mailRes = await sendProvisionalPasswordEmail(user.email, user.name, provisionalPassword);

    await recordAuditLog(
      'RECUPERAR_SENHA',
      `Senha provisória gerada (${mailRes.sent ? 'enviada via SMTP' : 'entrega imediata'}) para ${email}`,
      { id: user.id, name: user.name, email, userType: user.userType },
      req.ip
    );

    res.json({
      success: true,
      emailSent: mailRes.sent,
      provisionalPassword: mailRes.sent ? undefined : provisionalPassword,
      message: mailRes.sent
        ? `Enviamos uma senha provisória para o e-mail ${email}. Use-a para entrar e depois altere sua senha no menu do perfil.`
        : `Senha provisória gerada para ${email}. Utilize a senha provisória abaixo para entrar e altere-a após o acesso.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro na solicitação de recuperação.' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const email = sanitizeString(req.body?.email).toLowerCase();
    const code = sanitizeString(req.body?.code);
    const newPassword = String(req.body?.newPassword || '');

    if (!isValidEmail(email) || !isValidPassword(newPassword)) {
      res.status(400).json({ error: 'E-mail inválido ou nova senha menor que 6 caracteres.' });
      return;
    }

    const stored = passwordResetStore.get(email);
    if (!stored || stored.code !== code || Date.now() > stored.expiresAt) {
      res.status(400).json({ error: 'Código de verificação inválido ou expirado.' });
      return;
    }

    const user = usersStore.find(u => u.email.toLowerCase() === email);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const newHash = hashPassword(newPassword);
    user.passwordHash = newHash;
    passwordResetStore.delete(email);

    const dbPool = getDbPool();
    const dbState = getDbState();
    if (dbState.connected && dbPool) {
      await dbPool.query('UPDATE usuario SET senha_hash = ? WHERE email = ?', [newHash, user.email]).catch(() => {});
    }

    await recordAuditLog('RECUPERAR_SENHA', `Senha redefinida com sucesso via código para ${email}`, { id: user.id, name: user.name, email, userType: user.userType as UserType }, req.ip);
    res.json({ success: true, message: 'Senha redefinida com sucesso! Faça login com sua nova senha.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao redefinir senha.' });
  }
}
