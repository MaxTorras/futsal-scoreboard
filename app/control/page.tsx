"use client";

import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ─────────────────────────────
   TYPES (minimal, clean)
───────────────────────────── */
type Team = {
  name: string;
  color: string;
  logo: string;
};

type Scoreboard = {
  score: { a: number; b: number };
  fouls: { a: number; b: number };
  timer: {
    duration: number;
    remaining: number;
    running: boolean;
    lastUpdate: number;
  };
  teams: {
    a: Team;
    b: Team;
  };
  period: string;
};

/* ─────────────────────────────
   DEFAULT STATE
───────────────────────────── */
const defaultState: Scoreboard = {
  score: { a: 0, b: 0 },
  fouls: { a: 0, b: 0 },
  period: "2nd HALF",
  teams: {
    a: { name: "HOME", color: "#00bfff", logo: "" },
    b: { name: "AWAY", color: "#ff3b3b", logo: "" },
  },
  timer: {
    duration: 1200,
    remaining: 1200,
    running: false,
    lastUpdate: Date.now(),
  },
};

/* ─────────────────────────────
   COMPONENT
───────────────────────────── */
export default function ControlPage() {
  const [state, setState] = useState<Scoreboard>(defaultState);

  const ref = doc(db, "scoreboard", "main");

  /* ===========================
     LIVE SYNC FROM FIRESTORE
  =========================== */
  useEffect(() => {
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setState(snap.data() as Scoreboard);
      }
    });

    return () => unsub();
  }, []);

  /* ===========================
     UPDATE HELPERS
  =========================== */
  const push = async (patch: Partial<Scoreboard>) => {
    await setDoc(ref, patch, { merge: true });
  };

  const updateScore = (team: "a" | "b", val: number) => {
    const next = {
      ...state,
      score: {
        ...state.score,
        [team]: Math.max(0, state.score[team] + val),
      },
    };

    push({ score: next.score });
  };

  const resetScore = () => push({ score: { a: 0, b: 0 } });

  const updateFouls = (team: "a" | "b", val: number) => {
    const next = {
      ...state,
      fouls: {
        ...state.fouls,
        [team]: Math.min(5, Math.max(0, state.fouls[team] + val)),
      },
    };

    push({ fouls: next.fouls });
  };

  const resetFouls = () => push({ fouls: { a: 0, b: 0 } });

  /* ===========================
     TIMER LOGIC (Firestore-safe)
  =========================== */
  const startTimer = () => {
    push({
      timer: {
        ...state.timer,
        running: true,
        lastUpdate: Date.now(),
      },
    });
  };

  const pauseTimer = () => {
    const now = Date.now();
    const elapsed = Math.floor((now - state.timer.lastUpdate) / 1000);

    push({
      timer: {
        ...state.timer,
        remaining: Math.max(state.timer.remaining - elapsed, 0),
        running: false,
      },
    });
  };

  const resetTimer = () => {
    push({
      timer: {
        ...state.timer,
        remaining: state.timer.duration,
        running: false,
        lastUpdate: Date.now(),
      },
    });
  };

  const setTime = (sec: number) => {
    push({
      timer: {
        ...state.timer,
        duration: sec,
        remaining: sec,
        running: false,
        lastUpdate: Date.now(),
      },
    });
  };

  /* ===========================
     TEAM UPDATE
  =========================== */
  const updateTeam = (team: "a" | "b", field: keyof Team, value: string) => {
    const updated = {
      ...state.teams[team],
      [field]: value,
    };

    push({
      teams: {
        ...state.teams,
        [team]: updated,
      },
    });
  };

  /* ===========================
     PERIOD
  =========================== */
  const setPeriod = (value: string) => push({ period: value });

  /* ===========================
     RENDER
  =========================== */
  return (
    <div style={{ padding: 20, color: "white", fontFamily: "Arial" }}>
      <h2>🏟 Scoreboard Control</h2>

      {/* SCORE */}
      <h3>Score</h3>
      <button onClick={() => updateScore("a", 1)}>Home +</button>
      <button onClick={() => updateScore("a", -1)}>Home -</button>
      <button onClick={() => updateScore("b", 1)}>Away +</button>
      <button onClick={() => updateScore("b", -1)}>Away -</button>
      <button onClick={resetScore}>Reset</button>

      <hr />

      {/* FOULS */}
      <h3>Fouls</h3>
      <button onClick={() => updateFouls("a", 1)}>Home +</button>
      <button onClick={() => updateFouls("a", -1)}>Home -</button>
      <button onClick={() => updateFouls("b", 1)}>Away +</button>
      <button onClick={() => updateFouls("b", -1)}>Away -</button>
      <button onClick={resetFouls}>Reset</button>

      <hr />

      {/* TIMER */}
      <h3>Timer</h3>
      <button onClick={() => setTime(1200)}>20:00</button>
      <button onClick={() => setTime(600)}>10:00</button>
      <button onClick={() => setTime(300)}>5:00</button>

      <br />

      <button onClick={startTimer}>Start</button>
      <button onClick={pauseTimer}>Pause</button>
      <button onClick={resetTimer}>Reset</button>

      <hr />

      {/* TEAMS */}
      <h3>Teams</h3>

      <input
        value={state.teams.a.name}
        onChange={(e) => updateTeam("a", "name", e.target.value)}
        placeholder="Home name"
      />

      <input
        value={state.teams.b.name}
        onChange={(e) => updateTeam("b", "name", e.target.value)}
        placeholder="Away name"
      />

      <br />

      <input
        type="color"
        value={state.teams.a.color}
        onChange={(e) => updateTeam("a", "color", e.target.value)}
      />

      <input
        type="color"
        value={state.teams.b.color}
        onChange={(e) => updateTeam("b", "color", e.target.value)}
      />

      <br />

      <input
        value={state.teams.a.logo}
        onChange={(e) => updateTeam("a", "logo", e.target.value)}
        placeholder="Home logo URL"
      />

      <input
        value={state.teams.b.logo}
        onChange={(e) => updateTeam("b", "logo", e.target.value)}
        placeholder="Away logo URL"
      />

      <hr />

      {/* PERIOD */}
      <h3>Period</h3>
      <button onClick={() => setPeriod("1st HALF")}>1st</button>
      <button onClick={() => setPeriod("2nd HALF")}>2nd</button>
      <button onClick={() => setPeriod("HALF TIME")}>HT</button>
      <button onClick={() => setPeriod("FULL TIME")}>FT</button>
    </div>
  );
}