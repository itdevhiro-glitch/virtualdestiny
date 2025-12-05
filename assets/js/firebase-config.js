// assets/js/firebase-config.js
// Created by Hiro

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDbfyMoe0CKmSc2V8naelne2CIUPX214J0",
  authDomain: "vdcommunity-33479.firebaseapp.com",
  projectId: "vdcommunity-33479",
  storageBucket: "vdcommunity-33479.firebasestorage.app",
  messagingSenderId: "522966215216",
  appId: "1:522966215216:web:632115cecd870e273a1bf5",
  measurementId: "G-98EE9MNK85"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, analytics };