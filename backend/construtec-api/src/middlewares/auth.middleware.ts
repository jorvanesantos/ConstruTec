import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken, JwtUserPayload } from '../utils/security';

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return token || null;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    return;
  }

  try {
    req.user = verifyJwtToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Sessão expirada ou token inválido.' });
  }
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (token) {
    try {
      req.user = verifyJwtToken(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  const allowed = req.user.userType === 'ADM_MASTER' || req.user.userType === 'ADM' || req.user.userType === 'PROPRIETARIO';
  if (!allowed) {
    res.status(403).json({ error: 'Acesso restrito a administradores do sistema.' });
    return;
  }
  next();
}

export function requireMaster(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  const isMaster = req.user.userType === 'ADM_MASTER' || req.user.userType === 'PROPRIETARIO';
  if (!isMaster) {
    res.status(403).json({ error: 'Ação permitida apenas para Administrador Master.' });
    return;
  }
  next();
}
