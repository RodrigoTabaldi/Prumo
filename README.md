# Prumo · Bank reconciliation

[English](#english) | [Português](#português)

## English

Prumo is a local web application for checking whether transactions from a bank statement also appear in a company's internal financial records. It compares two exports, highlights matches and differences, and creates a report for review.

### The problem it addresses

Financial teams often compare statements and internal records manually. That work takes time and makes missed or duplicated transactions harder to spot. Prumo brings both files into one workflow so a person can review matched entries and focus on the remaining differences.

Prumo helps find and document discrepancies. It does not change source files or decide how a difference should be corrected.

### What it does

- Import two files for the same account and period, in either order.
- Recognize supported file formats and infer which file is the bank statement and which is the internal report when the data provides enough clues. Ambiguous files are rejected with guidance instead of being assigned arbitrarily.
- Match transactions by exact date and amount, using matching descriptions to resolve candidates when possible.
- Show a detailed report with the period, matched totals, pending bank entries, pending internal entries and net difference.
- Open each transaction to compare its bank and internal records and add a review note.
- Export an Excel workbook with a summary sheet and separate sheets for matched and pending transactions.
- Keep a local history of reconciliation sessions and review notes.

### Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript 5, Vite 6, Lucide React |
| API | Python, FastAPI, Uvicorn |
| File handling | `ofxparse` for OFX and `openpyxl` for XLSX import and Excel reports |
| Persistence | SQLite |

### How a reconciliation works

1. Enter a session name and the account being checked.
2. Select the bank statement and internal report for the same period. Their order does not matter.
3. Review the summary and filter matched or pending transactions.
4. Open a pending entry to compare its details and record a note.
5. Download the Excel report or reopen the session from history.

The matching rule requires the same date and amount. An identical description helps choose between candidates, but does not override a date or amount mismatch. An internal transaction can be used only once. Ambiguous candidates remain pending rather than being matched at random.

### Supported files and limits

| Format | Expected content |
| --- | --- |
| CSV, TSV and delimited TXT | Date, description or history, and amount columns |
| XLSX | The active worksheet with date, description or history, and amount columns |
| OFX | A statement for one bank account |

Delimited files accept common separators such as semicolons, commas and tabs. Portuguese and English column names are supported, with UTF-8 and Windows-1252 text encodings. Files are limited to 5 MB and 10,000 transactions each. Dates must include the year (`DD/MM/YYYY` or `YYYY-MM-DD`). Amounts are stored in cents; credits should be positive and debits negative.

PDF and legacy XLS files are not supported. There is no date tolerance, split or grouped matching, manual status override, or deduplication across imports. Each import creates a separate session. Net totals exclude opening balances, so a zero net difference does not mean every transaction matched.

### Architecture and project structure

The browser runs the React application from `frontend/`. Vite forwards `/api` requests to the FastAPI service in `backend/`. The API parses uploads, applies the matching rules, stores sessions in SQLite and generates Excel reports. The original Python application remains in `conciliacao/`.

```text
backend/       FastAPI routes, import and reconciliation rules, SQLite, tests
frontend/      React and TypeScript interface
conciliacao/   Earlier standalone Python application and legacy readers
```

### API highlights

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Service health |
| `GET /api/sessions` | List saved sessions |
| `POST /api/sessions` | Import two files and create a reconciliation |
| `GET /api/sessions/{id}` | Retrieve a session and its transactions |
| `PATCH /api/sessions/{id}/rows/{row_id}` | Save a review note |
| `GET /api/sessions/{id}/export` | Download the Excel report |

### Run locally on Windows

Install Python and Node.js, then open two terminals in the repository root.

In the first terminal, set up and start the API:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r backend\requirements.txt
.venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

In the second terminal, start the web interface:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open <http://127.0.0.1:5173>. Interactive API documentation is available at <http://127.0.0.1:8000/docs>.

### Data, privacy and project status

Session data is stored locally in `backend/prumo.sqlite3`. Set `PRUMO_DB` to use a different SQLite file. The demo uses fictional data, and notes added to the demo are not saved.

Prumo is under development and intended for local use. It has no authentication or separation between users. Keep the services bound to `127.0.0.1`; deploying to a network or the internet requires access control, HTTPS, upload protections, retention rules, backups and request limits.

### Tests and build

From the repository root, run the backend tests:

```powershell
python -m unittest discover -s backend/tests -v
```

To build the frontend:

```powershell
cd frontend
npm.cmd run build
```

---

## Português

O Prumo é uma aplicação web local para conferir se as movimentações do extrato bancário também aparecem no controle financeiro da empresa. Ele compara dois arquivos, destaca correspondências e diferenças e apresenta um relatório para revisão.

### O problema que resolve

Conferir extratos e controles financeiros manualmente toma tempo e facilita que lançamentos passem despercebidos. O Prumo reúne os dois arquivos em um fluxo de revisão: mostra o que encontrou e ajuda a concentrar a atenção nas diferenças.

O sistema ajuda a localizar e documentar divergências. Ele não altera os arquivos de origem nem decide como uma diferença deve ser corrigida.

### O que o sistema faz

- Recebe dois arquivos do mesmo período e da mesma conta, em qualquer ordem.
- Reconhece formatos aceitos e tenta identificar qual arquivo é o extrato e qual é o controle interno. Quando faltam informações para distinguir os lados, avisa em vez de atribuí-los ao acaso.
- Compara lançamentos por data e valor exatos. Descrições iguais ajudam a escolher entre possíveis correspondências.
- Apresenta um relatório detalhado com o período, totais conciliados, pendências no banco, pendências no controle e diferença líquida.
- Permite abrir cada lançamento, comparar os dados dos dois lados e registrar uma observação.
- Exporta um Excel com uma aba de resumo e abas separadas para lançamentos conciliados e pendentes.
- Mantém um histórico local das conciliações e das observações.

### Stack tecnológica

| Área | Tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript 5, Vite 6, Lucide React |
| API | Python, FastAPI, Uvicorn |
| Leitura e relatórios | `ofxparse` para OFX e `openpyxl` para XLSX e relatórios Excel |
| Persistência | SQLite |

### Como funciona uma conciliação

1. Informe um nome para a conciliação e a conta que será conferida.
2. Selecione o extrato bancário e o relatório interno do mesmo período. A ordem não importa.
3. Confira o resumo e filtre os lançamentos conciliados ou pendentes.
4. Abra uma pendência para comparar os detalhes e registrar uma observação.
5. Baixe o relatório Excel ou abra a conciliação novamente pelo histórico.

A regra exige que data e valor sejam iguais. Uma descrição igual ajuda a decidir entre candidatos, mas não compensa uma diferença de data ou valor. Cada lançamento interno pode ser usado uma única vez. Casos ambíguos permanecem pendentes, sem associação arbitrária.

### Arquivos aceitos e limites

| Formato | Conteúdo esperado |
| --- | --- |
| CSV, TSV e TXT delimitado | Colunas de data, descrição ou histórico e valor |
| XLSX | Aba ativa com data, descrição ou histórico e valor |
| OFX | Extrato de uma única conta bancária |

Arquivos delimitados aceitam separadores comuns, como ponto e vírgula, vírgula e tabulação. São aceitos cabeçalhos em português e inglês e textos nos formatos UTF-8 e Windows-1252. Cada arquivo pode ter até 5 MB e 10.000 lançamentos. As datas devem incluir o ano (`DD/MM/AAAA` ou `AAAA-MM-DD`). Os valores são armazenados em centavos; créditos devem ser positivos e débitos negativos.

PDF e planilhas XLS antigas não são aceitos. Não há tolerância de datas, agrupamento de lançamentos, alteração manual do status ou deduplicação entre importações. Cada envio cria uma conciliação separada. Os totais líquidos não incluem saldo inicial; por isso, diferença zero não garante que todos os lançamentos foram conciliados.

### Arquitetura e estrutura do projeto

O navegador carrega a aplicação React em `frontend/`. O Vite encaminha as chamadas `/api` para a API FastAPI em `backend/`. A API lê os arquivos, aplica as regras de conciliação, salva as sessões no SQLite e gera relatórios Excel. O aplicativo Python anterior foi mantido em `conciliacao/`.

```text
backend/       Rotas FastAPI, importação, regras de conciliação, SQLite e testes
frontend/      Interface em React e TypeScript
conciliacao/   Aplicativo Python anterior e leitores legados
```

### Principais endpoints da API

| Endpoint | Finalidade |
| --- | --- |
| `GET /api/health` | Verificar a saúde do serviço |
| `GET /api/sessions` | Listar conciliações salvas |
| `POST /api/sessions` | Importar dois arquivos e criar uma conciliação |
| `GET /api/sessions/{id}` | Consultar uma conciliação e seus lançamentos |
| `PATCH /api/sessions/{id}/rows/{row_id}` | Salvar uma observação de revisão |
| `GET /api/sessions/{id}/export` | Baixar o relatório Excel |

### Executar localmente no Windows

Instale Python e Node.js e abra dois terminais na raiz do repositório.

No primeiro terminal, prepare e inicie a API:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r backend\requirements.txt
.venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

No segundo terminal, inicie a interface web:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Acesse <http://127.0.0.1:5173>. A documentação interativa da API está em <http://127.0.0.1:8000/docs>.

### Dados, privacidade e status do projeto

As sessões são salvas localmente em `backend/prumo.sqlite3`. Defina `PRUMO_DB` para usar outro arquivo SQLite. A demonstração usa dados fictícios, e as observações feitas nela não são persistidas.

O Prumo está em desenvolvimento e foi preparado para uso local. Não tem autenticação nem separação de dados entre usuários. Mantenha os serviços vinculados a `127.0.0.1`. Para publicar em uma rede ou na internet, será necessário implementar controle de acesso, HTTPS, proteção de uploads, política de retenção, backup e limites de requisições.

### Testes e build

Na raiz do projeto, execute os testes do backend:

```powershell
python -m unittest discover -s backend/tests -v
```

Para compilar o frontend:

```powershell
cd frontend
npm.cmd run build
```
