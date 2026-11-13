# Arquitetura Geral do Sistema — ConstruTec

**Stack Oficial:** Angular 19 + Node.js/Express + TypeScript + MySQL

## 1. Visão em 3 Camadas
```
Usuário → Angular (frontend/construtec-web) → API REST (backend/construtec-api) → MySQL (database/)
```
- **Frontend (`frontend/construtec-web/`)**: Angular standalone components, roteamento (`app.routes.ts`), HTTP Client com interceptor JWT (`auth.interceptor.ts`), proteção de rotas (`auth.guard.ts`, `admin.guard.ts`), separação clara entre `core/`, `shared/`, `features/` e `layout/`.
- **Backend (`backend/construtec-api/`)**: Express + TypeScript dividido em `routes/`, `controllers/`, `services/`, `repositories/`, `validators/`, `middlewares/`, `config/` e `utils/`.
- **Banco de Dados (`database/`)**: Scripts versionados em `migrations/`, `seeds/` e `scripts/`, contemplando `usuario`, `tipo_construcao`, `material`, `unidade_medida`, `obra`, `medicao`, `localizacoes` e `historico`.

## 2. Segurança e Qualidade
- Hash seguro de senha com `bcryptjs` (`bcrypt.hashSync` / `bcrypt.compareSync`).
- Tokens JWT assinados no backend e validados via middleware (`authenticateToken`, `requireAdmin`).
- Consultas SQL parametrizadas (sem concatenação de strings).
- Variáveis sensíveis exclusivamente em `.env` (nunca versionadas).
