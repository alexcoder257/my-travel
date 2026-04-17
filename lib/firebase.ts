import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

export default app;
