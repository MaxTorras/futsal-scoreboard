// app\overlay\page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ---------------------------
   FOULS RENDER
---------------------------- */
function Fouls({ value }: { value: number }) {
  return (
    <div className="fouls-wrap">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`foul ${i < value ? "active" : ""}`}
        />
      ))}
    </div>
  );
}

/* ---------------------------
   FORMAT TIME
---------------------------- */
function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ---------------------------
   MAIN COMPONENT
---------------------------- */
export default function OverlayPage() {
  const [state, setState] = useState<any>(null);
  const [displayTime, setDisplayTime] = useState("00:00");

  /* ===========================
     FIRESTORE LISTENER
  =========================== */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "scoreboard", "main"), (snap) => {
      if (snap.exists()) {
        setState(snap.data());
      }
    });

    return () => unsub();
  }, []);

  /* ===========================
     TIMER ENGINE
  =========================== */
useEffect(() => {
  if (!state?.timer) return;

  const interval = setInterval(() => {
    const t = state.timer;
    const now = Date.now();

    if (!t.running) {
      setDisplayTime(formatTime(t.remaining ?? 0));
      return;
    }

    const elapsed = Math.floor((now - t.lastUpdate) / 1000);
    const remaining = Math.max(t.remaining - elapsed, 0);

    setDisplayTime(formatTime(remaining));
  }, 250);

  return () => clearInterval(interval);
}, [state?.timer?.running, state?.timer?.remaining, state?.timer?.lastUpdate]);

  /* ===========================
     LOADING STATE
  =========================== */
  if (!state) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Loading scoreboard...
      </div>
    );
  }

return (
  <>
    <div className="scoreboard">
      {/* TIMER */}
      <div className="timer">{displayTime}</div>

      {/* TEAMS WRAPPER */}
      <div className="teams">

        {/* TEAM A */}
        <div className="team-block team-a">
            {state.teams?.a?.logo && (
  <img
    src={state.teams.a.logo}
    className="team-logo"
    alt="Team A logo"
  />
)}
          <div className="team-name">{state.teams?.a?.name ?? "Team A"}</div>
          
          <div className="score score-pop">{state.score?.a ?? 0}</div>
          <Fouls value={state.fouls?.a ?? state.foulsA ?? 0} />
        </div>

        {/* CENTER */}
        <div className="center">
          <div className="divider">-</div>
          <div className="period">{state.period ?? "1st HALF"}</div>
        </div>

        {/* TEAM B */}
        <div className="team-block team-b">
          <div className="score score-pop">{state.score?.b ?? 0}</div>
          <div className="team-name">{state.teams?.b?.name ?? "Team B"}</div>
          {state.teams?.b?.logo && (
  <img
    src={state.teams.b.logo}
    className="team-logo"
    alt="Team B logo"
  />
)}
          <Fouls value={state.fouls?.b ?? state.foulsB ?? 0} />
        </div>

      </div>
    </div>

    {/* GLOBAL CSS VARIABLES */}
  <style jsx global>{`
  :root {
    --bg-main: ${state.theme?.bgMain ?? "#111"};
    --bg-blocks: ${state.theme?.bgBlocks ?? "#1a1a1a"};
    --bg-timer: ${state.theme?.bgTimer ?? "#1a1a1a"};

    --color-a: ${state.teams?.a?.color ?? "#00bfff"};
--color-b: ${state.teams?.b?.color ?? "#ff3b3b"};

    --text: ${state.theme?.textColor ?? "#ffffff"};
    --text-muted: ${state.theme?.textMuted ?? "#aaaaaa"};

    --foul-active: ${state.theme?.foulActive ?? "#ffffff"};
    --foul-inactive: ${state.theme?.foulInactive ?? "#333333"};
  }

  body {
    margin: 0;
    background: transparent;
    color: var(--text);
  }
`}</style>

    {/* COMPONENT STYLES */}
    <style jsx>{`
      .scoreboard {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 10px 14px;
        background: var(--bg-main);
        border-radius: 8px;
        width: fit-content;
        color: var(--text);
      }

      .timer {
        width: 85px;
        text-align: center;
        font-size: 20px;
        font-weight: 700;
        padding: 8px;
        border-radius: 6px;
        background: var(--bg-timer);
        font-variant-numeric: tabular-nums;
      }

      .teams {
        display: flex;
        align-items: center;
      }

      .team-block {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
        height: 60px;
        background: var(--bg-blocks);
        border-radius: 6px;
        position: relative;
        overflow: hidden;
      }

      .team-name {
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
          max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
      }

      .score {
        font-size: 32px;
        font-weight: 800;
        min-width: 40px;
        text-align: center;
      }

      .center {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 10px;
      }

      .divider {
        font-size: 26px;
        color: #888;
      }

      .period {
        font-size: 10px;
        color: #aaa;
      }

      .fouls-wrap {
        position: absolute;
        bottom: -16px;
        display: flex;
        gap: 4px;
      }

      .foul {
        width: 10px;
        height: 14px;
        background: #333;
        border-radius: 2px;
      }

      .foul.active {
        background: var(--foul-active);
      }

      .team-a::before {
        content: "";
        position: absolute;
        left: 0;
        width: 5px;
        height: 100%;
        background: var(--color-a);
      }

      .team-b::after {
        content: "";
        position: absolute;
        right: 0;
        width: 5px;
        height: 100%;
        background: var(--color-b);


      }
        .team-logo {
  width: 60px;
  height: 60px;
  border-radius: 4px;
}
    `}</style>
  </>
);
}