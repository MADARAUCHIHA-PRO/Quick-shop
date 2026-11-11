import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Same Firebase project as the old site. This web config is public by
// design (it is already in the old repo) — it is NOT a secret.
const firebaseConfig = {
  apiKey: "AIzaSyAQhBWcHqBXCOCF_RhFhDyCnthy3t8luZM",
  authDomain: "quick-shop-63627.firebaseapp.com",
  projectId: "quick-shop-63627",
  storageBucket: "quick-shop-63627.firebasestorage.app",
  messagingSenderId: "461073578456",
  appId: "1:461073578456:web:db6548f79b4a0af82c1aad",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
