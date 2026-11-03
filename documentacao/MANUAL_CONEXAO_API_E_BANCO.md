# ConstruTec - Guia de Conexão de API e Banco de Dados

Este manual foi elaborado para orientar qualquer desenvolvedor a conectar o **ConstruTec** a uma **API REST** e a um **Banco de Dados Relacional (MySQL)**.

---

## 1. Mapa de Arquivos do Projeto

| Finalidade | Caminho do Arquivo |
| :--- | :--- |
| **Credenciais de Ambiente** | `/.env` e `/.env.example` |
| **Scripts de Criação do Banco** | `/database/create_database.sql`<br>`/database/create_tables.sql`<br>`/database/insert_data.sql` |
| **API Node.js / Express** | `/server.ts` |
| **API Java Spring Boot** | `/backend/src/main/resources/application.properties` |
| **Frontend React (Consumo da API)** | `/src/App.tsx`<br>`/src/components/Calculator.tsx` |

---

## 2. Preparando o Banco de Dados MySQL

1. Crie o banco de dados executando o arquivo `/database/create_database.sql`:
   ```sql
   CREATE DATABASE IF NOT EXISTS construtec_db
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;
   ```
2. Crie as tabelas executando `/database/create_tables.sql`.
3. Popule os insumos padrão e estados executando `/database/insert_data.sql`.

---

## 3. Conectando a API Node.js (`server.ts`) ao MySQL

### A. Instale o driver do MySQL
```bash
npm install mysql2
```

### B. Adicione as variáveis no arquivo `.env`
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=construtec_db
DB_USER=root
DB_PASSWORD=sua_senha_aqui
```

### C. Código de Conexão no `server.ts`
Adicione no início de `server.ts`:
```typescript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'sua_senha_aqui',
  database: process.env.DB_NAME || 'construtec_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Teste de conexão imediato ao iniciar
pool.getConnection()
  .then((conn) => {
    console.log('✅ Conectado ao MySQL com sucesso!');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Falha na conexão com o MySQL:', err.message);
  });
```

### D. Substituir as rotas para gravar no MySQL
```typescript
// GET /api/orcamentos - Lista orçamentos salvos
app.get('/api/orcamentos', async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM orcamentos ORDER BY data_criacao DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orcamentos - Grava novo orçamento
app.post('/api/orcamentos', async (req: Request, res: Response) => {
  try {
    const { title, clientName, workType, calculationResult } = req.body;
    const query = `
      INSERT INTO orcamentos 
      (titulo, nome_cliente, tipo_obra, area_m2, volume_m3, margem_desperdicio, custo_total_estimado, resultado_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'rascunho')
    `;
    const [result]: any = await pool.query(query, [
      title,
      clientName,
      workType,
      calculationResult.area || null,
      calculationResult.volume || null,
      calculationResult.wastePercentage,
      calculationResult.totalEstimatedCost,
      JSON.stringify(calculationResult)
    ]);
    res.status(201).json({ id: result.insertId, message: 'Orçamento salvo!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 4. Conectando o Backend Java Spring Boot (`/backend`)

Se for utilizar o backend Java:

**Arquivo:** `/backend/src/main/resources/application.properties`
```properties
server.port=8080

spring.datasource.url=jdbc:mysql://localhost:3306/construtec_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Sao_Paulo
spring.datasource.username=root
spring.datasource.password=sua_senha_aqui
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

Para rodar:
```bash
cd backend
./mvnw spring-boot:run
```

---

## 5. Conectando o Frontend React à sua API

**Arquivo sugerido:** `/src/services/api.ts`

```typescript
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function salvarOrcamento(orcamento: any) {
  const response = await fetch(`${BASE_URL}/orcamentos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orcamento),
  });
  
  if (!response.ok) {
    throw new Error('Falha ao salvar orçamento na API');
  }
  
  return await response.json();
}
```

---

## 6. Testando as Conexões

- **Health Check da API:**
  ```bash
  curl -i http://localhost:3000/api/health
  ```
- **Listar Orçamentos do Banco:**
  ```bash
  curl -i http://localhost:3000/api/orcamentos
  ```
