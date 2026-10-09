# Prumo · Conciliação bancária

Aplicação web local para comparar extratos bancários com lançamentos internos. O projeto original em `conciliacao/` foi preservado. A interface React/TypeScript está em `frontend/`, e a API FastAPI em `backend/`.

## Executar no Windows

Na raiz do projeto:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r backend\requirements.txt
.venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Em outro terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Acesse http://127.0.0.1:5173. Documentação da API: http://127.0.0.1:8000/docs.

## Fluxo

1. Explore a demonstração identificada como dados fictícios. As notas da demonstração não são persistidas.
2. Clique em **Nova conciliação**, informe nome e conta e envie os dois arquivos.
3. Filtre conciliadas e pendentes, busque descrições e registre observações.
4. Exporte Excel com abas de conciliados, só no banco e só no interno.
5. Abra uma conciliação anterior no histórico. SQLite persiste os registros no computador (`backend/prumo.sqlite3`). `PRUMO_DB` permite definir outro caminho.

## Regras e limites

- CSV com cabeçalhos `data;descricao;valor`, aceitando também data/descrição/histórico em português e date/description/amount em inglês. Separadores: ponto e vírgula, vírgula ou tabulação. Valores com vírgula decimal devem estar entre aspas quando o separador é vírgula.
- Datas DD/MM/AAAA ou AAAA-MM-DD, sempre com ano. Valores em reais, positivos para créditos e negativos para débitos. São aceitos 1.250,00 e 1250.00, com no máximo duas casas decimais.
- UTF-8 e CP1252; arquivos de até 5 MB e 10.000 transações. Linhas inválidas são rejeitadas, sem descarte silencioso.
- OFX deve conter uma única conta. PDFs não são suportados: os leitores legados são específicos de layout e precisam de validação por banco.
- Correspondência por data e valor exatos, com prioridade para descrição igual. Cada lançamento é utilizado no máximo uma vez. Casos ambíguos permanecem pendentes. Não há tolerância de datas, agrupamento de lançamentos ou conciliação manual nesta versão.
- Observações documentam a revisão sem alterar o status; para corrigir valores, ajuste o controle e faça uma nova importação. Os movimentos líquidos não incluem saldo inicial; a diferença líquida pode ser zero mesmo existindo pendências.
- Não existe deduplicação entre importações: cada envio cria um fechamento independente.

## Verificação

```powershell
python -m unittest discover -s backend/tests -v
cd frontend
npm.cmd run build
```

## Limite de implantação

Esta versão é para uso local e não tem autenticação nem isolamento entre usuários. Mantenha os servidores em 127.0.0.1. Antes de disponibilizar pela internet: implementar autenticação, autorização por organização, HTTPS, proteção de uploads, política de retenção, backup e limites de requisições. O proxy do Vite é apenas para desenvolvimento; produção exige servir os arquivos de `frontend/dist` e encaminhar `/api` para o FastAPI na mesma origem. As fontes externas têm fallback para sans-serif se não houver internet.
