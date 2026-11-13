import { Response } from 'express';
import { getDbPool, getDbState } from '../config/database';
import { REGIONAL_LOCATIONS } from '../models/catalog.data';
import { SavedBudget, AdminUserWork } from '../models/types';
import {
  budgetsStore,
  isAdminOrMasterType,
  recordAuditLog,
  userWorksStore
} from '../repositories/data.repository';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export function listBudgets(req: AuthenticatedRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.json([]);
    return;
  }

  if (isAdminOrMasterType(user.userType)) {
    res.json(budgetsStore);
    return;
  }

  const filtered = budgetsStore.filter(
    b => b.userId === user.id || (b.userEmail && b.userEmail.toLowerCase() === user.email.toLowerCase())
  );
  res.json(filtered);
}

export async function createBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const body = req.body || {};
    const user = req.user;
    const now = new Date().toISOString();
    const budgetId = body.id || `orc_${Date.now()}`;
    const location = body.location || REGIONAL_LOCATIONS[0];

    const newBudget: SavedBudget = {
      id: budgetId,
      userId: user?.id || body.userId || undefined,
      userEmail: user?.email || body.userEmail || undefined,
      title: body.title || `Obra ${body.workTypeName || body.workType || 'ConstruTec'}`,
      clientName: body.clientName || user?.name || 'Cliente ConstruTec',
      location,
      workType: body.workType || body.calculationResult?.workType || 'muro',
      workTypeName: body.workTypeName || body.calculationResult?.workTypeName || 'Obra Civil',
      calculationResult: body.calculationResult,
      status: body.status || 'rascunho',
      createdAt: body.createdAt || now,
      updatedAt: now,
      notes: body.notes || undefined
    };

    budgetsStore.unshift(newBudget);

    const newWork: AdminUserWork = {
      id: budgetId,
      userId: newBudget.userId || '',
      userName: user?.name || newBudget.clientName || 'Usuário ConstruTec',
      userEmail: newBudget.userEmail || '',
      title: newBudget.title,
      workType: newBudget.workType,
      workTypeName: newBudget.workTypeName,
      status: newBudget.status,
      totalCost: Number(newBudget.calculationResult?.totalEstimatedCost || 0),
      locationCity: location.city,
      locationUf: location.uf,
      createdAt: now,
      calculationResult: newBudget.calculationResult
    };
    userWorksStore.unshift(newWork);

    const dbPool = getDbPool();
    const dbState = getDbState();
    if (dbState.connected && dbPool) {
      try {
        const numericUserId = newBudget.userId && /^\d+$/.test(String(newBudget.userId)) ? Number(newBudget.userId) : null;
        const [ins]: any = await dbPool.query(
          `INSERT INTO obra (codigo_externo, usuario_id, titulo, cliente_nome, tipo_obra, tipo_obra_nome, custo_total_estimado, status, dados_localizacao, resultado_calculo)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            budgetId,
            numericUserId,
            newBudget.title,
            newBudget.clientName || null,
            newBudget.workType,
            newBudget.workTypeName,
            newWork.totalCost,
            newBudget.status,
            JSON.stringify(location),
            JSON.stringify(newBudget.calculationResult || {})
          ]
        );
        if (ins?.insertId) {
          await dbPool.query(
            `INSERT INTO medicao (obra_id, area_liquida_m2, volume_m3, desperdicio_percentual, parametros_json)
             VALUES (?, ?, ?, ?, ?)`,
            [
              ins.insertId,
              Number(newBudget.calculationResult?.areaM2 || newBudget.calculationResult?.area || 0),
              newBudget.calculationResult?.volumeM3 ?? newBudget.calculationResult?.volume ?? null,
              Number(newBudget.calculationResult?.wastePercentage ?? 10),
              JSON.stringify(newBudget.calculationResult?.inputSummary || {})
            ]
          );
        }
      } catch (err: any) {
        console.warn('[MySQL] Erro ao persistir obra/medição:', err.message);
      }
    }

    await recordAuditLog(
      'CRIAR_CALCULO',
      `Orçamento salvo: "${newBudget.title}" (${newBudget.workTypeName}) - R$ ${newWork.totalCost.toFixed(2)}`,
      {
        id: user?.id,
        name: user?.name || newWork.userName,
        email: user?.email || newWork.userEmail,
        userType: user?.userType || 'USUARIO'
      },
      req.ip
    );

    res.status(201).json(newBudget);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao salvar orçamento.' });
  }
}

export async function updateBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const idx = budgetsStore.findIndex(b => b.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Orçamento não encontrado.' });
    return;
  }

  const target = budgetsStore[idx];
  const user = req.user;
  if (
    user &&
    !isAdminOrMasterType(user.userType) &&
    target.userId !== user.id &&
    target.userEmail?.toLowerCase() !== user.email.toLowerCase()
  ) {
    res.status(403).json({ error: 'Sem permissão para editar este orçamento.' });
    return;
  }

  const updated: SavedBudget = {
    ...target,
    ...req.body,
    id: target.id,
    updatedAt: new Date().toISOString()
  };
  budgetsStore[idx] = updated;

  const wIdx = userWorksStore.findIndex(w => w.id === id);
  if (wIdx !== -1) {
    userWorksStore[wIdx] = {
      ...userWorksStore[wIdx],
      title: updated.title,
      status: updated.status,
      totalCost: Number(updated.calculationResult?.totalEstimatedCost ?? userWorksStore[wIdx].totalCost)
    };
  }

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool
      .query('UPDATE obra SET titulo = ?, status = ? WHERE codigo_externo = ?', [updated.title, updated.status, id])
      .catch(() => {});
  }

  await recordAuditLog(
    'EDITAR_OBRA',
    `Obra "${updated.title}" atualizada (status: ${updated.status}).`,
    { id: user?.id, name: user?.name || 'Sistema', email: user?.email, userType: user?.userType || 'USUARIO' },
    req.ip
  );

  res.json(updated);
}

export async function deleteBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const idx = budgetsStore.findIndex(b => b.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Orçamento não encontrado.' });
    return;
  }

  const target = budgetsStore[idx];
  const user = req.user;
  if (
    user &&
    !isAdminOrMasterType(user.userType) &&
    target.userId !== user.id &&
    target.userEmail?.toLowerCase() !== user.email.toLowerCase()
  ) {
    res.status(403).json({ error: 'Sem permissão para excluir este orçamento.' });
    return;
  }

  budgetsStore.splice(idx, 1);
  const wIdx = userWorksStore.findIndex(w => w.id === id);
  if (wIdx !== -1) {
    userWorksStore.splice(wIdx, 1);
  }

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    await dbPool.query('DELETE FROM obra WHERE codigo_externo = ?', [id]).catch(() => {});
  }

  await recordAuditLog(
    'EXCLUIR_OBRA',
    `Obra/orçamento removido: "${target.title}".`,
    { id: user?.id, name: user?.name || 'Sistema', email: user?.email, userType: user?.userType || 'USUARIO' },
    req.ip
  );

  res.json({ success: true, id });
}
