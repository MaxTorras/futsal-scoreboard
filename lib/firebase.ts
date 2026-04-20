// lib/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCeK1Rdv9JoEz1Y1ARUp_yQU0Wa-vwzntc",
  authDomain: "futsalscoreboardinter.firebaseapp.com",
  projectId: "futsalscoreboardinter",
  storageBucket: "futsalscoreboardinter.firebasestorage.app",
  messagingSenderId: "1058352114736",
  appId: "1:1058352114736:web:ef8f27f1e97b87d4a9d1f5",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);