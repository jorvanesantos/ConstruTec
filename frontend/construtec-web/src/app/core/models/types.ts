export type WorkTypeKey =
  | 'muro'
  | 'parede'
  | 'piso'
  | 'pintura'
  | 'concreto'
  | 'fundacao'
  | 'telhado'
  | 'revestimento'
  | 'outro';

export interface WorkTypeInfo {
  id: WorkTypeKey;
  key?: WorkTypeKey;
  name: string;
  title?: string;
  tagline: string;
  description: string;
  icon: string;
  defaultWaste: number;
  defaultWastePercentage?: number;
  category: 'alvenaria' | 'acabamento' | 'estrutural' | 'cobertura' | 'geral';
}

export interface MaterialItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantityRaw: number;
  theoreticalQuantity: number;
  quantityCommercial: number;
  commercialQuantity: number;
  unitPrice: number;
  totalPrice: number;
  commercialPackageDescription?: string;
  purpose?: string;
}

export interface CalculationResult {
  workType: WorkTypeKey;
  workTypeName: string;
  area: number;
  areaM2: number;
  volume?: number;
  volumeM3?: number;
  perimeter?: number;
  materials: MaterialItem[];
  wastePercentage: number;
  subtotalMaterials: number;
  wasteCost: number;
  totalEstimatedCost: number;
  formulasUsed: string[];
  technicalPremises: string[];
  technicalWarning: string;
  priceDisclaimer: string;
  inputSummary: Record<string, string | number>;
  calculatedAt: string;
}

export interface RegionalLocation {
  uf: string;
  stateName: string;
  city: string;
  priceMultiplier: number;
  source: string;
}

export interface SavedBudget {
  id: string;
  userId?: string;
  userEmail?: string;
  title: string;
  clientName?: string;
  location: RegionalLocation;
  workType: WorkTypeKey;
  workTypeName: string;
  calculationResult: CalculationResult;
  status: 'rascunho' | 'aprovado' | 'em_andamento' | 'concluido';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export type UserType = 'ADM_MASTER' | 'ADM' | 'USUARIO' | 'PROPRIETARIO';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'gestor' | 'engenheiro' | 'arquiteto' | 'mestre_obras' | 'pedreiro' | 'cliente' | 'proprietario';
  userType: UserType;
  token?: string;
  active?: boolean;
  pendingMasterRequestsCount?: number;
  defaultLocation: RegionalLocation;
  isLoggedIn: boolean;
  createdAt?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  role: string;
  active: boolean;
  createdAt: string;
  avatarUrl?: string;
  phone?: string;
  city?: string;
  uf?: string;
  password?: string;
  passwordHash?: string;
}

export interface AdminMaterial {
  id: string;
  name: string;
  description: string;
  unit: string;
  price: number;
  minQuantity: number;
  status: 'ativo' | 'inativo';
  category: string;
  updatedAt?: string;
}

export interface AdminWorkType {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'alvenaria' | 'acabamento' | 'estrutural' | 'cobertura' | 'geral';
  defaultWaste: number;
  icon: string;
  active: boolean;
  createdAt?: string;
}

export interface AdminUserWork {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  workType: string;
  workTypeName: string;
  status: 'rascunho' | 'aprovado' | 'em_andamento' | 'concluido';
  totalCost: number;
  locationCity?: string;
  locationUf?: string;
  createdAt: string;
  calculationResult?: CalculationResult;
}

export type MasterRequestAction = 'REBAIXAR' | 'EXCLUIR';
export type MasterRequestStatus = 'PENDENTE' | 'ACEITA' | 'RECUSADA' | 'CANCELADA';

export interface MasterActionRequest {
  id: string;
  actionType: MasterRequestAction;
  targetUserId: string;
  targetUserName: string;
  targetUserEmail: string;
  targetNewUserType?: UserType;
  requestedById: string;
  requestedByName: string;
  requestedByEmail: string;
  reason?: string;
  status: MasterRequestStatus;
  createdAt: string;
  respondedAt?: string;
}

export type AuditActionType =
  | 'LOGIN'
  | 'LOGIN_FALHA'
  | 'ALTERAR_SENHA'
  | 'RECUPERAR_SENHA'
  | 'CRIAR_CALCULO'
  | 'EDITAR_OBRA'
  | 'EXCLUIR_OBRA'
  | 'CADASTRAR_USUARIO'
  | 'CADASTRAR_ADM'
  | 'CADASTRAR_PROPRIETARIO'
  | 'EDITAR_USUARIO'
  | 'EXCLUIR_USUARIO'
  | 'STATUS_USUARIO'
  | 'PROMOVER_MASTER'
  | 'SOLICITAR_REBAIXAMENTO_MASTER'
  | 'SOLICITAR_EXCLUSAO_MASTER'
  | 'ACEITAR_SOLICITACAO_MASTER'
  | 'RECUSAR_SOLICITACAO_MASTER'
  | 'EDITAR_MATERIAL'
  | 'CADASTRAR_MATERIAL'
  | 'EXCLUIR_MATERIAL'
  | 'STATUS_MATERIAL'
  | 'CRIAR_TIPO_OBRA'
  | 'EDITAR_TIPO_OBRA'
  | 'STATUS_TIPO_OBRA';

export interface SystemAuditLog {
  id: string;
  action: AuditActionType;
  description: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  userType: UserType;
  createdAt: string;
  ip?: string;
}

export interface AdminDashboardStats {
  totalUsuarios: number;
  totalObras: number;
  totalCalculos: number;
  totalMateriais: number;
  totalProprietarios: number;
  totalAdms: number;
  maxProprietarios: number;
}

export interface PriceCatalogItem {
  id: string;
  name: string;
  category: string;
  baseUnit: string;
  basePrice: number;
  commercialUnit: string;
  unit?: string;
  updatedAt: string;
  description: string;
}

export type ThemeMode = 'light' | 'dark';
export type NavTab = 'home' | 'calculator' | 'budgets' | 'materials' | 'about' | 'dashboard' | 'admin';
export type AdminTabKey = 'overview' | 'users' | 'workTypes' | 'materials' | 'works' | 'history';
