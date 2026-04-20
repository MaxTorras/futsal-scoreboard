"use client";

import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Overlay() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "scoreboard", "main"), (doc) => {
      setData(doc.data());
    });
    return () => unsub();
  }, []);

  if (!data) return null;

  return (
    <div className="w-screen h-screen flex items-end justify-center bg-transparent">
      <div className="bg-black text-white px-8 py-4 flex gap-10 text-2xl rounded-xl">
        <div>HOME {data.homeScore}</div>
        <div>{formatTime(data.time)}</div>
        <div>{data.awayScore} AWAY</div>
      </div>
    </div>
  );
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}