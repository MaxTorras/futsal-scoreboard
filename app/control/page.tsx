"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CSSProperties } from "react";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface TeamInfo {
  name: string;
  color: string;
  logo: string;
}

interface TimerState {
  duration: number;
  remaining: number;
  running: boolean;
  lastUpdate: number;
}

interface ScoreboardState {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  foulsA: number;
  foulsB: number;
  period: string;
  colorA: string;
  colorB: string;
  bgMain: string;
  bgBlocks: string;
  bgTimer: string;
  textColor: string;
  textMuted: string;
  textAccent: string;
  foulActive: string;
  foulInactive: string;
  teams: { a: TeamInfo; b: TeamInfo };
  timer: TimerState;
}

/* ─────────────────────────────────────────
   DEFAULT STATE
───────────────────────────────────────── */
const defaultState: ScoreboardState = {
  teamA: "Team A",
  teamB: "Team B",
  scoreA: 0,
  scoreB: 0,
  foulsA: 0,
  foulsB: 0,
  period: "1st HALF",
  colorA: "#7a1132",
  colorB: "#bdff34",
  bgMain: "#111111",
  bgBlocks: "#1a1a1a",
  bgTimer: "#1a1a1a",
  textColor: "#ffffff",
  textMuted: "#aaaaaa",
  textAccent: "#ffffff",
  foulActive: "#ffffff",
  foulInactive: "#333333",
  teams: {
    a: { name: "Team A", color: "#7a1132", logo: "" },
    b: { name: "Team B", color: "#bdff34", logo: "" },
  },
  timer: {
    duration: 1200,
    remaining: 1200,
    running: false,
    lastUpdate: 0,
  },
};

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const PERIODS = ["1st HALF", "2nd HALF", "HALF TIME", "FULL TIME"];

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export default function ControlPage() {
  const [state, setState] = useState<ScoreboardState>(defaultState);
  const [tab, setTab] = useState<"control" | "design">("control");
  const [halfMinutes, setHalfMinutes] = useState(20);

  /* ── Firestore sync ── */
  const send = (newState: ScoreboardState) => {
    const payload = {
      score: {
        a: newState.scoreA,
        b: newState.scoreB,
      },
      fouls: {
        a: newState.foulsA,
        b: newState.foulsB,
      },
      period: newState.period,

      teams: newState.teams,

      theme: {
        bgMain: newState.bgMain,
        bgBlocks: newState.bgBlocks,
        bgTimer: newState.bgTimer,
        textColor: newState.textColor,
        textMuted: newState.textMuted,
        textAccent: newState.textAccent,
        foulActive: newState.foulActive,
        foulInactive: newState.foulInactive,
      },

      timer: newState.timer,
    };

    setDoc(doc(db, "scoreboard", "main"), payload, { merge: true });
  };

  const update = (newState: ScoreboardState) => {
    setState(newState);
    send(newState);
  };

  /* ── Score ── */
  const changeScore = (team: "A" | "B", val: number) =>
    update({
      ...state,
      scoreA: team === "A" ? Math.max(0, state.scoreA + val) : state.scoreA,
      scoreB: team === "B" ? Math.max(0, state.scoreB + val) : state.scoreB,
    });

  const resetScore = () => update({ ...state, scoreA: 0, scoreB: 0 });

  /* ── Fouls ── */
  const changeFoul = (team: "A" | "B", val: number) =>
    update({
      ...state,
      foulsA: team === "A" ? Math.min(5, Math.max(0, state.foulsA + val)) : state.foulsA,
      foulsB: team === "B" ? Math.min(5, Math.max(0, state.foulsB + val)) : state.foulsB,
    });

  const resetFouls = () => update({ ...state, foulsA: 0, foulsB: 0 });

  /* ── Period ── */
  const shiftPeriod = (dir: 1 | -1) => {
    const i = PERIODS.indexOf(state.period);
    const next = PERIODS[(i + dir + PERIODS.length) % PERIODS.length];
    update({ ...state, period: next });
  };

  /* ── Timer ── */
  const setMatch = () => {
    const duration = halfMinutes * 60;
    update({
      ...state,
      timer: { duration, remaining: duration, running: false, lastUpdate: Date.now() },
    });
  };

  const timerAction = (action: "start" | "pause" | "reset") => {
    const now = Date.now();
    let t = { ...state.timer };

    if (action === "start") {
      t = { ...t, running: true, lastUpdate: now };
    } else if (action === "pause") {
      const elapsed = Math.floor((now - t.lastUpdate) / 1000);
      t = { ...t, remaining: Math.max(t.remaining - elapsed, 0), running: false };
    } else if (action === "reset") {
      t = { duration: t.duration, remaining: t.duration, running: false, lastUpdate: now };
    }

    update({ ...state, timer: t });
  };

  /* ── Design helpers ── */
  const setTheme = (key: keyof ScoreboardState, value: string) =>
    update({ ...state, [key]: value });

  /* ─────────────────────────────────────────
     STYLES (UNCHANGED)
  ───────────────────────────────────────── */
  const s: Record<string, CSSProperties> = {
    body: {
      margin: 0,
      padding: 12,
      fontFamily: "Segoe UI, Arial, sans-serif",
      background: "#0f0f0f",
      color: "white",
      minHeight: "100vh",
    },
    tabs: { display: "flex", gap: 8, marginBottom: 12 },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: 12,
    },
    box: {
      background: "#1a1a1a",
      padding: 12,
      borderRadius: 10,
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    btn: {
      padding: "10px 12px",
      borderRadius: 8,
      border: "none",
      background: "#333",
      color: "white",
      cursor: "pointer",
      fontSize: 14,
    },
    input: {
      padding: 10,
      borderRadius: 6,
      border: "none",
      width: "100%",
      fontSize: 14,
      boxSizing: "border-box",
    },
    colorRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
  };

  const tabBtn = (active: boolean): CSSProperties => ({
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: active ? "#555" : "#222",
    color: "white",
    fontSize: 14,
  });

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div style={s.body}>
      <h2>🏟 Pro Control Panel</h2>

      <div style={s.tabs}>
        <button style={tabBtn(tab === "control")} onClick={() => setTab("control")}>
          Control
        </button>
        <button style={tabBtn(tab === "design")} onClick={() => setTab("design")}>
          Design
        </button>
      </div>

      <div style={s.grid}>

        {tab === "control" && (
          <>
            <div style={s.box}>
              <h3>Score</h3>
              <button style={s.btn} onClick={() => changeScore("A", 1)}>+ Team A</button>
              <button style={s.btn} onClick={() => changeScore("A", -1)}>− Team A</button>
              <button style={s.btn} onClick={() => changeScore("B", 1)}>+ Team B</button>
              <button style={s.btn} onClick={() => changeScore("B", -1)}>− Team B</button>
              <button style={s.btn} onClick={resetScore}>Reset Score</button>
            </div>

            <div style={s.box}>
              <h3>Fouls</h3>
              <button style={s.btn} onClick={() => changeFoul("A", 1)}>+ Team A</button>
              <button style={s.btn} onClick={() => changeFoul("A", -1)}>− Team A</button>
              <button style={s.btn} onClick={() => changeFoul("B", 1)}>+ Team B</button>
              <button style={s.btn} onClick={() => changeFoul("B", -1)}>− Team B</button>
              <button style={s.btn} onClick={resetFouls}>Reset Fouls</button>
            </div>

            <div style={s.box}>
              <h3>Period — {state.period}</h3>
              <button style={s.btn} onClick={() => shiftPeriod(1)}>Next →</button>
              <button style={s.btn} onClick={() => shiftPeriod(-1)}>← Prev</button>
            </div>

            <div style={s.box}>
              <h3>Timer</h3>
              <label>Half duration (minutes)</label>
              <input
                style={s.input}
                type="number"
                min={1}
                value={halfMinutes}
                onChange={(e) => setHalfMinutes(Number(e.target.value))}
              />
              <button style={s.btn} onClick={setMatch}>Set Match</button>
              <button style={s.btn} onClick={() => timerAction("start")}>▶ Start</button>
              <button style={s.btn} onClick={() => timerAction("pause")}>⏸ Pause</button>
              <button style={s.btn} onClick={() => timerAction("reset")}>↺ Reset</button>
            </div>
          </>
        )}

        {tab === "design" && (
          <>
            <div style={s.box}>
              <h3>Teams</h3>
              <label>Team A name</label>
              <input
                style={s.input}
                value={state.teamA}
                onChange={(e) => update({ ...state, teamA: e.target.value })}
              />
              <label>Team B name</label>
              <input
                style={s.input}
                value={state.teamB}
                onChange={(e) => update({ ...state, teamB: e.target.value })}
              />
            </div>

            <div style={s.box}>
              <h3>Team Colors</h3>
              <div style={s.colorRow}>
                <input
                  type="color"
                  value={state.colorA}
                  onChange={(e) => update({ ...state, colorA: e.target.value })}
                />
                <label>Team A</label>
              </div>
              <div style={s.colorRow}>
                <input
                  type="color"
                  value={state.colorB}
                  onChange={(e) => update({ ...state, colorB: e.target.value })}
                />
                <label>Team B</label>
              </div>
            </div>

            <div style={s.box}>
              <h3>Theme</h3>
              {(
                [
                  ["bgMain", "Main background"],
                  ["bgBlocks", "Blocks background"],
                  ["bgTimer", "Timer background"],
                  ["textColor", "Text color"],
                  ["foulActive", "Foul active"],
                  ["foulInactive", "Foul inactive"],
                ] as [keyof ScoreboardState, string][]
              ).map(([key, label]) => (
                <div key={key} style={s.colorRow}>
                  <input
                    type="color"
                    value={state[key] as string}
                    onChange={(e) => setTheme(key, e.target.value)}
                  />
                  <label>{label}</label>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}