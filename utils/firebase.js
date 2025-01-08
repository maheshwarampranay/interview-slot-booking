// utils/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDmLgTCorIrrEVaVjaAVj7yN7LktcVd0MY",
    authDomain: "spotify-clone-5ab74.firebaseapp.com",
    projectId: "spotify-clone-5ab74",
    storageBucket: "spotify-clone-5ab74.appspot.com",
    messagingSenderId: "607253520689",
    appId: "1:607253520689:web:c060daef5f1c897b2b9010"
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