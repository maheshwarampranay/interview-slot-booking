// utils/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCEIPJnDpT-nuCEZuOJ23CXcac3dHVR07Q",
  authDomain: "cosc-recruitment-scheduler.firebaseapp.com",
  projectId: "cosc-recruitment-scheduler",
  storageBucket: "cosc-recruitment-scheduler.firebasestorage.app",
  messagingSenderId: "68676757796",
  appId: "1:68676757796:web:cda7683910322a70aa2bb1",
  measurementId: "G-F4KDRTCHSK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only on the client side
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export const db = getFirestore(app);
export { analytics };

export function generateTimeSlots(start, end) {
  const slots = [];
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;

  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    slots.push(timeString);
    
    currentMinute += 30;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute = 0;
    }
  }
  return slots;
}