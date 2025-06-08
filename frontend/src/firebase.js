// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "ojudge-fa3bc.firebaseapp.com",
  projectId: "ojudge-fa3bc",
  storageBucket: "ojudge-fa3bc.firebasestorage.app",
  messagingSenderId: "756977177447",
  appId: "1:756977177447:web:4d4a6adb74f51132ea95c2",
  measurementId: "G-KYYMC4CQMJ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);