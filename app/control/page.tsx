// app\control\page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CSSProperties } from "react";
import { CLOUDINARY_URL, UPLOAD_PRESET } from "@/lib/cloudinary";

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

  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [presetTarget, setPresetTarget] = useState<"A" | "B">("A");

  const [logoPreview, setLogoPreview] = useState<{
  a: string;
  b: string;
}>({
  a: "",
  b: "",
});
  /* ── LOAD PRESETS ── */
  const loadPresets = async () => {
    const snap = await getDocs(collection(db, "teamPresets"));
   setPresets(
  snap.docs.map((d) => ({
    id: d.id,
    team: d.data().team,
  }))
);
  };

  useEffect(() => {
    loadPresets();
  }, []);

  /* ── UPLOAD LOGO ── */
const uploadLogo = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  return data.secure_url;
};

  /* ── SAVE PRESET (single team-based) ── */
const savePreset = async () => {
  const team =
    presetTarget === "A" ? state.teams.a : state.teams.b;

  const id = `${team.name
    .toLowerCase()
    .replace(/\s+/g, "-")}-${Date.now()}`;

  await setDoc(doc(db, "teamPresets", id), {
    team: {
      name: team.name,
      color: team.color,
      logo: team.logo,
    },
  });

  loadPresets();
};

  /* ── APPLY PRESET ── */
const applyPreset = (preset: any) => {
  const target = presetTarget;

  update({
    ...state,
    teams: {
      ...state.teams,
      [target.toLowerCase()]: preset.team,
    },
  });
};

  /* ── FIRESTORE SYNC ── */
  const send = (newState: ScoreboardState) => {
    const payload = {
      score: { a: newState.scoreA, b: newState.scoreB },
      fouls: { a: newState.foulsA, b: newState.foulsB },
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

  /* ── SCORE ── */
  const changeScore = (team: "A" | "B", val: number) =>
    update({
      ...state,
      scoreA: team === "A" ? Math.max(0, state.scoreA + val) : state.scoreA,
      scoreB: team === "B" ? Math.max(0, state.scoreB + val) : state.scoreB,
    });

  const resetScore = () => update({ ...state, scoreA: 0, scoreB: 0 });

  /* ── FOULS ── */
  const changeFoul = (team: "A" | "B", val: number) =>
    update({
      ...state,
      foulsA: team === "A"
        ? Math.min(5, Math.max(0, state.foulsA + val))
        : state.foulsA,
      foulsB: team === "B"
        ? Math.min(5, Math.max(0, state.foulsB + val))
        : state.foulsB,
    });

  const resetFouls = () => update({ ...state, foulsA: 0, foulsB: 0 });

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

  /* ─────────────────────────────────────────
     DESIGN HELPERS
  ───────────────────────────────────────── */
  const setTheme = (key: keyof ScoreboardState, value: string) =>
    update({ ...state, [key]: value });

  /* ─────────────────────────────────────────
     STYLES
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
        {/* CONTROL */}
        {tab === "control" && (
          <>
            <div style={s.box}>
              <h3>Score</h3>
              <button style={s.btn} onClick={() => changeScore("A", 1)}>+ A</button>
              <button style={s.btn} onClick={() => changeScore("A", -1)}>− A</button>
              <button style={s.btn} onClick={() => changeScore("B", 1)}>+ B</button>
              <button style={s.btn} onClick={() => changeScore("B", -1)}>− B</button>
              <button style={s.btn} onClick={resetScore}>Reset</button>
            </div>

            <div style={s.box}>
              <h3>Fouls</h3>
              <button style={s.btn} onClick={() => changeFoul("A", 1)}>+ A</button>
              <button style={s.btn} onClick={() => changeFoul("A", -1)}>− A</button>
              <button style={s.btn} onClick={() => changeFoul("B", 1)}>+ B</button>
              <button style={s.btn} onClick={() => changeFoul("B", -1)}>− B</button>
              <button style={s.btn} onClick={resetFouls}>Reset</button>
            </div>

            <div style={s.box}>
              <h3>Period</h3>
              <div>{state.period}</div>
              <button style={s.btn} onClick={() => shiftPeriod(1)}>Next</button>
              <button style={s.btn} onClick={() => shiftPeriod(-1)}>Prev</button>
            </div>

            <div style={s.box}>
              <h3>Timer</h3>
              <input
                style={s.input}
                type="number"
                value={halfMinutes}
                onChange={(e) => setHalfMinutes(Number(e.target.value))}
              />
              <button style={s.btn} onClick={setMatch}>Set</button>
              <button style={s.btn} onClick={() => timerAction("start")}>Start</button>
              <button style={s.btn} onClick={() => timerAction("pause")}>Pause</button>
              <button style={s.btn} onClick={() => timerAction("reset")}>Reset</button>
            </div>
          </>
        )}

        {/* DESIGN */}
        {tab === "design" && (
          <>
            <div style={s.box}>
  <h3>Team Presets</h3>

  {/* TARGET SELECTOR */}
  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
    <button
      style={{ ...s.btn, background: presetTarget === "A" ? "#555" : "#333" }}
      onClick={() => setPresetTarget("A")}
    >
      Apply to A
    </button>

    <button
      style={{ ...s.btn, background: presetTarget === "B" ? "#555" : "#333" }}
      onClick={() => setPresetTarget("B")}
    >
      Apply to B
    </button>
  </div>

  {/* SELECT */}
  <select
    style={s.input}
    value={selectedPreset}
    onChange={(e) => {
      setSelectedPreset(e.target.value);
      const preset = presets.find((p) => p.id === e.target.value);
      if (preset) applyPreset(preset);
    }}
  >
    <option value="">Select preset</option>
    {presets.map((p) => (
      <option key={p.id} value={p.id}>
        {p.team.name}
      </option>
    ))}
  </select>

  <button style={s.btn} onClick={savePreset}>
    Save selected team preset
  </button>
</div>

            <div style={s.box}>
              <h3>Team A</h3>
              <input
                style={s.input}
                value={state.teams.a.name}
onChange={(e) =>
  update({
    ...state,
    teams: {
      ...state.teams,
      a: { ...state.teams.a, name: e.target.value },
    },
  })
}
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // ⚡ instant local preview
  const previewUrl = URL.createObjectURL(file);

  setLogoPreview((prev) => ({
    ...prev,
    a: previewUrl,
  }));

  // ☁️ upload to Cloudinary
  const url = await uploadLogo(file);

  update({
    ...state,
    teams: {
      ...state.teams,
      a: { ...state.teams.a, logo: url },
    },
  });
}}
              />
              {(logoPreview.a || state.teams.a.logo) && (
  <div style={{ marginTop: 8 }}>
    <img
      src={logoPreview.a || state.teams.a.logo}
      style={{
        width: 90,
        height: 90,
        objectFit: "cover",
        borderRadius: 10,
        border: "1px solid #333",
        background: "#000",
      }}
    />
  </div>
)}
            </div>

            <div style={s.box}>
              <h3>Team B</h3>
              <input
                style={s.input}
                value={state.teams.b.name}
onChange={(e) =>
  update({
    ...state,
    teams: {
      ...state.teams,
      b: { ...state.teams.b, name: e.target.value },
    },
  })
}
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const previewUrl = URL.createObjectURL(file);

  setLogoPreview((prev) => ({
    ...prev,
    b: previewUrl,
  }));

  const url = await uploadLogo(file);

  update({
    ...state,
    teams: {
      ...state.teams,
      b: { ...state.teams.b, logo: url },
    },
  });
}}
              />
              {(logoPreview.b || state.teams.b.logo) && (
  <div style={{ marginTop: 8 }}>
    <img
      src={logoPreview.b || state.teams.b.logo}
      style={{
        width: 90,
        height: 90,
        objectFit: "cover",
        borderRadius: 10,
        border: "1px solid #333",
        background: "#000",
      }}
    />
  </div>
)}
            </div>

            <div style={s.box}>
              <h3>Colors</h3>

              <div style={s.colorRow}>
                <input
                
                  type="color"
                  value={state.teams.a.color}
onChange={(e) =>
  update({
    ...state,
    teams: {
      ...state.teams,
      a: { ...state.teams.a, color: e.target.value },
    },
  })
}
                />
                A
              </div>
              <div style={s.colorRow}>
                <input
                  type="color"
                  value={state.teams.b.color}
onChange={(e) =>
  update({
    ...state,
    teams: {
      ...state.teams,
      b: { ...state.teams.b, color: e.target.value },
    },
  })
}
                />
                B
              </div>
            </div>

            <div style={s.box}>
              <h3>Theme</h3>

              {(
                [
                  ["bgMain", "Main"],
                  ["bgBlocks", "Blocks"],
                  ["bgTimer", "Timer"],
                  ["textColor", "Text"],
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
                  {label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}