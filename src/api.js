const BASE_URL = "https://script.google.com/macros/s/AKfycbwDtj4utRVA2ZajNdt99LNnOUub9biNB_Or7gORFXlbxXAeW-uothzbBiL2ugTti6RvgQ/exec";

async function call(action, params = {}) {
  const isRead = [
    "listarParticipantes","getPalpites","getPalpitesFinal",
    "getResultados","getResultadoFinal"
  ].includes(action);

  if (isRead) {
    const url = new URL(BASE_URL);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { redirect: "follow" });
    const data = await res.json();
    if (data.erro) throw new Error(data.erro);
    return data;
  } else {
    const res = await fetch(BASE_URL, {
      method: "POST",
      redirect: "follow",
      body: JSON.stringify({ action, ...params }),
    });
    const data = await res.json();
    if (data.erro) throw new Error(data.erro);
    return data;
  }
}

export const criarParticipante  = (nome, pin)                    => call("criarParticipante",   { nome, pin });
export const autenticar         = (nome, pin)                    => call("autenticar",           { nome, pin });
export const listarParticipantes= ()                             => call("listarParticipantes");
export const salvarPalpite      = (participanteId, jogoId, golsA, golsB) => call("salvarPalpite", { participanteId, jogoId, golsA, golsB });
export const salvarPalpiteFinal = (participanteId, campeao, vice)        => call("salvarPalpiteFinal", { participanteId, campeao, vice });
export const getPalpites        = (participanteId)               => call("getPalpites",          { participanteId });
export const getPalpitesFinal   = ()                             => call("getPalpitesFinal");
export const getResultados      = ()                             => call("getResultados");
export const getResultadoFinal  = ()                             => call("getResultadoFinal");
export const salvarResultado    = (senhaAdmin, jogoId, golsA, golsB) => call("salvarResultado", { senhaAdmin, jogoId, golsA, golsB });
export const salvarResultadoFinal = (senhaAdmin, campeao, vice)      => call("salvarResultadoFinal", { senhaAdmin, campeao, vice });