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
│   ├── migrations/          # Estrutura versionada MySQL
│   ├── seeds/               # Carga inicial de dados (001_initial_data.sql)
│   └── scripts/             # Scripts auxiliares (reset_database.sql)
├── docs/
│   └── DOCUMENTACAO_COMPLETA.md  # Documentação técnica e funcional consolidada
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

Abra `http://localhost:3000` pelo servidor iniciado com `npm run dev`. Não abra o `index.html` pelo Five Server ou Live Server: esses servidores não compilam o Angular nem executam a API. Se a porta 3000 estiver ocupada, pare o servidor que a está usando antes de iniciar o ConstruTec.

Ao iniciar com MySQL conectado, o backend cria o banco/tabelas ausentes e adiciona automaticamente colunas de redefinição de senha que ainda não existam na tabela `usuario`; não é necessário rodar manualmente o `ALTER TABLE` no phpMyAdmin.

Em **Meus Orçamentos**, use **Adicionar cálculo** para incluir outros cálculos no mesmo orçamento ou **Editar cálculo** para recalcular um item. Os valores individuais e o total são exibidos no histórico e no relatório. Cálculos antigos podem não conter todas as medidas originais; nesse caso, confira os campos antes de recalcular e salvar.

Na calculadora, depois de obter um resultado, use **Adicionar outro cálculo ao orçamento** para reunir vários serviços antes de salvar. Os cálculos pendentes podem ser removidos, visualizados ou salvos juntos; eles permanecem apenas na página até o salvamento.

Clique em um orçamento no histórico ou em **Orçamentos Recentes** para consultar seus detalhes. Na visualização, use **Imprimir / Salvar PDF** para imprimir ou salvar o relatório completo.

Para habilitar o login Google, crie um OAuth Client ID do tipo aplicativo Web no Google Cloud Console, inclua `http://localhost:3000` nas origens JavaScript autorizadas e configure `GOOGLE_CLIENT_ID=seu-client-id` no `.env` da raiz. O backend valida o ID token do Google antes de iniciar a sessão.

## Credenciais Iniciais de Administração (Seed)
- **ADM Técnico (`ConstruTec`)**: `adm@construtec.com.br` / `123456`
- **ADM Master**: `jorvanesantos@gmail.com` / `123456`
