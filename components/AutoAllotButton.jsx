'use client'

import { useState } from 'react';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { db } from '@/utils/firebase';
import toast from 'react-hot-toast';

const timeSlots = {
  '2025-01-10': {
    morning: ['10:00', '10:25', '10:50', '11:15', '11:40', '12:05', '12:30'],
    afternoon: ['14:00', '14:25', '14:50', '15:15', '15:40', '16:05', '16:30'],
    evening: ['17:00', '17:25']
  },
  '2025-01-11': {
    morning: ['10:00', '10:25', '10:50', '11:15', '11:40', '12:05', '12:30'],
    afternoon: ['14:00', '14:25', '14:50', '15:15', '15:40', '16:05', '16:30'],
    evening: ['17:00', '17:25']
  }
};

const AutoAllotButton = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);

  const findAvailableSlot = (bookedSlots, date, panel) => {
    const panelBookings = bookedSlots.filter(slot => 
      slot.panel === panel && slot.date === date
    );
    
    const bookedTimes = new Set(panelBookings.map(slot => slot.time));
    
    for (const period of ['morning', 'afternoon', 'evening']) {
      for (const time of timeSlots[date][period]) {
        if (!bookedTimes.has(time)) {
          return time;
        }
      }
    }
    return null;
  };

  const autoAllotSlots = async () => {
    const toastId = toast.loading('Auto-allotting slots...');
    try {
      setLoading(true);

      const slotsSnapshot = await getDocs(collection(db, 'slots'));
      const existingSlots = slotsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const usersQuery = query(
        collection(db, 'users'),
        where('hasScheduled', '==', false)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      let allotmentCount = 0;
      const dates = Object.keys(timeSlots);

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        const existingSlot = existingSlots.find(slot => 
          slot.userId === userDoc.id || slot.email === userData.email
        );
        if (existingSlot) continue;

        let allocated = false;
        for (const date of dates) {
          const availableTime = findAvailableSlot(existingSlots, date, userData.panel);
          if (availableTime) {
            const slotData = {
              date,
              time: availableTime,
              panel: userData.panel,
              name: userData.name,
              email: userData.email,
              rollNumber: userData.rollNumber,
              userId: userDoc.id,
              createdAt: new Date()
            };

            await addDoc(collection(db, 'slots'), slotData);
            
            await updateDoc(doc(db, 'users', userDoc.id), {
              hasScheduled: true
            });

            existingSlots.push(slotData);
            allotmentCount++;
            allocated = true;
            break;
          }
        }

        if (!allocated) {
          console.warn(`Could not find slot for user: ${userData.name}`);
        }
      }

      toast.success(`Successfully allocated ${allotmentCount} slots`, { id: toastId });
      if (onComplete) onComplete();

    } catch (error) {
      console.error('Error in auto-allotment:', error);
      toast.error('Failed to auto-allot slots. Please try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={autoAllotSlots}
      disabled={loading}
      className="bg-purple-600 hover:bg-purple-700"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : null}
      Auto Allot Slots
    </Button>
  );
};

export default AutoAllotButton;