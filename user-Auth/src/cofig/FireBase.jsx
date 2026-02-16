// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";

import  {getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeIDJr4YT1Mw6-P71v0DW1hupnzA_ga-0",
  authDomain: "user-todo-auth-c8d11.firebaseapp.com",
  projectId: "user-todo-auth-c8d11",
  storageBucket: "user-todo-auth-c8d11.firebasestorage.app",
  messagingSenderId: "95453067430",
  appId: "1:95453067430:web:468b7675b6f0c0904b9c67"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth= getAuth();
export const db= getFirestore(app);
export default app ; 