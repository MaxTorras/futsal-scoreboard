"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ---------------------------
   FOULS RENDER
---------------------------- */
function Fouls({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 10,
            height: 14,
            borderRadius: 2,
            background: i < value ? "white" : "#333",
          }}
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

      if (!t) return;

      // paused → just display stored remaining
      if (!t.running) {
        setDisplayTime(formatTime(t.remaining || 0));
        return;
      }

      // running → calculate live
      const now = Date.now();
      const elapsed = Math.floor((now - t.lastUpdate) / 1000);

      const remaining = Math.max((t.remaining || 0) - elapsed, 0);

      setDisplayTime(formatTime(remaining));
    }, 250);

    return () => clearInterval(interval);
  }, [state?.timer]);

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

  /* ===========================
     UI
  =========================== */
  return (
    <>
      <div className="scoreboard">
        {/* TIMER */}
        <div className="timer">{displayTime}</div>

        {/* TEAMS */}
        <div className="teams">
          {/* TEAM A */}
          <div className="team-block team-a">
            <div className="team-name">{state.teamA || "Team A"}</div>
            <div className="score">{state.scoreA ?? 0}</div>
            <div className="fouls">
              <Fouls value={state.foulsA ?? 0} />
            </div>
          </div>

          {/* CENTER */}
          <div className="divider-container">
            <div className="divider">-</div>
            <div className="period">{state.period || "1st HALF"}</div>
          </div>

          {/* TEAM B */}
          <div className="team-block team-b">
            <div className="score">{state.scoreB ?? 0}</div>
            <div className="team-name">{state.teamB || "Team B"}</div>
            <div className="fouls">
              <Fouls value={state.foulsB ?? 0} />
            </div>
          </div>
        </div>
      </div>

      {/* ===========================
         DYNAMIC COLORS
      =========================== */}
      <style jsx global>{`
        :root {
          --bgMain: ${state.bgMain || "#111"};
          --bgBlocks: ${state.bgBlocks || "#1a1a1a"};
          --bgTimer: ${state.bgTimer || "#1a1a1a"};
          --colorA: ${state.colorA || "#00bfff"};
          --colorB: ${state.colorB || "#ff3b3b"};
        }

        body {
          margin: 0;
          background: transparent;
          font-family: "Segoe UI", Arial, sans-serif;
        }
      `}</style>

      {/* ===========================
         SCOREBOARD STYLES
      =========================== */}
      <style jsx>{`
        .scoreboard {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 14px;
          color: white;
          padding: 10px 16px;
          background: var(--bgMain);
          border-radius: 8px;
          width: fit-content;
        }

        .timer {
          font-size: 20px;
          font-weight: 700;
          width: 80px;
          text-align: center;
          background: var(--bgTimer);
          padding: 8px;
          border-radius: 6px;
          font-variant-numeric: tabular-nums;
        }

        .teams {
          display: flex;
          align-items: center;
        }

        .team-block {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 18px;
          height: 60px;
          background: var(--bgBlocks);
          border-radius: 6px;
          position: relative;
        }

        .team-name {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .score {
          font-size: 32px;
          font-weight: 800;
          min-width: 40px;
          text-align: center;
        }

        .divider-container {
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

        .fouls {
          position: absolute;
          bottom: -16px;
        }

        .team-a::before {
          content: "";
          position: absolute;
          left: 0;
          width: 5px;
          height: 100%;
          background: var(--colorA);
        }

        .team-b::after {
          content: "";
          position: absolute;
          right: 0;
          width: 5px;
          height: 100%;
          background: var(--colorB);
        }
      `}</style>
    </>
  );
}