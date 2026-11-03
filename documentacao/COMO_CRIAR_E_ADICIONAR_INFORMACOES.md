# ConstruTec - Guia Prático: Como Criar e Adicionar Informações do Zero

Este documento foi criado especialmente para você que **ainda vai criar o banco de dados, senhas, materiais ou novas obras**, explicando o passo a passo de forma simples e didática.

---

## Índice

1. [Onde e Como Criar o Banco de Dados (3 Opções)](#1-onde-e-como-criar-o-banco-de-dados)
2. [Como Criar o Arquivo `.env` na Raiz do Projeto](#2-como-criar-o-arquivo-env)
3. [Como Adicionar Novos Materiais e Preços](#3-como-adicionar-novos-materiais-e-preços)
4. [Como Adicionar Novos Tipos de Obras (ex: Piscina, Laje)](#4-como-adicionar-novos-tipos-de-obras)
5. [Como Adicionar Novas Rotas na sua API (`server.ts`)](#5-como-adicionar-novas-rotas-na-sua-api)
6. [Resumo dos Arquivos e Caminhos](#6-resumo-dos-arquivos-e-caminhos)

---

## 1. Onde e Como Criar o Banco de Dados

Você precisa de um banco MySQL funcionando para guardar os dados. Escolha a opção que preferir:

### Opção A: Usando XAMPP (Mais simples no Windows)
1. Instale o [XAMPP](https://www.apachefriends.org).
2. Abra o painel do XAMPP e clique em **Start** no módulo **MySQL**.
3. Clique em **Admin** ao lado de MySQL (ele abrirá o phpMyAdmin no navegador).
4. Clique na aba **SQL** no menu superior.
5. Copie e cole o código do arquivo `/database/create_database.sql` e clique em **Executar**.
6. Selecione o banco `construtec_db` criado no menu à esquerda, abra a aba **SQL**, cole o conteúdo de `/database/create_tables.sql` e clique em **Executar**.
7. *(Opcional)* Cole o conteúdo de `/database/insert_data.sql` e execute para carregar os insumos iniciais.

### Opção B: Usando MySQL Workbench
1. Abra o MySQL Workbench e conecte-se à sua instância local.
2. Vá em **File > Open SQL Script...** e selecione o arquivo `/database/create_database.sql`.
3. Clique no ícone do raio ⚡ para executar.
4. Repita o processo com `/database/create_tables.sql` e `/database/insert_data.sql`.

### Opção C: Usando Nuvem Gratuita (Sem instalar nada no seu computador)
- Crie uma conta gratuita em plataformas como [Aiven](https://aiven.io) ou [Railway](https://railway.app).
- Crie um banco MySQL gratuito. A plataforma fornecerá: **Host**, **Porta**, **Usuário**, **Senha** e **Nome do Banco**.

---

## 2. Como Criar o Arquivo `.env`

O arquivo `.env` fica na raiz do projeto e diz para a aplicação onde está o banco de dados e qual é a senha de acesso.

1. Na raiz do projeto (onde fica o `package.json`), crie um arquivo com o nome exato:
   ```text
   .env
   ```
2. Adicione o seguinte conteúdo:
   ```env
   # BANCO DE DADOS
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=construtec_db
   DB_USER=root
   DB_PASSWORD=sua_senha_aqui

   # PORTA DO SERVIDOR LOCAL
   PORT=3000

   # ENDEREÇO DA API PARA O FRONTEND (Opcional)
   VITE_API_URL=http://localhost:3000/api
   ```

> **Dica**: Se estiver usando o XAMPP no Windows, o `DB_USER` é `root` e a senha `DB_PASSWORD` geralmente fica em branco (sem nada após o sinal de `=`).

---

## 3. Como Adicionar Novos Materiais e Preços

### No Banco de Dados (via SQL)
Para cadastrar um novo material diretamente no banco de dados, execute:

```sql
INSERT INTO materiais (
    nome, 
    categoria, 
    unidade_base, 
    preco_base, 
    unidade_comercial, 
    descricao
) VALUES (
    'Porcelanato Esmaltado Retificado 84x84 cm', 
    'Pisos', 
    'm²', 
    79.90, 
    'caixas (2,12 m²)', 
    'Piso retificado de alto padrão para salas e quartos.'
);
```

### No Código do Frontend (para aparecer na tela)
**Arquivo:** `/src/data/catalog.ts`

Procure pela constante `BASE_MATERIALS_CATALOG` e adicione o item:

```typescript
{
  id: 'mat_porcelanato_84x84',
  name: 'Porcelanato Retificado 84x84 cm',
  category: 'Pisos',
  baseUnit: 'm²',
  basePrice: 79.90,
  commercialUnit: 'caixas (2,12 m²)',
  updatedAt: '2026-03-01',
  description: 'Porcelanato de grande formato com acabamento polido.'
},
```

---

## 4. Como Adicionar Novos Tipos de Obras

Caso deseje criar um novo cálculo (exemplo: **Piscina** ou **Calçada**):

1. **Adicione a chave no arquivo de tipos:**  
   No arquivo `/src/types.ts`, adicione `'piscina'` em `WorkTypeKey`:
   ```typescript
   export type WorkTypeKey = 
     | 'muro'
     | 'parede'
     | 'piso'
     | 'piscina'
     ...
   ```

2. **Adicione a descrição no catálogo:**  
   No arquivo `/src/data/catalog.ts`, adicione em `WORK_TYPES`:
   ```typescript
   {
     id: 'piscina',
     key: 'piscina',
     name: 'Piscina',
     title: 'Piscina de Concreto',
     tagline: 'Escavação, alvenaria estrutural, impermeabilização e azulejo',
     description: 'Calcule concreto usinado, armação de ferro, impermeabilizante e revestimento.',
     icon: 'Waves',
     defaultWaste: 15,
     defaultWastePercentage: 15,
     category: 'estrutural'
   },
   ```

3. **Crie a fórmula de cálculo:**  
   No arquivo `/src/services/calculationEngine.ts`, crie a função `calculatePiscina(params)`.

---

## 5. Como Adicionar Novas Rotas na sua API

**Arquivo:** `/server.ts`

Para criar um novo endpoint, adicione no arquivo `/server.ts` antes da linha `app.listen`:

```typescript
// Exemplo: Rota para receber um novo material via API
app.post('/api/materiais', async (req: Request, res: Response) => {
  try {
    const { nome, categoria, precoBase, unidade } = req.body;

    if (!nome || !precoBase) {
      return res.status(400).json({ error: 'Nome e Preço são obrigatórios!' });
    }

    res.status(201).json({
      message: 'Material recebido com sucesso!',
      material: { nome, categoria, precoBase, unidade }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 6. Resumo dos Arquivos e Caminhos

| O que você quer fazer? | Arquivo para abrir |
| :--- | :--- |
| Configurar a senha e o host do banco de dados | `/.env` |
| Criar o banco e as tabelas no MySQL | `/database/create_database.sql`<br>`/database/create_tables.sql` |
| Adicionar rotas na API (servidor Node/Express) | `/server.ts` |
| Adicionar novos materiais no catálogo do site | `/src/data/catalog.ts` |
| Criar novas regras ou fórmulas de cálculo | `/src/services/calculationEngine.ts` |
| Modificar os campos da calculadora no visual | `/src/components/Calculator.tsx` |
