// ============================================================
// api.js — Camada de comunicação com o Google Apps Script
// URL embutida direto aqui (não usar .env — não vai pro GitHub)
// TODAS as requisições são POST, inclusive leituras (resolve bug 302/CORS)
// ============================================================

const API_URL =
  'https://script.google.com/macros/s/AKfycbwDtj4utRVA2ZajNdt99LNnOUub9biNB_Or7gORFXlbxXAeW-uothzbBiL2ugTti6RvgQ/exec';

async function post(acao, dados = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // text/plain evita preflight CORS
    body: JSON.stringify({ acao, ...dados }),
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  if (!json.ok) throw new Error(json.erro || 'Erro desconhecido');
  return json;
}

// ── Participantes ─────────────────────────────────────────────

export async function cadastrar(nome, pin) {
  return post('cadastrar', { nome, pin: String(pin) });
}

export async function login(nome, pin) {
  return post('login', { nome, pin: String(pin) });
}

// ── Jogos ─────────────────────────────────────────────────────

export async function getJogos() {
  return post('getJogos');
}

// ── Palpites ──────────────────────────────────────────────────

export async function getPalpites(participanteId) {
  return post('getPalpites', { participanteId });
}

export async function salvarPalpite(participanteId, jogoId, golsCasa, golsVisitante) {
  // Só dispara quando os dois campos estão preenchidos (resolve bug de duplicatas)
  if (golsCasa === '' || golsCasa === null || golsCasa === undefined) return;
  if (golsVisitante === '' || golsVisitante === null || golsVisitante === undefined) return;

  return post('salvarPalpite', {
    participanteId,
    jogoId,
    golsCasa: Number(golsCasa),
    golsVisitante: Number(golsVisitante),
  });
}

// ── Palpite Final (campeão e vice) ────────────────────────────

export async function getPalpiteFinal(participanteId) {
  return post('getPalpiteFinal', { participanteId });
}

export async function salvarPalpiteFinal(participanteId, campeao, vice) {
  return post('salvarPalpiteFinal', { participanteId, campeao, vice });
}

// ── Ranking ───────────────────────────────────────────────────

export async function getRanking() {
  return post('getRanking');
}

// ── Resultados ────────────────────────────────────────────────

export async function getResultados() {
  return post('getResultados');
}

// ── Config pública ────────────────────────────────────────────

export async function getConfig() {
  return post('getConfig');
}

// ── Admin ─────────────────────────────────────────────────────

export async function adminLogin(senha) {
  return post('adminLogin', { senha });
}

export async function lancarResultado(senha, jogoId, golsCasa, golsVisitante) {
  return post('lancarResultado', { senha, jogoId, golsCasa: Number(golsCasa), golsVisitante: Number(golsVisitante) });
}

export async function lancarResultadoFinal(senha, campeao, vice) {
  return post('lancarResultadoFinal', { senha, campeao, vice });
}

export async function adicionarJogo(senha, id, fase, casa, visitante, data, horario) {
  return post('adicionarJogo', { senha, id, fase, casa, visitante, data, horario });
}

export async function getPlacares() {
  return post('getPlacares');
}
