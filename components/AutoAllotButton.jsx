'use client'

import { useState } from 'react';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { db } from '@/utils/firebase';
import toast from 'react-hot-toast';

const timeSlots = {
  '2024-03-05': [
    '09:40 AM to 10:30 AM',
    '10:30 AM to 11:20 AM', 
    '11:20 AM to 12:10 PM', 
    '12:10 PM to 01:30 PM'
  ]
};

const AutoAllotButton = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);

  const findAvailableSlot = (bookedSlots) => {
    const bookedTimes = new Set(bookedSlots.map(slot => slot.time));
    
    for (const time of timeSlots['2024-03-05']) {
      if (!bookedTimes.has(time)) {
        return time;
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
      const date = '2024-03-05';

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        const existingSlot = existingSlots.find(slot => 
          slot.userId === userDoc.id
        );
        if (existingSlot) continue;

        const availableTime = findAvailableSlot(existingSlots);
        if (availableTime) {
          const slotData = {
            date,
            time: availableTime,
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