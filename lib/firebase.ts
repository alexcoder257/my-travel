import { initializeApp } from "firebase/app";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBe1vfeHK-3jEfyRA5oYsACAGbC3J6p6LA",
  authDomain: "mmo-dashboard-89780.firebaseapp.com",
  projectId: "mmo-dashboard-89780",
  storageBucket: "mmo-dashboard-89780.firebasestorage.app",
  messagingSenderId: "987861838252",
  appId: "1:987861838252:web:88de20526038ea7c8ab209",
  measurementId: "G-KMVYM3XSQ3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Enable Offline Persistence
if (typeof window !== "undefined") {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === "unimplemented") {
      console.warn("The current browser does not support all of the features required to enable persistence");
    }
  });
}

export default app;
