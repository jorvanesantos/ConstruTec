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
      calculationResults: Array.isArray(body.calculationResults) && body.calculationResults.length
        ? body.calculationResults
        : [body.calculationResult],
      status: body.status || 'rascunho',
      createdAt: body.createdAt || now,
      updatedAt: now,
      notes: body.notes || undefined
    };

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
    const dbPool = getDbPool();
    const dbState = getDbState();
    if (!dbState.connected || !dbPool) {
      res.status(503).json({ error: 'Banco de dados indisponível. O orçamento não foi salvo.' });
      return;
    }
    if (dbState.connected && dbPool) {
      const connection = await dbPool.getConnection();
      try {
        await connection.beginTransaction();
        const numericUserId = newBudget.userId && /^\d+$/.test(String(newBudget.userId)) ? Number(newBudget.userId) : null;
        const [ins]: any = await connection.query(
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
            JSON.stringify({ ...newBudget.calculationResult, calculationResults: newBudget.calculationResults })
          ]
        );
        if (ins?.insertId) {
          await connection.query(
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
        await connection.commit();
      } catch (err: any) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('[MySQL] Erro ao desfazer orçamento:', rollbackError);
        }
        console.error('[MySQL] Erro ao persistir obra/medição:', err.message);
        res.status(503).json({ error: 'Não foi possível salvar o orçamento no banco de dados.' });
        return;
      } finally {
        connection.release();
      }
    }

    budgetsStore.unshift(newBudget);
    userWorksStore.unshift(newWork);

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

  const results = req.body?.calculationResults ?? target.calculationResults ?? [target.calculationResult];
  if (!Array.isArray(results) || results.length === 0 || results.some(result =>
    !result || typeof result.totalEstimatedCost !== 'number' || !Number.isFinite(result.totalEstimatedCost) ||
    result.totalEstimatedCost < 0 || !Array.isArray(result.materials)
  )) {
    res.status(400).json({ error: 'Os cálculos do orçamento são inválidos.' });
    return;
  }
  const updated: SavedBudget = {
    ...target,
    title: typeof req.body?.title === 'string' ? req.body.title.trim() || target.title : target.title,
    clientName: typeof req.body?.clientName === 'string' ? req.body.clientName.trim() : target.clientName,
    status: ['rascunho', 'aprovado', 'em_andamento', 'concluido'].includes(req.body?.status) ? req.body.status : target.status,
    workType: results[0].workType,
    workTypeName: results[0].workTypeName,
    calculationResult: results[0],
    calculationResults: results,
    updatedAt: new Date().toISOString()
  };

  const totalCost = Math.round(results.reduce((sum, result) => sum + result.totalEstimatedCost, 0) * 100) / 100;

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (!dbState.connected || !dbPool) {
    res.status(503).json({ error: 'Banco de dados indisponível. O orçamento não foi alterado.' });
    return;
  }
  try {
    const [result] = await dbPool.execute<import('mysql2').ResultSetHeader>(
      `UPDATE obra SET titulo = ?, cliente_nome = ?, status = ?, tipo_obra = ?, tipo_obra_nome = ?, custo_total_estimado = ?,
       resultado_calculo = ? WHERE codigo_externo = ?`,
      [updated.title, updated.clientName || null, updated.status, updated.workType, updated.workTypeName, totalCost,
        JSON.stringify({ ...updated.calculationResult, calculationResults: results }), id]
    );
    if (!result.affectedRows) {
      res.status(404).json({ error: 'Orçamento não encontrado no banco de dados.' });
      return;
    }
  } catch (err) {
    console.error('[MySQL] Erro ao atualizar orçamento:', err);
    res.status(503).json({ error: 'Não foi possível atualizar o orçamento no banco de dados.' });
    return;
  }

  budgetsStore[idx] = updated;
  const wIdx = userWorksStore.findIndex(w => w.id === id);
  if (wIdx !== -1) {
    userWorksStore[wIdx] = {
      ...userWorksStore[wIdx],
      title: updated.title,
      status: updated.status,
      workType: updated.workType,
      workTypeName: updated.workTypeName,
      totalCost,
      calculationResult: updated.calculationResult
    };
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
