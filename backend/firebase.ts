
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBDypwdoRY8jDH17lROLT9mCVCpCTEaOE0",
  authDomain: "knockout-7d62d.firebaseapp.com",
  projectId: "knockout-7d62d",
  databaseURL: "https://knockout-7d62d-default-rtdb.firebaseio.com",
  storageBucket: "knockout-7d62d.firebasestorage.app",
  messagingSenderId: "246737296390",
  appId: "1:246737296390:web:efc2b3444a5dc0c8ecf787"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const rtdb = getDatabase(app);
