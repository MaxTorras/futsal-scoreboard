"use client";

import { db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

const ref = doc(db, "scoreboard", "main");

export default function Control() {
  const update = async (field: string, value: any) => {
    await updateDoc(ref, { [field]: value });
  };

  const add = async (field: string) => {
    await updateDoc(ref, { [field]: increment(1) });
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Control Panel</h1>

      <div className="flex gap-4">
        <button onClick={() => add("homeScore")}>+ Home</button>
        <button onClick={() => add("awayScore")}>+ Away</button>
      </div>

      <div className="flex gap-4">
        <button onClick={() => add("homeFouls")}>+ Foul Home</button>
        <button onClick={() => add("awayFouls")}>+ Foul Away</button>
      </div>

      <div className="flex gap-4">
        <button onClick={() => update("isRunning", true)}>Start</button>
        <button onClick={() => update("isRunning", false)}>Stop</button>
      </div>
    </div>
  );
}