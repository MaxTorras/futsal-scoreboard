// app\control\page.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import "../control/control.css";

/* ─────────────────────────────
   TYPES
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
    a: { name: "HOME", color: "#781030", logo: "" },
    b: { name: "AWAY", color: "#ff0000", logo: "" },
  },
  timer: {
    duration: 1200,
    remaining: 1200,
    running: false,
    lastUpdate: Date.now(), // FIX: initialise with real timestamp, not 0
  },
};

/* ─────────────────────────────
   COMPONENT
───────────────────────────── */
export default function ControlPage() {
  const [state, setState] = useState<Scoreboard>(defaultState);

  const ref = doc(db, "scoreboard", "main");

  const update = async (patch: any) => {
    await setDoc(ref, patch, { merge: true });
  };

  // FIX: single mount effect — no redundant local-state patch
  useEffect(() => {
    setDoc(ref, defaultState, { merge: true });
  }, []);

  /* ===========================
     FIRESTORE SYNC
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
     SCORE
  =========================== */
  const updateScore = (team: "a" | "b", val: number) => {
    update({
      [`score.${team}`]: Math.max(0, state.score[team] + val),
    });
  };

  const resetScore = () =>
    update({
      score: { a: 0, b: 0 },
    });

  /* ===========================
     FOULS
  =========================== */
  const updateFouls = (team: "a" | "b", val: number) => {
    update({
      [`fouls.${team}`]: Math.min(5, Math.max(0, state.fouls[team] + val)),
    });
  };

  const resetFouls = () =>
    update({
      fouls: { a: 0, b: 0 },
    });

  /* ===========================
     TIMER
  =========================== */
  const setTime = (sec: number) => {
    const safe = Math.max(0, sec);

    update({
      "timer.duration": safe,
      "timer.remaining": safe,
      "timer.running": false,
      "timer.lastUpdate": Date.now(),
    });
  };

  const startTimer = () =>
    update({
      "timer.running": true,
      "timer.lastUpdate": Date.now(),
    });

  // FIX: read live remaining from Firestore snapshot (state is synced via onSnapshot)
  // so state here is already up-to-date; but we re-calculate elapsed client-side
  // to avoid double-subtracting elapsed time that the overlay already handles.
  const pauseTimer = () => {
    const now = Date.now();
    const elapsed = state.timer.running
      ? Math.floor((now - state.timer.lastUpdate) / 1000)
      : 0;

    update({
      "timer.remaining": Math.max(state.timer.remaining - elapsed, 0),
      "timer.running": false,
      "timer.lastUpdate": now,
    });
  };

  const resetTimer = () =>
    update({
      "timer.remaining": state.timer.duration,
      "timer.running": false,
      "timer.lastUpdate": Date.now(),
    });

  /* ===========================
     TEAM
  =========================== */
  const updateTeam = (team: "a" | "b", field: keyof Team, value: string) => {
    update({
      [`teams.${team}.${field}`]: value,
    });
  };

  /* ===========================
     RENDER
  =========================== */
  return (
    <div className="control">

      {/* TIMER */}
      <div className="timer-control center-text section">
        TIMER CONTROL

        <div id="timeDisplay">
          {Math.floor(state.timer.remaining / 60)}:
          {(state.timer.remaining % 60).toString().padStart(2, "0")}
        </div>

        <div id="timer-adjuster">
          <div className="center-text">Timer Adjuster</div>

          <button className="button" onClick={() => setTime(state.timer.remaining - 10)}>-10s</button>
          <button className="button" onClick={() => setTime(state.timer.remaining - 1)}>-1s</button>
          <button className="button" onClick={() => setTime(state.timer.remaining + 1)}>+1s</button>
          <button className="button" onClick={() => setTime(state.timer.remaining + 10)}>+10s</button>

          <button className="button" onClick={() => setTime(1200)}>20:00</button>
          <button className="button" onClick={() => setTime(600)}>10:00</button>
          <button className="button" onClick={() => setTime(300)}>05:00</button>
        </div>

        <div id="timer-set">
          <div className="center-text">Timer Control</div>
          <button className="button" onClick={startTimer}>START</button>
          <button className="button" onClick={pauseTimer}>PAUSE</button>
          <button className="button" onClick={resetTimer}>RESET TIMER</button>
        </div>
      </div>

      {/* SCORE */}
      <div className="score-control center-text section">
        SCORE CONTROL

        <div id="home-team" className="panel">
          <div>HOME TEAM</div>
          <button className="button" onClick={() => updateScore("a", 1)}>+1</button>
          <button className="button" onClick={() => updateScore("a", -1)}>-1</button>
        </div>

        <div id="away-team" className="panel">
          <div>AWAY TEAM</div>
          <button className="button" onClick={() => updateScore("b", 1)}>+1</button>
          <button className="button" onClick={() => updateScore("b", -1)}>-1</button>
        </div>

        {/* FIX: added id="resetGoals" so CSS grid-column rule applies */}
        <button id="resetGoals" className="button" onClick={resetScore}>Reset Goals</button>
      </div>

      {/* FOULS */}
      <div className="fouls-control center-text section">
        FOULS CONTROL

        <div id="fouls-home" className="panel">
          <div>Home Fouls</div>
          <button className="button" onClick={() => updateFouls("a", 1)}>+1</button>
          <button className="button" onClick={() => updateFouls("a", -1)}>-1</button>
        </div>

        <div id="fouls-away" className="panel">
          <div>Away Fouls</div>
          <button className="button" onClick={() => updateFouls("b", 1)}>+1</button>
          <button className="button" onClick={() => updateFouls("b", -1)}>-1</button>
        </div>

        {/* FIX: added id="resetFouls" so CSS grid-column rule applies */}
        <button id="resetFouls" className="button" onClick={resetFouls}>Reset Fouls</button>
      </div>

      {/* ───────── TEAMS ───────── */}
      <div className="section team-control">

        <div className="title">TEAM CONTROL</div>

        {/* NAMES */}
        <input
          value={state.teams.a.name}
          onChange={(e) => updateTeam("a", "name", e.target.value)}
        />

        <input
          value={state.teams.b.name}
          onChange={(e) => updateTeam("b", "name", e.target.value)}
        />

        {/* COLORS */}
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

        {/* LOGO UPLOAD A */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
              updateTeam("a", "logo", ev.target?.result as string);
            };
            reader.readAsDataURL(file);
          }}
        />

        {/* LOGO UPLOAD B */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
              updateTeam("b", "logo", ev.target?.result as string);
            };
            reader.readAsDataURL(file);
          }}
        />

        <button
          className="button"
          onClick={() => update({ teams: state.teams })}
          style={{ gridColumn: "1 / -1" }}
        >
          SET TEAMS
        </button>

      </div>
    </div>
  );
}