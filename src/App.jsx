import { useState, useEffect, useCallback } from 'react';
import * as api from './api';

// ── Constantes ────────────────────────────────────────────────
const SENHA_ADMIN = 'copa2026'; // deve bater com a aba config no Sheets

// ── Helpers ───────────────────────────────────────────────────
function formatarData(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function medalha(pos) {
  if (pos === 1) return '🥇';
  if (pos === 2) return '🥈';
  if (pos === 3) return '🥉';
  return `${pos}º`;
}

// ── Componente principal ──────────────────────────────────────
export default function App() {
  const [tela, setTela] = useState('login'); // login | app | admin
  const [usuario, setUsuario] = useState(null); // { participanteId, nome }
  const [abaApp, setAbaApp] = useState('palpites'); // palpites | ranking | final
  const [config, setConfig] = useState({ bloqueioFinal: false, copaIniciada: false });

  useEffect(() => {
    // Resgata sessão salva
    const salvo = localStorage.getItem('bolao_usuario');
    if (salvo) setUsuario(JSON.parse(salvo));

    // Carrega config
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
          <button className={abaApp === 'ranking' ? 'tab ativa' : 'tab'} onClick={() => setAbaApp('ranking')}>
            🏆 Ranking
          </button>
          <button className={abaApp === 'final' ? 'tab ativa' : 'tab'} onClick={() => setAbaApp('final')}>
            🌟 Campeão
          </button>
        </nav>
      </header>

      <main className="main-content">
        {abaApp === 'palpites' && <TelaPalpites participanteId={usuario.participanteId} />}
        {abaApp === 'ranking' && <TelaRanking />}
        {abaApp === 'final' && (
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
  const [modo, setModo] = useState('login'); // login | cadastro
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
      let res;
      if (modo === 'login') {
        res = await api.login(nome.trim(), pin);
      } else {
        res = await api.cadastrar(nome.trim(), pin);
      }
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
  const [palpites, setPalpites] = useState({}); // { jogoId: { casa, visitante } }
  const [salvando, setSalvando] = useState({});
  const [msgs, setMsgs] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [faseAtiva, setFaseAtiva] = useState('');

  useEffect(() => {
    Promise.all([
      api.getJogos(),
      api.getPalpites(participanteId),
      api.getResultados(),
    ]).then(([rJogos, rPalpites, rResultados]) => {
      setJogos(rJogos.jogos || []);
      if (rJogos.jogos?.length) setFaseAtiva(rJogos.jogos[0].fase);

      // Indexa palpites por jogoId
      const mapa = {};
      (rPalpites.palpites || []).forEach(p => {
        mapa[p.jogoId] = { casa: String(p.golsCasa), visitante: String(p.golsVisitante) };
      });
      setPalpites(mapa);

      // Indexa resultados por jogoId
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

  async function handleBlur(jogoId) {
    const p = palpites[jogoId] || {};
    // Só salva quando os dois campos estão preenchidos (evita duplicatas)
    if (p.casa === '' || p.casa === undefined || p.visitante === '' || p.visitante === undefined) return;

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

  const fases = [...new Set(jogos.map(j => j.fase))];

  return (
    <div className="palpites-wrapper">
      <div className="fases-nav">
        {fases.map(f => (
          <button
            key={f}
            className={faseAtiva === f ? 'fase-btn ativa' : 'fase-btn'}
            onClick={() => setFaseAtiva(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="jogos-lista">
        {jogos.filter(j => j.fase === faseAtiva).map(jogo => {
          const p = palpites[jogo.id] || { casa: '', visitante: '' };
          const res = resultados[jogo.id];
          const temResultado = res !== undefined;

          return (
            <div key={jogo.id} className={`jogo-card ${temResultado ? 'encerrado' : ''}`}>
              <div className="jogo-data">{formatarData(jogo.data)}</div>
              <div className="jogo-times">
                <span className="time-nome">{jogo.casa}</span>
                <div className="placar-inputs">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0" max="99"
                    value={p.casa}
                    onChange={e => handleChange(jogo.id, 'casa', e.target.value)}
                    onBlur={() => handleBlur(jogo.id)}
                    disabled={temResultado}
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
                    onBlur={() => handleBlur(jogo.id)}
                    disabled={temResultado}
                    className="placar-input"
                    placeholder="–"
                  />
                </div>
                <span className="time-nome">{jogo.visitante}</span>
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

// ── Tela Ranking ──────────────────────────────────────────────
function TelaRanking() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.getRanking()
      .then(setDados)
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <Loader />;
  if (!dados) return <p className="vazio">Não foi possível carregar o ranking.</p>;

  const { ranking, premioTotal, premioRodadas, premioCampeao, totalParticipantes } = dados;

  return (
    <div className="ranking-wrapper">
      <div className="premio-banner">
        <div className="premio-item">
          <span className="premio-label">Prêmio Total</span>
          <span className="premio-valor">R$ {premioTotal?.toLocaleString('pt-BR')}</span>
        </div>
        <div className="premio-item">
          <span className="premio-label">🏆 Campeão (70%)</span>
          <span className="premio-valor">R$ {premioCampeao?.toLocaleString('pt-BR')}</span>
        </div>
        <div className="premio-item">
          <span className="premio-label">📅 Rodadas (30%)</span>
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
        {ranking.length === 0 && (
          <p className="vazio">Nenhum participante ainda.</p>
        )}
      </div>
    </div>
  );
}

// ── Tela Palpite Final ────────────────────────────────────────
const SELECOES = [
  'Brasil', 'Argentina', 'França', 'Espanha', 'Portugal', 'Inglaterra',
  'Alemanha', 'Holanda', 'Itália', 'EUA', 'México', 'Coreia do Sul',
  'Japão', 'Marrocos', 'Senegal', 'Austrália', 'Turquia', 'Arábia Saudita',
  'Costa Rica', 'Gana', 'Tunísia', 'Nova Zelândia', 'Belize', 'Equador',
];

function TelaPalpiteFinal({ participanteId, bloqueado }) {
  const [campeao, setCampeao] = useState('');
  const [vice, setVice] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.getPalpiteFinal(participanteId)
      .then(r => {
        setCampeao(r.campeao || '');
        setVice(r.vice || '');
      })
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, [participanteId]);

  async function salvar() {
    if (!campeao || !vice) { setMsg('Selecione campeão e vice.'); return; }
    if (campeao === vice) { setMsg('Campeão e vice não podem ser a mesma seleção.'); return; }
    setSalvando(true);
    setMsg('');
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
          <select
            value={campeao}
            onChange={e => setCampeao(e.target.value)}
            disabled={bloqueado}
          >
            <option value="">Selecione...</option>
            {SELECOES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="final-campo">
          <label>🥈 Vice-campeão</label>
          <select
            value={vice}
            onChange={e => setVice(e.target.value)}
            disabled={bloqueado}
          >
            <option value="">Selecione...</option>
            {SELECOES.filter(s => s !== campeao).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
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
  const [jogos, setJogos] = useState([]);
  const [resultados, setResultados] = useState({});
  const [jogoSel, setJogoSel] = useState('');
  const [golsCasa, setGolsCasa] = useState('');
  const [golsVisitante, setGolsVisitante] = useState('');
  const [campeao, setCampeao] = useState('');
  const [vice, setVice] = useState('');
  const [msg, setMsg] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await api.adminLogin(senha);
      setLogado(true);
      carregarDados();
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarDados() {
    const [rJogos, rRes] = await Promise.all([api.getJogos(), api.getResultados()]);
    setJogos(rJogos.jogos || []);
    const mapa = {};
    (rRes.resultados || []).forEach(r => { mapa[r.jogoId] = r; });
    setResultados(mapa);
  }

  async function handleLancar(e) {
    e.preventDefault();
    if (!jogoSel || golsCasa === '' || golsVisitante === '') {
      setMsg('Preencha todos os campos.'); return;
    }
    setCarregando(true);
    setMsg('');
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
    setCarregando(true);
    setMsg('');
    try {
      await api.lancarResultadoFinal(senha, campeao, vice);
      setMsg('✅ Resultado final lançado!');
    } catch (err) {
      setMsg('❌ ' + err.message);
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

      <div className="admin-secao">
        <h3>Lançar resultado de jogo</h3>
        <form onSubmit={handleLancar} className="admin-form">
          <select value={jogoSel} onChange={e => setJogoSel(e.target.value)}>
            <option value="">Selecione o jogo...</option>
            {jogos.map(j => (
              <option key={j.id} value={j.id}>
                {j.casa} × {j.visitante} ({j.fase}) {resultados[j.id] ? `✓ ${resultados[j.id].golsCasa}-${resultados[j.id].golsVisitante}` : ''}
              </option>
            ))}
          </select>
          <div className="admin-placar">
            <input type="number" min="0" max="99" value={golsCasa}
              onChange={e => setGolsCasa(e.target.value)} placeholder="Gols casa" />
            <span>×</span>
            <input type="number" min="0" max="99" value={golsVisitante}
              onChange={e => setGolsVisitante(e.target.value)} placeholder="Gols visitante" />
          </div>
          <button type="submit" className="btn-principal" disabled={carregando}>
            {carregando ? 'Salvando...' : 'Lançar resultado'}
          </button>
        </form>
      </div>

      <div className="admin-secao">
        <h3>Lançar resultado final (campeão e vice)</h3>
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
    </div>
  );
}

// ── Loader ────────────────────────────────────────────────────
function Loader() {
  return <div className="loader">⚽ Carregando...</div>;
}