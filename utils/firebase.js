// utils/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC-BbbEwgAfcAGcJdKOr3fT9S3oNhQvMwI",
  authDomain: "scheduler-73212.firebaseapp.com",
  projectId: "scheduler-73212",
  storageBucket: "scheduler-73212.firebasestorage.app",
  messagingSenderId: "470613926780",
  appId: "1:470613926780:web:9b055efdcea0bf674c7af9"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

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