# Prumo — conciliação bancária

O Prumo ajuda a conferir se as movimentações do extrato bancário também aparecem no controle financeiro da empresa. Ele compara os dois arquivos, destaca o que encontrou e deixa as diferenças visíveis para revisão.

## A ideia do projeto

Conferir extratos linha por linha costuma tomar tempo e facilita erros. O Prumo organiza essa tarefa em uma tela: reúne os dados do banco e do controle interno, procura correspondências e mostra o que ainda precisa ser verificado.

O sistema não altera os arquivos originais nem decide como corrigir uma divergência. Ele ajuda a localizar e documentar o que precisa de atenção.

## O que o sistema faz

- Recebe dois arquivos do mesmo período: um extrato bancário e um relatório do sistema financeiro ou ERP. A ordem dos arquivos não importa.
- Identifica o formato e tenta reconhecer cada lado pelos dados do arquivo. Se não houver informação suficiente para distingui-los, avisa antes de criar a conciliação.
- Compara lançamentos por data e valor. Quando há mais de uma correspondência possível, dá prioridade a descrições iguais. Casos ambíguos ficam pendentes para revisão.
- Apresenta um relatório com o período, totais conciliados, pendências no banco, pendências no controle e diferença líquida.
- Permite abrir cada lançamento, consultar os dois lados e registrar uma observação.
- Exporta um arquivo Excel com uma aba de resumo e abas com os lançamentos conciliados e pendentes.
- Mantém um histórico local das conciliações e das observações.

## Formatos aceitos

| Formato | Como é lido |
| --- | --- |
| CSV, TSV e TXT delimitado | Arquivos tabulares com colunas de data, descrição ou histórico e valor |
| Excel XLSX | A primeira planilha do arquivo, com as mesmas informações em colunas |
| OFX | Extrato de uma única conta bancária |

Para CSV, TSV, TXT e XLSX, os cabeçalhos podem estar em português ou inglês. Arquivos com separadores comuns, como ponto e vírgula, vírgula ou tabulação, são aceitos. PDF e planilhas XLS antigas não são suportados nesta versão.

Cada arquivo pode ter até 5 MB e 10.000 lançamentos. As datas devem incluir o ano e usar `DD/MM/AAAA` ou `AAAA-MM-DD`. Os valores são tratados em reais, com até duas casas decimais: por exemplo, `1.250,00` ou `1250.00`. Créditos devem ser positivos e débitos negativos.

## Como usar no Windows

Você precisa ter Python e Node.js instalados. Abra dois terminais na pasta do projeto.

No primeiro terminal, crie o ambiente Python, instale as dependências e inicie a API:

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

Abra <http://127.0.0.1:5173>. A documentação interativa da API fica em <http://127.0.0.1:8000/docs>.

## Uma conciliação, passo a passo

1. Abra **Nova conciliação** e informe um nome e a conta que será conferida.
2. Selecione os dois arquivos do mesmo período, em qualquer ordem.
3. Confira o relatório e filtre as movimentações conciliadas ou pendentes.
4. Abra uma pendência para ver o lançamento e registrar uma observação, se necessário.
5. Baixe o relatório Excel ou volte à conciliação pelo histórico.

A demonstração inicial usa dados fictícios. As observações feitas nela não são salvas.

## Como a comparação funciona

O Prumo procura lançamentos com a mesma data e o mesmo valor. Uma descrição igual ajuda a escolher entre candidatos; ela não substitui a conferência de data e valor. Cada lançamento interno pode ser usado uma vez. Se houver mais de uma combinação possível, os itens ficam pendentes em vez de serem associados ao acaso.

As observações servem para documentar a revisão e não mudam o resultado calculado. Para corrigir um valor ou uma data, ajuste o sistema de origem e importe os arquivos novamente. Cada importação cria uma conciliação separada; não há deduplicação entre envios.

Os totais apresentados são movimentos líquidos dos arquivos e não incluem saldo inicial. Por isso, uma diferença líquida igual a zero não significa necessariamente que todos os lançamentos foram conciliados.

## Tecnologias

| Parte | Tecnologias |
| --- | --- |
| Interface web | React 19, TypeScript, Vite e Lucide React |
| API | Python, FastAPI e Uvicorn |
| Importação e exportação | `ofxparse` para OFX e `openpyxl` para planilhas Excel |
| Histórico local | SQLite |

O diretório `conciliacao/` contém o aplicativo Python anterior, mantido no repositório. A interface web e a API atuais ficam, respectivamente, em `frontend/` e `backend/`.

## Estrutura do projeto

```text
backend/       API, regras de importação e conciliação, histórico e testes
frontend/      Interface web em React e TypeScript
conciliacao/   Aplicativo Python anterior e leitores legados
```

## Verificações

Na raiz do projeto, rode os testes da API e das regras de conciliação:

```powershell
python -m unittest discover -s backend/tests -v
```

Para verificar a interface, entre em `frontend/` e execute:

```powershell
npm.cmd run build
```

## Dados e segurança

Por padrão, o histórico é salvo em `backend/prumo.sqlite3`, neste computador. A variável `PRUMO_DB` permite indicar outro caminho para o banco SQLite.

Esta versão foi preparada para uso local: não tem autenticação nem separação de dados entre usuários. Mantenha os serviços vinculados a `127.0.0.1`. Para disponibilizar o sistema em uma rede ou na internet, é necessário implementar controle de acesso, HTTPS, proteção dos uploads, limites de requisição, retenção e backup dos dados.
