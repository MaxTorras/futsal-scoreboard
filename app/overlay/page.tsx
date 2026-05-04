// app\overlay\page.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import "../overlay/scoreboard.css";

/* ---------------------------
   FOULS
---------------------------- */
function Fouls({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(5, value));

  // FIX: use array join to avoid trailing space after last dot
  const filled = Array(safe).fill("●");
  const empty = Array(5 - safe).fill("○");
  return (
    <div className="fouls">
      {[...filled, ...empty].join(" ")}
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
   MAIN OVERLAY
---------------------------- */
export default function OverlayPage() {
  const [data, setData] = useState<any>(null);
  const [tick, setTick] = useState(0);

  /* ---------------------------
     FIRESTORE
  ---------------------------- */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "scoreboard", "main"), (snap) => {
      if (snap.exists()) {
        setData(snap.data());
      }
    });

    return () => unsub();
  }, []);

  /* ---------------------------
     LIVE TIMER TICK
  ---------------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  /* ---------------------------
     TIMER CALCULATION (LIVE)
  ---------------------------- */
  let remaining = data?.timer?.remaining ?? 0;
  const timer = data?.timer;

  if (timer?.running) {
    const now = Date.now();
    const elapsed = Math.floor((now - (timer?.lastUpdate ?? now)) / 1000);
    remaining = Math.max((timer?.remaining ?? 0) - elapsed, 0);
  }

  const time = formatTime(remaining);

  // FIX: read team colors from Firestore so they reflect control-page changes
  const colorA = data?.teams?.a?.color ?? "#781030";
  const colorB = data?.teams?.b?.color ?? "#ff0000";

  return (
    <div className="scoreboard-wrapper">

      <div className="scoreboard">

        {/* TIMER */}
        <div className="timer-container">
          <div className="timer">
            <div id="minutage">{time}</div>
            <div className="period">{data?.period ?? "2nd HALF"}</div>
          </div>
        </div>

        {/* TEAMS */}
        <div className="teams">

          {/* TEAM A — FIX: inline color from Firestore */}
          <div className="team-block-a" style={{ background: colorA }}>
            {data?.teams?.a?.logo && (
              <img src={data.teams.a.logo} className="logo" alt="Team A logo" />
            )}
            <div className="teamName">{data?.teams?.a?.name ?? "HOME"}</div>
          </div>

          {/* SCORE */}
          <div className="divider-container">
            <div className="score score-left">{data?.score?.a ?? 0}</div>
            <div className="divider">-</div>
            <div className="score score-right">{data?.score?.b ?? 0}</div>
          </div>

          {/* TEAM B — FIX: inline color from Firestore */}
          <div className="team-block-b" style={{ background: colorB }}>
            <div className="teamName">{data?.teams?.b?.name ?? "AWAY"}</div>
            {data?.teams?.b?.logo && (
              <img src={data.teams.b.logo} className="logo" alt="Team B logo" />
            )}
          </div>

        </div>
      </div>

      {/* FOULS — FIX: order is home (a) left, away (b) right to match scoreboard */}
      <div className="scoreboard-extension">

        <div className="fouls" id="fouls-a">
          <Fouls value={data?.fouls?.a ?? 0} />
        </div>

        <div className="fouls" id="fouls-b">
          <Fouls value={data?.fouls?.b ?? 0} />
        </div>

      </div>

      <style jsx global>{`
        body {
          margin: 0;
          background: transparent;
        }
      `}</style>

    </div>
  );
}