'use client'

import { useState } from 'react';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { db } from '@/utils/firebase';
import toast from 'react-hot-toast';

const timeSlots = {
  '2026-01-06': [
    '9:00 AM to 9:30 AM',
    '9:30 AM to 10:00 AM',
    '10:00 AM to 10:30 AM',
    '10:30 AM to 11:00 AM',
    '11:00 AM to 11:30 AM',
    '11:30 AM to 12:00 PM',
    '1:00 PM to 1:30 PM',
    '1:30 PM to 2:00 PM',
    '2:00 PM to 2:30 PM',
    '2:30 PM to 3:00 PM',
    '3:00 PM to 3:30 PM',
    '3:30 PM to 4:00 PM',
    '4:00 PM to 4:30 PM',
    '4:30 PM to 5:00 PM'
  ],
  '2026-01-07': [
    '9:00 AM to 9:30 AM',
    '9:30 AM to 10:00 AM',
    '10:00 AM to 10:30 AM',
    '10:30 AM to 11:00 AM',
    '11:00 AM to 11:30 AM',
    '11:30 AM to 12:00 PM',
    '1:00 PM to 1:30 PM',
    '1:30 PM to 2:00 PM',
    '2:00 PM to 2:30 PM',
    '2:30 PM to 3:00 PM',
    '3:00 PM to 3:30 PM',
    '3:30 PM to 4:00 PM',
    '4:00 PM to 4:30 PM',
    '4:30 PM to 5:00 PM'
  ],
  '2026-01-08': [
    '9:00 AM to 9:30 AM',
    '9:30 AM to 10:00 AM',
    '10:00 AM to 10:30 AM',
    '10:30 AM to 11:00 AM',
    '11:00 AM to 11:30 AM',
    '11:30 AM to 12:00 PM',
    '1:00 PM to 1:30 PM',
    '1:30 PM to 2:00 PM',
    '2:00 PM to 2:30 PM',
    '2:30 PM to 3:00 PM',
    '3:00 PM to 3:30 PM',
    '3:30 PM to 4:00 PM',
    '4:00 PM to 4:30 PM',
    '4:30 PM to 5:00 PM'
  ]
};

const AutoAllotButton = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);

  const findAvailableSlot = (bookedSlots) => {
    const dates = Object.keys(timeSlots);
    for (const date of dates) {
      const bookedTimesForDate = new Set(bookedSlots.filter(slot => slot.date === date).map(slot => slot.time));
      for (const time of timeSlots[date]) {
        if (!bookedTimesForDate.has(time)) {
          return { date, time };
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

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        const existingSlot = existingSlots.find(slot => 
          slot.userId === userDoc.id
        );
        if (existingSlot) continue;

        const availableSlot = findAvailableSlot(existingSlots);
        if (availableSlot) {
          const slotData = {
            date: availableSlot.date,
            time: availableSlot.time,
            name: userData.name,
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
        } else {
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