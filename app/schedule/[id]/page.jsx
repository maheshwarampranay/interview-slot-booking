'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where,
  runTransaction,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db } from '@/utils/firebase';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { CalendarIcon, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import InstructionsModal from '@/components/InstructionsModal';
import Image from 'next/image';
import { updateDoc } from 'firebase/firestore';

const generateTimeSlots = () => {
  return [
    '09:40 AM to 10:30 AM',
    '10:30 AM to 11:20 AM', 
    '11:20 AM to 12:10 PM', 
    '12:10 PM to 01:30 PM'
  ];
};

const slotsRef = collection(db, 'slots');

export default function SchedulePage() {
  const params = useParams();
  const id = params.id;
  
  const [user, setUser] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmedSlot, setConfirmedSlot] = useState(null);
  const [existingBooking, setExistingBooking] = useState(null);
  const [bookings, setBookings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingSlot, setPendingSlot] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [loadError, setLoadError] = useState(null);
  
  const timeSlots = generateTimeSlots();
  const date = '2024-03-05';

  const fetchUserAndBookings = useCallback(async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', id));
      if (!userDoc.exists()) {
        setLoadError('Invalid participant link');
        toast.error('Invalid participant link');
        setLoading(false);
        return;
      }
  
      const userData = userDoc.data();
      setUser({ id: userDoc.id, ...userData });
  
      const bookingsRef = collection(db, 'slots');
      const userBookingQuery = query(bookingsRef, where('userId', '==', id));
      const userBookingSnap = await getDocs(userBookingQuery);
      
      if (!userBookingSnap.empty) {
        const bookingData = userBookingSnap.docs[0].data();
        setExistingBooking(bookingData);
        setConfirmedSlot({ 
          date: bookingData.date, 
          time: bookingData.time 
        });
      }
  
      const allBookingsQuery = query(bookingsRef, where('date', '==', date));
      const bookingsSnap = await getDocs(allBookingsQuery);
      const bookingsData = {};
      
      bookingsSnap.forEach(doc => {
        const data = doc.data();
        const timeSlot = data.time;
        if (!bookingsData[timeSlot]) {
          bookingsData[timeSlot] = [];
        }
        bookingsData[timeSlot].push(data);
      });
      
      setBookings(bookingsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoadError(`Failed to load schedule data: ${error.message}`);
      toast.error('Failed to load schedule data. Please try again.');
      setLoading(false);
    }
  }, [id, date]);

  useEffect(() => {
    if (id) {
      fetchUserAndBookings();
    }
  }, [id, fetchUserAndBookings]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'slots'), where('date', '==', date)),
      (snapshot) => {
        const newBookings = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          const timeSlot = data.time;
          if (!newBookings[timeSlot]) {
            newBookings[timeSlot] = [];
          }
          newBookings[timeSlot].push(data);
        });
        setBookings(newBookings);
      },
      () => {
        toast.error('Failed to sync booking updates. Please refresh the page.');
        setLoadError('Failed to sync booking updates');
      }
    );

    return () => unsubscribe();
  }, [date]);

  const handleSlotSelect = (time) => {
    const currentBookings = bookings[time] || [];
    if (currentBookings.length >= 59) {
      toast.error('This slot is fully booked');
      return;
    }

    setPendingSlot({ date, time });
    setShowConfirmation(true);
  };

  const handleConfirmSlot = async () => {
    if (isBooking) return;
    
    setIsBooking(true);
    const loadingToast = toast.loading('Booking your slot...');
    
    try {
      const { date, time } = pendingSlot;
      
      await runTransaction(db, async (transaction) => {
        // More comprehensive checks
        const existingBookingsQuery = query(
          slotsRef, 
          where('date', '==', date),
          where('time', '==', time)
        );
        const existingBookingsSnap = await getDocs(existingBookingsQuery);
        
        // Check if slot is already full (59 bookings)
        if (existingBookingsSnap.size >= 59) {
          throw new Error('This slot is now full');
        }
  
        // Check for existing bookings by this user for ANY slot
        const userExistingBookingQuery = query(
          slotsRef, 
          where('userId', '==', user.id),
          where('date', '==', date)  // Ensure same date
        );
        const userExistingBookings = await getDocs(userExistingBookingQuery);
        
        // Prevent multiple bookings on the same date
        if (!userExistingBookings.empty) {
          throw new Error('You can only book one slot per day');
        }
  
        // Create new booking
        const newBookingRef = doc(slotsRef);
        transaction.set(newBookingRef, {
          userId: user.id,
          name: user.name,
          rollNumber: user.rollNumber,
          date,
          time,
          timestamp: serverTimestamp()
        });
      });
  
      // Update user document
      await updateDoc(doc(db, 'users', user.id), {
        hasScheduled: true
      });
  
      toast.success('Slot booked successfully!', {
        id: loadingToast
      });
      
      setConfirmedSlot({ date, time });
      setSelectedSlot({ date, time });
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error booking slot:', error);
      toast.error(error.message || 'Failed to book slot. Please try another time.', {
        id: loadingToast
      });
    } finally {
      setIsBooking(false);
    }
  };

  const isSlotBooked = (time) => {
    const currentBookings = bookings[time] || [];
    return currentBookings.length >= 59;
  };
  const renderTimeSlot = (time) => {
    const currentBookings = bookings[time] || [];
    const availableSlots = 59 - currentBookings.length;
    const isBooked = isSlotBooked(time);
    const isSelected = selectedSlot?.time === time;
    
    return (
      <Button
        key={time}
        onClick={() => handleSlotSelect(time)}
        disabled={isBooked || isSelected || confirmedSlot}
        className={`p-2 text-sm whitespace-normal h-auto ${
          isSelected
            ? 'bg-green-500 hover:bg-green-600'
            : isBooked
            ? 'bg-gray-300 text-black cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        <div className="flex flex-col items-center">
          <span>{time}</span>
          <span className="text-xs">
            {availableSlots} slots available
          </span>
        </div>
      </Button>
    );
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadError && !confirmedSlot) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (confirmedSlot || existingBooking) {
    const slot = confirmedSlot || existingBooking;

    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl text-green-600">
            Slot Confirmed!
          </CardTitle>
          <Image
            src="/cosc.svg"
            alt="COSC Logo"
            width={64}
            height={64}
            className="object-contain"
          />
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="bg-green-50 rounded-lg p-6 space-y-4">
            <p className="text-lg font-medium">Hi {user?.name}, your slot is confirmed!</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-green-600" />
                <span>March 5th, 2024</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span>{slot.time}</span>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-3">
                Please arrive at CSE Lab 8 or DF Lab 5 minutes before your slot.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <InstructionsModal 
        isOpen={showInstructions} 
        onClose={() => setShowInstructions(false)} 
      />

      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-black">Hey there, {user?.name}! 🎉</CardTitle>
            <p className="text-gray-600">Select your slot for the Decipher on March 5th</p>
          </div>
          <Image
            src="/cosc.svg"
            alt="COSC Logo"
            width={64}
            height={64}
            className="object-contain"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div key="2024-03-05" className="space-y-4">
              <h3 className="text-lg font-semibold text-black">
                Decipher - Slot Selection
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-black mb-2">
                    Available Slots
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map(time => renderTimeSlot(time))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationModal 
        isOpen={showConfirmation}
        onConfirm={handleConfirmSlot}
        onCancel={() => {
          setShowConfirmation(false);
          setPendingSlot(null);
        }}
        date="March 5th, 2024"
        time={pendingSlot?.time}
      />
    </>
  );
}