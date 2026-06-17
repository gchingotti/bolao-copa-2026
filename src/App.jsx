import { useState, useEffect } from 'react';
import * as api from './api';

// ── Constantes ────────────────────────────────────────────────

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
  'Fase de 16',
  'Oitavas de Final',
  'Quartas de Final',
  'Semifinal',
  'Disputa 3º Lugar',
  'Final',
];

// ── Helpers ───────────────────────────────────────────────────

function formatarData(iso) {
  if (!iso) return '';
  const str = String(iso).trim();
  if (str.includes('-')) {
    const [y, m, d] = str.split('-');
    return `${d}/${m}`;
  }
  if (str.includes('/')) {
    const partes = str.split('/');
    return `${partes[0]}/${partes[1]}`;
  }
  return str;
}

// Verifica se o jogo já iniciou (horário em Brasília = UTC-3)
function jogoJaIniciou(jogo) {
  if (!jogo.data || !jogo.horario) return false;
  try {
    const [h, m] = jogo.horario.split(':').map(Number);
    const hUTC = h + 3;
    // Trata virada de dia (ex: 23:00 BRT = 02:00 UTC do dia seguinte)
    let dataUTC = jogo.data;
    if (hUTC >= 24) {
      const d = new Date(jogo.data + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + 1);
      dataUTC = d.toISOString().split('T')[0];
    }
    const hFinal = hUTC % 24;
    const dataISO = `${dataUTC}T${String(hFinal).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`;
    return new Date() >= new Date(dataISO);
  } catch (e) {
    return false;
  }
}

// Calcula o "dia de exibição" do jogo: horários de madrugada (00h-03h59)
// são agrupados visualmente com o dia anterior, seguindo a lógica de
// "noite de jogos" que o pessoal usa naturalmente
function diaExibicao(jogo) {
  if (!jogo.data || !jogo.horario) return jogo.data;
  const [h] = jogo.horario.split(':').map(Number);
  if (h >= 0 && h < 4) {
    // Volta um dia
    const [y, m, d] = jogo.data.split('-').map(Number);
    const data = new Date(Date.UTC(y, m - 1, d));
    data.setUTCDate(data.getUTCDate() - 1);
    const yy = data.getUTCFullYear();
    const mm = String(data.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(data.getUTCDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }
  return jogo.data;
}

function formatarDataLonga(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const dataObj = new Date(Number(y), Number(m) - 1, Number(d));
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return `${d}/${m} · ${diasSemana[dataObj.getDay()]}`;
}

function medalha(pos) {
  if (pos === 1) return '🥇';
  if (pos === 2) return '🥈';
  if (pos === 3) return '🥉';
  return `${pos}º`;
}

// ── App principal ─────────────────────────────────────────────
export default function App() {
  const [tela, setTela] = useState('login');
  const [usuario, setUsuario] = useState(null);
  const [abaApp, setAbaApp] = useState('palpites');
  const [config, setConfig] = useState({ bloqueioFinal: false, copaIniciada: false });

  useEffect(() => {
    const salvo = localStorage.getItem('bolao_usuario');
    if (salvo) {
      setUsuario(JSON.parse(salvo));
      setTela('app');
    }
    api.getConfig().then(r => setConfig({
      bloqueioFinal: r.bloqueioFinal,
      copaIniciada: r.copaIniciada,
    })).catch(() => {});
  }, []);

  function entrar(u) {
    setUsuario(u);
    localStorage.setItem('bolao_usuario', JSON.stringify(u));
    setTela('app');
  }

  function sair() {
    setUsuario(null);
    localStorage.removeItem('bolao_usuario');
    setTela('login');
  }

  if (tela === 'login') return <TelaLogin onEntrar={entrar} onAdmin={() => setTela('admin')} />;
  if (tela === 'admin') return <TelaAdmin onVoltar={() => setTela('login')} />;

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
          <button className={abaApp === 'palpites' ? 'tab ativa' : 'tab'} onClick={() => setAbaApp('palpites')}>
            📝 Palpites
          </button>
          <button className={abaApp === 'placares' ? 'tab ativa' : 'tab'} onClick={() => setAbaApp('placares')}>
            📋 Placares
          </button>
          <button className={abaApp === 'ranking' ? 'tab ativa' : 'tab'} onClick={() => setAbaApp('ranking')}>
            🏆 Ranking
          </button>
          <button className={abaApp === 'final' ? 'tab ativa' : 'tab'} onClick={() => setAbaApp('final')}>
            🌟 Campeão
          </button>
        </nav>
      </header>

      <main className="main-content">
        {abaApp === 'palpites'  && <TelaPalpites participanteId={usuario.participanteId} />}
        {abaApp === 'placares'  && <TelaPlacares />}
        {abaApp === 'ranking'   && <TelaRanking />}
        {abaApp === 'final'    && (
          <TelaPalpiteFinal
            participanteId={usuario.participanteId}
            bloqueado={config.bloqueioFinal}
          />
        )}
      </main>
    </div>
  );
}

// ── Tela Login / Cadastro ─────────────────────────────────────
function TelaLogin({ onEntrar, onAdmin }) {
  const [modo, setModo] = useState('login');
  const [nome, setNome] = useState('');
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    if (!nome.trim() || !pin.trim()) { setErro('Preencha nome e PIN'); return; }
    if (pin.length < 4) { setErro('PIN deve ter ao menos 4 dígitos'); return; }

    setCarregando(true);
    try {
      const res = modo === 'login'
        ? await api.login(nome.trim(), pin)
        : await api.cadastrar(nome.trim(), pin);
      onEntrar({ participanteId: res.participanteId, nome: res.nome });
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
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
          <button className={modo === 'login' ? 'toggle-btn ativo' : 'toggle-btn'} onClick={() => setModo('login')}>
            Entrar
          </button>
          <button className={modo === 'cadastro' ? 'toggle-btn ativo' : 'toggle-btn'} onClick={() => setModo('cadastro')}>
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="campo">
            <label>Nome</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Como você quer ser chamado"
              autoComplete="off"
            />
          </div>
          <div className="campo">
            <label>PIN (4+ dígitos)</label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              maxLength={8}
            />
          </div>

          {erro && <p className="erro-msg">{erro}</p>}

          <button type="submit" className="btn-principal" disabled={carregando}>
            {carregando ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <button className="btn-admin-link" onClick={onAdmin}>🔐 Área Admin</button>
      </div>
    </div>
  );
}

// ── Tela Palpites ─────────────────────────────────────────────
function TelaPalpites({ participanteId }) {
  const [jogos, setJogos] = useState([]);
  const [resultados, setResultados] = useState({});
  const [palpites, setPalpites] = useState({});
  const [salvando, setSalvando] = useState({});
  const [msgs, setMsgs] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [diaAtivo, setDiaAtivo] = useState('');

  useEffect(() => {
    Promise.all([
      api.getJogos(),
      api.getPalpites(participanteId),
      api.getResultados(),
    ]).then(([rJogos, rPalpites, rResultados]) => {
      const listaJogos = rJogos.jogos || [];
      setJogos(listaJogos);

      if (listaJogos.length) {
        // Seleciona o dia de hoje (ou o próximo dia com jogo) como padrão
        const hojeISO = new Date().toISOString().split('T')[0];
        const diasDisponiveis = [...new Set(listaJogos.map(diaExibicao))].sort();
        const diaDefault = diasDisponiveis.find(d => d >= hojeISO) || diasDisponiveis[diasDisponiveis.length - 1];
        setDiaAtivo(diaDefault);
      }

      const mapa = {};
      (rPalpites.palpites || []).forEach(p => {
        mapa[p.jogoId] = { casa: String(p.golsCasa), visitante: String(p.golsVisitante) };
      });
      setPalpites(mapa);

      const mapRes = {};
      (rResultados.resultados || []).forEach(r => {
        mapRes[r.jogoId] = { casa: r.golsCasa, visitante: r.golsVisitante };
      });
      setResultados(mapRes);
    }).catch(console.error).finally(() => setCarregando(false));
  }, [participanteId]);

  function handleChange(jogoId, campo, val) {
    const limpo = val.replace(/\D/g, '').slice(0, 2);
    setPalpites(prev => ({
      ...prev,
      [jogoId]: { ...prev[jogoId], [campo]: limpo }
    }));
  }

  async function handleBlur(jogoId, jogo) {
    const p = palpites[jogoId] || {};
    if (p.casa === '' || p.casa === undefined || p.visitante === '' || p.visitante === undefined) return;
    // Bloqueia se jogo já iniciou
    if (jogoJaIniciou(jogo)) return;

    setSalvando(s => ({ ...s, [jogoId]: true }));
    try {
      await api.salvarPalpite(participanteId, jogoId, Number(p.casa), Number(p.visitante));
      setMsgs(m => ({ ...m, [jogoId]: '✓' }));
      setTimeout(() => setMsgs(m => ({ ...m, [jogoId]: '' })), 2000);
    } catch (err) {
      setMsgs(m => ({ ...m, [jogoId]: '✗ Erro' }));
    } finally {
      setSalvando(s => ({ ...s, [jogoId]: false }));
    }
  }

  if (carregando) return <Loader />;

  // Agrupa jogos por dia de exibição (madrugada junto com dia anterior)
  const dias = [...new Set(jogos.map(diaExibicao))].sort();
  const jogosDoDia = jogos
    .filter(j => diaExibicao(j) === diaAtivo)
    .sort((a, b) => `${a.data}${a.horario}`.localeCompare(`${b.data}${b.horario}`));

  return (
    <div className="palpites-wrapper">
      <div className="fases-nav">
        {dias.map(d => (
          <button
            key={d}
            className={diaAtivo === d ? 'fase-btn ativa' : 'fase-btn'}
            onClick={() => setDiaAtivo(d)}
          >
            {formatarData(d)}
          </button>
        ))}
      </div>

      {diaAtivo && (
        <div className="dia-titulo">{formatarDataLonga(diaAtivo)}</div>
      )}

      <div className="jogos-lista">
        {jogosDoDia.map(jogo => {
          const p = palpites[jogo.id] || { casa: '', visitante: '' };
          const res = resultados[jogo.id];
          const temResultado = res !== undefined;
          const iniciou = jogoJaIniciou(jogo);
          const bloqueado = temResultado || iniciou;

          return (
            <div key={jogo.id} className={`jogo-card ${bloqueado ? 'encerrado' : ''}`}>
              <div className="jogo-data">
                {jogo.fase}
                {jogo.horario && <span className="jogo-horario"> · {jogo.horario}</span>}
                {iniciou && !temResultado && <span className="jogo-em-andamento"> · Em andamento</span>}
              </div>
              <div className="jogo-times">
                <span className="time-nome">{jogo.casa}</span>
                <div className="placar-inputs">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0" max="99"
                    value={p.casa}
                    onChange={e => handleChange(jogo.id, 'casa', e.target.value)}
                    onBlur={() => handleBlur(jogo.id, jogo)}
                    disabled={bloqueado}
                    className="placar-input"
                    placeholder="–"
                  />
                  <span className="placar-x">×</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0" max="99"
                    value={p.visitante}
                    onChange={e => handleChange(jogo.id, 'visitante', e.target.value)}
                    onBlur={() => handleBlur(jogo.id, jogo)}
                    disabled={bloqueado}
                    className="placar-input"
                    placeholder="–"
                  />
                </div>
                <span className="time-nome visitante">{jogo.visitante}</span>
              </div>

              {temResultado && (
                <div className="resultado-real">
                  Resultado: {res.casa} × {res.visitante}
                </div>
              )}

              <div className="jogo-status">
                {salvando[jogo.id] ? '💾' : msgs[jogo.id] || ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tela Placares ─────────────────────────────────────────────
function TelaPlacares() {
  const [placares, setPlacares] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.getPlacares()
      .then(r => setPlacares(r.placares || []))
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, []);

  function iniciais(nome) {
    return nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  function corAvatar(nome) {
    const cores = ['#1e7a40', '#185fa5', '#d4a017', '#993556', '#3B6D11', '#854F0B'];
    let hash = 0;
    for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
    return cores[Math.abs(hash) % cores.length];
  }

  if (carregando) return <Loader />;

  if (placares.length === 0) {
    return (
      <div className="placares-wrapper">
        <p className="vazio">Nenhum jogo iniciado ainda.<br />Os placares aparecem aqui quando os jogos começarem.</p>
      </div>
    );
  }

  return (
    <div className="placares-wrapper">
      {placares.map(({ jogo, resultado, palpites }) => (
        <div key={jogo.id} className="placar-card">
          <div className="placar-header">
            <div>
              <div className="placar-jogo-titulo">{jogo.casa} × {jogo.visitante}</div>
              <div className="placar-jogo-sub">{formatarData(jogo.data)} · {jogo.horario} · {jogo.fase}</div>
            </div>
            {resultado
              ? <div className="placar-resultado-badge">{resultado.golsCasa} × {resultado.golsVisitante}</div>
              : <div className="placar-andamento">● Andamento</div>
            }
          </div>

          <div className="placar-lista">
            {palpites
              .sort((a, b) => (b.pontos || 0) - (a.pontos || 0))
              .map(p => (
                <div key={p.participanteId} className="placar-row">
                  <div className="placar-avatar" style={{ background: corAvatar(p.nome) + '33', color: corAvatar(p.nome) }}>
                    {iniciais(p.nome)}
                  </div>
                  <span className="placar-nome">{p.nome}</span>
                  <span className="placar-palpite">
                    {p.semPalpite ? '—' : `${p.golsCasa}×${p.golsVisitante}`}
                  </span>
                  {resultado ? (
                    <span className={`placar-pts ${p.pontos >= 5 ? 'pts-exato' : p.pontos > 0 ? 'pts-parcial' : 'pts-zero'}`}>
                      {p.semPalpite ? 's/ palpite' : `${p.pontos} pts`}
                    </span>
                  ) : (
                    <span className="placar-pts pts-zero">— pts</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tela Ranking ──────────────────────────────────────────────
function TelaRanking() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.getRanking().then(setDados).catch(console.error).finally(() => setCarregando(false));
  }, []);

  if (carregando) return <Loader />;
  if (!dados) return <p className="vazio">Não foi possível carregar o ranking.</p>;

  const { ranking, premioTotal, premioRodadas, premioCampeao } = dados;

  return (
    <div className="ranking-wrapper">
      <div className="premio-banner">
        <div className="premio-item">
          <span className="premio-label">Prêmio Total</span>
          <span className="premio-valor">R$ {premioTotal?.toLocaleString('pt-BR')}</span>
        </div>
        <div className="premio-item">
          <span className="premio-label">🏆 Campeão (50%)</span>
          <span className="premio-valor">R$ {premioCampeao?.toLocaleString('pt-BR')}</span>
        </div>
        <div className="premio-item">
          <span className="premio-label">📅 Rodadas (50%)</span>
          <span className="premio-valor">R$ {premioRodadas?.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div className="ranking-lista">
        {ranking.map(p => (
          <div key={p.participanteId} className={`ranking-row pos-${p.posicao}`}>
            <span className="ranking-pos">{medalha(p.posicao)}</span>
            <span className="ranking-nome">{p.nome}</span>
            <span className="ranking-pts">{p.totalPontos} pts</span>
          </div>
        ))}
        {ranking.length === 0 && <p className="vazio">Nenhum participante ainda.</p>}
      </div>
    </div>
  );
}

// ── Tela Palpite Final ────────────────────────────────────────
function TelaPalpiteFinal({ participanteId, bloqueado }) {
  const [campeao, setCampeao] = useState('');
  const [vice, setVice] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.getPalpiteFinal(participanteId)
      .then(r => { setCampeao(r.campeao || ''); setVice(r.vice || ''); })
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, [participanteId]);

  async function salvar() {
    if (!campeao || !vice) { setMsg('Selecione campeão e vice.'); return; }
    if (campeao === vice) { setMsg('Campeão e vice não podem ser iguais.'); return; }
    setSalvando(true); setMsg('');
    try {
      await api.salvarPalpiteFinal(participanteId, campeao, vice);
      setMsg('✅ Palpite salvo!');
    } catch (err) {
      setMsg('❌ ' + err.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <Loader />;

  return (
    <div className="final-wrapper">
      <div className="final-card">
        <h2 className="final-titulo">🌟 Palpite Campeão & Vice</h2>
        <p className="final-info">
          {bloqueado
            ? '🔒 A Copa já começou — palpites encerrados.'
            : 'Estes palpites ficam bloqueados após o início da Copa.'}
        </p>

        <div className="final-campo">
          <label>🥇 Campeão</label>
          <select value={campeao} onChange={e => setCampeao(e.target.value)} disabled={bloqueado}>
            <option value="">Selecione...</option>
            {SELECOES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="final-campo">
          <label>🥈 Vice-campeão</label>
          <select value={vice} onChange={e => setVice(e.target.value)} disabled={bloqueado}>
            <option value="">Selecione...</option>
            {SELECOES.filter(s => s !== campeao).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {!bloqueado && (
          <button className="btn-principal" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar palpite'}
          </button>
        )}

        {msg && <p className="final-msg">{msg}</p>}

        <div className="final-regras">
          <h3>Pontuação bônus</h3>
          <p>✅ Acertar o campeão = <strong>5 pts</strong></p>
          <p>✅ Acertar o vice = <strong>3 pts</strong></p>
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
    e.preventDefault();
    setErro(''); setCarregando(true);
    try {
      await api.adminLogin(senha);
      setLogado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  if (!logado) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <h2 className="admin-titulo">🔐 Área Admin</h2>
          <form onSubmit={handleLogin} className="login-form">
            <div className="campo">
              <label>Senha admin</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••" />
            </div>
            {erro && <p className="erro-msg">{erro}</p>}
            <button type="submit" className="btn-principal" disabled={carregando}>
              {carregando ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
          <button className="btn-admin-link" onClick={onVoltar}>← Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <div className="admin-header">
        <h2>⚙️ Painel Admin</h2>
        <button className="btn-sair" onClick={onVoltar}>Voltar</button>
      </div>

      <div className="login-toggle" style={{ marginBottom: 0 }}>
        <button className={abaAdmin === 'resultados' ? 'toggle-btn ativo' : 'toggle-btn'} onClick={() => setAbaAdmin('resultados')}>
          Resultados
        </button>
        <button className={abaAdmin === 'jogos' ? 'toggle-btn ativo' : 'toggle-btn'} onClick={() => setAbaAdmin('jogos')}>
          + Jogos extras
        </button>
      </div>

      {abaAdmin === 'resultados' && <AdminResultados senha={senha} />}
      {abaAdmin === 'jogos'      && <AdminJogosExtras senha={senha} />}
    </div>
  );
}

// ── Admin — Resultados ────────────────────────────────────────
function AdminResultados({ senha }) {
  const [jogos, setJogos] = useState([]);
  const [resultados, setResultados] = useState({});
  const [jogoSel, setJogoSel] = useState('');
  const [golsCasa, setGolsCasa] = useState('');
  const [golsVisitante, setGolsVisitante] = useState('');
  const [campeao, setCampeao] = useState('');
  const [vice, setVice] = useState('');
  const [msg, setMsg] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const [rJogos, rRes] = await Promise.all([api.getJogos(), api.getResultados()]);
    setJogos(rJogos.jogos || []);
    const mapa = {};
    (rRes.resultados || []).forEach(r => { mapa[r.jogoId] = r; });
    setResultados(mapa);
  }

  async function handleLancar(e) {
    e.preventDefault();
    if (!jogoSel || golsCasa === '' || golsVisitante === '') { setMsg('Preencha todos os campos.'); return; }
    setCarregando(true); setMsg('');
    try {
      await api.lancarResultado(senha, jogoSel, Number(golsCasa), Number(golsVisitante));
      setMsg('✅ Resultado salvo e pontos calculados!');
      setJogoSel(''); setGolsCasa(''); setGolsVisitante('');
      carregarDados();
    } catch (err) {
      setMsg('❌ ' + err.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleLancarFinal(e) {
    e.preventDefault();
    if (!campeao || !vice) { setMsg('Selecione campeão e vice.'); return; }
    setCarregando(true); setMsg('');
    try {
      await api.lancarResultadoFinal(senha, campeao, vice);
      setMsg('✅ Resultado final lançado!');
    } catch (err) {
      setMsg('❌ ' + err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <div className="admin-secao">
        <h3>Lançar resultado de jogo</h3>
        <form onSubmit={handleLancar} className="admin-form">
          <select value={jogoSel} onChange={e => setJogoSel(e.target.value)}>
            <option value="">Selecione o jogo...</option>
            {jogos.map(j => (
              <option key={j.id} value={j.id}>
                [{j.fase}] {j.casa} × {j.visitante} {resultados[j.id] ? `✓ ${resultados[j.id].golsCasa}-${resultados[j.id].golsVisitante}` : ''}
              </option>
            ))}
          </select>
          <div className="admin-placar">
            <input type="number" min="0" max="99" value={golsCasa}
              onChange={e => setGolsCasa(e.target.value)} placeholder="Casa" />
            <span>×</span>
            <input type="number" min="0" max="99" value={golsVisitante}
              onChange={e => setGolsVisitante(e.target.value)} placeholder="Visitante" />
          </div>
          <button type="submit" className="btn-principal" disabled={carregando}>
            {carregando ? 'Salvando...' : 'Lançar resultado'}
          </button>
        </form>
      </div>

      <div className="admin-secao">
        <h3>Lançar campeão e vice-campeão</h3>
        <form onSubmit={handleLancarFinal} className="admin-form">
          <select value={campeao} onChange={e => setCampeao(e.target.value)}>
            <option value="">Campeão...</option>
            {SELECOES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={vice} onChange={e => setVice(e.target.value)}>
            <option value="">Vice...</option>
            {SELECOES.filter(s => s !== campeao).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" className="btn-principal" disabled={carregando}>
            Lançar resultado final
          </button>
        </form>
      </div>

      {msg && <p className="admin-msg">{msg}</p>}
    </>
  );
}

// ── Admin — Jogos Extras ──────────────────────────────────────
function AdminJogosExtras({ senha }) {
  const [fase, setFase] = useState('');
  const [casa, setCasa] = useState('');
  const [visitante, setVisitante] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [msg, setMsg] = useState('');
  const [carregando, setCarregando] = useState(false);

  function gerarIdJogo() {
    const prefixo = fase.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const sufixo = Date.now().toString().slice(-4);
    return `${prefixo}${sufixo}`;
  }

  async function handleAdicionar(e) {
    e.preventDefault();
    if (!fase || !casa || !visitante || !data || !horario) { setMsg('Preencha todos os campos.'); return; }
    if (casa === visitante) { setMsg('Os dois times não podem ser iguais.'); return; }

    setCarregando(true); setMsg('');
    try {
      const id = gerarIdJogo();
      await api.adicionarJogo(senha, id, fase, casa, visitante, data, horario);
      setMsg(`✅ Jogo adicionado! (${casa} × ${visitante})`);
      setCasa(''); setVisitante(''); setData(''); setHorario('');
    } catch (err) {
      setMsg('❌ ' + err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="admin-secao">
      <h3>Adicionar jogo eliminatório</h3>
      <p className="admin-info">
        Adicione os confrontos das fases eliminatórias conforme forem definidos.
        O jogo aparece automaticamente na tela de palpites e fica bloqueado no horário de início.
      </p>
      <form onSubmit={handleAdicionar} className="admin-form">
        <div className="campo">
          <label>Fase</label>
          <select value={fase} onChange={e => setFase(e.target.value)}>
            <option value="">Selecione a fase...</option>
            {FASES_EXTRA.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div className="campo">
          <label>Data do jogo</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)} min="2026-06-28" max="2026-07-19" />
        </div>

        <div className="campo">
          <label>Horário (Brasília)</label>
          <input type="time" value={horario} onChange={e => setHorario(e.target.value)} />
        </div>

        <div className="campo">
          <label>Time 1 (mandante)</label>
          <select value={casa} onChange={e => setCasa(e.target.value)}>
            <option value="">Selecione...</option>
            {SELECOES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="campo">
          <label>Time 2 (visitante)</label>
          <select value={visitante} onChange={e => setVisitante(e.target.value)}>
            <option value="">Selecione...</option>
            {SELECOES.filter(s => s !== casa).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button type="submit" className="btn-principal" disabled={carregando}>
          {carregando ? 'Adicionando...' : 'Adicionar jogo'}
        </button>
      </form>

      {msg && <p className="admin-msg">{msg}</p>}
    </div>
  );
}

// ── Loader ────────────────────────────────────────────────────
function Loader() {
  return <div className="loader">⚽ Carregando...</div>;
}
