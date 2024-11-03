import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyB5VLN7KUd3CpJsc2ubKikvRJkd_hat4u8",
  authDomain: "warehouseapp-b85de.firebaseapp.com",
  projectId: "warehouseapp-b85de",
  storageBucket: "warehouseapp-b85de.firebasestorage.app",
  messagingSenderId: "535089462672",
  appId: "1:535089462672:web:edb68bd9ee8609a51dc715",
  measurementId: "G-315TGMCNN3"
};

let app;
let db;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  // Only initialize analytics if window is defined (browser environment)
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

export { db, analytics };
export default app;