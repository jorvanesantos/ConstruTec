import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as calculoController from '../controllers/calculo.controller';
import * as obraController from '../controllers/obra.controller';
import * as catalogoController from '../controllers/catalogo.controller';
import * as adminController from '../controllers/admin.controller';
import * as docsController from '../controllers/docs.controller';
import { authenticateToken, optionalAuth, requireAdmin } from '../middlewares/auth.middleware';

export const apiRouter = Router();

// Saúde & Banco de Dados
apiRouter.get('/health', adminController.health);
apiRouter.get('/status-banco', adminController.statusBanco);
apiRouter.post('/conectar-banco', adminController.conectarBanco);

// Autenticação & Perfil
apiRouter.post('/auth/login', authController.login);
apiRouter.post('/auth/register', authController.register);
apiRouter.post('/auth/google', authController.googleLogin);
apiRouter.get('/auth/me', authenticateToken, authController.getMe);
apiRouter.post('/auth/alterar-senha', authenticateToken, authController.changePassword);
apiRouter.post('/auth/change-password', authenticateToken, authController.changePassword);
apiRouter.post('/auth/avatar', authenticateToken, authController.updateAvatar);
apiRouter.post('/auth/solicitar-recuperacao', authController.requestPasswordRecovery);
apiRouter.post('/auth/redefinir-senha', authController.resetPassword);

// Motor de Cálculo (requer usuário autenticado)
apiRouter.post('/calculos', authenticateToken, calculoController.calculateGeneric);
apiRouter.post('/calculos/:tipo', authenticateToken, calculoController.calculateByType);

// Obras e Orçamentos Salvos
apiRouter.get('/orcamentos', optionalAuth, obraController.listBudgets);
apiRouter.post('/orcamentos', authenticateToken, obraController.createBudget);
apiRouter.put('/orcamentos/:id', authenticateToken, obraController.updateBudget);
apiRouter.delete('/orcamentos/:id', authenticateToken, obraController.deleteBudget);

apiRouter.get('/obras', optionalAuth, obraController.listBudgets);
apiRouter.post('/obras', authenticateToken, obraController.createBudget);
apiRouter.put('/obras/:id', authenticateToken, obraController.updateBudget);
apiRouter.delete('/obras/:id', authenticateToken, obraController.deleteBudget);

// Catálogo e Preços Regionais
apiRouter.get('/tipos-obras', catalogoController.getWorkTypes);
apiRouter.get('/tipos-construcao', catalogoController.getWorkTypes);
apiRouter.get('/materiais', catalogoController.getMaterials);
apiRouter.get('/materiais/:id', catalogoController.getMaterialById);
apiRouter.get('/precos', catalogoController.getRegionalPrices);
apiRouter.get('/regiao/detectar', catalogoController.detectRegion);

// Documentação
apiRouter.get('/docs/download-word', docsController.downloadWordDoc);
apiRouter.get('/docs/download-txt', docsController.downloadTxtDoc);
apiRouter.get('/docs/content', docsController.getDocContent);

// Painel Administrativo (ADM + ADM_MASTER)
apiRouter.get('/admin/stats', authenticateToken, requireAdmin, adminController.getStats);
apiRouter.get('/admin/usuarios', authenticateToken, requireAdmin, adminController.listUsers);
apiRouter.post('/admin/usuarios', authenticateToken, requireAdmin, adminController.createUser);
apiRouter.put('/admin/usuarios/:id', authenticateToken, requireAdmin, adminController.updateUser);
apiRouter.patch('/admin/usuarios/:id/status', authenticateToken, requireAdmin, adminController.toggleUserStatus);
apiRouter.delete('/admin/usuarios/:id', authenticateToken, requireAdmin, adminController.deleteUser);
apiRouter.get('/admin/master-solicitacoes', authenticateToken, requireAdmin, adminController.listMasterRequests);
apiRouter.post('/admin/master-solicitacoes', authenticateToken, requireAdmin, adminController.createMasterRequest);
apiRouter.post('/admin/master-solicitacoes/:id/responder', authenticateToken, requireAdmin, adminController.respondMasterRequest);
apiRouter.delete('/admin/master-solicitacoes/:id', authenticateToken, requireAdmin, adminController.cancelMasterRequest);

apiRouter.get('/admin/tipos-construcao', authenticateToken, requireAdmin, adminController.listWorkTypes);
apiRouter.post('/admin/tipos-construcao', authenticateToken, requireAdmin, adminController.createWorkType);
apiRouter.put('/admin/tipos-construcao/:id', authenticateToken, requireAdmin, adminController.updateWorkType);
apiRouter.patch('/admin/tipos-construcao/:id/status', authenticateToken, requireAdmin, adminController.toggleWorkTypeStatus);

apiRouter.get('/admin/materiais', authenticateToken, requireAdmin, adminController.listMaterials);
apiRouter.post('/admin/materiais', authenticateToken, requireAdmin, adminController.createMaterial);
apiRouter.put('/admin/materiais/:id', authenticateToken, requireAdmin, adminController.updateMaterial);
apiRouter.patch('/admin/materiais/:id/status', authenticateToken, requireAdmin, adminController.toggleMaterialStatus);
apiRouter.delete('/admin/materiais/:id', authenticateToken, requireAdmin, adminController.deleteMaterial);

apiRouter.get('/admin/obras', authenticateToken, requireAdmin, adminController.listWorks);
apiRouter.get('/admin/historico', authenticateToken, requireAdmin, adminController.listHistory);
