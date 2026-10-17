import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9yj3ikv7oIsBhU7IE9XPclY3vul5d9us",
  authDomain: "edugm-bangla.firebaseapp.com",
  projectId: "edugm-bangla",
  storageBucket: "edugm-bangla.firebasestorage.app",
  messagingSenderId: "236553092510",
  appId: "1:236553092510:web:91f03b4434616c06846a8f"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
