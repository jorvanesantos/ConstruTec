import { getDbPool, getDbState } from '../config/database';
import {
  AdminMaterial,
  AdminUser,
  AdminUserWork,
  AdminWorkType,
  AuditActionType,
  MasterActionRequest,
  MasterRequestAction,
  MasterRequestStatus,
  SavedBudget,
  SystemAuditLog,
  UserType
} from '../models/types';
import { INITIAL_ADMIN_MATERIALS, INITIAL_WORK_TYPES } from '../models/catalog.data';
import { hashPassword } from '../utils/security';

export const MAX_PROPRIETARIOS = 5;

const LEGACY_MOCK_IDS = new Set(['orc_1', 'orc_2', 'orc_3', 'obra_1', 'obra_2', 'obra_3']);

export const usersStore: AdminUser[] = [
  {
    id: 'usr_prop_1',
    name: 'Jorvane Santos',
    email: 'jorvanesantos@gmail.com',
    userType: 'ADM_MASTER',
    role: 'proprietario',
    active: true,
    createdAt: '2026-01-15T10:00:00.000Z',
    city: 'São Paulo',
    uf: 'SP',
    passwordHash: hashPassword('123456')
  },
  {
    id: 'usr_prop_2',
    name: 'Jorvane Santos (Corp)',
    email: 'jorvane@construtec.com.br',
    userType: 'ADM_MASTER',
    role: 'proprietario',
    active: true,
    createdAt: '2026-01-15T10:05:00.000Z',
    city: 'São Paulo',
    uf: 'SP',
    passwordHash: hashPassword('123456')
  },
  {
    id: 'usr_adm_1',
    name: 'ConstruTec',
    email: 'adm@construtec.com.br',
    userType: 'ADM',
    role: 'gestor',
    active: true,
    createdAt: '2026-02-01T09:00:00.000Z',
    city: 'São Paulo',
    uf: 'SP',
    passwordHash: hashPassword('123456')
  },
  {
    id: 'usr_1',
    name: 'Maria Oliveira',
    email: 'maria@gmail.com',
    userType: 'USUARIO',
    role: 'arquiteto',
    active: true,
    createdAt: '2026-02-12T14:20:00.000Z',
    city: 'Rio de Janeiro',
    uf: 'RJ',
    passwordHash: hashPassword('123456')
  },
  {
    id: 'usr_2',
    name: 'Carlos Mendes',
    email: 'carlos@gmail.com',
    userType: 'USUARIO',
    role: 'mestre_obras',
    active: true,
    createdAt: '2026-02-18T11:10:00.000Z',
    city: 'Belo Horizonte',
    uf: 'MG',
    passwordHash: hashPassword('123456')
  }
];

export const materialsStore: AdminMaterial[] = [...INITIAL_ADMIN_MATERIALS];
export const workTypesStore: AdminWorkType[] = [...INITIAL_WORK_TYPES];

// Zero dados fictícios iniciais: começa vazio até haver criação real de orçamentos/obras
export const budgetsStore: SavedBudget[] = [];
export const userWorksStore: AdminUserWork[] = [];

export const auditLogsStore: SystemAuditLog[] = [
  {
    id: 'log_init',
    action: 'LOGIN',
    description: 'Sistema ConstruTec inicializado e pronto para novos cálculos.',
    userId: 'usr_prop_1',
    userName: 'Jorvane Santos',
    userEmail: 'jorvanesantos@gmail.com',
    userType: 'ADM_MASTER',
    createdAt: new Date().toISOString(),
    ip: '127.0.0.1'
  }
];

export const masterRequestsStore: MasterActionRequest[] = [];

export const passwordResetStore = new Map<string, { code: string; expiresAt: number }>();

export function sanitizeUser(user: AdminUser): AdminUser {
  const { passwordHash: _ph, password: _p, ...safe } = user;
  return safe;
}

export function isMasterType(userType?: string): boolean {
  return userType === 'ADM_MASTER' || userType === 'PROPRIETARIO';
}

export function isAdminOrMasterType(userType?: string): boolean {
  return userType === 'ADM_MASTER' || userType === 'ADM' || userType === 'PROPRIETARIO';
}

export async function recordAuditLog(
  action: AuditActionType,
  description: string,
  user: { id?: string; name: string; email?: string; userType: UserType },
  ip = '127.0.0.1'
): Promise<SystemAuditLog> {
  const entry: SystemAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    action,
    description,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userType: user.userType,
    createdAt: new Date().toISOString(),
    ip
  };

  auditLogsStore.unshift(entry);
  if (auditLogsStore.length > 500) {
    auditLogsStore.pop();
  }

  const dbPool = getDbPool();
  const dbState = getDbState();
  if (dbState.connected && dbPool) {
    try {
      const numericUserId = user.id && /^\d+$/.test(String(user.id)) ? Number(user.id) : null;
      await dbPool.query(
        'INSERT INTO historico (usuario_id, usuario_nome, usuario_email, tipo_usuario, acao, descricao, ip_origem) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [numericUserId, user.name, user.email || null, user.userType, action, description, ip]
      );
    } catch (err: any) {
      console.warn('[MySQL] Aviso ao gravar log no histórico:', err.message);
    }
  }

  return entry;
}

export async function syncDataFromMySQL(): Promise<void> {
  const dbPool = getDbPool();
  const dbState = getDbState();
  if (!dbState.connected || !dbPool) return;

  try {
    // 1. Usuários
    const [uRows]: any = await dbPool.query('SELECT * FROM usuario ORDER BY criado_em DESC');
    if (Array.isArray(uRows) && uRows.length > 0) {
      usersStore.length = 0;
      for (const r of uRows) {
        usersStore.push({
          id: String(r.id),
          name: r.nome,
          email: r.email,
          userType: (r.tipo_usuario || 'USUARIO') as UserType,
          role: r.perfil || 'cliente',
          active: Boolean(r.ativo),
          createdAt: r.criado_em ? new Date(r.criado_em).toISOString() : new Date().toISOString(),
          avatarUrl: r.avatar_url || undefined,
          phone: r.telefone || undefined,
          city: r.cidade_padrao || 'São Paulo',
          uf: r.uf_padrao || 'SP',
          passwordHash: r.senha_hash || undefined
        });
      }
    } else {
      for (const u of usersStore) {
        await dbPool.query(
          `INSERT IGNORE INTO usuario (nome, email, senha_hash, perfil, tipo_usuario, uf_padrao, cidade_padrao, ativo)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [u.name, u.email, u.passwordHash || hashPassword('123456'), u.role, u.userType, u.uf || 'SP', u.city || 'São Paulo', u.active ? 1 : 0]
        );
      }
    }

    // 2. Tipos de construção
    const [wtRows]: any = await dbPool.query('SELECT * FROM tipo_construcao ORDER BY id ASC');
    if (Array.isArray(wtRows) && wtRows.length > 0) {
      workTypesStore.length = 0;
      for (const w of wtRows) {
        workTypesStore.push({
          id: String(w.id),
          code: w.codigo,
          name: w.nome,
          description: w.descricao || '',
          category: w.categoria || 'geral',
          defaultWaste: Number(w.desperdicio_padrao || 10),
          icon: w.icone || 'Wrench',
          active: Boolean(w.ativo),
          createdAt: w.criado_em ? new Date(w.criado_em).toISOString() : new Date().toISOString()
        });
      }
    } else {
      for (const wt of workTypesStore) {
        await dbPool.query(
          `INSERT IGNORE INTO tipo_construcao (codigo, nome, descricao, categoria, desperdicio_padrao, icone, ativo)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [wt.code, wt.name, wt.description, wt.category, wt.defaultWaste, wt.icon, wt.active ? 1 : 0]
        );
      }
    }

    // 3. Materiais
    const [mRows]: any = await dbPool.query('SELECT * FROM material ORDER BY id ASC');
    if (Array.isArray(mRows) && mRows.length > 0) {
      materialsStore.length = 0;
      for (const m of mRows) {
        materialsStore.push({
          id: m.codigo || String(m.id),
          name: m.nome,
          description: m.descricao || '',
          unit: m.unidade_base || m.unidade_comercial || 'un',
          price: Number(m.preco || 0),
          minQuantity: Number(m.quantidade_minima || 10),
          status: m.status === 'inativo' ? 'inativo' : 'ativo',
          category: m.categoria || 'Geral',
          updatedAt: m.criado_em ? new Date(m.criado_em).toISOString() : new Date().toISOString()
        });
      }
    } else {
      for (const mat of materialsStore) {
        await dbPool.query(
          `INSERT IGNORE INTO material (codigo, nome, categoria, unidade_base, unidade_comercial, preco, quantidade_minima, descricao, status, ativo)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [mat.id, mat.name, mat.category, mat.unit, mat.unit, mat.price, mat.minQuantity, mat.description, mat.status, mat.status === 'ativo' ? 1 : 0]
        );
      }
    }

    // 4. Obras / Orçamentos reais (exclui IDs fictícios legados)
    const [oRows]: any = await dbPool.query(
      `SELECT o.*, u.nome AS usuario_nome, u.email AS usuario_email
       FROM obra o
       LEFT JOIN usuario u ON u.id = o.usuario_id
       ORDER BY o.criado_em DESC`
    );
    if (Array.isArray(oRows)) {
      budgetsStore.length = 0;
      userWorksStore.length = 0;
      for (const o of oRows) {
        const externalId = o.codigo_externo || `obra_${o.id}`;
        if (LEGACY_MOCK_IDS.has(externalId)) continue;

        let parsedLoc: any = { uf: 'SP', stateName: 'São Paulo', city: 'São Paulo', priceMultiplier: 1, source: 'SINAPI' };
        let parsedCalc: any = null;
        try {
          if (o.dados_localizacao) {
            parsedLoc = typeof o.dados_localizacao === 'string' ? JSON.parse(o.dados_localizacao) : o.dados_localizacao;
          }
          if (o.resultado_calculo) {
            parsedCalc = typeof o.resultado_calculo === 'string' ? JSON.parse(o.resultado_calculo) : o.resultado_calculo;
          }
        } catch {
          // Ignora falha de parse JSON pontual
        }

        const createdAt = o.criado_em ? new Date(o.criado_em).toISOString() : new Date().toISOString();
        const budget: SavedBudget = {
          id: externalId,
          userId: o.usuario_id ? String(o.usuario_id) : undefined,
          userEmail: o.usuario_email || undefined,
          title: o.titulo,
          clientName: o.cliente_nome || o.usuario_nome || undefined,
          location: parsedLoc,
          workType: o.tipo_obra,
          workTypeName: o.tipo_obra_nome || o.tipo_obra,
          calculationResult: parsedCalc || {
            workType: o.tipo_obra,
            workTypeName: o.tipo_obra_nome || o.tipo_obra,
            area: 0,
            areaM2: 0,
            materials: [],
            wastePercentage: 10,
            subtotalMaterials: Number(o.custo_total_estimado || 0),
            wasteCost: 0,
            totalEstimatedCost: Number(o.custo_total_estimado || 0),
            formulasUsed: [],
            technicalPremises: [],
            technicalWarning: '',
            priceDisclaimer: 'Valores estimados com base em insumos regionais.',
            inputSummary: {},
            calculatedAt: createdAt
          },
          status: o.status || 'rascunho',
          createdAt,
          updatedAt: createdAt
        };
        budgetsStore.push(budget);

        userWorksStore.push({
          id: externalId,
          userId: o.usuario_id ? String(o.usuario_id) : '',
          userName: o.usuario_nome || o.cliente_nome || 'Usuário ConstruTec',
          userEmail: o.usuario_email || '',
          title: o.titulo,
          workType: o.tipo_obra,
          workTypeName: o.tipo_obra_nome || o.tipo_obra,
          status: o.status || 'rascunho',
          totalCost: Number(o.custo_total_estimado || 0),
          locationCity: parsedLoc?.city,
          locationUf: parsedLoc?.uf,
          createdAt,
          calculationResult: parsedCalc || undefined
        });
      }
    }

    // 5. Histórico
    const [hRows]: any = await dbPool.query('SELECT * FROM historico ORDER BY criado_em DESC LIMIT 200');
    if (Array.isArray(hRows) && hRows.length > 0) {
      auditLogsStore.length = 0;
      for (const h of hRows) {
        auditLogsStore.push({
          id: `log_db_${h.id}`,
          action: h.acao as AuditActionType,
          description: h.descricao,
          userId: h.usuario_id ? String(h.usuario_id) : undefined,
          userName: h.usuario_nome,
          userEmail: h.usuario_email || undefined,
          userType: (h.tipo_usuario || 'USUARIO') as UserType,
          createdAt: h.criado_em ? new Date(h.criado_em).toISOString() : new Date().toISOString(),
          ip: h.ip_origem || '127.0.0.1'
        });
      }
    }

    // 6. Solicitações de rebaixamento/exclusão de ADM Master
    const [reqRows]: any = await dbPool.query('SELECT * FROM master_solicitacoes ORDER BY criado_em DESC LIMIT 200');
    if (Array.isArray(reqRows)) {
      masterRequestsStore.length = 0;
      for (const mr of reqRows) {
        masterRequestsStore.push({
          id: mr.id,
          actionType: mr.tipo_acao as MasterRequestAction,
          targetUserId: String(mr.alvo_usuario_id),
          targetUserName: mr.alvo_usuario_nome,
          targetUserEmail: mr.alvo_usuario_email,
          targetNewUserType: (mr.novo_tipo_usuario || undefined) as UserType | undefined,
          requestedById: String(mr.solicitante_id),
          requestedByName: mr.solicitante_nome,
          requestedByEmail: mr.solicitante_email,
          reason: mr.motivo || undefined,
          status: mr.status as MasterRequestStatus,
          createdAt: mr.criado_em ? new Date(mr.criado_em).toISOString() : new Date().toISOString(),
          respondedAt: mr.respondido_em ? new Date(mr.respondido_em).toISOString() : undefined
        });
      }
    }
  } catch (err: any) {
    console.warn('[MySQL] Aviso na sincronização inicial:', err.message);
  }
}
