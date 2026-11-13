# ConstruTec — Plataforma Inteligente de Cálculo de Materiais e Orçamentos

**Arquitetura:** Angular 19 + Node.js/Express + TypeScript + MySQL

> "Calcule com precisão, construa com economia."

## Estrutura do Monorepo
```
construtec/
├── frontend/
│   └── construtec-web/      # Aplicação Angular 19 (core, shared, features, layout)
├── backend/
│   └── construtec-api/      # API REST Node.js/Express (config, controllers, middlewares, routes, services, repositories, validators, utils)
├── database/
│   ├── migrations/          # Estrutura versionada MySQL (001_initial_schema.sql)
│   ├── seeds/               # Carga inicial de dados (001_initial_data.sql)
│   └── scripts/             # Scripts auxiliares (reset_database.sql)
├── docs/
│   ├── arquitetura/         # Visão em camadas e fluxo completo
│   ├── api/                 # Contrato REST/JSON dos endpoints
│   ├── banco/               # Modelagem física MySQL e guia de conexão
│   └── requisitos/          # Especificações funcionais (.md, .docx, .txt)
├── server.ts                # Ponto de entrada unificado (API + Vite/Static na porta 3000)
├── .env.example             # Modelo de variáveis de ambiente
└── package.json             # Scripts de execução e build
```

## Como Executar
1. Instale as dependências: `npm install`
2. Configure `.env` a partir de `.env.example` (opcional: caso o MySQL local não esteja ativo, o backend inicia com persistência em memória automaticamente).
3. Inicie em desenvolvimento: `npm run dev`
4. Compile para produção: `npm run build` e execute `npm start`.
5. Valide tipos TypeScript: `npm run lint`.

## Credenciais Iniciais de Administração (Seed)
- **ADM Técnico (`ConstruTec`)**: `adm@construtec.com.br` / `123456`
- **ADM Master**: `jorvanesantos@gmail.com` / `123456`
