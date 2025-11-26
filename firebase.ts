import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBbnIvFqCYrFWgFyDPmHFFfWAWqY0lznB8",
  authDomain: "ndbrain-5eee8.firebaseapp.com",
  databaseURL: "https://ndbrain-5eee8-default-rtdb.firebaseio.com",
  projectId: "ndbrain-5eee8",
  storageBucket: "ndbrain-5eee8.firebasestorage.app",
  messagingSenderId: "808584447476",
  appId: "1:808584447476:web:e2a99e2587bd555e34a5a1",
  measurementId: "G-5ED83GWPVW"
};

const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        console.warn("Persistence failed: Multiple tabs open");
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn("Persistence failed: Browser not supported");
    }
  });

export const googleProvider = new firebase.auth.GoogleAuthProvider();