// lib\firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCeK1Rdv9JoEz1Y1ARUp_yQU0Wa-vwzntc",
  authDomain: "futsalscoreboardinter.firebaseapp.com",
  projectId: "futsalscoreboardinter",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);