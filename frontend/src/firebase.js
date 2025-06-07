// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "online-judge-e567c.firebaseapp.com",
  projectId: "online-judge-e567c",
  storageBucket: "online-judge-e567c.appspot.com",
  messagingSenderId: "539689679295",
  appId: "1:539689679295:web:94f9630e1957b60283490a"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);