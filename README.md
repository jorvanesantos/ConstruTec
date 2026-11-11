# ConstruTec

Plataforma para cálculo e gestão de materiais de construção, com frontend em React/TypeScript e servidor/API em Node.js, Express e Vite.

## Tecnologias

- Frontend: React, TypeScript e Vite
- Servidor/API: Node.js, Express e TypeScript
- Banco de dados: MySQL

## Executar o frontend

Requisitos: Node.js.

```bash
npm install
npm run dev
```

No Windows, também é possível iniciar com `INICIAR_PROJETO.bat`. O servidor serve o frontend e a API em `http://localhost:3000`.

## Configurar o MySQL com XAMPP

1. Inicie o serviço MySQL no painel do XAMPP.
2. Crie o banco e a tabela de cálculos executando `database/create_calculations.sql` no phpMyAdmin ou no cliente MySQL.
3. Configure `.env` na raiz do projeto. O arquivo `.env.example` contém os valores padrão para o XAMPP local:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=construtec
```

O servidor também cria o banco e as tabelas necessárias ao iniciar, caso o usuário MySQL tenha permissão. Se o MySQL estiver desligado, as funções existentes que oferecem modo de memória continuam disponíveis; a rota de cálculos persistidos responde `503` até o banco conectar.

## Testar a persistência de cálculos

Com o servidor e o MySQL em execução, envie um cálculo para a rota de exemplo:

```bash
curl.exe -X POST http://localhost:3000/api/calculos/salvos -H "Content-Type: application/json" -d "{\"tipoObra\":\"muro\",\"parametros\":{\"comprimento\":5,\"altura\":2},\"resultado\":{\"custoTotal\":1250.50}}"
```

Consulte os últimos cálculos em `GET http://localhost:3000/api/calculos/salvos` ou um registro específico em `GET http://localhost:3000/api/calculos/salvos/1`. A rota de cálculo existente (`POST /api/calculos`) continua calculando sem salvar; use `/api/calculos/salvos` para persistir e consultar exemplos.

Os scripts SQL estão na pasta `database/`; a documentação completa e única do sistema está em `documentacao/`.

Para estudar e apresentar o funcionamento do sistema, consulte o [guia completo do ConstruTec](documentacao/GUIA_COMPLETO_CONSTRUTEC.md).
