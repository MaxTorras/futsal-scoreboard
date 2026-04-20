"use client";

import { useEffect, useState } from "react";

export default function ControlPage() {
  const [state, setState] = useState({
    teamA: "Team A",
    teamB: "Team B",
    scoreA: 0,
    scoreB: 0,
    foulsA: 0,
    foulsB: 0,
    period: "1st HALF",
    timerDisplay: "20:00",
    halfDuration: 20,
    colorA: "#00bfff",
    colorB: "#ff3b3b",
    bgMain: "#111111",
    bgBlocks: "#1a1a1a",
    bgTimer: "#1a1a1a",
  });

  const [halfMinutes, setHalfMinutes] = useState(20);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<{ [key: string]: any }>({});
  const [selectedPreset, setSelectedPreset] = useState("");

  /* 🔁 SEND TO SERVER */
  const send = async (newState = state) => {
    await fetch("/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newState),
    });
  };

  /* 🧠 LOAD INITIAL STATE */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/data");
        const data = await res.json();
        setState(data);
      } catch (e) {
        console.log("No server state yet");
      }

      const stored = JSON.parse(localStorage.getItem("colorPresets") || "{}");
      setPresets(stored);
    };

    load();
  }, []);

  /* TEAMS */
  const updateTeams = () => {
    send(state);
  };

  /* SCORE */
  const changeScore = (team: "A" | "B", val: number) => {
    const newState = {
      ...state,
      scoreA:
        team === "A"
          ? Math.max(0, state.scoreA + val)
          : state.scoreA,
      scoreB:
        team === "B"
          ? Math.max(0, state.scoreB + val)
          : state.scoreB,
    };
    setState(newState);
    send(newState);
  };

  /* FOULS */
  const changeFoul = (team: "A" | "B", val: number) => {
    const newState = {
      ...state,
      foulsA:
        team === "A"
          ? Math.min(5, Math.max(0, state.foulsA + val))
          : state.foulsA,
      foulsB:
        team === "B"
          ? Math.min(5, Math.max(0, state.foulsB + val))
          : state.foulsB,
    };
    setState(newState);
    send(newState);
  };

  /* PERIOD */
  const setPeriod = (p: string) => {
    const newState = { ...state, period: p };
    setState(newState);
    send(newState);
  };

  /* TIMER */
  const setMatch = () => {
    const newState = { ...state, halfDuration: halfMinutes };
    setState(newState);
    send(newState);
  };

  const timerAction = (action: string) => {
    const newState = { ...state, timerAction: action };
    setState(newState);
    send(newState);
  };

  /* COLORS */
  const updateColor = (team: "A" | "B", value: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(value)) return;

    const newState =
      team === "A"
        ? { ...state, colorA: value }
        : { ...state, colorB: value };

    setState(newState);
  };

  const applyColors = () => send(state);

  /* THEME */
  const applyTheme = () => send(state);

  /* PRESETS */
  const savePreset = () => {
    if (!presetName) return;

    const newPresets = {
      ...presets,
      [presetName]: {
        colorA: state.colorA,
        colorB: state.colorB,
      },
    };

    localStorage.setItem("colorPresets", JSON.stringify(newPresets));
    setPresets(newPresets);
    setPresetName("");
  };

  const loadPreset = () => {
    if (!presets[selectedPreset]) return;

    const newState = {
      ...state,
      colorA: presets[selectedPreset].colorA,
      colorB: presets[selectedPreset].colorB,
    };

    setState(newState);
    send(newState);
  };

  return (
    <div style={styles.body}>
      <h2>🏟 Scoreboard Control Panel</h2>

      <div style={styles.grid}>
        {/* TEAMS */}
        <div style={styles.section}>
          <h3>Teams</h3>
          <input
            value={state.teamA}
            onChange={(e) =>
              setState({ ...state, teamA: e.target.value })
            }
          />
          <input
            value={state.teamB}
            onChange={(e) =>
              setState({ ...state, teamB: e.target.value })
            }
          />
          <button onClick={updateTeams}>Update</button>
        </div>

        {/* SCORE */}
        <div style={styles.section}>
          <h3>Score</h3>
          <button onClick={() => changeScore("A", 1)}>+ A</button>
          <button onClick={() => changeScore("A", -1)}>- A</button>
          <br />
          <button onClick={() => changeScore("B", 1)}>+ B</button>
          <button onClick={() => changeScore("B", -1)}>- B</button>
        </div>

        {/* FOULS */}
        <div style={styles.section}>
          <h3>Fouls</h3>
          <button onClick={() => changeFoul("A", 1)}>+ A</button>
          <button onClick={() => changeFoul("A", -1)}>- A</button>
          <br />
          <button onClick={() => changeFoul("B", 1)}>+ B</button>
          <button onClick={() => changeFoul("B", -1)}>- B</button>
        </div>

        {/* PERIOD */}
        <div style={styles.section}>
          <h3>Period</h3>
          <button onClick={() => setPeriod("1st HALF")}>1st</button>
          <button onClick={() => setPeriod("2nd HALF")}>2nd</button>
          <button onClick={() => setPeriod("HALF TIME")}>HT</button>
          <button onClick={() => setPeriod("FULL TIME")}>FT</button>
        </div>

        {/* TIMER */}
        <div style={styles.section}>
          <h3>Timer</h3>
          <input
            type="number"
            value={halfMinutes}
            onChange={(e) => setHalfMinutes(Number(e.target.value))}
          />
          <button onClick={setMatch}>Set Match</button>
          <br />
          <button onClick={() => timerAction("start")}>Start</button>
          <button onClick={() => timerAction("pause")}>Pause</button>
          <button onClick={() => timerAction("reset")}>Reset</button>
        </div>

        {/* COLORS */}
        <div style={styles.section}>
          <h3>Colors</h3>

          <label>Team A</label>
          <input
            type="color"
            value={state.colorA}
            onChange={(e) => updateColor("A", e.target.value)}
          />
          <input
            value={state.colorA}
            onChange={(e) => updateColor("A", e.target.value)}
          />

          <label>Team B</label>
          <input
            type="color"
            value={state.colorB}
            onChange={(e) => updateColor("B", e.target.value)}
          />
          <input
            value={state.colorB}
            onChange={(e) => updateColor("B", e.target.value)}
          />

          <button onClick={applyColors}>Apply</button>

          <hr />

          <h4>Presets</h4>

          <input
            placeholder="Preset name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
          <button onClick={savePreset}>Save</button>

          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
          >
            <option value="">Select preset</option>
            {Object.keys(presets).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button onClick={loadPreset}>Load</button>
        </div>

        {/* THEME */}
        <div style={styles.section}>
          <h3>Theme</h3>

          <label>Main</label>
          <input
            type="color"
            value={state.bgMain}
            onChange={(e) =>
              setState({ ...state, bgMain: e.target.value })
            }
          />

          <label>Blocks</label>
          <input
            type="color"
            value={state.bgBlocks}
            onChange={(e) =>
              setState({ ...state, bgBlocks: e.target.value })
            }
          />

          <label>Timer</label>
          <input
            type="color"
            value={state.bgTimer}
            onChange={(e) =>
              setState({ ...state, bgTimer: e.target.value })
            }
          />

          <button onClick={applyTheme}>Apply</button>
        </div>
      </div>
    </div>
  );
}

/* 🎨 STYLES */
const styles: any = {
  body: {
    margin: 0,
    padding: 20,
    fontFamily: "Segoe UI, Arial",
    background: "#0f0f0f",
    color: "white",
    minHeight: "100vh",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 15,
  },
  section: {
    background: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
  },
};