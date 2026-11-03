# Resolução: Por que a página fica em branco ao abrir o `index.html` e como executar

Se você baixou a pasta do projeto e tentou abrir o arquivo `index.html` dando dois cliques no Windows/Mac, o navegador abriu uma página totalmente branca. 

Aqui você entenderá o motivo e como abrir o sistema perfeitamente com 1 clique ou pelo terminal.

---

## 1. Por que isso acontece?

O **ConstruTec** é uma aplicação web moderna feita em **React** com **TypeScript** (`.tsx`), componentes modulares e servidor Node.js:

1. **Nenhum navegador suporta TypeScript nativamente**: O código TypeScript (`/src/main.tsx`) precisa ser compilado e servido pelo Vite/Node.js para que o navegador consiga entender.
2. **Restrição de segurança do protocolo `file://`**: Quando você abre o arquivo direto da pasta (`file:///C:/...`), o navegador bloqueia a importação de módulos e scripts por regras de segurança contra invasão.
3. **Ambiente com Backend**: O sistema possui rotas de API para salvar orçamentos e calcular insumos, necessitando do servidor local ativo em `http://localhost:3000`.

---

## 2. Como Abrir Corretamente

### Opção 1: Inicializador com 1 Clique no Windows (Mais Fácil)

1. Tenha o **Node.js** instalado no seu computador. Se não tiver, baixe e instale a versão LTS gratuita em:  
   👉 [https://nodejs.org](https://nodejs.org) (basta avançar as telas do instalador padrão).
2. Na pasta do projeto baixado, dê dois cliques no arquivo:  
   👉 **`INICIAR_PROJETO.bat`**
3. O script cuidará de tudo automaticamente:
   - Verifica o Node.js.
   - Instala as dependências (`npm install`) na primeira vez.
   - Inicia o servidor e já abre seu navegador em `http://localhost:3000`.

---

### Opção 2: Pelo Terminal / Prompt de Comando (Manual)

1. Abra a pasta do projeto no seu computador.
2. Abra o terminal nessa pasta:
   - **No Windows**: Clique na barra de endereços do topo do Explorer, digite `cmd` e aperte `Enter`.
   - **No Mac/Linux**: Abra o terminal e use `cd caminho/da/pasta`.
3. Digite o comando para baixar as bibliotecas (apenas na primeira vez):
   ```bash
   npm install
   ```
4. Em seguida, inicie o servidor com:
   ```bash
   npm run dev
   ```
5. Abra o seu navegador (Chrome, Edge, Firefox, Brave) e acesse:
   ```text
   http://localhost:3000
   ```

O sistema carregará completo: calculadora de 9 tipos de obras, catálogo de materiais, orçamentos, relatórios para impressão e cálculo de desperdício.

---

## 3. Gerando uma Versão Compilada (Build de Produção)

Caso queira empacotar todo o código em JavaScript e CSS unificados:

```bash
npm run build
```

Uma pasta `dist/` será gerada com os arquivos minificados prontos para deploy na nuvem ou em qualquer servidor de hospedagem. Para testar o build localmente:

```bash
npm run start
```
