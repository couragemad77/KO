// Initialize Firebase Client SDK with modular imports
// Using standard modular path for Firebase v9+ SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDypwdoRY8jDH17lROLT9mCVCpCTEaOE0",
  authDomain: "knockout-7d62d.firebaseapp.com",
  projectId: "knockout-7d62d",
  storageBucket: "knockout-7d62d.firebasestorage.app",
  messagingSenderId: "246737296390",
  appId: "1:246737296390:web:efc2b3444a5dc0c8ecf787"
};

// Use initializeApp from the modular SDK to initialize the app instance
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it for use in services
export const db = getFirestore(app);