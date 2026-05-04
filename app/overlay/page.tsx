"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ---------------------------
   FOULS COMPONENT
---------------------------- */
function Fouls({ value }: { value: number }) {
  return (
    <div className="fouls">
      {"● ".repeat(value) + "○ ".repeat(5 - value)}
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
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const [time, setTime] = useState("20:00");

  const [teamA, setTeamA] = useState("HOME");
  const [teamB, setTeamB] = useState("AWAY");

  const [logoA, setLogoA] = useState("");
  const [logoB, setLogoB] = useState("");

  const [foulsA, setFoulsA] = useState(0);
  const [foulsB, setFoulsB] = useState(0);

  const [colorA, setColorA] = useState("");
  const [colorB, setColorB] = useState("");

  const [period, setPeriod] = useState("2nd HALF");

  /* ===========================
     FIRESTORE LISTENER (single source of truth)
  =========================== */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "scoreboard", "main"), (snap) => {
      const data = snap.data();
      if (!data) return;

      // SCORE
      setScoreA(data?.score?.a ?? 0);
      setScoreB(data?.score?.b ?? 0);

      // TIMER
      const t = data?.timer?.remaining ?? 0;
      setTime(formatTime(t));

      // TEAMS
      setTeamA(data?.teams?.a?.name ?? "HOME");
      setTeamB(data?.teams?.b?.name ?? "AWAY");

      // LOGOS
      setLogoA(data?.teams?.a?.logo ?? "");
      setLogoB(data?.teams?.b?.logo ?? "");

      // FOULS
      setFoulsA(data?.fouls?.a ?? 0);
      setFoulsB(data?.fouls?.b ?? 0);

      // COLORS
      setColorA(data?.teams?.a?.color ?? "");
      setColorB(data?.teams?.b?.color ?? "");

      // PERIOD
      setPeriod(data?.period ?? "2nd HALF");
    });

    return () => unsub();
  }, []);

  return (
    <div className="scoreboard-wrapper">
      <div className="scoreboard">

        {/* TIMER */}
        <div className="timer-container">
          <div className="timer">
            <div id="minutage">{time}</div>
            <div className="period">{period}</div>
          </div>
        </div>

        {/* TEAMS */}
        <div className="teams">

          {/* TEAM A */}
          <div
            className="team-block team-block-a"
            style={{ background: colorA }}
          >
            {logoA && <img src={logoA} className="logo" />}

            <div className="teams">{teamA}</div>

            <div className="score">{scoreA}</div>

            <Fouls value={foulsA} />
          </div>

          {/* DIVIDER */}
          <div className="divider-container">
            <div className="divider">-</div>
          </div>

          {/* TEAM B */}
          <div
            className="team-block team-block-b"
            style={{ background: colorB }}
          >
            <div className="score">{scoreB}</div>

            <div className="team-block-b-inner">
              <div className="teams">{teamB}</div>
              {logoB && <img src={logoB} className="logo" />}
            </div>

            <Fouls value={foulsB} />
          </div>

        </div>
      </div>

      {/* OPTIONAL EXTENSION AREA */}
      <div className="scoreboard-extension">
        <div className="fouls">
          <Fouls value={foulsB} />
        </div>

        <div className="fouls">
          <Fouls value={foulsA} />
        </div>
      </div>

      {/* GLOBAL CSS VARIABLES */}
      <style jsx global>{`
        :root {
          --color-a: ${colorA || "#00bfff"};
          --color-b: ${colorB || "#ff3b3b"};
        }

        body {
          margin: 0;
          background: transparent;
        }
      `}</style>
    </div>
  );
}