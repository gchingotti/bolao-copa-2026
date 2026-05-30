import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "./api";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ENTRY_FEE = 50;
const ROUND_POOL_PCT = 0.30;
const FINAL_POOL_PCT = 0.70;
const POINTS = { exact: 5, winner: 2, draw: 1, bonusChampion: 5, bonusVice: 3 };
const ADMIN_PASSWORD = "copa2026";
const ROUNDS = ["Fase de Grupos","Oitavas","Quartas","Semifinal","3º Lugar","Final 🏆"];
const ROUND_LABELS = {"Fase de Grupos":"Grupos","Oitavas":"Oitavas","Quartas":"Quartas","Semifinal":"Semi","3º Lugar":"3º Lugar","Final 🏆":"🏆 Final"};

// ─── COPA 2026 DATA ──────────────────────────────────────────────────────────
const GROUPS = {
  A:["México","África do Sul","Coreia do Sul","República Tcheca"],
  B:["Canadá","Bósnia-Herzegovina","Catar","Suíça"],
  C:["Brasil","Marrocos","Haiti","Escócia"],
  D:["Estados Unidos","Paraguai","Austrália","Turquia"],
  E:["Alemanha","Curaçao","Costa do Marfim","Equador"],
  F:["Países Baixos","Japão","Suécia","Tunísia"],
  G:["Bélgica","Egito","Irã","Nova Zelândia"],
  H:["Espanha","Cabo Verde","Arábia Saudita","Uruguai"],
  I:["França","Senegal","Iraque","Noruega"],
  J:["Argentina","Argélia","Áustria","Jordânia"],
  K:["Portugal","RD Congo","Uzbequistão","Colômbia"],
  L:["Inglaterra","Croácia","Gana","Panamá"],
};
const ALL_TEAMS = Object.values(GROUPS).flat();

const FLAGS = {
  "México":"🇲🇽","África do Sul":"🇿🇦","Coreia do Sul":"🇰🇷","República Tcheca":"🇨🇿",
  "Canadá":"🇨🇦","Bósnia-Herzegovina":"🇧🇦","Catar":"🇶🇦","Suíça":"🇨🇭",
  "Brasil":"🇧🇷","Marrocos":"🇲🇦","Haiti":"🇭🇹","Escócia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Estados Unidos":"🇺🇸","Paraguai":"🇵🇾","Austrália":"🇦🇺","Turquia":"🇹🇷",
  "Alemanha":"🇩🇪","Curaçao":"🇨🇼","Costa do Marfim":"🇨🇮","Equador":"🇪🇨",
  "Países Baixos":"🇳🇱","Japão":"🇯🇵","Suécia":"🇸🇪","Tunísia":"🇹🇳",
  "Bélgica":"🇧🇪","Egito":"🇪🇬","Irã":"🇮🇷","Nova Zelândia":"🇳🇿",
  "Espanha":"🇪🇸","Cabo Verde":"🇨🇻","Arábia Saudita":"🇸🇦","Uruguai":"🇺🇾",
  "França":"🇫🇷","Senegal":"🇸🇳","Iraque":"🇮🇶","Noruega":"🇳🇴",
  "Argentina":"🇦🇷","Argélia":"🇩🇿","Áustria":"🇦🇹","Jordânia":"🇯🇴",
  "Portugal":"🇵🇹","RD Congo":"🇨🇩","Uzbequistão":"🇺🇿","Colômbia":"🇨🇴",
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croácia":"🇭🇷","Gana":"🇬🇭","Panamá":"🇵🇦",
};

const GROUP_MATCHES = [
  {id:"A1",group:"A",home:"México",away:"África do Sul",round:"Fase de Grupos",date:"11/06",time:"16:00"},
  {id:"A2",group:"A",home:"Coreia do Sul",away:"República Tcheca",round:"Fase de Grupos",date:"11/06",time:"23:00"},
  {id:"A3",group:"A",home:"República Tcheca",away:"África do Sul",round:"Fase de Grupos",date:"18/06",time:"13:00"},
  {id:"A4",group:"A",home:"México",away:"Coreia do Sul",round:"Fase de Grupos",date:"18/06",time:"22:00"},
  {id:"A5",group:"A",home:"República Tcheca",away:"México",round:"Fase de Grupos",date:"24/06",time:"22:00"},
  {id:"A6",group:"A",home:"África do Sul",away:"Coreia do Sul",round:"Fase de Grupos",date:"24/06",time:"22:00"},
  {id:"B1",group:"B",home:"Canadá",away:"Bósnia-Herzegovina",round:"Fase de Grupos",date:"12/06",time:"16:00"},
  {id:"B2",group:"B",home:"Catar",away:"Suíça",round:"Fase de Grupos",date:"13/06",time:"16:00"},
  {id:"B3",group:"B",home:"Suíça",away:"Bósnia-Herzegovina",round:"Fase de Grupos",date:"18/06",time:"16:00"},
  {id:"B4",group:"B",home:"Canadá",away:"Catar",round:"Fase de Grupos",date:"18/06",time:"19:00"},
  {id:"B5",group:"B",home:"Suíça",away:"Canadá",round:"Fase de Grupos",date:"24/06",time:"16:00"},
  {id:"B6",group:"B",home:"Bósnia-Herzegovina",away:"Catar",round:"Fase de Grupos",date:"24/06",time:"16:00"},
  {id:"C1",group:"C",home:"Brasil",away:"Marrocos",round:"Fase de Grupos",date:"13/06",time:"19:00"},
  {id:"C2",group:"C",home:"Haiti",away:"Escócia",round:"Fase de Grupos",date:"13/06",time:"22:00"},
  {id:"C3",group:"C",home:"Escócia",away:"Marrocos",round:"Fase de Grupos",date:"19/06",time:"19:00"},
  {id:"C4",group:"C",home:"Brasil",away:"Haiti",round:"Fase de Grupos",date:"19/06",time:"21:30"},
  {id:"C5",group:"C",home:"Escócia",away:"Brasil",round:"Fase de Grupos",date:"24/06",time:"19:00"},
  {id:"C6",group:"C",home:"Marrocos",away:"Haiti",round:"Fase de Grupos",date:"24/06",time:"19:00"},
  {id:"D1",group:"D",home:"Estados Unidos",away:"Paraguai",round:"Fase de Grupos",date:"12/06",time:"22:00"},
  {id:"D2",group:"D",home:"Austrália",away:"Turquia",round:"Fase de Grupos",date:"13/06",time:"01:00"},
  {id:"D3",group:"D",home:"Turquia",away:"Paraguai",round:"Fase de Grupos",date:"19/06",time:"01:00"},
  {id:"D4",group:"D",home:"Estados Unidos",away:"Austrália",round:"Fase de Grupos",date:"19/06",time:"16:00"},
  {id:"D5",group:"D",home:"Turquia",away:"Estados Unidos",round:"Fase de Grupos",date:"25/06",time:"23:00"},
  {id:"D6",group:"D",home:"Paraguai",away:"Austrália",round:"Fase de Grupos",date:"25/06",time:"23:00"},
  {id:"E1",group:"E",home:"Alemanha",away:"Curaçao",round:"Fase de Grupos",date:"14/06",time:"14:00"},
  {id:"E2",group:"E",home:"Costa do Marfim",away:"Equador",round:"Fase de Grupos",date:"14/06",time:"20:00"},
  {id:"E3",group:"E",home:"Alemanha",away:"Costa do Marfim",round:"Fase de Grupos",date:"20/06",time:"17:00"},
  {id:"E4",group:"E",home:"Equador",away:"Curaçao",round:"Fase de Grupos",date:"20/06",time:"21:00"},
  {id:"E5",group:"E",home:"Curaçao",away:"Costa do Marfim",round:"Fase de Grupos",date:"25/06",time:"17:00"},
  {id:"E6",group:"E",home:"Equador",away:"Alemanha",round:"Fase de Grupos",date:"25/06",time:"17:00"},
  {id:"F1",group:"F",home:"Países Baixos",away:"Japão",round:"Fase de Grupos",date:"14/06",time:"17:00"},
  {id:"F2",group:"F",home:"Suécia",away:"Tunísia",round:"Fase de Grupos",date:"14/06",time:"23:00"},
  {id:"F3",group:"F",home:"Tunísia",away:"Japão",round:"Fase de Grupos",date:"20/06",time:"01:00"},
  {id:"F4",group:"F",home:"Países Baixos",away:"Suécia",round:"Fase de Grupos",date:"20/06",time:"14:00"},
  {id:"F5",group:"F",home:"Japão",away:"Suécia",round:"Fase de Grupos",date:"25/06",time:"20:00"},
  {id:"F6",group:"F",home:"Tunísia",away:"Países Baixos",round:"Fase de Grupos",date:"25/06",time:"20:00"},
  {id:"G1",group:"G",home:"Bélgica",away:"Egito",round:"Fase de Grupos",date:"15/06",time:"16:00"},
  {id:"G2",group:"G",home:"Irã",away:"Nova Zelândia",round:"Fase de Grupos",date:"15/06",time:"22:00"},
  {id:"G3",group:"G",home:"Bélgica",away:"Irã",round:"Fase de Grupos",date:"21/06",time:"16:00"},
  {id:"G4",group:"G",home:"Nova Zelândia",away:"Egito",round:"Fase de Grupos",date:"21/06",time:"22:00"},
  {id:"G5",group:"G",home:"Egito",away:"Irã",round:"Fase de Grupos",date:"27/06",time:"00:00"},
  {id:"G6",group:"G",home:"Nova Zelândia",away:"Bélgica",round:"Fase de Grupos",date:"27/06",time:"00:00"},
  {id:"H1",group:"H",home:"Espanha",away:"Cabo Verde",round:"Fase de Grupos",date:"15/06",time:"13:00"},
  {id:"H2",group:"H",home:"Arábia Saudita",away:"Uruguai",round:"Fase de Grupos",date:"15/06",time:"19:00"},
  {id:"H3",group:"H",home:"Espanha",away:"Arábia Saudita",round:"Fase de Grupos",date:"21/06",time:"13:00"},
  {id:"H4",group:"H",home:"Uruguai",away:"Cabo Verde",round:"Fase de Grupos",date:"21/06",time:"19:00"},
  {id:"H5",group:"H",home:"Cabo Verde",away:"Arábia Saudita",round:"Fase de Grupos",date:"26/06",time:"21:00"},
  {id:"H6",group:"H",home:"Uruguai",away:"Espanha",round:"Fase de Grupos",date:"26/06",time:"21:00"},
  {id:"I1",group:"I",home:"França",away:"Senegal",round:"Fase de Grupos",date:"16/06",time:"16:00"},
  {id:"I2",group:"I",home:"Iraque",away:"Noruega",round:"Fase de Grupos",date:"16/06",time:"19:00"},
  {id:"I3",group:"I",home:"França",away:"Iraque",round:"Fase de Grupos",date:"22/06",time:"18:00"},
  {id:"I4",group:"I",home:"Noruega",away:"Senegal",round:"Fase de Grupos",date:"22/06",time:"21:00"},
  {id:"I5",group:"I",home:"Noruega",away:"França",round:"Fase de Grupos",date:"26/06",time:"16:00"},
  {id:"I6",group:"I",home:"Senegal",away:"Iraque",round:"Fase de Grupos",date:"26/06",time:"16:00"},
  {id:"J1",group:"J",home:"Áustria",away:"Jordânia",round:"Fase de Grupos",date:"16/06",time:"01:00"},
  {id:"J2",group:"J",home:"Argentina",away:"Argélia",round:"Fase de Grupos",date:"16/06",time:"22:00"},
  {id:"J3",group:"J",home:"Argentina",away:"Áustria",round:"Fase de Grupos",date:"22/06",time:"14:00"},
  {id:"J4",group:"J",home:"Jordânia",away:"Argélia",round:"Fase de Grupos",date:"22/06",time:"00:00"},
  {id:"J5",group:"J",home:"Argélia",away:"Áustria",round:"Fase de Grupos",date:"27/06",time:"23:00"},
  {id:"J6",group:"J",home:"Jordânia",away:"Argentina",round:"Fase de Grupos",date:"27/06",time:"23:00"},
  {id:"K1",group:"K",home:"Portugal",away:"RD Congo",round:"Fase de Grupos",date:"17/06",time:"14:00"},
  {id:"K2",group:"K",home:"Colômbia",away:"Uzbequistão",round:"Fase de Grupos",date:"17/06",time:"23:00"},
  {id:"K3",group:"K",home:"Portugal",away:"Uzbequistão",round:"Fase de Grupos",date:"23/06",time:"14:00"},
  {id:"K4",group:"K",home:"Colômbia",away:"RD Congo",round:"Fase de Grupos",date:"23/06",time:"23:00"},
  {id:"K5",group:"K",home:"Colômbia",away:"Portugal",round:"Fase de Grupos",date:"27/06",time:"20:30"},
  {id:"K6",group:"K",home:"RD Congo",away:"Uzbequistão",round:"Fase de Grupos",date:"27/06",time:"20:30"},
  {id:"L1",group:"L",home:"Inglaterra",away:"Croácia",round:"Fase de Grupos",date:"17/06",time:"17:00"},
  {id:"L2",group:"L",home:"Gana",away:"Panamá",round:"Fase de Grupos",date:"17/06",time:"20:00"},
  {id:"L3",group:"L",home:"Inglaterra",away:"Gana",round:"Fase de Grupos",date:"23/06",time:"17:00"},
  {id:"L4",group:"L",home:"Panamá",away:"Croácia",round:"Fase de Grupos",date:"23/06",time:"20:00"},
  {id:"L5",group:"L",home:"Panamá",away:"Inglaterra",round:"Fase de Grupos",date:"27/06",time:"18:00"},
  {id:"L6",group:"L",home:"Croácia",away:"Gana",round:"Fase de Grupos",date:"27/06",time:"18:00"},
];

const KNOCKOUT_MATCHES = [
  {id:"r32_1",round:"Oitavas",home:"1º A",away:"3º D/E/F"},
  {id:"r32_2",round:"Oitavas",home:"1º B",away:"3º A/C/D"},
  {id:"r32_3",round:"Oitavas",home:"1º C",away:"3º G/H/I"},
  {id:"r32_4",round:"Oitavas",home:"1º D",away:"2º B"},
  {id:"r32_5",round:"Oitavas",home:"1º E",away:"3º J/K/L"},
  {id:"r32_6",round:"Oitavas",home:"1º F",away:"2º A"},
  {id:"r32_7",round:"Oitavas",home:"1º G",away:"2º C"},
  {id:"r32_8",round:"Oitavas",home:"1º H",away:"2º D"},
  {id:"r32_9",round:"Oitavas",home:"1º I",away:"2º E"},
  {id:"r32_10",round:"Oitavas",home:"1º J",away:"2º F"},
  {id:"r32_11",round:"Oitavas",home:"1º K",away:"2º G"},
  {id:"r32_12",round:"Oitavas",home:"1º L",away:"2º H"},
  {id:"r32_13",round:"Oitavas",home:"2º I",away:"2º J"},
  {id:"r32_14",round:"Oitavas",home:"2º K",away:"2º L"},
  {id:"r32_15",round:"Oitavas",home:"3º A/B/C",away:"3º I/J/K/L"},
  {id:"r32_16",round:"Oitavas",home:"3º B/E/G",away:"3º H/J/K"},
  {id:"qf_1",round:"Quartas",home:"TBD",away:"TBD"},
  {id:"qf_2",round:"Quartas",home:"TBD",away:"TBD"},
  {id:"qf_3",round:"Quartas",home:"TBD",away:"TBD"},
  {id:"qf_4",round:"Quartas",home:"TBD",away:"TBD"},
  {id:"qf_5",round:"Quartas",home:"TBD",away:"TBD"},
  {id:"qf_6",round:"Quartas",home:"TBD",away:"TBD"},
  {id:"qf_7",round:"Quartas",home:"TBD",away:"TBD"},
  {id:"qf_8",round:"Quartas",home:"TBD",away:"TBD"},
  {id:"sf_1",round:"Semifinal",home:"TBD",away:"TBD"},
  {id:"sf_2",round:"Semifinal",home:"TBD",away:"TBD"},
  {id:"sf_3",round:"Semifinal",home:"TBD",away:"TBD"},
  {id:"sf_4",round:"Semifinal",home:"TBD",away:"TBD"},
  {id:"3rd",round:"3º Lugar",home:"TBD",away:"TBD"},
  {id:"final",round:"Final 🏆",home:"TBD",away:"TBD"},
];

const ALL_MATCHES = [...GROUP_MATCHES, ...KNOCKOUT_MATCHES];

const COPA_START = new Date("2026-06-11T16:00:00-03:00");

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const FLAG = t => FLAGS[t] || "🏳️";
const fmt = v => `R$ ${v.toLocaleString("pt-BR",{minimumFractionDigits:0})}`;

function matchKickoff(match) {
  if (!match.date || !match.time) return null;
  const [d,m] = match.date.split("/");
  const [hh,mm] = match.time.split(":");
  return new Date(`2026-${m}-${d}T${hh}:${mm}:00-03:00`);
}
function isMatchLocked(match) {
  const ko = matchKickoff(match);
  if (!ko) return false;
  return new Date() >= ko;
}
function isCopaStarted() { return new Date() >= COPA_START; }
function getResult(h,a){ if(h>a)return"home"; if(a>h)return"away"; return"draw"; }

function calcPoints(guess, official) {
  if (!official||official.home===""||official.away==="") return null;
  const oh=parseInt(official.home),oa=parseInt(official.away);
  const gh=parseInt(guess?.home),ga=parseInt(guess?.away);
  if (isNaN(oh)||isNaN(oa)||isNaN(gh)||isNaN(ga)) return null;
  if (gh===oh&&ga===oa) return POINTS.exact;
  const or=getResult(oh,oa),gr=getResult(gh,ga);
  if (or==="draw"&&gr==="draw") return POINTS.draw;
  if (or!=="draw"&&gr===or) return POINTS.winner;
  return 0;
}
function calcBonus(guesses, champion, vice) {
  let b=0;
  if (champion&&guesses?.champion===champion) b+=POINTS.bonusChampion;
  if (vice&&guesses?.vice===vice) b+=POINTS.bonusVice;
  return b;
}
function pointsByRound(guesses, results, round) {
  return ALL_MATCHES.filter(m=>m.round===round).reduce((sum,m)=>{
    const p=calcPoints(guesses?.[m.id],results[m.id]);
    return sum+(p??0);
  },0);
}
function totalPoints(guesses, results, champion, vice) {
  return ROUNDS.reduce((s,r)=>s+pointsByRound(guesses,results,r),0)+calcBonus(guesses,champion,vice);
}
function roundWinner(participants, allGuesses, results, round) {
  const s=participants.map(n=>({name:n,pts:pointsByRound(allGuesses[n],results,round)})).sort((a,b)=>b.pts-a.pts);
  if (!s.length||s[0].pts===0) return null;
  return s.filter(x=>x.pts===s[0].pts);
}
function isRoundComplete(results, round) {
  const ms=ALL_MATCHES.filter(m=>m.round===round);
  return ms.length>0&&ms.every(m=>{const r=results[m.id];return r&&r.home!==""&&r.away!==""&&r.home!==undefined;});
}
function calcPool(n) {
  const total=n*ENTRY_FEE, rp=total*ROUND_POOL_PCT, fp=total*FINAL_POOL_PCT;
  return {total,roundPool:rp,finalPool:fp,perRound:rp/ROUNDS.length};
}

// ─── Converte array do Sheets → objeto {jogoId: {home, away}} ────────────────
function resultadosParaObj(arr) {
  const obj = {};
  if (!Array.isArray(arr)) return obj;
  arr.forEach(r => {
    if (r.jogoId !== undefined && r.jogoId !== "") {
      obj[r.jogoId] = { home: String(r.golsA ?? ""), away: String(r.golsB ?? "") };
    }
  });
  return obj;
}

// ─── Converte array de palpites do Sheets → objeto {jogoId: {home, away}} ───
function palpitesParaObj(arr) {
  const obj = {};
  if (!Array.isArray(arr)) return obj;
  arr.forEach(p => {
    if (p.jogoId !== undefined && p.jogoId !== "") {
      obj[p.jogoId] = { home: String(p.golsA ?? ""), away: String(p.golsB ?? "") };
    }
    if (p.campeao) obj.champion = p.campeao;
    if (p.vice)    obj.vice     = p.vice;
  });
  return obj;
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function BolaoApp() {
  const [screen, setScreen] = useState("loading");
  const [participants, setParticipants] = useState([]); // [{id, nome}]
  const [results, setResults] = useState({});
  const [allGuesses, setAllGuesses] = useState({});     // {participanteId: {jogoId:{home,away}, champion, vice}}
  const [currentUser, setCurrentUser] = useState(null); // {id, nome}
  const [myGuesses, setMyGuesses] = useState({});
  const [officialChampion, setOfficialChampion] = useState("");
  const [officialVice, setOfficialVice] = useState("");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [activeRound, setActiveRound] = useState("Fase de Grupos");
  const [toast, setToast] = useState(null);
  const [saveTimer, setSaveTimer] = useState(null);
  const [roundSummary, setRoundSummary] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast=(msg,type="ok")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),2800); };

  // ── Carrega dados iniciais ──────────────────────────────────────────────────
  useEffect(()=>{
    async function load(){
      try {
        const [partsArr, resArr, finalRes] = await Promise.all([
          api.listarParticipantes(),
          api.getResultados(),
          api.getResultadoFinal(),
        ]);

        const parts = Array.isArray(partsArr) ? partsArr : [];
        setParticipants(parts);
        setResults(resultadosParaObj(resArr));
        setOfficialChampion(finalRes?.campeao || "");
        setOfficialVice(finalRes?.vice || "");

        // Carrega palpites de todos
        const gMap = {};
        await Promise.all(parts.map(async p => {
          try {
            const pArr = await api.getPalpites(p.id);
            const pfArr = await api.getPalpitesFinal();
            const meuFinal = Array.isArray(pfArr) ? pfArr.find(x => x.participanteId === p.id) : null;
            const obj = palpitesParaObj(pArr);
            if (meuFinal) { obj.champion = meuFinal.campeao; obj.vice = meuFinal.vice; }
            gMap[p.id] = obj;
          } catch {}
        }));
        setAllGuesses(gMap);

        // Sessão salva no localStorage
        try {
          const saved = localStorage.getItem("bolao-session");
          if (saved) {
            const s = JSON.parse(saved);
            const found = parts.find(p => p.id === s.id);
            if (found) {
              setCurrentUser(found);
              setMyGuesses(gMap[found.id] || {});
              setScreen("home");
              return;
            }
          }
        } catch {}
      } catch (e) {
        console.error("Erro ao carregar:", e);
      }
      setScreen("splash");
    }
    load();
  },[]);

  // ── Salvar palpite com debounce ────────────────────────────────────────────
  const saveGuessDebounced = useCallback((participanteId, matchId, golsA, golsB) => {
    if (saveTimer) clearTimeout(saveTimer);
    setSaveTimer(setTimeout(async () => {
      try {
        await api.salvarPalpite(participanteId, matchId, golsA, golsB);
      } catch(e) { console.error("Erro ao salvar palpite:", e); }
    }, 800));
  }, [saveTimer]);

  const handleGuessChange=(matchId,side,val)=>{
    const updated={...myGuesses,[matchId]:{...(myGuesses[matchId]||{}),[side]:val}};
    setMyGuesses(updated);
    setAllGuesses(prev=>({...prev,[currentUser.id]:updated}));
    const g = updated[matchId] || {};
    const golsA = side === "home" ? val : (g.home ?? "");
    const golsB = side === "away" ? val : (g.away ?? "");
    saveGuessDebounced(currentUser.id, matchId, golsA, golsB);
  };

  // ── Login / Cadastro ───────────────────────────────────────────────────────
  const handleJoin=async()=>{
    const name=newName.trim();
    const pin=newPin.trim();
    if(!name) return showToast("Digite seu nome","err");
    if(!pin||pin.length<4) return showToast("PIN deve ter pelo menos 4 dígitos","err");
    setLoading(true);
    try {
      const existing = participants.find(p => p.nome.toLowerCase() === name.toLowerCase());
      let user;
      if (existing) {
        user = await api.autenticar(name, pin);
      } else {
        user = await api.criarParticipante(name, pin);
        const newParts = await api.listarParticipantes();
        setParticipants(Array.isArray(newParts) ? newParts : []);
      }
      setCurrentUser(user);
      const pArr = await api.getPalpites(user.id);
      const pfArr = await api.getPalpitesFinal();
      const meuFinal = Array.isArray(pfArr) ? pfArr.find(x => x.participanteId === user.id) : null;
      const obj = palpitesParaObj(pArr);
      if (meuFinal) { obj.champion = meuFinal.campeao; obj.vice = meuFinal.vice; }
      setMyGuesses(obj);
      setAllGuesses(prev => ({...prev, [user.id]: obj}));
      localStorage.setItem("bolao-session", JSON.stringify(user));
      setScreen("home");
      showToast(existing ? `Bem-vindo de volta, ${user.nome}!` : `Bem-vindo ao bolão, ${user.nome}! 🎉`);
    } catch(e) {
      showToast(e.message || "Erro ao entrar","err");
    }
    setLoading(false);
  };

  const handleLogout=()=>{
    localStorage.removeItem("bolao-session");
    setCurrentUser(null); setMyGuesses({}); setScreen("splash");
  };

  // ── Admin: salvar resultado ────────────────────────────────────────────────
  const handleResultChange=async(matchId,side,val)=>{
    const updated={...results,[matchId]:{...(results[matchId]||{}),[side]:val}};
    setResults(updated);
    const r = updated[matchId] || {};
    try {
      await api.salvarResultado(adminPass, matchId, r.home ?? "", r.away ?? "");
    } catch(e) { console.error(e); }
  };

  const handleChampionChange=async(field,val)=>{
    const champ = field==="champion" ? val : officialChampion;
    const vic   = field==="vice"     ? val : officialVice;
    if(field==="champion") setOfficialChampion(val); else setOfficialVice(val);
    try {
      await api.salvarResultadoFinal(adminPass, champ, vic);
    } catch(e) { console.error(e); }
  };

  const openRoundSummary=(round)=>{
    const data=participants.map(p=>{
      const pts=pointsByRound(allGuesses[p.id],results,round);
      const exactCount=ALL_MATCHES.filter(m=>m.round===round&&calcPoints(allGuesses[p.id]?.[m.id],results[m.id])===POINTS.exact).length;
      return {name:p.nome,pts,exactCount};
    }).sort((a,b)=>b.pts-a.pts||b.exactCount-a.exactCount);
    setRoundSummary({round,data});
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const pool=calcPool(participants.length||10);
  const ranking=participants.map(p=>({
    id: p.id,
    name: p.nome,
    pts:totalPoints(allGuesses[p.id],results,officialChampion,officialVice),
    exact:Object.entries(allGuesses[p.id]||{}).filter(([id,g])=>calcPoints(g,results[id])===POINTS.exact).length,
    bonus:calcBonus(allGuesses[p.id],officialChampion,officialVice),
  })).sort((a,b)=>b.pts-a.pts||b.exact-a.exact);

  // ── SCREENS ────────────────────────────────────────────────────────────────
  if(screen==="loading") return(
    <div style={S.page}><div style={S.splashBg}/>
      <div style={S.center}><div style={S.bigBall}>⚽</div><p style={{color:"#889",marginTop:"1rem"}}>Carregando...</p></div>
    </div>
  );

  if(screen==="splash") return(
    <div style={S.page}><div style={S.splashBg}/>
      <div style={S.splashContent}>
        <div style={S.bigBall}>⚽</div>
        <h1 style={S.splashTitle}>BOLÃO<br/>DA COPA</h1>
        <p style={S.splashYear}>2026</p>
        <button style={S.btnGreen} onClick={()=>setScreen("login")}>Entrar no Bolão</button>
        <button style={S.btnGhost} onClick={()=>setScreen("ranking")}>Ver Ranking</button>
        <button style={S.btnGhost} onClick={()=>setScreen("premios")}>Ver Premiação</button>
        <button style={S.btnMuted} onClick={()=>setScreen("admin_login")}>🔐 Admin</button>
      </div>
    </div>
  );

  if(screen==="login") return(
    <div style={S.page}><div style={S.splashBg}/>
      <div style={S.card}>
        <h2 style={S.cardTitle}>⚽ Entrar no Bolão</h2>
        <p style={S.cardSub}>Digite seu nome e crie um PIN de 4+ dígitos</p>
        <p style={{...S.cardSub,fontSize:"0.78rem",color:"#667",marginTop:"-0.5rem"}}>Novo? Seu PIN será criado. Já tem conta? Use seu PIN cadastrado.</p>
        <input style={S.input} placeholder="Seu nome..." value={newName} onChange={e=>setNewName(e.target.value)}/>
        <input style={S.input} type="number" placeholder="PIN (mín. 4 dígitos)..." value={newPin}
          onChange={e=>setNewPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleJoin()}/>
        <button style={S.btnGreen} onClick={handleJoin} disabled={loading}>{loading?"Entrando...":"Entrar"}</button>
        <button style={S.btnGhost} onClick={()=>setScreen("splash")}>Voltar</button>
        {participants.length>0&&<p style={S.hint}>Já no bolão: {participants.map(p=>p.nome).join(", ")}</p>}
      </div>
      {toast&&<Toast t={toast}/>}
    </div>
  );

  if(screen==="admin_login") return(
    <div style={S.page}><div style={S.splashBg}/>
      <div style={S.card}>
        <h2 style={S.cardTitle}>🔐 Admin</h2>
        <input style={S.input} type="password" placeholder="Senha..." value={adminPass}
          onChange={e=>setAdminPass(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"){ if(adminPass===ADMIN_PASSWORD){setScreen("admin");showToast("Modo admin ativado ⚙️")}else showToast("Senha incorreta","err")}}}/>
        <button style={S.btnGreen} onClick={()=>{ if(adminPass===ADMIN_PASSWORD){setScreen("admin");showToast("Modo admin ativado")}else showToast("Senha incorreta","err")}}>Entrar</button>
        <button style={S.btnGhost} onClick={()=>setScreen("splash")}>Voltar</button>
      </div>
      {toast&&<Toast t={toast}/>}
    </div>
  );

  if(screen==="home"){
    const myPts=totalPoints(myGuesses,results,officialChampion,officialVice);
    const myRank=ranking.findIndex(r=>r.id===currentUser?.id)+1;
    const pending=ALL_MATCHES.filter(m=>!isMatchLocked(m)&&(!myGuesses[m.id]?.home&&myGuesses[m.id]?.home!==0)).length;
    const actualPool=calcPool(participants.length);
    return(
      <div style={S.page}>
        <Header title="⚽ Bolão da Copa" right={<button style={S.logoutBtn} onClick={handleLogout}>Sair</button>}/>
        <div style={S.scroll}>
          <div style={S.heroCard}>
            <div style={S.heroEmoji}>⚽</div>
            <div style={S.heroName}>{currentUser?.nome}</div>
            <div style={S.heroStats}>
              <StatBox num={myPts} label="pontos"/>
              <StatBox num={`${myRank}º`} label="lugar"/>
              <StatBox num={ALL_MATCHES.length-pending} label="palpites"/>
            </div>
          </div>
          <div style={S.poolBanner}>
            <div style={S.poolTitle}>💰 Vaquinha atual</div>
            <div style={S.poolTotal}>{fmt(actualPool.total)}</div>
            <div style={S.poolSplit}>
              <span>🏅 Rodadas: <b>{fmt(actualPool.roundPool)}</b></span>
              <span>🏆 Final: <b>{fmt(actualPool.finalPool)}</b></span>
            </div>
            <div style={S.poolNote}>{participants.length} participante{participants.length!==1?"s":""} × R$ {ENTRY_FEE}</div>
          </div>
          <div style={S.menuGrid}>
            <MenuCard icon="🎯" label="Meus Palpites" sub={`${pending} abertos`} onClick={()=>setScreen("palpites")}/>
            <MenuCard icon="🏆" label="Ranking" sub={`${participants.length} jogadores`} onClick={()=>setScreen("ranking")}/>
            <MenuCard icon="💰" label="Premiação" sub="por rodada e final" onClick={()=>setScreen("premios")}/>
            <MenuCard icon="👥" label="Palpites do Grupo" sub="ver o que cada um apostou" onClick={()=>setScreen("grupo")}/>
            <MenuCard icon="📊" label="Rodadas" sub="pontos por fase" onClick={()=>setScreen("rodadas")}/>
            <MenuCard icon="📋" label="Regras" sub="pontuação e desempate" onClick={()=>setScreen("regras")}/>
          </div>
        </div>
        {toast&&<Toast t={toast}/>}
      </div>
    );
  }

  if(screen==="palpites"){
    const filtered=ALL_MATCHES.filter(m=>m.round===activeRound);
    const copaStarted=isCopaStarted();
    return(
      <div style={S.page}>
        <Header title="Meus Palpites" left={<BtnBack onClick={()=>setScreen("home")}/>}/>
        <RoundTabs active={activeRound} onChange={setActiveRound}/>
        <div style={S.scroll}>
          {filtered.map(match=>{
            const g=myGuesses[match.id]||{};
            const res=results[match.id]||{};
            const pts=calcPoints(g,res);
            const hasRes=res.home!==undefined&&res.home!==""&&res.away!==undefined&&res.away!=="";
            const locked=isMatchLocked(match);
            return(
              <div key={match.id} style={{...S.matchCard,...(pts===POINTS.exact?S.mExact:pts>0&&hasRes?S.mResult:pts===0&&hasRes?S.mWrong:locked&&!hasRes?S.mLocked:{})}}>
                {match.group&&<div style={S.matchGroup}>Grupo {match.group}{match.date?` · ${match.date} ${match.time}`:""}</div>}
                {locked&&!hasRes&&<div style={S.lockBadge}>🔒 Encerrado</div>}
                {hasRes&&<div style={S.badge}>{pts===POINTS.exact?"🎯 +5":pts===POINTS.winner?"✅ +2":pts===POINTS.draw?"🤝 +1":"❌ 0"}</div>}
                <div style={S.matchRow}>
                  <div style={S.teamLbl}>{FLAG(match.home)} {match.home}</div>
                  <div style={S.scoreRow}>
                    <input style={{...S.scoreIn,...(locked?S.scoreDisabled:{})}} type="number" min="0" max="20"
                      value={g.home??""} disabled={locked}
                      onChange={e=>!locked&&handleGuessChange(match.id,"home",e.target.value)}/>
                    <span style={S.vsX}>×</span>
                    <input style={{...S.scoreIn,...(locked?S.scoreDisabled:{})}} type="number" min="0" max="20"
                      value={g.away??""} disabled={locked}
                      onChange={e=>!locked&&handleGuessChange(match.id,"away",e.target.value)}/>
                  </div>
                  <div style={S.teamLbl}>{FLAG(match.away)} {match.away}</div>
                </div>
                {hasRes&&<div style={S.official}>Resultado oficial: {res.home} × {res.away}</div>}
              </div>
            );
          })}
          <div style={{...S.bonusCard,...(copaStarted?S.bonusLocked:{})}}>
            <div style={S.bonusTitle}>🏆 Bônus — Campeão & Vice</div>
            {copaStarted&&<div style={S.lockBadge}>🔒 Copa já começou — palpites encerrados</div>}
            <div style={S.bonusRow}>
              <div style={S.bonusLabel}>🥇 Campeão <span style={S.bonusPts}>+5 pts</span></div>
              <select style={{...S.bonusSel,...(copaStarted?{opacity:0.5,pointerEvents:"none"}:{})}}
                value={myGuesses.champion||""} disabled={copaStarted}
                onChange={async e=>{
                  if(copaStarted) return;
                  const upd={...myGuesses,champion:e.target.value};
                  setMyGuesses(upd);
                  setAllGuesses(prev=>({...prev,[currentUser.id]:upd}));
                  try { await api.salvarPalpiteFinal(currentUser.id, e.target.value, myGuesses.vice||""); } catch {}
                }}>
                <option value="">-- Escolha --</option>
                {ALL_TEAMS.map(t=><option key={t} value={t}>{FLAG(t)} {t}</option>)}
              </select>
            </div>
            <div style={S.bonusRow}>
              <div style={S.bonusLabel}>🥈 Vice <span style={S.bonusPts}>+3 pts</span></div>
              <select style={{...S.bonusSel,...(copaStarted?{opacity:0.5,pointerEvents:"none"}:{})}}
                value={myGuesses.vice||""} disabled={copaStarted}
                onChange={async e=>{
                  if(copaStarted) return;
                  const upd={...myGuesses,vice:e.target.value};
                  setMyGuesses(upd);
                  setAllGuesses(prev=>({...prev,[currentUser.id]:upd}));
                  try { await api.salvarPalpiteFinal(currentUser.id, myGuesses.champion||"", e.target.value); } catch {}
                }}>
                <option value="">-- Escolha --</option>
                {ALL_TEAMS.map(t=><option key={t} value={t}>{FLAG(t)} {t}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={S.autoSave}>💾 Salvamento automático · Palpites bloqueiam no início de cada jogo</div>
        {toast&&<Toast t={toast}/>}
      </div>
    );
  }

  if(screen==="ranking"){
    const medals=["🥇","🥈","🥉"];
    return(
      <div style={S.page}>
        <Header title="🏆 Ranking Geral" left={<BtnBack onClick={()=>setScreen(currentUser?"home":"splash")}/>}/>
        <div style={S.scroll}>
          {ranking.length===0&&<div style={S.empty}>Nenhum participante ainda</div>}
          {ranking.map((p,i)=>(
            <div key={p.id} style={{...S.rankCard,...(p.id===currentUser?.id?S.rankMe:{})}}>
              <div style={S.rankPos}>{medals[i]||`${i+1}º`}</div>
              <div style={S.rankName}>{p.name}{p.id===currentUser?.id?" (você)":""}</div>
              <div style={S.rankRight}>
                <div style={S.rankPts}>{p.pts}<span style={S.rankPtsLbl}> pts</span></div>
                <div style={S.rankSub}>{p.exact} exatos{p.bonus>0?` · +${p.bonus} bônus`:""}</div>
              </div>
            </div>
          ))}
          {!currentUser&&<div style={{padding:"1rem"}}><button style={S.btnGreen} onClick={()=>setScreen("login")}>Participar do Bolão</button></div>}
        </div>
      </div>
    );
  }

  if(screen==="premios"){
    const actualPool=calcPool(participants.length||10);
    return(
      <div style={S.page}>
        <Header title="💰 Premiação" left={<BtnBack onClick={()=>setScreen(currentUser?"home":"splash")}/>}/>
        <div style={S.scroll}>
          <div style={S.poolBig}>
            <div style={S.poolBigLabel}>Prêmio total estimado</div>
            <div style={S.poolBigNum}>{fmt(actualPool.total)}</div>
            <div style={S.poolBigSub}>{participants.length||10} pessoas × R$ {ENTRY_FEE}</div>
          </div>
          <div style={S.premioSection}>
            <div style={S.premioSectionTitle}>🏅 Prêmio por Rodada <span style={S.premioSectionSub}>(30% da vaquinha)</span></div>
            <div style={S.premioSectionDesc}>Quem fizer mais pontos na rodada leva {fmt(actualPool.perRound)}</div>
            {ROUNDS.map(round=>{
              const complete=isRoundComplete(results,round);
              const winners=complete?roundWinner(participants.map(p=>p.id),allGuesses,results,round):null;
              const winnerNames = winners ? winners.map(w=>participants.find(p=>p.id===w.name)?.nome||w.name).join(", ") : null;
              return(
                <div key={round} style={S.premioRound}>
                  <div style={S.premioRoundLeft}>
                    <div style={S.premioRoundName}>{round}</div>
                    {complete&&winners&&<div style={S.premioWinner}>🏅 {winnerNames} ({winners[0].pts} pts)</div>}
                    {complete&&!winners&&<div style={S.premioNoWinner}>Sem pontos</div>}
                    {!complete&&<div style={S.premioStatus}>Em andamento</div>}
                  </div>
                  <div style={S.premioRoundPrize}>{fmt(actualPool.perRound)}</div>
                </div>
              );
            })}
          </div>
          <div style={S.premioSection}>
            <div style={S.premioSectionTitle}>🏆 Prêmio Final <span style={S.premioSectionSub}>(70% da vaquinha)</span></div>
            <div style={S.premioSectionDesc}>Quem tiver mais pontos no total ao fim do torneio</div>
            <div style={S.premioFinal}>
              <div style={S.premioFinalNum}>{fmt(actualPool.finalPool)}</div>
              {ranking.length>0&&<div style={S.premioFinalLider}>Líder atual: 🥇 {ranking[0].name} ({ranking[0].pts} pts)</div>}
            </div>
          </div>
          <div style={S.premioNote}>ℹ️ Em empate na rodada, o prêmio é dividido igualmente.</div>
        </div>
      </div>
    );
  }

  if(screen==="grupo"){
    return(
      <div style={S.page}>
        <Header title="👥 Palpites do Grupo" left={<BtnBack onClick={()=>setScreen("home")}/>}/>
        <div style={S.scroll}>
          <p style={{color:"#889",fontSize:"0.82rem",textAlign:"center",marginBottom:"0.5rem"}}>Palpites visíveis apenas para jogos já iniciados</p>
          {participants.map(p=>(
            <button key={p.id} style={{...S.rankCard,cursor:"pointer",width:"100%",textAlign:"left"}}
              onClick={()=>{setViewingUser(p);setScreen("ver_palpites");}}>
              <div style={S.rankPos}>⚽</div>
              <div style={S.rankName}>{p.nome}{p.id===currentUser?.id?" (você)":""}</div>
              <div style={S.rankRight}>
                <div style={S.rankPts}>{totalPoints(allGuesses[p.id],results,officialChampion,officialVice)}<span style={S.rankPtsLbl}> pts</span></div>
                <div style={S.rankSub}>ver palpites →</div>
              </div>
            </button>
          ))}
          {participants.length===0&&<div style={S.empty}>Nenhum participante ainda</div>}
        </div>
      </div>
    );
  }

  if(screen==="ver_palpites"&&viewingUser){
    const theirGuesses=allGuesses[viewingUser.id]||{};
    const filtered=ALL_MATCHES.filter(m=>m.round===activeRound&&isMatchLocked(m));
    return(
      <div style={S.page}>
        <Header title={`Palpites de ${viewingUser.nome}`} left={<BtnBack onClick={()=>setScreen("grupo")}/>}/>
        <RoundTabs active={activeRound} onChange={setActiveRound}/>
        <div style={S.scroll}>
          {filtered.length===0&&<div style={S.empty}>Nenhum jogo encerrado nesta fase ainda</div>}
          {filtered.map(match=>{
            const g=theirGuesses[match.id]||{};
            const res=results[match.id]||{};
            const pts=calcPoints(g,res);
            const hasRes=res.home!==undefined&&res.home!==""&&res.away!==undefined&&res.away!=="";
            return(
              <div key={match.id} style={{...S.matchCard,...(pts===POINTS.exact?S.mExact:pts>0&&hasRes?S.mResult:pts===0&&hasRes?S.mWrong:{})}}>
                {match.group&&<div style={S.matchGroup}>Grupo {match.group} · {match.date} {match.time}</div>}
                {hasRes&&<div style={S.badge}>{pts===POINTS.exact?"🎯 +5":pts===POINTS.winner?"✅ +2":pts===POINTS.draw?"🤝 +1":"❌ 0"}</div>}
                <div style={S.matchRow}>
                  <div style={S.teamLbl}>{FLAG(match.home)} {match.home}</div>
                  <div style={S.scoreRow}>
                    <div style={S.scoreShow}>{g.home??"-"}</div>
                    <span style={S.vsX}>×</span>
                    <div style={S.scoreShow}>{g.away??"-"}</div>
                  </div>
                  <div style={S.teamLbl}>{FLAG(match.away)} {match.away}</div>
                </div>
                {hasRes&&<div style={S.official}>Resultado oficial: {res.home} × {res.away}</div>}
              </div>
            );
          })}
          {isCopaStarted()&&(
            <div style={S.bonusCard}>
              <div style={S.bonusTitle}>🏆 Bônus apostados</div>
              <div style={S.bonusRow}>
                <div style={S.bonusLabel}>🥇 Campeão</div>
                <div style={{...S.bonusSel,padding:"0.5rem",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"0.5rem",color:"#fff",flex:1.5}}>
                  {theirGuesses.champion?`${FLAG(theirGuesses.champion)} ${theirGuesses.champion}`:"Não apostou"}
                  {officialChampion&&theirGuesses.champion===officialChampion&&" 🎯 +5"}
                </div>
              </div>
              <div style={S.bonusRow}>
                <div style={S.bonusLabel}>🥈 Vice</div>
                <div style={{...S.bonusSel,padding:"0.5rem",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"0.5rem",color:"#fff",flex:1.5}}>
                  {theirGuesses.vice?`${FLAG(theirGuesses.vice)} ${theirGuesses.vice}`:"Não apostou"}
                  {officialVice&&theirGuesses.vice===officialVice&&" 🎯 +3"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if(screen==="rodadas"){
    return(
      <div style={S.page}>
        <Header title="📊 Pontos por Rodada" left={<BtnBack onClick={()=>setScreen("home")}/>}/>
        <div style={S.scroll}>
          {ROUNDS.map(round=>{
            const complete=isRoundComplete(results,round);
            const scores=participants.map(p=>({id:p.id,name:p.nome,pts:pointsByRound(allGuesses[p.id],results,round)})).sort((a,b)=>b.pts-a.pts);
            return(
              <div key={round} style={S.rodadaCard}>
                <div style={S.rodadaHeader}>
                  <span style={S.rodadaName}>{round}</span>
                  <div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
                    <span style={complete?S.rodadaDone:S.rodadaPending}>{complete?"✅ Encerrada":"⏳ Em andamento"}</span>
                    {complete&&<button style={S.resumoBtn} onClick={()=>openRoundSummary(round)}>Ver resumo</button>}
                  </div>
                </div>
                {scores.map((s,i)=>(
                  <div key={s.id} style={S.rodadaRow}>
                    <span style={S.rodadaRank}>{i+1}º</span>
                    <span style={{...S.rodadaName2,...(s.id===currentUser?.id?{color:"#f0c040"}:{})}}>{s.name}{s.id===currentUser?.id?" ★":""}</span>
                    <span style={S.rodadaPts}>{s.pts} pts</span>
                  </div>
                ))}
                {scores.length===0&&<div style={S.empty}>Sem participantes</div>}
              </div>
            );
          })}
        </div>
        {roundSummary&&(
          <div style={S.modalOverlay} onClick={()=>setRoundSummary(null)}>
            <div style={S.modal} onClick={e=>e.stopPropagation()}>
              <div style={S.modalTitle}>📊 Resumo — {roundSummary.round}</div>
              {roundSummary.data.map((d,i)=>(
                <div key={d.name} style={S.modalRow}>
                  <span style={S.rodadaRank}>{i+1}º</span>
                  <span style={S.rankName}>{d.name}</span>
                  <span style={S.rankPts}>{d.pts} pts</span>
                  <span style={{fontSize:"0.75rem",color:"#889",marginLeft:"0.5rem"}}>{d.exactCount} exatos</span>
                </div>
              ))}
              <button style={{...S.btnGhost,marginTop:"1rem"}} onClick={()=>setRoundSummary(null)}>Fechar</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if(screen==="regras") return(
    <div style={S.page}>
      <Header title="📋 Regras" left={<BtnBack onClick={()=>setScreen("home")}/>}/>
      <div style={S.scroll}>
        <div style={S.ruleCard}>
          <div style={S.ruleTitle}>⚽ Pontuação por jogo</div>
          <div style={S.ruleRow}><span>🎯 Placar exato</span><span style={S.pts5}>5 pts</span></div>
          <div style={S.ruleRow}><span>✅ Vencedor correto</span><span style={S.pts2}>2 pts</span></div>
          <div style={S.ruleRow}><span>🤝 Empate correto</span><span style={S.pts1}>1 pt</span></div>
          <div style={S.ruleRow}><span>❌ Erro total</span><span style={{color:"#888"}}>0 pts</span></div>
        </div>
        <div style={S.ruleCard}>
          <div style={S.ruleTitle}>🏆 Bônus campeão & vice</div>
          <div style={S.ruleRow}><span>🥇 Acertou o campeão</span><span style={S.pts5}>5 pts</span></div>
          <div style={S.ruleRow}><span>🥈 Acertou o vice</span><span style={S.pts2}>3 pts</span></div>
          <div style={S.ruleRow}><span style={{fontSize:"0.8rem",color:"#889"}}>Palpite bloqueado no início da Copa (11/06/2026)</span></div>
        </div>
        <div style={S.ruleCard}>
          <div style={S.ruleTitle}>🔒 Bloqueio de palpites</div>
          <div style={{fontSize:"0.88rem",color:"#bbc",lineHeight:1.6}}>Cada jogo trava automaticamente no horário do seu início (horário de Brasília).</div>
        </div>
        <div style={S.ruleCard}>
          <div style={S.ruleTitle}>💰 Premiação</div>
          <div style={S.ruleRow}><span>🏅 Prêmio por rodada (30%)</span></div>
          <div style={{fontSize:"0.82rem",color:"#889",marginBottom:"0.5rem"}}>Maior pontuação na rodada. Em empate, divide igualmente.</div>
          <div style={S.ruleRow}><span>🏆 Prêmio final (70%)</span></div>
          <div style={{fontSize:"0.82rem",color:"#889"}}>Maior pontuação total ao fim do torneio.</div>
        </div>
        <div style={S.ruleCard}>
          <div style={S.ruleTitle}>⚖️ Critério de desempate</div>
          <div style={{fontSize:"0.88rem",color:"#bbc",lineHeight:1.8}}>
            1º Maior pontuação total<br/>
            2º Maior nº de placares exatos<br/>
            3º Maior bônus (campeão/vice)<br/>
            4º Sorteio entre empatados
          </div>
        </div>
      </div>
    </div>
  );

  if(screen==="admin"){
    const filtered=ALL_MATCHES.filter(m=>m.round===activeRound);
    return(
      <div style={S.page}>
        <Header title="⚙️ Admin — Resultados" left={<BtnBack onClick={()=>setScreen("splash")}/>}/>
        <RoundTabs active={activeRound} onChange={setActiveRound}/>
        <div style={S.scroll}>
          {filtered.map(match=>{
            const res=results[match.id]||{};
            return(
              <div key={match.id} style={S.matchCard}>
                {match.group&&<div style={S.matchGroup}>Grupo {match.group}{match.date?` · ${match.date} ${match.time}`:""}</div>}
                <div style={S.matchRow}>
                  <div style={S.teamLbl}>{FLAG(match.home)} {match.home}</div>
                  <div style={S.scoreRow}>
                    <input style={{...S.scoreIn,...S.scoreAdmin}} type="number" min="0" max="20" value={res.home??""} onChange={e=>handleResultChange(match.id,"home",e.target.value)}/>
                    <span style={S.vsX}>×</span>
                    <input style={{...S.scoreIn,...S.scoreAdmin}} type="number" min="0" max="20" value={res.away??""} onChange={e=>handleResultChange(match.id,"away",e.target.value)}/>
                  </div>
                  <div style={S.teamLbl}>{FLAG(match.away)} {match.away}</div>
                </div>
              </div>
            );
          })}
          <div style={S.bonusCard}>
            <div style={S.bonusTitle}>🏆 Definir Campeão & Vice (oficial)</div>
            <div style={S.bonusRow}>
              <div style={S.bonusLabel}>🥇 Campeão</div>
              <select style={{...S.bonusSel,...S.scoreAdmin}} value={officialChampion} onChange={e=>handleChampionChange("champion",e.target.value)}>
                <option value="">-- Selecione --</option>
                {ALL_TEAMS.map(t=><option key={t} value={t}>{FLAG(t)} {t}</option>)}
              </select>
            </div>
            <div style={S.bonusRow}>
              <div style={S.bonusLabel}>🥈 Vice</div>
              <select style={{...S.bonusSel,...S.scoreAdmin}} value={officialVice} onChange={e=>handleChampionChange("vice",e.target.value)}>
                <option value="">-- Selecione --</option>
                {ALL_TEAMS.map(t=><option key={t} value={t}>{FLAG(t)} {t}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={S.autoSave}>💾 Resultados salvos automaticamente</div>
        {toast&&<Toast t={toast}/>}
      </div>
    );
  }

  return null;
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
function Header({title,left,right}){
  return(
    <div style={S.header}>
      <div style={{width:48}}>{left}</div>
      <div style={S.headerTitle}>{title}</div>
      <div style={{width:48,textAlign:"right"}}>{right}</div>
    </div>
  );
}
function BtnBack({onClick}){ return <button style={S.backBtn} onClick={onClick}>←</button>; }
function RoundTabs({active,onChange}){
  return(
    <div style={S.tabs}>
      {ROUNDS.map(r=>(
        <button key={r} style={{...S.tab,...(active===r?S.tabActive:{})}} onClick={()=>onChange(r)}>
          {ROUND_LABELS[r]||r}
        </button>
      ))}
    </div>
  );
}
function StatBox({num,label}){
  return <div style={S.statBox}><div style={S.statNum}>{num}</div><div style={S.statLbl}>{label}</div></div>;
}
function MenuCard({icon,label,sub,onClick}){
  return(
    <button style={S.menuCard} onClick={onClick}>
      <div style={S.menuIcon}>{icon}</div>
      <div style={S.menuLbl}>{label}</div>
      <div style={S.menuSub}>{sub}</div>
    </button>
  );
}
function Toast({t}){
  return <div style={{...S.toast,...(t.type==="err"?S.toastErr:S.toastOk)}}>{t.msg}</div>;
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S={
  page:{minHeight:"100vh",background:"#0a1628",color:"#fff",fontFamily:"'Trebuchet MS',sans-serif",position:"relative",overflowX:"hidden"},
  splashBg:{position:"fixed",inset:0,background:"radial-gradient(ellipse at 30% 20%,#1a3a6e 0%,#0a1628 60%),radial-gradient(ellipse at 80% 80%,#1e5c2e 0%,transparent 50%)",zIndex:0},
  center:{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh"},
  splashContent:{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"2rem",gap:"0.9rem"},
  bigBall:{fontSize:"5rem"},
  splashTitle:{fontSize:"3.5rem",fontWeight:900,letterSpacing:"0.1em",textAlign:"center",lineHeight:1,background:"linear-gradient(135deg,#f0c040,#fff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:0},
  splashYear:{fontSize:"1.4rem",color:"#f0c040",margin:"0 0 1rem",letterSpacing:"0.3em"},
  card:{position:"relative",zIndex:1,background:"rgba(255,255,255,0.07)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"1.5rem",padding:"2rem",margin:"2rem auto",maxWidth:"420px",display:"flex",flexDirection:"column",gap:"1rem"},
  cardTitle:{margin:0,fontSize:"1.6rem",fontWeight:800,textAlign:"center"},
  cardSub:{margin:0,color:"#aab",textAlign:"center",fontSize:"0.9rem"},
  input:{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"0.75rem",padding:"0.8rem 1rem",color:"#fff",fontSize:"1rem",outline:"none",width:"100%",boxSizing:"border-box"},
  hint:{color:"#888",fontSize:"0.8rem",textAlign:"center",margin:0},
  btnGreen:{background:"linear-gradient(135deg,#1e8a3e,#2db855)",border:"none",borderRadius:"0.75rem",padding:"0.9rem 1.5rem",color:"#fff",fontSize:"1rem",fontWeight:700,cursor:"pointer",width:"100%"},
  btnGhost:{background:"transparent",border:"1px solid rgba(255,255,255,0.25)",borderRadius:"0.75rem",padding:"0.75rem 1.5rem",color:"#ccc",fontSize:"0.95rem",cursor:"pointer",width:"100%"},
  btnMuted:{background:"transparent",border:"none",color:"#556",fontSize:"0.85rem",cursor:"pointer",padding:"0.5rem"},
  header:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.25rem",background:"rgba(255,255,255,0.05)",backdropFilter:"blur(10px)",borderBottom:"1px solid rgba(255,255,255,0.1)",position:"sticky",top:0,zIndex:10},
  headerTitle:{fontWeight:700,fontSize:"1.05rem",flex:1,textAlign:"center"},
  backBtn:{background:"none",border:"none",color:"#f0c040",fontSize:"1.4rem",cursor:"pointer",padding:"0.25rem 0.5rem"},
  logoutBtn:{background:"none",border:"none",color:"#888",fontSize:"0.85rem",cursor:"pointer"},
  scroll:{padding:"1rem",display:"flex",flexDirection:"column",gap:"0.85rem",paddingBottom:"5rem"},
  heroCard:{background:"linear-gradient(135deg,#1a3a6e,#0d2240)",border:"1px solid rgba(240,192,64,0.3)",borderRadius:"1.25rem",padding:"1.5rem",textAlign:"center"},
  heroEmoji:{fontSize:"2.5rem",marginBottom:"0.5rem"},
  heroName:{fontSize:"1.5rem",fontWeight:800,marginBottom:"1rem"},
  heroStats:{display:"flex",justifyContent:"space-around"},
  statBox:{textAlign:"center"},
  statNum:{fontSize:"2rem",fontWeight:900,color:"#f0c040"},
  statLbl:{fontSize:"0.75rem",color:"#889",textTransform:"uppercase",letterSpacing:"0.05em"},
  poolBanner:{background:"rgba(240,192,64,0.08)",border:"1px solid rgba(240,192,64,0.25)",borderRadius:"1rem",padding:"1rem 1.25rem",textAlign:"center"},
  poolTitle:{fontSize:"0.75rem",color:"#889",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"0.25rem"},
  poolTotal:{fontSize:"2.2rem",fontWeight:900,color:"#f0c040"},
  poolSplit:{display:"flex",justifyContent:"space-around",fontSize:"0.85rem",margin:"0.5rem 0",color:"#ccc"},
  poolNote:{fontSize:"0.75rem",color:"#667"},
  menuGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"},
  menuCard:{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"1rem",padding:"1.1rem 0.9rem",cursor:"pointer",textAlign:"center",color:"#fff",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.35rem"},
  menuIcon:{fontSize:"1.8rem"},
  menuLbl:{fontWeight:700,fontSize:"0.88rem"},
  menuSub:{fontSize:"0.7rem",color:"#889"},
  tabs:{display:"flex",gap:"0.5rem",padding:"0.75rem 1rem",overflowX:"auto",borderBottom:"1px solid rgba(255,255,255,0.08)"},
  tab:{background:"transparent",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"2rem",padding:"0.4rem 0.9rem",color:"#999",fontSize:"0.8rem",cursor:"pointer",whiteSpace:"nowrap"},
  tabActive:{background:"#f0c040",borderColor:"#f0c040",color:"#0a1628",fontWeight:700},
  matchCard:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"1rem",padding:"0.75rem 1rem",position:"relative"},
  mExact:{background:"rgba(240,192,64,0.1)",borderColor:"rgba(240,192,64,0.5)"},
  mResult:{background:"rgba(76,175,80,0.08)",borderColor:"rgba(76,175,80,0.4)"},
  mWrong:{background:"rgba(255,60,60,0.05)",borderColor:"rgba(255,60,60,0.2)"},
  mLocked:{opacity:0.6},
  matchGroup:{fontSize:"0.7rem",color:"#889",textTransform:"uppercase",marginBottom:"0.4rem"},
  lockBadge:{fontSize:"0.75rem",color:"#f0c040",marginBottom:"0.3rem",fontWeight:600},
  badge:{position:"absolute",top:"0.75rem",right:"0.75rem",fontSize:"0.8rem",fontWeight:700},
  matchRow:{display:"flex",alignItems:"center",gap:"0.5rem"},
  teamLbl:{flex:1,fontSize:"0.82rem",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  scoreRow:{display:"flex",alignItems:"center",gap:"0.35rem",flexShrink:0},
  scoreIn:{width:"2.5rem",height:"2.5rem",textAlign:"center",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"0.5rem",color:"#fff",fontSize:"1.1rem",fontWeight:700,outline:"none"},
  scoreDisabled:{opacity:0.4,cursor:"not-allowed",background:"rgba(255,255,255,0.04)"},
  scoreShow:{width:"2.5rem",height:"2.5rem",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"0.5rem",fontSize:"1.1rem",fontWeight:700,color:"#fff"},
  scoreAdmin:{borderColor:"#f0c040",background:"rgba(240,192,64,0.1)"},
  vsX:{color:"#666",fontSize:"0.9rem"},
  official:{marginTop:"0.4rem",fontSize:"0.75rem",color:"#889",textAlign:"center"},
  autoSave:{textAlign:"center",padding:"0.75rem",color:"#556",fontSize:"0.75rem"},
  rankCard:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"1rem",padding:"0.9rem 1.1rem",display:"flex",alignItems:"center",gap:"0.75rem"},
  rankMe:{background:"rgba(240,192,64,0.1)",borderColor:"rgba(240,192,64,0.4)"},
  rankPos:{fontSize:"1.5rem",width:"2rem",textAlign:"center"},
  rankName:{flex:1,fontWeight:600,fontSize:"0.95rem"},
  rankRight:{textAlign:"right"},
  rankPts:{fontSize:"1.3rem",fontWeight:900,color:"#f0c040"},
  rankPtsLbl:{fontSize:"0.7rem",color:"#889"},
  rankSub:{fontSize:"0.75rem",color:"#889"},
  empty:{textAlign:"center",color:"#556",padding:"2rem"},
  poolBig:{background:"linear-gradient(135deg,#1a3a6e,#0d2240)",border:"1px solid rgba(240,192,64,0.3)",borderRadius:"1.25rem",padding:"1.5rem",textAlign:"center"},
  poolBigLabel:{fontSize:"0.8rem",color:"#889",textTransform:"uppercase",letterSpacing:"0.05em"},
  poolBigNum:{fontSize:"3rem",fontWeight:900,color:"#f0c040",margin:"0.25rem 0"},
  poolBigSub:{fontSize:"0.85rem",color:"#889"},
  premioSection:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"1rem",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.6rem"},
  premioSectionTitle:{fontWeight:800,fontSize:"1rem"},
  premioSectionSub:{fontWeight:400,color:"#889",fontSize:"0.85rem"},
  premioSectionDesc:{fontSize:"0.82rem",color:"#aab",marginBottom:"0.25rem"},
  premioRound:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.6rem 0",borderTop:"1px solid rgba(255,255,255,0.06)"},
  premioRoundLeft:{flex:1},
  premioRoundName:{fontWeight:600,fontSize:"0.9rem"},
  premioWinner:{fontSize:"0.78rem",color:"#f0c040",marginTop:"0.2rem"},
  premioNoWinner:{fontSize:"0.78rem",color:"#889",marginTop:"0.2rem"},
  premioStatus:{fontSize:"0.78rem",color:"#556",marginTop:"0.2rem"},
  premioRoundPrize:{fontWeight:700,color:"#f0c040",fontSize:"0.95rem"},
  premioFinal:{background:"rgba(240,192,64,0.08)",border:"1px solid rgba(240,192,64,0.2)",borderRadius:"0.75rem",padding:"1rem",textAlign:"center",marginTop:"0.25rem"},
  premioFinalNum:{fontSize:"2.2rem",fontWeight:900,color:"#f0c040"},
  premioFinalLider:{fontSize:"0.85rem",color:"#ccc",marginTop:"0.4rem"},
  premioNote:{fontSize:"0.78rem",color:"#667",textAlign:"center",padding:"0.5rem 0"},
  bonusCard:{background:"rgba(240,192,64,0.07)",border:"1px solid rgba(240,192,64,0.25)",borderRadius:"1rem",padding:"1rem 1.25rem",display:"flex",flexDirection:"column",gap:"0.75rem"},
  bonusLocked:{opacity:0.7},
  bonusTitle:{fontWeight:800,fontSize:"0.95rem",color:"#f0c040"},
  bonusRow:{display:"flex",alignItems:"center",gap:"0.75rem"},
  bonusLabel:{flex:1,fontSize:"0.88rem",fontWeight:600},
  bonusPts:{color:"#f0c040",fontWeight:700,marginLeft:"0.4rem"},
  bonusSel:{flex:1.5,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"0.5rem",padding:"0.5rem",color:"#fff",fontSize:"0.85rem",outline:"none"},
  rodadaCard:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"1rem",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.4rem"},
  rodadaHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.4rem",flexWrap:"wrap",gap:"0.3rem"},
  rodadaName:{fontWeight:700,fontSize:"0.95rem"},
  rodadaDone:{fontSize:"0.75rem",color:"#4caf50"},
  rodadaPending:{fontSize:"0.75rem",color:"#889"},
  rodadaRow:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.3rem 0",borderTop:"1px solid rgba(255,255,255,0.05)"},
  rodadaRank:{fontSize:"0.8rem",color:"#889",width:"1.5rem"},
  rodadaName2:{flex:1,fontSize:"0.88rem",fontWeight:600},
  rodadaPts:{fontSize:"0.88rem",fontWeight:700,color:"#f0c040"},
  resumoBtn:{background:"rgba(240,192,64,0.15)",border:"1px solid rgba(240,192,64,0.3)",borderRadius:"1rem",padding:"0.2rem 0.6rem",color:"#f0c040",fontSize:"0.75rem",cursor:"pointer"},
  ruleCard:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"1rem",padding:"1rem 1.25rem",display:"flex",flexDirection:"column",gap:"0.5rem"},
  ruleTitle:{fontWeight:800,fontSize:"0.95rem",marginBottom:"0.25rem"},
  ruleRow:{display:"flex",justifyContent:"space-between",fontSize:"0.88rem",padding:"0.2rem 0"},
  pts5:{color:"#f0c040",fontWeight:700},
  pts2:{color:"#4caf50",fontWeight:700},
  pts1:{color:"#64b5f6",fontWeight:700},
  modalOverlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"},
  modal:{background:"#1a2a45",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"1.25rem",padding:"1.5rem",width:"100%",maxWidth:"400px",display:"flex",flexDirection:"column",gap:"0.5rem"},
  modalTitle:{fontWeight:800,fontSize:"1.1rem",marginBottom:"0.5rem",textAlign:"center"},
  modalRow:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.4rem 0",borderTop:"1px solid rgba(255,255,255,0.06)"},
  toast:{position:"fixed",bottom:"1.5rem",left:"50%",transform:"translateX(-50%)",padding:"0.75rem 1.5rem",borderRadius:"2rem",fontSize:"0.9rem",fontWeight:600,zIndex:100,whiteSpace:"nowrap"},
  toastOk:{background:"#1e8a3e",color:"#fff"},
  toastErr:{background:"#c0392b",color:"#fff"},
};