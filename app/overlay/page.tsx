"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* 🟥 FOULS RENDER (KEEP OUTSIDE COMPONENT) */
function renderFouls(value: number) {
  return Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className={`card ${i < value ? "active" : ""}`} />
  ));
}

export default function OverlayPage() {
  const [state, setState] = useState<any>(null);

  /* 🔥 FIREBASE LISTENER */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "scoreboard", "main"), (snap) => {
      if (snap.exists()) {
        setState(snap.data());
      }
    });

    return () => unsub();
  }, []);

  /* ⛔ WAIT FOR DATA */
  if (!state) return null;

  return (
    <>
      <div className="scoreboard">
        <div className="timer">{state.timerDisplay || "20:00"}</div>

        <div className="teams">
          <div className="team-block team-a">
            <div className="team-name">{state.teamA || "Team A"}</div>
            <div className="score">{state.scoreA || 0}</div>
            <div className="fouls">{renderFouls(state.foulsA || 0)}</div>
          </div>

          <div className="divider-container">
            <div className="divider">-</div>
            <div className="period">{state.period || "1st HALF"}</div>
          </div>

          <div className="team-block team-b">
            <div className="score">{state.scoreB || 0}</div>
            <div className="team-name">{state.teamB || "Team B"}</div>
            <div className="fouls">{renderFouls(state.foulsB || 0)}</div>
          </div>
        </div>
      </div>

      {/* 🎨 DYNAMIC COLORS */}
      <style jsx global>{`
        :root {
          --bgMain: ${state.bgMain || "#111"};
          --bgBlocks: ${state.bgBlocks || "#1a1a1a"};
          --bgTimer: ${state.bgTimer || "#1a1a1a"};
          --colorA: ${state.colorA || "#00bfff"};
          --colorB: ${state.colorB || "#ff3b3b"};
        }
      `}</style>

      {/* 🎨 STYLES */}
      <style jsx>{`
        body {
          margin: 0;
          background: transparent;
          font-family: "Segoe UI", Arial, sans-serif;
        }

        .scoreboard {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 15px;
          color: white;
          padding: 12px 20px;
          background: var(--bgMain);
          border-radius: 6px;
          height: 60px;
          width: fit-content;
        }

        .timer {
          font-size: 20px;
          font-weight: 600;
          width: 80px;
          text-align: center;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bgTimer);
          border-radius: 6px;
          border-right: 2px solid #333;
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
          padding: 0 20px;
          height: 60px;
          border-radius: 6px;
          background: var(--bgBlocks);
          position: relative;
        }

        .team-name {
          font-size: 16px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .score {
          font-size: 34px;
          font-weight: 700;
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
          font-size: 28px;
          color: #888;
        }

        .period {
          font-size: 10px;
          color: #aaa;
        }

        .fouls {
          position: absolute;
          bottom: -18px;
          display: flex;
          gap: 4px;
        }

        .card {
          width: 10px;
          height: 14px;
          background: #333;
        }

        .card.active {
          background: white;
        }

        .team-a::before {
          content: "";
          position: absolute;
          left: 0;
          width: 6px;
          height: 100%;
          background: var(--colorA);
        }

        .team-b::after {
          content: "";
          position: absolute;
          right: 0;
          width: 6px;
          height: 100%;
          background: var(--colorB);
        }
      `}</style>
    </>
  );
}