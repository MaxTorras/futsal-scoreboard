"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import "../overlay/scoreboard.css"

/* ---------------------------
   FOULS
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

  /* ---------------------------
     FIRESTORE
  ---------------------------- */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "scoreboard", "main"), (snap) => {
      const data = snap.data();
      if (!data) return;

      setScoreA(data?.score?.a ?? 0);
      setScoreB(data?.score?.b ?? 0);

      const t = data?.timer?.remaining ?? 0;
      setTime(formatTime(t));

      setTeamA(data?.teams?.a?.name ?? "HOME");
      setTeamB(data?.teams?.b?.name ?? "AWAY");

      setLogoA(data?.teams?.a?.logo ?? "");
      setLogoB(data?.teams?.b?.logo ?? "");

      setFoulsA(data?.fouls?.a ?? 0);
      setFoulsB(data?.fouls?.b ?? 0);

      setColorA(data?.teams?.a?.color ?? "");
      setColorB(data?.teams?.b?.color ?? "");

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
  <div className="team-block-a">
    <img src={logoA} className="logo" />
    <div className="teamName">{teamA}</div>
  </div>



  <div className="divider-container">
     <div className="score score-left" id="score-a">{scoreA}</div>
<div className="divider">-</div>
<div className="score score-right" id="score-b">{scoreB}</div>
  </div>



  {/* TEAM B */}
  <div className="team-block-b">
    <div className="teamName">{teamB}</div>
    <img src={logoB} className="logo" />
  </div>

</div>
      </div>

      {/* EXTENSION (MATCHES ORIGINAL IDS) */}
      <div className="scoreboard-extension">

        <div className="fouls" id="fouls-b">
          <Fouls value={foulsB} />
        </div>

        <div className="fouls" id="fouls-a">
          <Fouls value={foulsA} />
        </div>

      </div>

      {/* GLOBAL FIX */}
      <style jsx global>{`
        body {
          margin: 0;
          background: transparent;
        }
      `}</style>

    </div>
  );
}