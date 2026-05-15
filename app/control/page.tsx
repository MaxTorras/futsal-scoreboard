"use client";

import { useEffect, useState } from "react";
import { doc, setDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import "../control/control.css";
import { CLOUDINARY_URL, UPLOAD_PRESET } from "@/lib/cloudinary";

/* ─────────────────────────────
   TYPES
───────────────────────────── */
type TeamInfo = {
  name: string;
  color: string;
  logo: string;
};

interface TimerState {
  duration: number;
  remaining: number;
  running: boolean;
  lastUpdate: number;
}

type Scoreboard = {
  score: { a: number; b: number };
  fouls: { a: number; b: number };
  timer: TimerState;
  teams: {
    a: TeamInfo;
    b: TeamInfo;
  };
  period: string;
};

/* ─────────────────────────────
   DEFAULT STATE
───────────────────────────── */
const defaultState: Scoreboard = {
  score: { a: 0, b: 0 },
  fouls: { a: 0, b: 0 },
  period: "1st HALF",
  teams: {
    a: { name: "HOME", color: "#781030", logo: "" },
    b: { name: "AWAY", color: "#ff0000", logo: "" },
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
/* ─────────────────────────────
   COMPONENT
───────────────────────────── */
export default function ControlPage() {
  const [state, setState] = useState<Scoreboard>(defaultState);
  const [tab, setTab] = useState<"control" | "design">("control");
  const [halfMinutes, setHalfMinutes] = useState(20);

  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [presetTarget, setPresetTarget] = useState<"A" | "B">("A");
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");

  const [logoPreview, setLogoPreview] = useState<{
  a: string;
  b: string;
}>({
  a: "",
  b: "",
});

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // avoid typing in inputs
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    switch (e.key.toLowerCase()) {

      // SCORE
      case "q":
        changeScore("A", 1);
        break;

      case "a":
        changeScore("A", -1);
        break;

      case "w":
        changeScore("B", 1);
        break;

      case "s":
        changeScore("B", -1);
        break;

      // TIMER
      case " ":
        e.preventDefault();
        startTimer();
        break;

      case "p":
        pauseTimer();
        break;

      case "r":
        resetTimer();
        break;

      // FOULS
      case "e":
        changeFoul("A", 1);
        break;

      case "d":
        changeFoul("B", 1);
        break;

      // QUICK RESET SCORE
      case "x":
        resetScore();
        break;

      case "c":
        resetFouls();
        break;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [state]);

  /* ── FIRESTORE SYNC ── */
const send = (newState: Scoreboard) => {
  const payload = {
    score: newState.score,
    fouls: newState.fouls,
    period: newState.period,
    teams: newState.teams,
    timer: newState.timer,
  };

  setDoc(doc(db, "scoreboard", "main"), payload, { merge: true });
};

  const update = (newState: Scoreboard) => {
    setState(newState);
    send(newState);
  };

  /* ===========================
     SCORE
  =========================== */
/* ── SCORE ── */
 const changeScore = (team: "A" | "B", val: number) =>
  update({
    ...state,
    score: {
      a: team === "A" ? Math.max(0, state.score.a + val) : state.score.a,
      b: team === "B" ? Math.max(0, state.score.b + val) : state.score.b,
    },
  });

const resetScore = () =>
  update({
    ...state,
    score: { a: 0, b: 0 },
  });

 /* ── FOULS ── */
const changeFoul = (team: "A" | "B", val: number) =>
  update({
    ...state,
    fouls: {
      a:
        team === "A"
          ? Math.min(5, Math.max(0, state.fouls.a + val))
          : state.fouls.a,
      b:
        team === "B"
          ? Math.min(5, Math.max(0, state.fouls.b + val))
          : state.fouls.b,
    },
  });

const resetFouls = () =>
  update({
    ...state,
    fouls: { a: 0, b: 0 },
  });

  /* ── PERIOD ── */
  const shiftPeriod = (dir: 1 | -1) => {
    const i = PERIODS.indexOf(state.period);
    const next = PERIODS[(i + dir + PERIODS.length) % PERIODS.length];
    update({ ...state, period: next });
  };

  /* ── TIMER ── */
  const setMatch = () => {
    const duration = halfMinutes * 60;
    update({
      ...state,
      timer: {
        duration,
        remaining: duration,
        running: false,
        lastUpdate: Date.now(),
      },
    });
  };

  const timerAction = (action: "start" | "pause" | "reset") => {
    const now = Date.now();
    let t = { ...state.timer };

    if (action === "start") {
      t.running = true;
      t.lastUpdate = now;
    } else if (action === "pause") {
      const elapsed = Math.floor((now - t.lastUpdate) / 1000);
      t.remaining = Math.max(t.remaining - elapsed, 0);
      t.running = false;
    } else if (action === "reset") {
      t = {
        duration: t.duration,
        remaining: t.duration,
        running: false,
        lastUpdate: now,
      };
    }

    update({ ...state, timer: t });
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error("Cloudinary upload failed");
  }

  return data.secure_url;
};
  /* ===========================
     TEAM
  =========================== */
  const updateTeam = (team: "a" | "b", field: keyof TeamInfo, value: string) => {
  update({
    ...state,
    teams: {
      ...state.teams,
      [team]: {
        ...state.teams[team],
        [field]: value,
      },
    },
  });
};
const setTime = (seconds: number) => {
  update({
    ...state,
    timer: {
      ...state.timer,
      remaining: Math.max(0, seconds),
      lastUpdate: Date.now(),
    },
  });
};

const startTimer = () => {
  update({
    ...state,
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

  update({
    ...state,
    timer: {
      ...state.timer,
      remaining: Math.max(state.timer.remaining - elapsed, 0),
      running: false,
    },
  });
};

const resetTimer = () => {
  update({
    ...state,
    timer: {
      ...state.timer,
      remaining: state.timer.duration,
      running: false,
      lastUpdate: Date.now(),
    },
  });
};

useEffect(() => {
  if (!state.timer.running) return;

  const interval = setInterval(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - state.timer.lastUpdate) / 1000);

    if (elapsed <= 0) return;

    const newRemaining = Math.max(state.timer.remaining - elapsed, 0);

    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        remaining: newRemaining,
        lastUpdate: now,
        running: newRemaining > 0,
      },
    }));
  }, 1000);

  return () => clearInterval(interval);
}, [state.timer.running]);

const applyTeam = (side: "a" | "b") => {
  const id = side === "a" ? homeTeamId : awayTeamId;

  const team = presets.find((t) => t.id === id);
  if (!team) return;

  update({
    ...state,
    teams: {
      ...state.teams,
      [side]: {
        name: team.name,
        color: team.color,
        logo: team.logo,
      },
    },
  });
};

const saveTeamToDatabase = async (team: "a" | "b") => {
  console.log("Saving team:", team, state.teams[team]);
  try {
    const teamData = state.teams[team];

    await addDoc(collection(db, "teams"), {
      name: teamData.name,
      color: teamData.color,
      logo: teamData.logo,
    });

    console.log("Team saved!");
  } catch (err) {
    console.error("Error saving team:", err);
  }
};

const loadTeams = async () => {
  const snapshot = await getDocs(collection(db, "teams"));

  const teams = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  setPresets(teams);
};

useEffect(() => {
  loadTeams();
}, []);
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
          <button className="button" onClick={() => changeScore("A", 1)}>+1</button>
          <button className="button" onClick={() => changeScore("A", -1)}>-1</button>
        </div>

        <div id="away-team" className="panel">
          <div>AWAY TEAM</div>
          <button className="button" onClick={() => changeScore("B", 1)}>+1</button>
          <button className="button" onClick={() => changeScore("B", -1)}>-1</button>
        </div>

        <button className="button" onClick={resetScore}>Reset Goals</button>
      </div>

      {/* FOULS */}
      <div className="fouls-control center-text section">
        FOULS CONTROL

        <div id="fouls-home" className="panel">
          <div>Home Fouls</div>
          <button className="button" onClick={() => changeFoul("A", 1)}>+1</button>
          <button className="button" onClick={() => changeFoul("A", -1)}>-1</button>
        </div>

        <div id="fouls-away" className="panel">
          <div>Away Fouls</div>
          <button className="button" onClick={() => changeFoul("B", 1)}>+1</button>
          <button className="button" onClick={() => changeFoul("B", -1)}>-1</button>
        </div>

        <button className="button" onClick={resetFouls}>Reset Fouls</button>
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
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = await uploadToCloudinary(file);
      updateTeam("a", "logo", url);
    }}
  />

  {/* LOGO UPLOAD B */}
  <input
    type="file"
    accept="image/*"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = await uploadToCloudinary(file);
      updateTeam("b", "logo", url);
    }}
  />

  <button onClick={() => saveTeamToDatabase("a")}>
    Save Home Team
  </button>

  <button onClick={() => saveTeamToDatabase("b")}>
    Save Away Team
  </button>

  {/* ───────── HOME LOAD ───────── */}
  <div style={{ textAlign: "center", width: "100%", marginTop: 10 }}>
    <div>HOME LOAD</div>

    <select
  value={homeTeamId}
  onChange={(e) => setHomeTeamId(e.target.value)}
  style={{ width: "100%", textAlign: "center", marginTop: 5 }}
>
  <option value="">Select a team</option>

  {presets.map((team) => (
    <option key={team.id} value={team.id}>
      {team.name}
    </option>
  ))}
</select>

    <button
      className="button"
      onClick={() => applyTeam("a")}
    >
      Apply to HOME
    </button>
  </div>

  {/* ───────── AWAY LOAD ───────── */}
  <div style={{ textAlign: "center", width: "100%", marginTop: 10 }}>
    <div>AWAY LOAD</div>

    <select
  value={awayTeamId}
  onChange={(e) => setAwayTeamId(e.target.value)}
  style={{ width: "100%", textAlign: "center", marginTop: 5 }}
>
  <option value="">Select a team</option>

  {presets.map((team) => (
    <option key={team.id} value={team.id}>
      {team.name}
    </option>
  ))}
</select>

    <button
      className="button"
      onClick={() => applyTeam("b")}
    >
      Apply to AWAY
    </button>
  </div>

  {/* SET BUTTON */}
  <button
    className="button"
    onClick={() =>
      update({
        ...state,
        teams: state.teams,
      })
    }
    style={{ gridColumn: "1 / -1" }}
  >
    SET TEAMS
  </button>

</div>
</div>
  );
}