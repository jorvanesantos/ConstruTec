import { Request, Response } from 'express';
import { createHash, randomBytes } from 'crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { OAuth2Client } from 'google-auth-library';
import { getDbPool, getDbState } from '../config/database';
import { REGIONAL_LOCATIONS } from '../models/catalog.data';
import { AdminUser } from '../models/types';
import {
  masterRequestsStore,
  recordAuditLog,
  sanitizeUser,
  usersStore
} from '../repositories/data.repository';
import { hashPassword, signJwtToken, verifyPassword } from '../utils/security';
import { sendPasswordResetEmail } from '../services/password-reset-email.service';
import { isValidEmail, isValidPassword, sanitizeString } from '../validators/request.validator';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

interface PasswordResetUserRow extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
  tipo_usuario: string;
  ativo?: number;
}

function normalizeResetToken(value: unknown): string {
  const token = sanitizeString(value);
  return /^[a-f0-9]{24}$/i.test(token) ? token.toUpperCase() : token;
}

function isValidResetToken(token: string): boolean {
  return /^[A-F0-9]{24}$/.test(token) || /^[a-f0-9]{64}$/i.test(token);
}

interface GoogleUserRow extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
  senha_hash: string | null;
  avatar_url: string | null;
  perfil: string;
  tipo_usuario: AdminUser['userType'];
  telefone: string | null;
  uf_padrao: string | null;
  cidade_padrao: string | null;
  ativo: number;
  criado_em: Date | string;
}

function userFromDatabase(row: GoogleUserRow, fallbackAvatar = ''): AdminUser {
  return {
    id: String(row.id),
    name: row.nome,
    email: row.email,
    userType: row.tipo_usuario || 'USUARIO',
    role: row.perfil || 'cliente',
    active: Boolean(row.ativo),
    createdAt: row.criado_em ? new Date(row.criado_em).toISOString() : new Date().toISOString(),
    avatarUrl: row.avatar_url || fallbackAvatar || undefined,
    phone: row.telefone || undefined,
    city: row.cidade_padrao || 'São Paulo',
    uf: row.uf_padrao || 'SP',
    passwordHash: row.senha_hash || undefined
  };
}

function syncUser(user: AdminUser): void {
  const index = usersStore.findIndex(candidate => candidate.email.toLowerCase() === user.email.toLowerCase());
  if (index >= 0) usersStore[index] = user;
  else usersStore.unshift(user);
}

const userByEmailQuery = `SELECT id, nome, email, senha_hash, avatar_url, perfil, tipo_usuario, telefone,
                                uf_padrao, cidade_padrao, ativo, criado_em
                         FROM usuario WHERE email = ? LIMIT 1`;
const databaseUnavailableMessage = 'Banco de dados indisponível. Tente novamente mais tarde.';

async function persistPasswordHash(email: string, passwordHash: string, res: Response): Promise<boolean> {
  const dbPool = getDbPool();
  if (!getDbState().connected || !dbPool) {
    res.status(503).json({ error: 'Banco de dados indisponível. A senha não foi alterada.' });
    return false;
  }

  try {
    const [result] = await dbPool.execute<ResultSetHeader>(
      'UPDATE usuario SET senha_hash = ? WHERE email = ?',
      [passwordHash, email]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Conta não encontrada no banco de dados. A senha não foi alterada.' });
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Auth] Falha ao persistir alteração de senha no banco de dados:', err);
    res.status(503).json({ error: 'Não foi possível salvar a senha no banco de dados. Tente novamente.' });
    return false;
  }
}

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

    const dbPool = getDbPool();
    if (!getDbState().connected || !dbPool) {
      res.status(503).json({ error: databaseUnavailableMessage });
      return;
    }

    let rows: GoogleUserRow[];
    try {
      [rows] = await dbPool.execute<GoogleUserRow[]>(userByEmailQuery, [email]);
    } catch (err) {
      console.error('[Auth] Falha ao consultar usuário para login:', err);
      res.status(503).json({ error: databaseUnavailableMessage });
      return;
    }
    const user = rows[0] ? userFromDatabase(rows[0]) : undefined;
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

    syncUser(user);
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

    const dbPool = getDbPool();
    if (!getDbState().connected || !dbPool) {
      res.status(503).json({ error: databaseUnavailableMessage });
      return;
    }
    const pwHash = hashPassword(password);
    let userId: string;
    try {
      const [result] = await dbPool.execute<ResultSetHeader>(
        `INSERT INTO usuario (nome, email, senha_hash, perfil, tipo_usuario, telefone, uf_padrao, cidade_padrao, ativo)
         VALUES (?, ?, ?, ?, 'USUARIO', ?, ?, ?, 1)`,
        [name, email, pwHash, role, phone || null, uf, city]
      );
      userId = String(result.insertId);
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.' });
        return;
      }
      console.error('[Auth] Falha ao cadastrar usuário no banco:', err);
      res.status(503).json({ error: 'Não foi possível salvar o cadastro. Tente novamente mais tarde.' });
      return;
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

    syncUser(newUser);
    await recordAuditLog('CADASTRAR_USUARIO', `Novo cadastro público realizado: ${name} (${email})`, { id: newUser.id, name, email, userType: 'USUARIO' }, req.ip);

    res.status(201).json(buildUserResponse(newUser));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro interno ao registrar usuário.' });
  }
}

export function googleClientConfig(_req: Request, res: Response): void {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID?.trim() || '' });
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  try {
    const idToken = sanitizeString(req.body?.idToken);
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      res.status(503).json({ error: 'Login Google não configurado. Defina GOOGLE_CLIENT_ID no .env do servidor.' });
      return;
    }
    if (!idToken) {
      res.status(400).json({ error: 'Credencial de login Google ausente.' });
      return;
    }

    const dbPool = getDbPool();
    if (!getDbState().connected || !dbPool) {
      res.status(503).json({ error: databaseUnavailableMessage });
      return;
    }

    let payload;
    try {
      const ticket = await new OAuth2Client(clientId).verifyIdToken({ idToken, audience: clientId });
      payload = ticket.getPayload();
    } catch (verificationError) {
      console.warn('[Auth] Token Google inválido:', verificationError);
      res.status(401).json({ error: 'Não foi possível validar sua conta Google. Tente novamente.' });
      return;
    }

    const email = payload?.email?.trim().toLowerCase() || '';
    const name = payload?.name?.trim() || email.split('@')[0];
    const avatarUrl = payload?.picture || '';
    if (!payload?.sub || payload.email_verified !== true || !isValidEmail(email)) {
      res.status(401).json({ error: 'A conta Google não forneceu um e-mail verificado válido.' });
      return;
    }

    let userRow: GoogleUserRow | undefined;
    try {
      [userRow] = (await dbPool.execute<GoogleUserRow[]>(userByEmailQuery, [email]))[0];
    } catch (err) {
      console.error('[Auth] Falha ao consultar usuário Google:', err);
      res.status(503).json({ error: databaseUnavailableMessage });
      return;
    }

    let user = userRow ? userFromDatabase(userRow, avatarUrl) : undefined;

    if (!user) {
      const createdAt = new Date();
      let userId: string;
      try {
        const [result] = await dbPool.execute<ResultSetHeader>(
          `INSERT INTO usuario
             (nome, email, senha_hash, avatar_url, perfil, tipo_usuario, uf_padrao, cidade_padrao, ativo)
           VALUES (?, ?, NULL, ?, 'cliente', 'USUARIO', 'SP', 'São Paulo', 1)`,
          [name, email, avatarUrl || null]
        );
        userId = String(result.insertId);
      } catch (err) {
        console.error('[Auth] Falha ao cadastrar usuário Google:', err);
        res.status(503).json({ error: 'Não foi possível salvar o cadastro. Tente novamente mais tarde.' });
        return;
      }

      user = {
        id: userId,
        name,
        email,
        avatarUrl: avatarUrl || undefined,
        userType: 'USUARIO',
        role: 'cliente',
        active: true,
        createdAt: createdAt.toISOString(),
        city: 'São Paulo',
        uf: 'SP',
        passwordHash: undefined
      };
    }

    if (!user.active) {
      res.status(403).json({ error: 'Esta conta foi desativada.' });
      return;
    }

    syncUser(user);
    await recordAuditLog('LOGIN', `Login via Google para ${user.name} (${user.email})`, { id: user.id, name: user.name, email: user.email, userType: user.userType }, req.ip);
    res.json(buildUserResponse(user));
  } catch (err: any) {
    console.error('[Auth] Erro no login Google:', err);
    res.status(500).json({ error: err.message || 'Erro no login Google.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  const dbPool = getDbPool();
  if (!getDbState().connected || !dbPool) {
    res.status(503).json({ error: databaseUnavailableMessage });
    return;
  }
  let rows: GoogleUserRow[];
  try {
    [rows] = await dbPool.execute<GoogleUserRow[]>(userByEmailQuery, [req.user.email]);
  } catch (err) {
    console.error('[Auth] Falha ao verificar sessão:', err);
    res.status(503).json({ error: databaseUnavailableMessage });
    return;
  }
  if (!rows[0] || String(rows[0].id) !== req.user.id) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }
  const found = userFromDatabase(rows[0]);
  if (!found.active) {
    res.status(403).json({ error: 'Esta conta foi desativada.' });
    return;
  }
  syncUser(found);
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
    if (!(await persistPasswordHash(user.email, newHash, res))) {
      return;
    }
    user.passwordHash = newHash;

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

    const dbPool = getDbPool();
    if (!getDbState().connected || !dbPool) {
      res.status(503).json({ error: 'Banco de dados indisponível. Tente novamente mais tarde.' });
      return;
    }

    const [rows] = await dbPool.execute<PasswordResetUserRow[]>(
      'SELECT id, nome, email, tipo_usuario, ativo FROM usuario WHERE email = ? LIMIT 1',
      [email]
    );
    const user = rows[0];
    if (!user || user.ativo === 0) {
      res.json({
        success: true,
        message: 'Se o e-mail estiver cadastrado, enviaremos um código para redefinir sua senha.'
      });
      return;
    }

    const token = randomBytes(12).toString('hex').toUpperCase();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const [tokenUpdate] = await dbPool.execute<ResultSetHeader>(
      `UPDATE usuario
       SET reset_token = ?, reset_token_expira = DATE_ADD(NOW(), INTERVAL 1 HOUR)
       WHERE id = ?`,
      [tokenHash, user.id]
    );
    if (tokenUpdate.affectedRows === 0) {
      res.json({
        success: true,
        message: 'Se o e-mail estiver cadastrado, enviaremos um código para redefinir sua senha.'
      });
      return;
    }

    try {
      await sendPasswordResetEmail(user.email, user.nome, token);
    } catch (mailError) {
      console.error('[Auth] Falha ao enviar e-mail de redefinição:', mailError);
      try {
        await dbPool.execute(
          'UPDATE usuario SET reset_token = NULL, reset_token_expira = NULL WHERE id = ? AND reset_token = ?',
          [user.id, tokenHash]
        );
      } catch (cleanupError) {
        console.error('[Auth] Falha ao invalidar token após erro de e-mail:', cleanupError);
      }
      res.status(503).json({ error: 'Não foi possível enviar o e-mail de redefinição. Verifique a configuração SMTP e tente novamente.' });
      return;
    }

    await recordAuditLog(
      'RECUPERAR_SENHA',
      `Código de redefinição de senha enviado para ${email}`,
      { id: String(user.id), name: user.nome, email: user.email, userType: user.tipo_usuario as AdminUser['userType'] },
      req.ip
    );

    res.json({
      success: true,
      message: 'Se o e-mail estiver cadastrado, enviaremos um código para redefinir sua senha.'
    });
  } catch (err) {
    console.error('[Auth] Erro ao solicitar recuperação de senha:', err);
    res.status(503).json({ error: 'Não foi possível concluir a recuperação de senha. Tente novamente mais tarde.' });
  }
}

export async function verifyPasswordRecoveryCode(req: Request, res: Response): Promise<void> {
  try {
    const token = normalizeResetToken(req.body?.token);
    if (!isValidResetToken(token)) {
      res.status(400).json({ error: 'O código é inválido ou expirou. Solicite um novo código.' });
      return;
    }

    const dbPool = getDbPool();
    if (!getDbState().connected || !dbPool) {
      res.status(503).json({ error: 'Banco de dados indisponível. Tente novamente mais tarde.' });
      return;
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const [rows] = await dbPool.execute<PasswordResetUserRow[]>(
      `SELECT id FROM usuario
       WHERE reset_token = ? AND reset_token_expira > NOW() AND ativo = 1
       LIMIT 1`,
      [tokenHash]
    );
    if (!rows[0]) {
      res.status(400).json({ error: 'O código é inválido ou expirou. Solicite um novo código.' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Auth] Erro ao verificar código de recuperação:', err);
    res.status(503).json({ error: 'Não foi possível verificar o código. Tente novamente mais tarde.' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const token = normalizeResetToken(req.body?.token);
    const newPassword = String(req.body?.novaSenha || '');

    if (!isValidResetToken(token) || !isValidPassword(newPassword)) {
      res.status(400).json({ error: 'Código inválido ou nova senha menor que 6 caracteres.' });
      return;
    }

    const dbPool = getDbPool();
    if (!getDbState().connected || !dbPool) {
      res.status(503).json({ error: 'Banco de dados indisponível. Tente novamente mais tarde.' });
      return;
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const [rows] = await dbPool.execute<PasswordResetUserRow[]>(
      `SELECT id, nome, email, tipo_usuario FROM usuario
       WHERE reset_token = ? AND reset_token_expira > NOW() AND ativo = 1
       LIMIT 1`,
      [tokenHash]
    );
    const user = rows[0];
    if (!user) {
      res.status(400).json({ error: 'O código ou link é inválido ou expirou. Solicite uma nova recuperação.' });
      return;
    }

    const newHash = hashPassword(newPassword);
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE usuario
       SET senha_hash = ?, reset_token = NULL, reset_token_expira = NULL
       WHERE id = ? AND reset_token = ? AND reset_token_expira > NOW() AND ativo = 1`,
      [newHash, user.id, tokenHash]
    );
    if (result.affectedRows === 0) {
      res.status(400).json({ error: 'O código ou link é inválido ou expirou. Solicite uma nova recuperação.' });
      return;
    }

    const storedUser = usersStore.find(candidate => candidate.email.toLowerCase() === user.email.toLowerCase());
    if (storedUser) {
      storedUser.passwordHash = newHash;
    }

    await recordAuditLog(
      'RECUPERAR_SENHA',
      `Senha redefinida com sucesso para ${user.email}`,
      { id: String(user.id), name: user.nome, email: user.email, userType: user.tipo_usuario as AdminUser['userType'] },
      req.ip
    );
    res.json({ success: true, message: 'Senha redefinida com sucesso! Faça login com sua nova senha.' });
  } catch (err) {
    console.error('[Auth] Erro ao redefinir senha:', err);
    res.status(503).json({ error: 'Não foi possível redefinir a senha. Tente novamente mais tarde.' });
  }
}
