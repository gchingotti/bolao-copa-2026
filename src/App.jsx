import { useState, useEffect } from 'react';
import * as api from './api';

const SELECOES = [
  'África do Sul', 'Alemanha', 'Argélia', 'Argentina', 'Arábia Saudita',
  'Austrália', 'Áustria', 'Bélgica', 'Bósnia e Herzegovina', 'Brasil',
  'Canadá', 'Cabo Verde', 'Catar', 'Colômbia', 'Coreia do Sul',
  'Costa do Marfim', 'Croácia', 'Curaçao', 'Egito', 'Equador',
  'Escócia', 'Espanha', 'Estados Unidos', 'França', 'Gana',
  'Haiti', 'Holanda', 'Inglaterra', 'Iraque', 'Irã',
  'Japão', 'Jordânia', 'Marrocos', 'México', 'Nova Zelândia',
  'Noruega', 'Panamá', 'Paraguai', 'Portugal', 'RD Congo',
  'República Tcheca', 'Senegal', 'Suécia', 'Suíça', 'Tunísia',
  'Turquia', 'Uruguai', 'Uzbequistão',
].sort();

const FASES_EXTRA = [
  'Fase de 16', 'Oitavas de Final', 'Quartas de Final',
  'Semifinal', 'Disputa 3º Lugar', 'Final',
];

// ── Helpers ───────────────────────────────────────────────────

function formatarData(iso) {
  if (!iso) return '';
  const str = String(iso).trim();
  if (str.includes('-')) { const [y, m, d] = str.split('-'); return `${d}/${m}`; }
  if (str.includes('/')) { const p = str.split('/'); return `${p[0]}/${p[1]}`; }
  return str;
}

function jogoJaIniciou(jogo) {
  if (!jogo.data || !jogo.horario) return false;
  try {
    const [h, m] = jogo.horario.split(':').map(Number);
    const hUTC = h + 3;
    let dataUTC = jogo.data;
    if (hUTC >= 24) {
      const d = new Date(jogo.data + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + 1);
      dataUTC = d.toISOString().split('T')[0];
    }
    const hFinal = hUTC % 24;
    const dataISO = `${dataUTC}T${String(hFinal).padStart(2,'0')}:${String(m).padStart(2,'0')}:00Z`;
    return new Date() >= new Date(dataISO);
  } catch(e) { return false; }
}

function diaExibicao(jogo) {
  if (!jogo.data || !jogo.horario) return jogo.data;
  const [h] = jogo.horario.split(':').map(Number);
  if (h >= 0 && h < 4) {
    const [y, m, d] = jogo.data.split('-').map(Number);
    const data = new Date(Date.UTC(y, m-1, d));
    data.setUTCDate(data.getUTCDate() - 1);
    return `${data.getUTCFullYear()}-${String(data.getUTCMonth()+1).padStart(2,'0')}-${String(data.getUTCDate()).padStart(2,'0')}`;
  }
  return jogo.data;
}

function formatarDataLonga(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const dataObj = new Date(Number(y), Number(m)-1, Number(d));
  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  return `${d}/${m} · ${dias[dataObj.getDay()]}`;
}

function medalha(pos) {
  if (pos === 1) return '🥇';
  if (pos === 2) return '🥈';
  if (pos === 3) return '🥉';
  return `${pos}º`;
}

// ── App principal ─────────────────────────────────────────────
// Carrega TODOS os dados uma única vez aqui e passa para as abas
// Trocar de aba não refaz nenhuma chamada ao GAS
export default function App() {
  const [tela, setTela] = useState('login');
  const [usuario, setUsuario] = useState(null);
  const [abaApp, setAbaApp] = useState('palpites');

  // Dados globais carregados uma única vez
  const [dadosGlobais, setDadosGlobais] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [placares, setPlacares] = useState(null);
  const [palpiteFinal, setPalpiteFinal] = useState(null);
  const [config, setConfig] = useState({ bloqueioFinal: false });
  const [carregandoGlobal, setCarregandoGlobal] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem('bolao_usuario');
    if (salvo) {
      const u = JSON.parse(salvo);
      setUsuario(u);
      setTela('app');
      carregarTudo(u.participanteId);
    }
    api.getConfig().then(r => setConfig({ bloqueioFinal: r.bloqueioFinal })).catch(() => {});
  }, []);

  async function carregarTudo(participanteId) {
    setCarregandoGlobal(true);
    try {
      // Carrega em paralelo: dados de palpites + ranking + placares + palpite final
      const [rDados, rRanking, rPlacares, rFinal] = await Promise.all([
        api.getDadosPalpites(participanteId),
        api.getRanking(),
        api.getPlacares(),
        api.getPalpiteFinal(participanteId),
      ]);
      setDadosGlobais(rDados);
      setRanking(rRanking);
      setPlacares(rPlacares.placares || []);
      setPalpiteFinal(rFinal);
    } catch(e) {
      console.error(e);
    } finally {
      setCarregandoGlobal(false);
    }
  }

  function entrar(u) {
    setUsuario(u);
    localStorage.setItem('bolao_usuario', JSON.stringify(u));
    setTela('app');
    carregarTudo(u.participanteId);
  }

  function sair() {
    setUsuario(null);
    localStorage.removeItem('bolao_usuario');
    setDadosGlobais(null);
    setRanking(null);
    setPlacares(null);
    setPalpiteFinal(null);
    setTela('login');
  }

  if (tela === 'login') return <TelaLogin onEntrar={entrar} onAdmin={() => setTela('admin')} />;
  if (tela === 'admin') return <TelaAdmin onVoltar={() => setTela('login')} />;

  if (carregandoGlobal || !dadosGlobais) {
    return (
      <div className="app-shell">
        <header className="top-bar">
          <div className="top-bar-inner">
            <span className="logo">⚽ Bolão Copa 2026</span>
            <div className="top-right">
              <span className="nome-usuario">{usuario?.nome}</span>
              <button className="btn-sair" onClick={sair}>Sair</button>
            </div>
          </div>
        </header>
        <main className="main-content"><Loader msg="Carregando bolão..." /></main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar-inner">
          <span className="logo">⚽ Bolão Copa 2026</span>
          <div className="top-right">
            <span className="nome-usuario">{usuario.nome}</span>
            <button className="btn-sair" onClick={sair}>Sair</button>
          </div>
        </div>
        <nav className="nav-tabs">
          <button className={abaApp==='palpites'?'tab ativa':'tab'} onClick={()=>setAbaApp('palpites')}>📝 Palpites</button>
          <button className={abaApp==='placares'?'tab ativa':'tab'} onClick={()=>setAbaApp('placares')}>📋 Placares</button>
          <button className={abaApp==='ranking'?'tab ativa':'tab'} onClick={()=>setAbaApp('ranking')}>🏆 Ranking</button>
          <button className={abaApp==='final'?'tab ativa':'tab'} onClick={()=>setAbaApp('final')}>🌟 Campeão</button>
        </nav>
      </header>
      <main className="main-content">
        {/* display:none mantém o componente vivo sem refazer chamadas ao trocar de aba */}
        <div style={{display: abaApp==='palpites' ? 'block' : 'none'}}>
          <TelaPalpites
            participanteId={usuario.participanteId}
            dadosIniciais={dadosGlobais}
            onAtualizarPlacares={() => api.getPlacares().then(r => setPlacares(r.placares||[])).catch(()=>{})}
          />
        </div>
        <div style={{display: abaApp==='placares' ? 'block' : 'none'}}>
          <TelaPlacares placares={placares} />
        </div>
        <div style={{display: abaApp==='ranking' ? 'block' : 'none'}}>
          <TelaRanking dados={ranking} />
        </div>
        <div style={{display: abaApp==='final' ? 'block' : 'none'}}>
          <TelaPalpiteFinal
            participanteId={usuario.participanteId}
            dadosIniciais={palpiteFinal}
            bloqueado={config.bloqueioFinal}
          />
        </div>
      </main>
    </div>
  );
}

// ── Tela Login ────────────────────────────────────────────────
function TelaLogin({ onEntrar, onAdmin }) {
  const [modo, setModo] = useState('login');
  const [nome, setNome] = useState('');
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setErro('');
    if (!nome.trim() || !pin.trim()) { setErro('Preencha nome e PIN'); return; }
    if (pin.length < 4) { setErro('PIN deve ter ao menos 4 dígitos'); return; }
    setCarregando(true);
    try {
      const res = modo==='login' ? await api.login(nome.trim(), pin) : await api.cadastrar(nome.trim(), pin);
      onEntrar({ participanteId: res.participanteId, nome: res.nome });
    } catch(err) { setErro(err.message); }
    finally { setCarregando(false); }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-hero">
          <span className="login-emoji">⚽</span>
          <h1 className="login-titulo">Bolão Copa 2026</h1>
          <p className="login-sub">EUA • México • Canadá</p>
        </div>
        <div className="login-toggle">
          <button className={modo==='login'?'toggle-btn ativo':'toggle-btn'} onClick={()=>setModo('login')}>Entrar</button>
          <button className={modo==='cadastro'?'toggle-btn ativo':'toggle-btn'} onClick={()=>setModo('cadastro')}>Cadastrar</button>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="campo">
            <label>Nome</label>
            <input type="text" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Como você quer ser chamado" autoComplete="off" />
          </div>
          <div className="campo">
            <label>PIN (4+ dígitos)</label>
            <input type="password" inputMode="numeric" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} placeholder="••••" maxLength={8} />
          </div>
          {erro && <p className="erro-msg">{erro}</p>}
          <button type="submit" className="btn-principal" disabled={carregando}>
            {carregando ? 'Aguarde...' : modo==='login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>
        <button className="btn-admin-link" onClick={onAdmin}>🔐 Área Admin</button>
      </div>
    </div>
  );
}

// ── Tela Palpites ─────────────────────────────────────────────
function TelaPalpites({ participanteId, dadosIniciais }) {
  const [jogos] = useState(dadosIniciais?.jogos || []);
  const [resultados, setResultados] = useState(() => {
    const m = {};
    (dadosIniciais?.resultados || []).forEach(r => { m[r.jogoId] = { casa: r.golsCasa, visitante: r.golsVisitante }; });
    return m;
  });
  const [palpites, setPalpites] = useState(() => {
    const m = {};
    (dadosIniciais?.palpites || []).forEach(p => { m[p.jogoId] = { casa: String(p.golsCasa), visitante: String(p.golsVisitante) }; });
    return m;
  });
  const [classificados, setClassificados] = useState(() => {
    const m = {};
    (dadosIniciais?.classificados || []).forEach(c => { m[c.jogoId] = c.classificado; });
    return m;
  });
  const [salvando, setSalvando] = useState({});
  const [msgs, setMsgs] = useState({});
  const [diaAtivo, setDiaAtivo] = useState(() => {
    const hojeISO = new Date().toISOString().split('T')[0];
    const jogosIniciais = dadosIniciais?.jogos || [];
    const diasFuturos = [...new Set(jogosIniciais.filter(j => !jogoJaIniciou(j)).map(diaExibicao))].sort();
    return diasFuturos[0] || hojeISO;
  });
  const [verHistorico, setVerHistorico] = useState(false);

  function handleChange(jogoId, campo, val) {
    const limpo = val.replace(/\D/g,'').slice(0,2);
    setPalpites(prev => ({ ...prev, [jogoId]: { ...prev[jogoId], [campo]: limpo } }));
  }

  async function handleBlur(jogoId, jogo) {
    const p = palpites[jogoId] || {};
    if (p.casa==='' || p.casa===undefined || p.visitante==='' || p.visitante===undefined) return;
    if (jogoJaIniciou(jogo)) return;
    setSalvando(s => ({ ...s, [jogoId]: true }));
    try {
      await api.salvarPalpite(participanteId, jogoId, Number(p.casa), Number(p.visitante));
      // Classificado automático pelo placar
      if (jogo.mataMata) {
        const gC = Number(p.casa), gV = Number(p.visitante);
        if (gC !== gV) {
          const autoClass = gC > gV ? jogo.casa : jogo.visitante;
          if (classificados[jogoId] !== autoClass) {
            setClassificados(prev => ({ ...prev, [jogoId]: autoClass }));
            await api.salvarClassificado(participanteId, jogoId, autoClass);
          }
        }
      }
      setMsgs(m => ({ ...m, [jogoId]: '✓' }));
      setTimeout(() => setMsgs(m => ({ ...m, [jogoId]: '' })), 2000);
    } catch(err) {
      setMsgs(m => ({ ...m, [jogoId]: '✗ Erro' }));
    } finally {
      setSalvando(s => ({ ...s, [jogoId]: false }));
    }
  }

  async function handleClassificado(jogoId, jogo, time) {
    if (jogoJaIniciou(jogo)) return;
    setClassificados(prev => ({ ...prev, [jogoId]: time }));
    try {
      await api.salvarClassificado(participanteId, jogoId, time);
      setMsgs(m => ({ ...m, [jogoId+'_class']: '✓' }));
      setTimeout(() => setMsgs(m => ({ ...m, [jogoId+'_class']: '' })), 2000);
    } catch(err) {
      setMsgs(m => ({ ...m, [jogoId+'_class']: '✗' }));
    }
  }

  const diasFuturos = [...new Set(jogos.filter(j => !jogoJaIniciou(j)).map(diaExibicao))].sort();
  const jogosHistorico = jogos.filter(j => jogoJaIniciou(j)).sort((a,b) => `${b.data}${b.horario}`.localeCompare(`${a.data}${a.horario}`));
  const jogosDoDia = jogos.filter(j => diaExibicao(j) === diaAtivo).sort((a,b) => `${a.data}${a.horario}`.localeCompare(`${b.data}${b.horario}`));

  if (verHistorico) {
    return (
      <div className="palpites-wrapper">
        <button className="btn-historico-voltar" onClick={() => setVerHistorico(false)}>← Voltar aos palpites</button>
        <div className="historico-lista">
          {jogosHistorico.map(jogo => {
            const p = palpites[jogo.id] || {};
            const res = resultados[jogo.id];
            const classAtual = classificados[jogo.id] || '';
            return (
              <div key={jogo.id} className="historico-card">
                <div className="historico-header">
                  <span className="historico-fase">{jogo.fase}</span>
                  <span className="historico-data">{formatarData(jogo.data)} · {jogo.horario}</span>
                </div>
                <div className="historico-jogo">
                  <span className="historico-time">{jogo.casa}</span>
                  <div className="historico-placares">
                    <span className="historico-palpite">{p.casa !== undefined ? `${p.casa}×${p.visitante}` : '—'}</span>
                    {res && <span className="historico-resultado">{res.casa}×{res.visitante}</span>}
                  </div>
                  <span className="historico-time right">{jogo.visitante}</span>
                </div>
                {jogo.mataMata && classAtual && <div className="historico-classificado">🏅 Avança: {classAtual}</div>}
              </div>
            );
          })}
          {jogosHistorico.length === 0 && <p className="vazio">Nenhum jogo encerrado ainda.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="palpites-wrapper">
      <div className="fases-nav">
        {diasFuturos.map(d => (
          <button key={d} className={diaAtivo===d?'fase-btn ativa':'fase-btn'} onClick={()=>setDiaAtivo(d)}>
            {formatarData(d)}
          </button>
        ))}
        {jogosHistorico.length > 0 && (
          <button className="fase-btn historico-btn" onClick={() => setVerHistorico(true)}>📂 Histórico</button>
        )}
      </div>

      {diaAtivo && <div className="dia-titulo">{formatarDataLonga(diaAtivo)}</div>}

      <div className="jogos-lista">
        {jogosDoDia.length === 0 && <p className="vazio">Nenhum jogo neste dia.</p>}
        {jogosDoDia.map(jogo => {
          const p = palpites[jogo.id] || { casa: '', visitante: '' };
          const res = resultados[jogo.id];
          const temResultado = res !== undefined;
          const iniciou = jogoJaIniciou(jogo);
          const bloqueado = temResultado || iniciou;
          const classAtual = classificados[jogo.id] || '';
          const ehMataMata = jogo.mataMata === true;
          const gC = Number(p.casa), gV = Number(p.visitante);
          const ehEmpate = p.casa !== '' && p.visitante !== '' && gC === gV;
          const mostrarSelecaoClass = ehMataMata && !bloqueado && (ehEmpate || !classAtual);

          return (
            <div key={jogo.id} className={`jogo-card ${bloqueado?'encerrado':''}`}>
              <div className="jogo-data">
                {jogo.fase}
                {jogo.horario && <span className="jogo-horario"> · {jogo.horario}</span>}
                {iniciou && !temResultado && <span className="jogo-em-andamento"> · Em andamento</span>}
              </div>
              <div className="jogo-times">
                <span className="time-nome">{jogo.casa}</span>
                <div className="placar-inputs">
                  <input type="number" inputMode="numeric" min="0" max="99"
                    value={p.casa} onChange={e=>handleChange(jogo.id,'casa',e.target.value)}
                    onBlur={()=>handleBlur(jogo.id,jogo)} disabled={bloqueado} className="placar-input" placeholder="–" />
                  <span className="placar-x">×</span>
                  <input type="number" inputMode="numeric" min="0" max="99"
                    value={p.visitante} onChange={e=>handleChange(jogo.id,'visitante',e.target.value)}
                    onBlur={()=>handleBlur(jogo.id,jogo)} disabled={bloqueado} className="placar-input" placeholder="–" />
                </div>
                <span className="time-nome visitante">{jogo.visitante}</span>
              </div>

              {mostrarSelecaoClass && (
                <div className="classificado-wrapper">
                  <span className="classificado-label">🏅 Quem avança?{ehEmpate && <span className="classificado-hint"> (pênaltis)</span>}</span>
                  <div className="classificado-btns">
                    <button className={`classificado-btn ${classAtual===jogo.casa?'ativo':''}`} onClick={()=>handleClassificado(jogo.id,jogo,jogo.casa)}>{jogo.casa}</button>
                    <button className={`classificado-btn ${classAtual===jogo.visitante?'ativo':''}`} onClick={()=>handleClassificado(jogo.id,jogo,jogo.visitante)}>{jogo.visitante}</button>
                  </div>
                  {msgs[jogo.id+'_class'] && <span className="classificado-msg">{msgs[jogo.id+'_class']}</span>}
                </div>
              )}

              {ehMataMata && !bloqueado && classAtual && !mostrarSelecaoClass && (
                <div className="classificado-auto">🏅 Avança: <strong>{classAtual}</strong> <span className="classificado-hint">(pelo placar)</span></div>
              )}
              {ehMataMata && bloqueado && classAtual && (
                <div className="classificado-auto encerrado-class">🏅 Avança: <strong>{classAtual}</strong></div>
              )}

              {temResultado && <div className="resultado-real">Resultado: {res.casa} × {res.visitante}</div>}
              <div className="jogo-status">{salvando[jogo.id]?'💾':msgs[jogo.id]||''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tela Placares ─────────────────────────────────────────────
function TelaPlacares({ placares }) {
  function iniciais(nome) { return nome.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase(); }
  function corAvatar(nome) {
    const cores = ['#1e7a40','#185fa5','#d4a017','#993556','#3B6D11','#854F0B'];
    let hash = 0;
    for (let i=0;i<nome.length;i++) hash = nome.charCodeAt(i)+((hash<<5)-hash);
    return cores[Math.abs(hash)%cores.length];
  }

  if (!placares) return <Loader />;
  if (placares.length===0) return <div className="placares-wrapper"><p className="vazio">Nenhum jogo iniciado ainda.</p></div>;

  return (
    <div className="placares-wrapper">
      {placares.map(({jogo, resultado, palpites}) => {
        const ehMataMata = jogo.mataMata===true;
        const totalPts = p => (p.pontos||0)+(p.pontosClassificado||0);
        return (
          <div key={jogo.id} className="placar-card">
            <div className="placar-header">
              <div>
                <div className="placar-jogo-titulo">{jogo.casa} × {jogo.visitante}</div>
                <div className="placar-jogo-sub">{formatarData(jogo.data)} · {jogo.horario} · {jogo.fase}</div>
              </div>
              {resultado
                ? <div className="placar-resultado-badge">{resultado.golsCasa} × {resultado.golsVisitante}</div>
                : <div className="placar-andamento">● Andamento</div>}
            </div>
            <div className="placar-lista">
              {palpites.sort((a,b)=>totalPts(b)-totalPts(a)).map(p => (
                <div key={p.participanteId} className="placar-row">
                  <div className="placar-avatar" style={{background:corAvatar(p.nome)+'33',color:corAvatar(p.nome)}}>{iniciais(p.nome)}</div>
                  <div className="placar-info">
                    <span className="placar-nome">{p.nome}</span>
                    {ehMataMata && p.classificado && <span className="placar-classificado">→ {p.classificado}</span>}
                  </div>
                  <span className="placar-palpite">{p.semPalpite?'—':`${p.golsCasa}×${p.golsVisitante}`}</span>
                  {resultado
                    ? <span className={`placar-pts ${totalPts(p)>=5?'pts-exato':totalPts(p)>0?'pts-parcial':'pts-zero'}`}>
                        {p.semPalpite?'s/ palpite':`${totalPts(p)} pts`}
                      </span>
                    : <span className="placar-pts pts-zero">— pts</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tela Ranking ──────────────────────────────────────────────
function TelaRanking({ dados }) {
  if (!dados) return <Loader />;
  const {ranking, premioTotal, premioRodadas, premioCampeao} = dados;
  return (
    <div className="ranking-wrapper">
      <div className="premio-banner">
        <div className="premio-item"><span className="premio-label">Prêmio Total</span><span className="premio-valor">R$ {premioTotal?.toLocaleString('pt-BR')}</span></div>
        <div className="premio-item"><span className="premio-label">🏆 Campeão (50%)</span><span className="premio-valor">R$ {premioCampeao?.toLocaleString('pt-BR')}</span></div>
        <div className="premio-item"><span className="premio-label">📅 Rodadas (50%)</span><span className="premio-valor">R$ {premioRodadas?.toLocaleString('pt-BR')}</span></div>
      </div>
      <div className="ranking-lista">
        {ranking.map(p=>(
          <div key={p.participanteId} className={`ranking-row pos-${p.posicao}`}>
            <span className="ranking-pos">{medalha(p.posicao)}</span>
            <span className="ranking-nome">{p.nome}</span>
            <span className="ranking-pts">{p.totalPontos} pts</span>
          </div>
        ))}
        {ranking.length===0 && <p className="vazio">Nenhum participante ainda.</p>}
      </div>
    </div>
  );
}

// ── Tela Palpite Final ────────────────────────────────────────
function TelaPalpiteFinal({ participanteId, dadosIniciais, bloqueado }) {
  const [campeao, setCampeao] = useState(dadosIniciais?.campeao || '');
  const [vice, setVice] = useState(dadosIniciais?.vice || '');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');

  async function salvar() {
    if (!campeao||!vice){setMsg('Selecione campeão e vice.');return;}
    if (campeao===vice){setMsg('Campeão e vice não podem ser iguais.');return;}
    setSalvando(true);setMsg('');
    try{ await api.salvarPalpiteFinal(participanteId,campeao,vice); setMsg('✅ Palpite salvo!'); }
    catch(err){ setMsg('❌ '+err.message); }
    finally{ setSalvando(false); }
  }

  return (
    <div className="final-wrapper">
      <div className="final-card">
        <h2 className="final-titulo">🌟 Palpite Campeão & Vice</h2>
        <p className="final-info">{bloqueado?'🔒 A Copa já começou — palpites encerrados.':'Estes palpites ficam bloqueados após o início da Copa.'}</p>
        <div className="final-campo">
          <label>🥇 Campeão</label>
          <select value={campeao} onChange={e=>setCampeao(e.target.value)} disabled={bloqueado}>
            <option value="">Selecione...</option>
            {SELECOES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="final-campo">
          <label>🥈 Vice-campeão</label>
          <select value={vice} onChange={e=>setVice(e.target.value)} disabled={bloqueado}>
            <option value="">Selecione...</option>
            {SELECOES.filter(s=>s!==campeao).map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {!bloqueado && <button className="btn-principal" onClick={salvar} disabled={salvando}>{salvando?'Salvando...':'Salvar palpite'}</button>}
        {msg && <p className="final-msg">{msg}</p>}
        <div className="final-regras">
          <h3>Pontuação bônus</h3>
          <p>✅ Acertar o campeão = <strong>20 pts</strong></p>
          <p>✅ Acertar o vice = <strong>10 pts</strong></p>
        </div>
      </div>
    </div>
  );
}

// ── Tela Admin ────────────────────────────────────────────────
function TelaAdmin({ onVoltar }) {
  const [logado, setLogado] = useState(false);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [abaAdmin, setAbaAdmin] = useState('resultados');

  async function handleLogin(e) {
    e.preventDefault(); setErro(''); setCarregando(true);
    try{ await api.adminLogin(senha); setLogado(true); }
    catch(err){ setErro(err.message); }
    finally{ setCarregando(false); }
  }

  if (!logado) return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="admin-titulo">🔐 Área Admin</h2>
        <form onSubmit={handleLogin} className="login-form">
          <div className="campo">
            <label>Senha admin</label>
            <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••" />
          </div>
          {erro && <p className="erro-msg">{erro}</p>}
          <button type="submit" className="btn-principal" disabled={carregando}>{carregando?'Verificando...':'Entrar'}</button>
        </form>
        <button className="btn-admin-link" onClick={onVoltar}>← Voltar</button>
      </div>
    </div>
  );

  return (
    <div className="admin-wrapper">
      <div className="admin-header"><h2>⚙️ Painel Admin</h2><button className="btn-sair" onClick={onVoltar}>Voltar</button></div>
      <div className="login-toggle" style={{marginBottom:0}}>
        <button className={abaAdmin==='resultados'?'toggle-btn ativo':'toggle-btn'} onClick={()=>setAbaAdmin('resultados')}>Resultados</button>
        <button className={abaAdmin==='jogos'?'toggle-btn ativo':'toggle-btn'} onClick={()=>setAbaAdmin('jogos')}>+ Jogos extras</button>
      </div>
      {abaAdmin==='resultados' && <AdminResultados senha={senha} />}
      {abaAdmin==='jogos'      && <AdminJogosExtras senha={senha} />}
    </div>
  );
}

// ── Admin — Resultados ────────────────────────────────────────
function AdminResultados({ senha }) {
  const [jogos, setJogos] = useState([]);
  const [resultados, setResultados] = useState({});
  const [jogoSel, setJogoSel] = useState('');
  const [jogoObj, setJogoObj] = useState(null);
  const [golsCasa, setGolsCasa] = useState('');
  const [golsVisitante, setGolsVisitante] = useState('');
  const [classificado, setClassificado] = useState('');
  const [campeao, setCampeao] = useState('');
  const [vice, setVice] = useState('');
  const [msg, setMsg] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(()=>{ carregarDados(); },[]);

  async function carregarDados() {
    const [rJogos,rRes] = await Promise.all([api.getJogos(),api.getResultados()]);
    setJogos(rJogos.jogos||[]);
    const mapa={};
    (rRes.resultados||[]).forEach(r=>{mapa[r.jogoId]=r;});
    setResultados(mapa);
  }

  function handleJogoSel(id) {
    setJogoSel(id); setClassificado(''); setGolsCasa(''); setGolsVisitante('');
    setJogoObj(jogos.find(j=>j.id===id)||null);
  }

  function handlePlacarChange(campo, val) {
    if (campo==='casa') setGolsCasa(val);
    else setGolsVisitante(val);
    if (!jogoObj?.mataMata) return;
    const gC = campo==='casa' ? Number(val) : Number(golsCasa);
    const gV = campo==='visitante' ? Number(val) : Number(golsVisitante);
    if (val !== '' && golsCasa !== '' && golsVisitante !== '') {
      if (gC > gV) setClassificado(jogoObj.casa);
      else if (gV > gC) setClassificado(jogoObj.visitante);
      else setClassificado('');
    }
  }

  async function handleLancar(e) {
    e.preventDefault();
    if (!jogoSel||golsCasa===''||golsVisitante===''){setMsg('Preencha todos os campos.');return;}
    if (jogoObj?.mataMata && !classificado){setMsg('Selecione quem se classifica.');return;}
    setCarregando(true);setMsg('');
    try{
      await api.lancarResultado(senha,jogoSel,Number(golsCasa),Number(golsVisitante),classificado||null);
      setMsg('✅ Resultado salvo!');
      setJogoSel('');setJogoObj(null);setGolsCasa('');setGolsVisitante('');setClassificado('');
      carregarDados();
    }catch(err){setMsg('❌ '+err.message);}
    finally{setCarregando(false);}
  }

  async function handleLancarFinal(e) {
    e.preventDefault();
    if (!campeao||!vice){setMsg('Selecione campeão e vice.');return;}
    setCarregando(true);setMsg('');
    try{ await api.lancarResultadoFinal(senha,campeao,vice); setMsg('✅ Resultado final lançado!'); }
    catch(err){setMsg('❌ '+err.message);}
    finally{setCarregando(false);}
  }

  return (
    <>
      <div className="admin-secao">
        <h3>Lançar resultado de jogo</h3>
        <form onSubmit={handleLancar} className="admin-form">
          <select value={jogoSel} onChange={e=>handleJogoSel(e.target.value)}>
            <option value="">Selecione o jogo...</option>
            {jogos.map(j=>(
              <option key={j.id} value={j.id}>
                [{j.fase}] {j.casa} × {j.visitante} {resultados[j.id]?`✓ ${resultados[j.id].golsCasa}-${resultados[j.id].golsVisitante}`:''}
              </option>
            ))}
          </select>
          <div className="admin-placar">
            <input type="number" min="0" max="99" value={golsCasa} onChange={e=>handlePlacarChange('casa',e.target.value)} placeholder="Casa" />
            <span>×</span>
            <input type="number" min="0" max="99" value={golsVisitante} onChange={e=>handlePlacarChange('visitante',e.target.value)} placeholder="Visitante" />
          </div>
          {jogoObj?.mataMata && (
            <div className="campo">
              <label>🏅 Quem se classificou?</label>
              <select value={classificado} onChange={e=>setClassificado(e.target.value)}>
                <option value="">Selecione...</option>
                <option value={jogoObj.casa}>{jogoObj.casa}</option>
                <option value={jogoObj.visitante}>{jogoObj.visitante}</option>
              </select>
              {classificado && <p style={{fontSize:'0.8rem',color:'#f0c040',marginTop:'4px'}}>✓ {classificado} se classifica</p>}
            </div>
          )}
          <button type="submit" className="btn-principal" disabled={carregando}>{carregando?'Salvando...':'Lançar resultado'}</button>
        </form>
      </div>
      <div className="admin-secao">
        <h3>Lançar campeão e vice-campeão</h3>
        <form onSubmit={handleLancarFinal} className="admin-form">
          <select value={campeao} onChange={e=>setCampeao(e.target.value)}>
            <option value="">Campeão...</option>
            {SELECOES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={vice} onChange={e=>setVice(e.target.value)}>
            <option value="">Vice...</option>
            {SELECOES.filter(s=>s!==campeao).map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" className="btn-principal" disabled={carregando}>Lançar resultado final</button>
        </form>
      </div>
      {msg && <p className="admin-msg">{msg}</p>}
    </>
  );
}

// ── Admin — Jogos Extras ──────────────────────────────────────
function AdminJogosExtras({ senha }) {
  const [fase,setFase]=useState('');const [casa,setCasa]=useState('');const [visitante,setVisitante]=useState('');
  const [data,setData]=useState('');const [horario,setHorario]=useState('');const [msg,setMsg]=useState('');const [carregando,setCarregando]=useState(false);
  function gerarId(){return fase.replace(/\s+/g,'').substring(0,3).toUpperCase()+Date.now().toString().slice(-4);}
  async function handleAdicionar(e) {
    e.preventDefault();
    if (!fase||!casa||!visitante||!data||!horario){setMsg('Preencha todos os campos.');return;}
    if (casa===visitante){setMsg('Times iguais.');return;}
    setCarregando(true);setMsg('');
    try{
      await api.adicionarJogo(senha,gerarId(),fase,casa,visitante,data,horario);
      setMsg(`✅ ${casa} × ${visitante} adicionado!`);
      setCasa('');setVisitante('');setData('');setHorario('');
    }catch(err){setMsg('❌ '+err.message);}
    finally{setCarregando(false);}
  }
  return (
    <div className="admin-secao">
      <h3>Adicionar jogo eliminatório</h3>
      <form onSubmit={handleAdicionar} className="admin-form">
        <div className="campo"><label>Fase</label>
          <select value={fase} onChange={e=>setFase(e.target.value)}>
            <option value="">Selecione...</option>
            {FASES_EXTRA.map(f=><option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="campo"><label>Data</label><input type="date" value={data} onChange={e=>setData(e.target.value)} min="2026-06-28" max="2026-07-19" /></div>
        <div className="campo"><label>Horário (Brasília)</label><input type="time" value={horario} onChange={e=>setHorario(e.target.value)} /></div>
        <div className="campo"><label>Time 1</label>
          <select value={casa} onChange={e=>setCasa(e.target.value)}>
            <option value="">Selecione...</option>
            {SELECOES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="campo"><label>Time 2</label>
          <select value={visitante} onChange={e=>setVisitante(e.target.value)}>
            <option value="">Selecione...</option>
            {SELECOES.filter(s=>s!==casa).map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-principal" disabled={carregando}>{carregando?'Adicionando...':'Adicionar jogo'}</button>
      </form>
      {msg && <p className="admin-msg">{msg}</p>}
    </div>
  );
}

function Loader({ msg }) { return <div className="loader">⚽ {msg || 'Carregando...'}</div>; }
