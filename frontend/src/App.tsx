import { useEffect, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, ArrowRight, Check, ChevronDown, Download, Files, LayoutDashboard, Plus, Search, X, Landmark, History, SlidersHorizontal, CircleHelp, LoaderCircle } from 'lucide-react'

type Transaction = { date: string; description: string; amount: number }
type Row = { id: string; bank: Transaction | null; internal: Transaction | null; status: 'matched' | 'bank_only' | 'internal_only'; note: string }
type Session = { id: string; title: string; account: string; created: string; rows: Row[] }
type Summary = Omit<Session, 'rows'>
const labels = { matched: 'Conciliado', bank_only: 'Só no banco', internal_only: 'Só no interno' }
const money = (value: number) => (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const demoRows: Row[] = [
  ['2026-10-01', 'Pix recebido · Estúdio Horizonte', 128000, 'matched'],
  ['2026-10-02', 'Pagamento · Fornecedor Casa Norte', -45680, 'matched'],
  ['2026-10-02', 'Tarifa de manutenção da conta', -4990, 'bank_only'],
  ['2026-10-03', 'Pix recebido · Marina Oliveira', 85000, 'matched'],
  ['2026-10-04', 'Assinatura · Software de gestão', -18900, 'internal_only'],
  ['2026-10-05', 'Transferência · Aluguel do escritório', -240000, 'matched'],
  ['2026-10-06', 'Pix recebido · Projeto Alameda', 375000, 'matched'],
  ['2026-10-07', 'Pagamento · Internet e telefonia', -22990, 'bank_only'],
  ['2026-10-08', 'Pix recebido · Consultoria mensal', 160000, 'matched'],
].map(([date, description, amount, status], index) => {
  const t = { date: String(date), description: String(description), amount: Number(amount) }
  return { id: String(index), bank: status === 'internal_only' ? null : t, internal: status === 'bank_only' ? null : t, status: status as Row['status'], note: '' }
})
const demo: Session = { id: 'demo', title: 'Fechamento de outubro', account: 'Conta de exemplo', created: '2026-10-09', rows: demoRows }
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch('/api' + path, options)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(typeof error.detail === 'string' ? error.detail : 'Não foi possível concluir. Verifique os dados e tente novamente.')
  }
  return response.json()
}

export default function App() {
  const [session, setSession] = useState<Session>(demo)
  const [history, setHistory] = useState<Summary[]>([])
  const [view, setView] = useState('workspace')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState<Row | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => { api<Summary[]>('/sessions').then(setHistory).catch(() => setError('API indisponível. A demonstração continua disponível; inicie o backend para importar arquivos.')) }, [])
  useEffect(() => {
    if (!modal && !selected) return
    const listener = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) { setModal(false); setSelected(null) } }
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [modal, selected, busy])
  const rows = session.rows
  const matched = rows.filter(r => r.status === 'matched').length
  const bankTotal = rows.reduce((sum, row) => sum + (row.bank?.amount || 0), 0)
  const internalTotal = rows.reduce((sum, row) => sum + (row.internal?.amount || 0), 0)
  const bankCount = rows.filter(r => r.bank).length
  const progress = bankCount ? Math.round(matched / bankCount * 100) : 0
  const filtered = rows.filter(row => (filter === 'all' || (filter === 'pending' ? row.status !== 'matched' : row.status === filter)) && `${row.bank?.description || ''} ${row.internal?.description || ''} ${row.note}`.toLowerCase().includes(search.toLowerCase()))
  async function openSession(id: string) {
    setError(''); setBusy(true)
    try { setSession(await api<Session>('/sessions/' + id)); setView('workspace'); setFilter('all'); setSearch('') } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function importFiles(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const result = await api<Session>('/sessions', { method: 'POST', body: new FormData(event.currentTarget) })
      setSession(result); setHistory(old => [result, ...old]); setModal(false); setView('workspace'); setFilter('all'); setSearch(''); setNotice('Arquivos importados. A conciliação está pronta para revisão.')
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function saveNote(event: FormEvent) {
    event.preventDefault(); if (!selected) return; setBusy(true); setError('')
    try {
      if (session.id === 'demo') setSession({ ...session, rows: rows.map(r => r.id === selected.id ? { ...r, note } : r) })
      else setSession(await api<Session>(`/sessions/${session.id}/rows/${selected.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) }))
      setSelected(null); setNotice(session.id === 'demo' ? 'Observação registrada apenas nesta demonstração.' : 'Observação salva no histórico.')
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob(['\uFEFFdata;descricao;valor\n01/10/2026;Pagamento de fornecedor;-1.250,00\n02/10/2026;Recebimento de cliente;2.500,00\n'], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'modelo-lancamentos.csv'; link.click(); URL.revokeObjectURL(url)
  }
  return <div className="shell">
    <aside className="sidebar"><a href="#" className="brand" onClick={() => setView('workspace')}><span className="brand-mark">p</span>prumo<span className="brand-dot">.</span></a><div className="workspace-label">ESPAÇO DE TRABALHO</div><div className="company"><span className="company-icon">F</span><div>Meu financeiro<small>Conciliação bancária</small></div></div><nav><button className={view === 'workspace' ? 'active' : ''} onClick={() => setView('workspace')}><LayoutDashboard size={18}/> Conciliação <span className="nav-count">{rows.length - matched}</span></button><button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}><History size={18}/> Histórico</button><button className={view === 'guide' ? 'active' : ''} onClick={() => setView('guide')}><Files size={18}/> Guia de importação</button></nav><div className="sidebar-bottom"><div className="sidebar-tip"><span>UM FECHAMENTO MAIS TRANQUILO</span><p>Cada diferença tem uma história. Comece pelas pendências.</p><button onClick={() => { setView('workspace'); setFilter('pending') }}>Revisar pendências <ArrowRight size={16}/></button></div><button className="help" onClick={() => setView('guide')}><CircleHelp size={17}/> Como funciona</button><div className="profile"><span>MF</span><div>Meu financeiro<small>Ambiente local</small></div></div></div></aside>
    <div className="main"><header className="topbar"><div>Financeiro <span>/</span> <strong>{view === 'history' ? 'Histórico' : view === 'guide' ? 'Guia de importação' : 'Conciliação bancária'}</strong></div><span className="environment"><i/> {session.id === 'demo' ? 'Demonstração' : 'Dados importados'}</span></header>
    <main><div className="page-heading"><div><div className="eyebrow">CONTAS EM ORDEM. DECISÕES MAIS CLARAS.</div><h1>{view === 'history' ? 'Seu histórico de fechamentos' : view === 'guide' ? 'Do arquivo à conciliação' : 'Conciliação bancária'}</h1><p>{view === 'workspace' ? 'O que entrou no banco, o que ficou no controle. Tudo lado a lado.' : 'Um lugar para acompanhar e organizar o seu financeiro.'}</p></div><button className="primary" onClick={() => { setError(''); setModal(true) }}><Plus size={18}/> Nova conciliação</button></div>
    {error && <div className="alert" role="alert">{error}<button aria-label="Fechar aviso" onClick={() => setError('')}><X size={16}/></button></div>}{notice && <div className="notice" role="status">{notice}<button aria-label="Fechar mensagem" onClick={() => setNotice('')}><X size={16}/></button></div>}
    {view === 'workspace' && <>
      <div className="context-bar"><div><Landmark size={20}/><div><strong>{session.account}</strong><small>{session.title}</small></div></div><span>{session.id === 'demo' ? '01 a 08 out. 2026 · Dados fictícios' : `${rows.length} registros na conciliação`}</span><button onClick={() => setView('history')}>Trocar conciliação <ChevronDown size={15}/></button></div>
      <section className="metrics"><article><span>Movimento líquido no banco <ArrowDownLeft size={17}/></span><h2>{money(bankTotal)}</h2><small>{bankCount} transações no extrato</small></article><article><span>Movimento líquido interno <ArrowUpRight size={17}/></span><h2>{money(internalTotal)}</h2><small>{rows.filter(r => r.internal).length} lançamentos no controle</small></article><article className="difference"><span>Diferença a conferir <SlidersHorizontal size={17}/></span><h2>{money(bankTotal - internalTotal)}</h2><small><i/> {rows.length - matched} pendências aguardando revisão</small></article></section>
      <section className="progress-panel"><span className="check-icon"><Check size={21}/></span><div><strong>Seu fechamento está avançando</strong><p>{matched} correspondências encontradas por data e valor.</p></div><div className="progress-value"><strong>{progress}% <small>do extrato conciliado</small></strong><div className="track"><div style={{ width: `${progress}%` }}/></div></div></section>
      <section className="ledger"><div className="ledger-heading"><div><h2>Transações</h2><span>Confira as correspondências e registre suas observações.</span></div><button className="secondary" disabled={session.id === 'demo'} title={session.id === 'demo' ? 'Importe arquivos reais para exportar o relatório' : 'Baixar relatório Excel'} onClick={() => { window.location.href = `/api/sessions/${session.id}/export` }}><Download size={16}/> Exportar Excel</button></div><div className="table-tools"><div className="tabs">{[['all', 'Todas'], ['matched', 'Conciliadas'], ['pending', 'Pendentes']].map(([value, label]) => <button key={value} className={filter === value ? 'chosen' : ''} onClick={() => setFilter(value)}>{label}<span>{value === 'all' ? rows.length : value === 'matched' ? matched : rows.length - matched}</span></button>)}</div><label className="search"><Search size={16}/><input aria-label="Buscar transações" placeholder="Buscar descrição..." value={search} onChange={e => setSearch(e.target.value)}/></label></div>
      <div className="table-scroll"><table><thead><tr><th>DATA</th><th>DESCRIÇÃO / LANÇAMENTO</th><th className="amount">VALOR</th><th>SITUAÇÃO</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{filtered.map(row => { const t = row.bank || row.internal!; return <tr key={row.id}><td className="date">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}</td><td><div className="transaction"><span className={`transaction-icon ${t.amount > 0 ? 'incoming' : ''}`}>{t.amount > 0 ? <ArrowDownLeft size={17}/> : <ArrowUpRight size={17}/>}</span><div><strong>{t.description}</strong><small>{row.note || (row.status === 'matched' ? `Controle: ${row.internal?.description}` : row.status === 'bank_only' ? 'Sem correspondência no controle interno' : 'Sem correspondência no extrato bancário')}</small></div></div></td><td className={`amount ${t.amount > 0 ? 'positive' : ''}`}>{money(t.amount)}</td><td><span className={`badge ${row.status}`}>{row.status === 'matched' ? <Check size={12}/> : <i/>}{labels[row.status]}</span></td><td><button className="row-action" aria-label={`Revisar ${t.description}`} onClick={() => { setSelected(row); setNote(row.note); setError('') }}><ArrowRight size={17}/></button></td></tr> })}</tbody></table>{!filtered.length && <div className="empty">Nenhuma transação encontrada para este filtro.</div>}</div><div className="table-footer"><span>{filtered.length} de {rows.length} registros</span><span>Correspondências individuais · Sem arredondamento de valores</span></div></section><div className="footnote"><span><Landmark size={14}/> Os saldos acima representam os movimentos importados, sem saldo inicial.</span><span>prumo · cada conta no seu lugar</span></div>
    </>}
    {view === 'history' && <section className="content-panel"><h2>Conciliações salvas</h2><p>Os arquivos importados ficam registrados neste computador.</p>{!history.length && <div className="empty">Você ainda não importou arquivos. Crie a sua primeira conciliação.</div>}{history.map(item => <button className="history-row" key={item.id} disabled={busy} onClick={() => openSession(item.id)}><span><strong>{item.title}</strong><small>{item.account} · {new Date(item.created).toLocaleDateString('pt-BR')}</small></span><ArrowRight size={20}/></button>)}</section>}
    {view === 'guide' && <section className="content-panel guide"><h2>Uma rotina simples, com conferência de verdade.</h2><div><b>01</b><section><h3>Exporte os dois lados</h3><p>Baixe o extrato da conta e os lançamentos do seu controle para o mesmo período. Ambos aceitam CSV ou OFX de uma única conta.</p></section></div><div><b>02</b><section><h3>Prepare o CSV</h3><p>Use as colunas data, descricao e valor. Datas em DD/MM/AAAA ou AAAA-MM-DD; valores como -1.250,00 ou -1250.00. Débitos são negativos. Limite: 5 MB e 10.000 transações por arquivo. Linhas inválidas interrompem a importação para evitar perda silenciosa de dados.</p><button className="secondary" onClick={downloadTemplate}><Download size={16}/> Baixar modelo CSV</button></section></div><div><b>03</b><section><h3>Revise as diferenças</h3><p>A conciliação usa data e valor exatos, priorizando descrições iguais. Correspondências ambíguas ficam pendentes. Registre observações e exporte o Excel com as três categorias. Uma observação não altera o status financeiro.</p></section></div><p className="guide-note">Esta versão é para uso local, sem autenticação. Publicação e uso por equipes exigem controle de acesso. PDFs precisam de validação específica por banco e não são aceitos nesta versão.</p></section>}
    </main></div>
    {modal && <div className="overlay"><dialog open aria-labelledby="import-title"><button className="close" aria-label="Fechar" disabled={busy} onClick={() => setModal(false)}><X size={20}/></button><div className="eyebrow">UM NOVO FECHAMENTO</div><h2 id="import-title">Coloque os dois lados na mesa.</h2><p>Importe os arquivos do mesmo período e da mesma conta.</p><form onSubmit={importFiles}><label>Nome da conciliação<input autoFocus required name="title" maxLength={100} placeholder="Ex.: Fechamento de outubro"/></label><label>Conta bancária<input required name="account" maxLength={100} placeholder="Ex.: Itaú · Conta operacional"/></label><div className="file-fields"><label><Landmark size={22}/> Extrato bancário<small>CSV ou OFX · até 5 MB</small><input required type="file" name="bank" accept=".csv,.ofx"/></label><label><Files size={22}/> Lançamentos internos<small>CSV ou OFX · até 5 MB</small><input required type="file" name="internal" accept=".csv,.ofx"/></label></div><button type="button" className="text-button" onClick={downloadTemplate}>Baixar modelo de CSV</button>{error && <p role="alert" className="form-error">{error}</p>}<button className="primary full" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18}/> : <ArrowRight size={18}/>} {busy ? 'Importando e conciliando...' : 'Importar e conciliar'}</button></form></dialog></div>}
    {selected && <div className="overlay"><dialog open aria-labelledby="review-title"><button className="close" aria-label="Fechar" disabled={busy} onClick={() => setSelected(null)}><X size={20}/></button><div className="eyebrow">CONFERÊNCIA DA TRANSAÇÃO</div><h2 id="review-title">Cada detalhe conta.</h2><span className={`badge ${selected.status}`}>{labels[selected.status]}</span><div className="comparison">{[['Extrato bancário', selected.bank], ['Controle interno', selected.internal]].map(([label, value]) => { const t = value as Transaction | null; return <section key={String(label)}><h3>{String(label)}</h3>{t ? <><p>{t.description}</p><strong>{money(t.amount)}</strong><small>{t.date.split('-').reverse().join('/')}</small></> : <p>Nenhum lançamento correspondente.</p>}</section> })}</div><form onSubmit={saveNote}><label>Observação de revisão<textarea autoFocus maxLength={1000} value={note} onChange={e => setNote(e.target.value)} placeholder="Ex.: Tarifa identificada. Registrar no controle interno." rows={4}/></label><p>O status é calculado pelos arquivos. A observação documenta a revisão e mantém a pendência visível.</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary full" disabled={busy}>{busy ? 'Salvando...' : 'Salvar observação'}</button></form></dialog></div>}
  </div>
}
