// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "algoquest-e0a04.firebaseapp.com",
  projectId: "algoquest-e0a04",
  storageBucket: "algoquest-e0a04.firebasestorage.app",
  messagingSenderId: "1017749785628",
  appId: "1:1017749785628:web:af73a25dc13b5fe370a3d9",
  measurementId: "G-02FGR78HXD"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);