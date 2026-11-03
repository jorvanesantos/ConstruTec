# ConstruTec

Plataforma para cálculo e gestão de materiais de construção, com frontend em React/TypeScript e API em Java com Spring Boot.

## Tecnologias

- Frontend: React, TypeScript e Vite
- Backend: Java 25 e Spring Boot 3.5
- Banco de dados: MySQL

## Executar o frontend

Requisitos: Node.js.

```bash
npm install
npm run dev
```

No Windows, também é possível iniciar com `INICIAR_PROJETO.bat`.

## Executar o backend

Requisitos: JDK 25, Maven e MySQL.

Configure as variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` conforme seu banco. Na pasta `backend`, execute:

```bash
mvn spring-boot:run
```

A API inicia na porta `8080`. Scripts e instruções adicionais estão nas pastas `database/` e `documentacao/`.
