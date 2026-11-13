import { Request, Response } from 'express';
import { connectDatabase, getDbPool, getDbState } from '../config/database';
import {
  AdminMaterial,
  AdminUser,
  AdminWorkType,
  MasterActionRequest,
  MasterRequestAction,
  UserType
} from '../models/types';
import {
  auditLogsStore,
  budgetsStore,
  isMasterType,
  masterRequestsStore,
  materialsStore,
  MAX_PROPRIETARIOS,
  recordAuditLog,
  sanitizeUser,
  syncDataFromMySQL,
  userWorksStore,
  usersStore,
  workTypesStore
} from '../repositories/data.repository';
import { hashPassword, signJwtToken } from '../utils/security';
import { isValidEmail, isValidPassword, sanitizeString } from '../validators/request.validator';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export function health(_req: Request, res: Response): void {
  const dbState = getDbState();
  res.json({
    status: 'ok',
    service: 'ConstruTec API (Express + Angular + MySQL)',
    database: dbState.connected ? 'mysql_conectado' : 'memoria_fallback',
    timestamp: new Date().toISOString()
  });
}

export function statusBanco(_req: Request, res: Response): void {
  const dbState = getDbState();
  res.json({
    connected: dbState.connected,
    mode: dbState.connected ? 'MySQL Relacional' : 'Fallback em Memória',
    database: dbState.config.database,
    host: dbState.config.host,
    port: dbState.config.port,
    error: dbState.error
  });
}

export async function conectarBanco(_req: Request, res: Response): Promise<void> {
  const ok = await connectDatabase();
  if (ok) {
    await syncDataFromMySQL();
  }
  const dbState = getDbState();
  res.json({
    connected: ok,
    mode: ok ? 'MySQL Relacional' : 'Fallback em Memória',
    database: dbState.config.database,
    host: dbState.config.host,
    port: dbState.config.port,
    error: dbState.error
  });
}

export function getStats(_req: AuthenticatedRequest, res: Response): void {
  const totalProprietarios = usersStore.filter(u => isMasterType(u.userType) && u.active).length;
  const totalAdms = usersStore.filter(u => u.userType === 'ADM' && u.active).length;

  res.json({
    totalUsuarios: usersStore.length,
    totalObras: userWorksStore.length,
    totalCalculos: budgetsStore.length,
    totalMateriais: materialsStore.length,
    totalProprietarios,
    totalAdms,
    maxProprietarios: MAX_PROPRIETARIOS
  });
}

export function listUsers(_req: AuthenticatedRequest, res: Response): void {
  res.json(usersStore.map(sanitizeUser));
}

export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const actor = req.user!;
    const name = sanitizeString(req.body?.name);
    const email = sanitizeString(req.body?.email).toLowerCase();
    const password = String(req.body?.password || '123456');
    const requestedType = (req.body?.userType || 'USUARIO') as UserType;
    const role = sanitizeString(req.body?.role, requestedType === 'USUARIO' ? 'cliente' : 'gestor');
    const city = sanitizeString(req.body?.city, 'São Paulo');
    const uf = sanitizeString(req.body?.uf, 'SP').toUpperCase();

    if (!name || !isValidEmail(email)) {
      res.status(400).json({ error: 'Nome e e-mail válido são obrigatórios.' });
      return;
    }
    if (!isValidPassword(password)) {
      res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
      return;
    }
    if (usersStore.some(u => u.email.toLowerCase() === email)) {
      res.status(409).json({ error: 'Já existe uma conta cadastrada com este e-mail.' });
      return;
    }

    if (isMasterType(requestedType)) {
      const currentMasters = usersStore.filter(u => isMasterType(u.userType) && u.active).length;
      if (currentMasters >= MAX_PROPRIETARIOS) {
        res.status(400).json({ error: `Limite máximo de ${MAX_PROPRIETARIOS} contas Master atingido.` });
        return;
      }
    }

    const pwHash = hashPassword(password);
    let userId = `usr_${Date.now()}`;

    const dbPool = getDbPool();
    const dbState = getDbState();
    if (dbState.connected && dbPool) {
      try {
        const [ins]: any = await dbPool.query(
          `INSERT INTO usuario (nome, email, senha_hash, perfil, tipo_usuario, uf_padrao, cidade_padrao, ativo)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [name, email, pwHash, role, requestedType, uf, city]
        );
        if (ins?.insertId) userId = String(ins.insertId);
      } catch (err: any) {
        console.warn('[MySQL] Aviso ao criar usuário admin:', err.message);
      }
    }

    const newUser: AdminUser = {
      id: userId,
      name,
      email,
      userType: requestedType,
      role,
      active: true,
      createdAt: new Date().toISOString(),
      city,
      uf,
      passwordHash: pwHash
    };
    usersStore.unshift(newUser);

    const action =
      isMasterType(requestedType)
        ? 'CADASTRAR_PROPRIETARIO'
        : requestedType === 'ADM'
        ? 'CADASTRAR_ADM'
        : 'CADASTRAR_USUARIO';

    await recordAuditLog(
      action,
      `Conta criada (${requestedType}): ${name} (${email}) por ${actor.name}`,
      { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
      req.ip
    );

    res.status(201).json(sanitizeUser(newUser));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao criar usuário.' });
  }
}

async function createOrReuseMasterRequest(params: {
  actionType: MasterRequestAction;
  target: AdminUser;
  targetNewUserType?: UserType;
  actor: { id: string; name: string; email: string; userType: UserType };
  reason?: string;
  ip?: string;
}): Promise<{ ok: true; request: MasterActionRequest } | { ok: false; status: number; error: string }> {
  const { actionType, target, targetNewUserType, actor, reason, ip } = params;

  if (!isMasterType(target.userType)) {
    return { ok: false, status: 400, error: 'O usuário selecionado não é um ADM Master.' };
  }
  if (actor.id === target.id) {
    return {
      ok: false,
      status: 403,
      error:
        actionType === 'EXCLUIR'
          ? 'Para excluir uma conta ADM Master, outro administrador deve solicitar a exclusão para você aceitar.'
          : 'Para deixar de ser ADM Master, outro administrador deve solicitar o seu rebaixamento para você aceitar.'
    };
  }

  const activeMastersCount = usersStore.filter(u => isMasterType(u.userType) && u.active).length;
  if (activeMastersCount <= 1) {
    return {
      ok: false,
      status: 400,
      error: 'Deve permanecer pelo menos 1 Administrador Master ativo no sistema.'
    };
  }

  const existingPending = masterRequestsStore.find(
    r => r.targetUserId === target.id && r.actionType === actionType && r.status === 'PENDENTE'
  );
  if (existingPending) {
    return {
      ok: false,
      status: 409,
      error: `Já existe uma solicitação pendente de ${actionType === 'EXCLUIR' ? 'exclusão' : 'rebaixamento'} aguardando o aceite de ${target.name}.`
    };
  }

  const newReq: MasterActionRequest = {
    id: `mreq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    actionType,
    targetUserId: target.id,
    targetUserName: target.name,
    targetUserEmail: target.email,
    targetNewUserType: actionType === 'REBAIXAR' ? targetNewUserType || 'ADM' : undefined,
    requestedById: actor.id,
    requestedByName: actor.name,
    requestedByEmail: actor.email,
    reason: reason ? sanitizeString(reason) : undefined,
    status: 'PENDENTE',
    createdAt: new Date().toISOString()
  };

  masterRequestsStore.unshift(newReq);

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool
      .query(
        `INSERT INTO master_solicitacoes (id, tipo_acao, alvo_usuario_id, alvo_usuario_nome, alvo_usuario_email, novo_tipo_usuario, solicitante_id, solicitante_nome, solicitante_email, motivo, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE')`,
        [
          newReq.id,
          newReq.actionType,
          newReq.targetUserId,
          newReq.targetUserName,
          newReq.targetUserEmail,
          newReq.targetNewUserType || null,
          newReq.requestedById,
          newReq.requestedByName,
          newReq.requestedByEmail,
          newReq.reason || null
        ]
      )
      .catch(() => {});
  }

  await recordAuditLog(
    actionType === 'EXCLUIR' ? 'SOLICITAR_EXCLUSAO_MASTER' : 'SOLICITAR_REBAIXAMENTO_MASTER',
    actionType === 'EXCLUIR'
      ? `Solicitada exclusão do ADM Master ${target.name} (${target.email}) por ${actor.name}. Aguardando aceite.`
      : `Solicitado rebaixamento do ADM Master ${target.name} (${target.email}) para ${newReq.targetNewUserType} por ${actor.name}. Aguardando aceite.`,
    { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
    ip
  );

  return { ok: true, request: newReq };
}

export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const idx = usersStore.findIndex(u => u.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }

  const target = usersStore[idx];
  const actor = req.user!;
  const previousEmail = target.email;
  const nextName = sanitizeString(req.body?.name, target.name);
  const nextEmail = sanitizeString(req.body?.email, target.email).toLowerCase();

  if (!nextName || nextName.length < 2) {
    res.status(400).json({ error: 'Informe um nome válido para o usuário.' });
    return;
  }
  if (!isValidEmail(nextEmail)) {
    res.status(400).json({ error: 'E-mail inválido. Use o formato exemplo@dominio.com.' });
    return;
  }
  if (usersStore.some(u => u.id !== id && u.email.toLowerCase() === nextEmail)) {
    res.status(409).json({ error: 'Já existe outra conta cadastrada com este e-mail.' });
    return;
  }

  const requestedType = (req.body?.userType || target.userType) as UserType;
  let effectiveUserType: UserType = requestedType;
  let pendingRequest: MasterActionRequest | undefined;

  // Regra 1: Para um ADM se tornar Master, ele deve ser colocado por OUTRO ADM
  if (isMasterType(requestedType) && !isMasterType(target.userType)) {
    if (actor.id === target.id) {
      res.status(403).json({ error: 'Você não pode se autopromover a ADM Master. Outro administrador deve colocá-lo como Master.' });
      return;
    }
    if (target.userType !== 'ADM') {
      res.status(400).json({ error: 'Para se tornar ADM Master, a conta precisa estar primeiro como Administrador (ADM) e ser promovida por outro administrador.' });
      return;
    }
    const currentMasters = usersStore.filter(u => isMasterType(u.userType) && u.active).length;
    if (currentMasters >= MAX_PROPRIETARIOS) {
      res.status(400).json({ error: `Limite máximo de ${MAX_PROPRIETARIOS} contas Master atingido.` });
      return;
    }
  }

  // Regra 2: Para um ADM Master deixar de ser Master, outro ADM solicita o rebaixamento e o próprio Master precisa aceitar
  if (isMasterType(target.userType) && !isMasterType(requestedType)) {
    const reqResult = await createOrReuseMasterRequest({
      actionType: 'REBAIXAR',
      target,
      targetNewUserType: requestedType,
      actor,
      reason: req.body?.reason,
      ip: req.ip
    });

    if ('error' in reqResult) {
      res.status(reqResult.status).json({ error: reqResult.error });
      return;
    }

    pendingRequest = reqResult.request;
    effectiveUserType = target.userType;
  }

  const wasPromotedToMaster = !isMasterType(target.userType) && isMasterType(effectiveUserType);

  const updated: AdminUser = {
    ...target,
    name: nextName,
    email: nextEmail,
    role: sanitizeString(req.body?.role, target.role),
    city: sanitizeString(req.body?.city, target.city || 'São Paulo'),
    uf: sanitizeString(req.body?.uf, target.uf || 'SP').toUpperCase(),
    userType: effectiveUserType
  };
  usersStore[idx] = updated;

  if (previousEmail.toLowerCase() !== nextEmail.toLowerCase() || target.name !== nextName) {
    for (const b of budgetsStore) {
      if (b.userId === target.id || b.userEmail?.toLowerCase() === previousEmail.toLowerCase()) {
        b.userEmail = nextEmail;
      }
    }
    for (const w of userWorksStore) {
      if (w.userId === target.id || w.userEmail?.toLowerCase() === previousEmail.toLowerCase()) {
        w.userEmail = nextEmail;
        w.userName = nextName;
      }
    }
  }

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool
      .query('UPDATE usuario SET nome = ?, email = ?, perfil = ?, tipo_usuario = ?, cidade_padrao = ?, uf_padrao = ? WHERE email = ?', [
        updated.name,
        updated.email,
        updated.role,
        updated.userType,
        updated.city,
        updated.uf,
        previousEmail
      ])
      .catch(() => {});
  }

  const emailChangedNote = previousEmail.toLowerCase() !== nextEmail.toLowerCase()
    ? ` (e-mail alterado de ${previousEmail} para ${updated.email})`
    : ` (${updated.email})`;

  if (wasPromotedToMaster) {
    await recordAuditLog(
      'PROMOVER_MASTER',
      `${updated.name}${emailChangedNote} foi promovido para ADM Master por ${actor.name}`,
      { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
      req.ip
    );
  } else {
    await recordAuditLog(
      'EDITAR_USUARIO',
      `Dados atualizados do usuário ${updated.name}${emailChangedNote} por ${actor.name}`,
      { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
      req.ip
    );
  }

  if (pendingRequest) {
    res.status(202).json({
      ...sanitizeUser(updated),
      pendingApproval: true,
      request: pendingRequest,
      message: `Solicitação de rebaixamento enviada para aceite do ADM Master ${updated.name}.`
    });
    return;
  }

  res.json(sanitizeUser(updated));
}

export async function toggleUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const idx = usersStore.findIndex(u => u.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }

  const target = usersStore[idx];
  if (isMasterType(target.userType)) {
    res.status(403).json({ error: 'Contas Master principais não podem ser bloqueadas.' });
    return;
  }

  target.active = typeof req.body?.active === 'boolean' ? req.body.active : !target.active;

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool.query('UPDATE usuario SET ativo = ? WHERE email = ?', [target.active ? 1 : 0, target.email]).catch(() => {});
  }

  const actor = req.user!;
  await recordAuditLog(
    'STATUS_USUARIO',
    `Usuário ${target.email} marcado como ${target.active ? 'Ativo' : 'Bloqueado'}.`,
    { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
    req.ip
  );

  res.json(sanitizeUser(target));
}

export async function deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const idx = usersStore.findIndex(u => u.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }

  const target = usersStore[idx];
  const actor = req.user!;

  if (isMasterType(target.userType)) {
    const reqResult = await createOrReuseMasterRequest({
      actionType: 'EXCLUIR',
      target,
      actor,
      reason: req.body?.reason || (typeof req.query.reason === 'string' ? req.query.reason : undefined),
      ip: req.ip
    });

    if ('error' in reqResult) {
      res.status(reqResult.status).json({ error: reqResult.error });
      return;
    }

    res.status(202).json({
      success: false,
      id,
      pendingApproval: true,
      request: reqResult.request,
      message: `Solicitação de exclusão enviada. O ADM Master ${target.name} precisa aceitar para que a conta seja excluída.`
    });
    return;
  }

  usersStore.splice(idx, 1);

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool.query('DELETE FROM usuario WHERE email = ?', [target.email]).catch(() => {});
  }

  await recordAuditLog(
    'EXCLUIR_USUARIO',
    `Conta removida: ${target.name} (${target.email})`,
    { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
    req.ip
  );

  res.json({ success: true, id });
}

export function listMasterRequests(_req: AuthenticatedRequest, res: Response): void {
  res.json(masterRequestsStore);
}

export async function createMasterRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  const actor = req.user!;
  const targetUserId = sanitizeString(req.body?.targetUserId);
  const actionType = (req.body?.actionType || 'REBAIXAR') as MasterRequestAction;
  const targetNewUserType = (req.body?.targetNewUserType || 'ADM') as UserType;
  const reason = sanitizeString(req.body?.reason);

  const target = usersStore.find(u => u.id === targetUserId);
  if (!target) {
    res.status(404).json({ error: 'ADM Master não encontrado.' });
    return;
  }

  if (actionType !== 'REBAIXAR' && actionType !== 'EXCLUIR') {
    res.status(400).json({ error: 'Tipo de solicitação inválido.' });
    return;
  }

  if (actionType === 'REBAIXAR' && isMasterType(targetNewUserType)) {
    res.status(400).json({ error: 'Selecione ADM ou Usuário Padrão como novo nível para o rebaixamento.' });
    return;
  }

  const reqResult = await createOrReuseMasterRequest({
    actionType,
    target,
    targetNewUserType,
    actor,
    reason,
    ip: req.ip
  });

  if ('error' in reqResult) {
    res.status(reqResult.status).json({ error: reqResult.error });
    return;
  }

  res.status(201).json(reqResult.request);
}

export async function respondMasterRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const decision = String(req.body?.decision || '').toUpperCase();
  const actor = req.user!;

  const reqItem = masterRequestsStore.find(r => r.id === id);
  if (!reqItem) {
    res.status(404).json({ error: 'Solicitação não encontrada.' });
    return;
  }
  if (reqItem.status !== 'PENDENTE') {
    res.status(400).json({ error: `Esta solicitação já foi finalizada com status ${reqItem.status}.` });
    return;
  }

  if (actor.id !== reqItem.targetUserId) {
    res.status(403).json({ error: 'Somente o ADM Master em questão pode aceitar ou recusar esta solicitação.' });
    return;
  }

  if (decision !== 'ACEITAR' && decision !== 'RECUSAR') {
    res.status(400).json({ error: 'Decisão inválida. Informe ACEITAR ou RECUSAR.' });
    return;
  }

  const nowIso = new Date().toISOString();
  const dbPool = getDbPool();
  const dbState = getDbState();

  if (decision === 'RECUSAR') {
    reqItem.status = 'RECUSADA';
    reqItem.respondedAt = nowIso;

    if (dbState.connected && dbPool) {
      await dbPool
        .query('UPDATE master_solicitacoes SET status = ?, respondido_em = CURRENT_TIMESTAMP WHERE id = ?', ['RECUSADA', reqItem.id])
        .catch(() => {});
    }

    await recordAuditLog(
      'RECUSAR_SOLICITACAO_MASTER',
      `ADM Master ${actor.name} recusou solicitação de ${reqItem.actionType === 'EXCLUIR' ? 'exclusão' : 'rebaixamento'} enviada por ${reqItem.requestedByName}.`,
      { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
      req.ip
    );

    res.json({ accepted: false, request: reqItem, message: 'Solicitação recusada com sucesso.' });
    return;
  }

  const targetIdx = usersStore.findIndex(u => u.id === reqItem.targetUserId);
  if (targetIdx === -1) {
    res.status(404).json({ error: 'Conta alvo não encontrada.' });
    return;
  }

  const activeMastersCount = usersStore.filter(u => isMasterType(u.userType) && u.active).length;
  if (activeMastersCount <= 1) {
    res.status(400).json({ error: 'Não é possível concluir: deve permanecer pelo menos 1 ADM Master ativo no sistema.' });
    return;
  }

  const target = usersStore[targetIdx];
  reqItem.status = 'ACEITA';
  reqItem.respondedAt = nowIso;

  if (dbState.connected && dbPool) {
    await dbPool
      .query('UPDATE master_solicitacoes SET status = ?, respondido_em = CURRENT_TIMESTAMP WHERE id = ?', ['ACEITA', reqItem.id])
      .catch(() => {});
  }

  if (reqItem.actionType === 'REBAIXAR') {
    const newType: UserType = reqItem.targetNewUserType && !isMasterType(reqItem.targetNewUserType) ? reqItem.targetNewUserType : 'ADM';
    target.userType = newType;
    target.role = newType === 'USUARIO' ? 'cliente' : 'gestor';

    if (dbState.connected && dbPool) {
      await dbPool
        .query('UPDATE usuario SET tipo_usuario = ?, perfil = ? WHERE email = ?', [target.userType, target.role, target.email])
        .catch(() => {});
    }

    await recordAuditLog(
      'ACEITAR_SOLICITACAO_MASTER',
      `ADM Master ${target.name} aceitou rebaixamento para ${newType} (solicitado por ${reqItem.requestedByName}).`,
      { id: target.id, name: target.name, email: target.email, userType: target.userType },
      req.ip
    );

    const freshToken = signJwtToken({
      id: target.id,
      email: target.email,
      name: target.name,
      userType: target.userType,
      role: target.role
    });

    res.json({
      accepted: true,
      actionType: 'REBAIXAR',
      request: reqItem,
      updatedUser: sanitizeUser(target),
      token: freshToken,
      message: `Solicitação aceita. Seu perfil foi alterado para ${newType}.`
    });
    return;
  }

  // EXCLUIR
  usersStore.splice(targetIdx, 1);
  for (const other of masterRequestsStore) {
    if (other.id !== reqItem.id && other.targetUserId === target.id && other.status === 'PENDENTE') {
      other.status = 'CANCELADA';
      other.respondedAt = nowIso;
    }
  }

  if (dbState.connected && dbPool) {
    await dbPool.query('DELETE FROM usuario WHERE email = ?', [target.email]).catch(() => {});
    await dbPool
      .query("UPDATE master_solicitacoes SET status = 'CANCELADA', respondido_em = CURRENT_TIMESTAMP WHERE alvo_usuario_id = ? AND status = 'PENDENTE'", [target.id])
      .catch(() => {});
  }

  await recordAuditLog(
    'ACEITAR_SOLICITACAO_MASTER',
    `ADM Master ${target.name} (${target.email}) aceitou a exclusão da própria conta (solicitada por ${reqItem.requestedByName}).`,
    { id: target.id, name: target.name, email: target.email, userType: target.userType },
    req.ip
  );

  res.json({
    accepted: true,
    actionType: 'EXCLUIR',
    selfDeleted: true,
    request: reqItem,
    message: 'Solicitação aceita e conta excluída do sistema.'
  });
}

export async function cancelMasterRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const actor = req.user!;
  const reqItem = masterRequestsStore.find(r => r.id === id);
  if (!reqItem) {
    res.status(404).json({ error: 'Solicitação não encontrada.' });
    return;
  }
  if (reqItem.status !== 'PENDENTE') {
    res.status(400).json({ error: 'Apenas solicitações pendentes podem ser canceladas.' });
    return;
  }
  if (reqItem.requestedById !== actor.id && !isMasterType(actor.userType)) {
    res.status(403).json({ error: 'Somente o administrador solicitante pode cancelar esta solicitação.' });
    return;
  }

  reqItem.status = 'CANCELADA';
  reqItem.respondedAt = new Date().toISOString();

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool
      .query('UPDATE master_solicitacoes SET status = ?, respondido_em = CURRENT_TIMESTAMP WHERE id = ?', ['CANCELADA', reqItem.id])
      .catch(() => {});
  }

  res.json({ success: true, request: reqItem });
}

export function listWorkTypes(_req: AuthenticatedRequest, res: Response): void {
  res.json(workTypesStore);
}

export async function createWorkType(req: AuthenticatedRequest, res: Response): Promise<void> {
  const actor = req.user!;
  const name = sanitizeString(req.body?.name);
  const code = sanitizeString(req.body?.code || name.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
  if (!name) {
    res.status(400).json({ error: 'Nome do tipo de obra é obrigatório.' });
    return;
  }

  const newWt: AdminWorkType = {
    id: `wt_${Date.now()}`,
    code,
    name,
    description: sanitizeString(req.body?.description),
    category: req.body?.category || 'geral',
    defaultWaste: Number(req.body?.defaultWaste ?? 10),
    icon: sanitizeString(req.body?.icon, 'Wrench'),
    active: true,
    createdAt: new Date().toISOString()
  };

  workTypesStore.push(newWt);

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool
      .query(
        'INSERT INTO tipo_construcao (codigo, nome, descricao, categoria, desperdicio_padrao, icone, ativo) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [newWt.code, newWt.name, newWt.description, newWt.category, newWt.defaultWaste, newWt.icon]
      )
      .catch(() => {});
  }

  await recordAuditLog(
    'CRIAR_TIPO_OBRA',
    `Tipo de construção adicionado: ${newWt.name} (perda padrão ${newWt.defaultWaste}%)`,
    { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
    req.ip
  );

  res.status(201).json(newWt);
}

export async function updateWorkType(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const idx = workTypesStore.findIndex(w => w.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Tipo de obra não encontrado.' });
    return;
  }

  const updated: AdminWorkType = {
    ...workTypesStore[idx],
    ...req.body,
    defaultWaste: Number(req.body?.defaultWaste ?? workTypesStore[idx].defaultWaste),
    id: workTypesStore[idx].id
  };
  workTypesStore[idx] = updated;

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool
      .query('UPDATE tipo_construcao SET nome = ?, descricao = ?, categoria = ?, desperdicio_padrao = ? WHERE codigo = ?', [
        updated.name,
        updated.description,
        updated.category,
        updated.defaultWaste,
        updated.code
      ])
      .catch(() => {});
  }

  const actor = req.user!;
  await recordAuditLog(
    'EDITAR_TIPO_OBRA',
    `Tipo de obra atualizado: ${updated.name}`,
    { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
    req.ip
  );

  res.json(updated);
}

export async function toggleWorkTypeStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const target = workTypesStore.find(w => w.id === id);
  if (!target) {
    res.status(404).json({ error: 'Tipo de obra não encontrado.' });
    return;
  }

  target.active = !target.active;

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool.query('UPDATE tipo_construcao SET ativo = ? WHERE codigo = ?', [target.active ? 1 : 0, target.code]).catch(() => {});
  }

  const actor = req.user!;
  await recordAuditLog(
    'STATUS_TIPO_OBRA',
    `Tipo "${target.name}" definido como ${target.active ? 'Ativo' : 'Inativo'}.`,
    { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
    req.ip
  );

  res.json(target);
}

export function listMaterials(_req: AuthenticatedRequest, res: Response): void {
  res.json(materialsStore);
}

export async function createMaterial(req: AuthenticatedRequest, res: Response): Promise<void> {
  const actor = req.user!;
  const name = sanitizeString(req.body?.name);
  if (!name) {
    res.status(400).json({ error: 'Nome do material é obrigatório.' });
    return;
  }

  const mat: AdminMaterial = {
    id: `mat_${Date.now()}`,
    name,
    description: sanitizeString(req.body?.description),
    unit: sanitizeString(req.body?.unit, 'unidade'),
    price: Number(req.body?.price || 0),
    minQuantity: Number(req.body?.minQuantity ?? 10),
    status: req.body?.status === 'inativo' ? 'inativo' : 'ativo',
    category: sanitizeString(req.body?.category, 'Geral'),
    updatedAt: new Date().toISOString()
  };

  materialsStore.unshift(mat);

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool
      .query(
        'INSERT INTO material (codigo, nome, categoria, unidade_base, unidade_comercial, preco, quantidade_minima, descricao, status, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [mat.id, mat.name, mat.category, mat.unit, mat.unit, mat.price, mat.minQuantity, mat.description, mat.status, mat.status === 'ativo' ? 1 : 0]
      )
      .catch(() => {});
  }

  await recordAuditLog(
    'CADASTRAR_MATERIAL',
    `Insumo cadastrado: ${mat.name} - R$ ${mat.price.toFixed(2)}/${mat.unit}`,
    { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
    req.ip
  );

  res.status(201).json(mat);
}

export async function updateMaterial(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const idx = materialsStore.findIndex(m => m.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Material não encontrado.' });
    return;
  }

  const updated: AdminMaterial = {
    ...materialsStore[idx],
    ...req.body,
    price: Number(req.body?.price ?? materialsStore[idx].price),
    minQuantity: Number(req.body?.minQuantity ?? materialsStore[idx].minQuantity),
    id: materialsStore[idx].id,
    updatedAt: new Date().toISOString()
  };
  materialsStore[idx] = updated;

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool
      .query('UPDATE material SET nome = ?, categoria = ?, unidade_base = ?, preco = ?, quantidade_minima = ?, descricao = ?, status = ? WHERE codigo = ?', [
        updated.name,
        updated.category,
        updated.unit,
        updated.price,
        updated.minQuantity,
        updated.description,
        updated.status,
        updated.id
      ])
      .catch(() => {});
  }

  const actor = req.user!;
  await recordAuditLog(
    'EDITAR_MATERIAL',
    `Material atualizado: ${updated.name} (R$ ${Number(updated.price).toFixed(2)})`,
    { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
    req.ip
  );

  res.json(updated);
}

export async function toggleMaterialStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const target = materialsStore.find(m => m.id === id);
  if (!target) {
    res.status(404).json({ error: 'Material não encontrado.' });
    return;
  }

  target.status = target.status === 'ativo' ? 'inativo' : 'ativo';
  target.updatedAt = new Date().toISOString();

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool
      .query('UPDATE material SET status = ?, ativo = ? WHERE codigo = ?', [target.status, target.status === 'ativo' ? 1 : 0, target.id])
      .catch(() => {});
  }

  const actor = req.user!;
  await recordAuditLog(
    'STATUS_MATERIAL',
    `Material ${target.name} definido como ${target.status}.`,
    { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
    req.ip
  );

  res.json(target);
}

export async function deleteMaterial(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const idx = materialsStore.findIndex(m => m.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Material não encontrado.' });
    return;
  }

  const [removed] = materialsStore.splice(idx, 1);

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool.query('DELETE FROM material WHERE codigo = ?', [id]).catch(() => {});
  }

  const actor = req.user!;
  await recordAuditLog(
    'EXCLUIR_MATERIAL',
    `Insumo removido: ${removed.name}`,
    { id: actor.id, name: actor.name, email: actor.email, userType: actor.userType },
    req.ip
  );

  res.json({ success: true, id });
}

export function listWorks(_req: AuthenticatedRequest, res: Response): void {
  res.json(userWorksStore);
}

export function listHistory(req: AuthenticatedRequest, res: Response): void {
  const action = String(req.query.action || '').trim();
  const logs = action && action !== 'TODOS' ? auditLogsStore.filter(l => l.action === action) : auditLogsStore;
  res.json(logs);
}
