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
import { CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import InstructionsModal from '@/components/InstructionsModal';
import Image from 'next/image';
import { updateDoc } from 'firebase/firestore';

const generateTimeSlots = () => {
  return [
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
  const dates = ['2026-01-06', '2026-01-07', '2026-01-08'];
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [dateIndex, setDateIndex] = useState(0);

  const morningSlots = timeSlots.slice(0, 5);
  const afternoonSlots = timeSlots.slice(5, 11);
  const eveningSlots = timeSlots.slice(11);

  const nextDate = () => {
    if (dateIndex < dates.length - 1) {
      const newIndex = dateIndex + 1;
      setDateIndex(newIndex);
      setSelectedDate(dates[newIndex]);
    }
  };

  const prevDate = () => {
    if (dateIndex > 0) {
      const newIndex = dateIndex - 1;
      setDateIndex(newIndex);
      setSelectedDate(dates[newIndex]);
    }
  };

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
  
      const allBookingsQuery = query(bookingsRef, where('date', 'in', dates));
      const bookingsSnap = await getDocs(allBookingsQuery);
      const bookingsData = {};
      
      bookingsSnap.forEach(doc => {
        const data = doc.data();
        const slotKey = `${data.date}-${data.time}`;
        if (!bookingsData[slotKey]) {
          bookingsData[slotKey] = [];
        }
        bookingsData[slotKey].push(data);
      });
      
      setBookings(bookingsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoadError(`Failed to load schedule data: ${error.message}`);
      toast.error('Failed to load schedule data. Please try again.');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchUserAndBookings();
    }
  }, [id, fetchUserAndBookings]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'slots'), where('date', 'in', dates)),
      (snapshot) => {
        const newBookings = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          const slotKey = `${data.date}-${data.time}`;
          if (!newBookings[slotKey]) {
            newBookings[slotKey] = [];
          }
          newBookings[slotKey].push(data);
        });
        setBookings(newBookings);
      },
      () => {
        toast.error('Failed to sync booking updates. Please refresh the page.');
        setLoadError('Failed to sync booking updates');
      }
    );

    return () => unsubscribe();
  }, [id]);

  const handleSlotSelect = (time, date) => {
    const slotKey = `${date}-${time}`;
    const currentBookings = bookings[slotKey] || [];
    if (currentBookings.length >= 3) {
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
        
        // Check if slot is already full (3 bookings)
        if (existingBookingsSnap.size >= 3) {
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

  const isSlotBooked = (slotKey) => {
    const currentBookings = bookings[slotKey] || [];
    return currentBookings.length >= 3;
  };
  function renderTimeSlot(time, date) {
    const slotKey = `${date}-${time}`;
    const currentBookings = bookings[slotKey] || [];
    const availableSlots = 3 - currentBookings.length;
    const isBooked = isSlotBooked(slotKey);
    const isSelected = selectedSlot?.date === date && selectedSlot?.time === time;
    
    return (
      <Button
        key={slotKey}
        onClick={() => handleSlotSelect(time, date)}
        disabled={isBooked || isSelected || confirmedSlot}
        className={`p-1.5 text-xs sm:text-sm whitespace-normal h-auto ${
          isSelected
            ? 'bg-green-500 hover:bg-green-600'
            : isBooked
            ? 'bg-gray-300 text-black cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        <div className="flex flex-col items-center">
          <span className="text-xs sm:text-sm">{time}</span>
          <span className="text-[10px] sm:text-xs opacity-80">
            {availableSlots} slots available
          </span>
        </div>
      </Button>
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-4 sm:mt-8 p-2 sm:p-0">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
            <p className="text-sm sm:text-base">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadError && !confirmedSlot) {
    return (
      <Card className="w-full max-w-md mx-auto mt-4 sm:mt-8 p-2 sm:p-0">
        <CardContent className="p-4 sm:p-6">
          <Alert variant="destructive">
            <AlertDescription className="text-sm sm:text-base">{loadError}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (confirmedSlot || existingBooking) {
    const slot = confirmedSlot || existingBooking;

    return (
      <Card className="w-full max-w-md mx-auto mt-4 sm:mt-8 p-2 sm:p-0">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl text-green-600">
            Slot Confirmed!
          </CardTitle>
          <Image
            src="/cosc.svg"
            alt="COSC Logo"
            width={48}
            height={48}
            className="object-contain w-12 h-12 sm:w-16 sm:h-16"
          />
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="bg-green-50 rounded-lg p-4 sm:p-6 space-y-4">
            <p className="text-base sm:text-lg font-medium">Hi {user?.name}, your slot is confirmed!</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="text-sm sm:text-base">March 5th, 2024</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="text-sm sm:text-base">{slot.time}</span>
              </div>
            </div>
            <div className="mt-4 sm:mt-6">
              <p className="text-xs sm:text-sm text-gray-600 mb-3">
                The interview link will be sent to you via email 10 minutes before your scheduled interview time.
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

      <Card className="w-full max-w-4xl mx-auto mt-4 sm:mt-8 p-2 sm:p-0 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 sticky top-0 bg-white z-10">
          <div>
            <CardTitle className="text-xl sm:text-2xl text-black">Hey there, {user?.name}! 🎉</CardTitle>
            <p className="text-sm sm:text-base text-gray-600">Select your interview slot for COSC Recruitments</p>
          </div>
          <Image
            src="/cosc.svg"
            alt="COSC Logo"
            width={48}
            height={48}
            className="object-contain w-12 h-12 sm:w-16 sm:h-16"
          />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-semibold text-black">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            
            <div className="flex items-center justify-center space-x-2 bg-gray-50 p-2 rounded">
              <Button onClick={prevDate} disabled={dateIndex === 0} className="p-1" variant="ghost">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {dates.map(date => (
                <Button
                  key={date}
                  onClick={() => {
                    setSelectedDate(date);
                    setDateIndex(dates.indexOf(date));
                  }}
                  className={`px-4 py-2 ${selectedDate === date ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-transparent text-black hover:bg-gray-200'}`}
                  variant="ghost"
                >
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Button>
              ))}
              <Button onClick={nextDate} disabled={dateIndex === dates.length - 1} className="p-1" variant="ghost">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div key={selectedDate} className="space-y-3 transition-opacity duration-300">
                <div>
                  <h4 className="text-sm font-medium text-left text-black">Morning</h4>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {morningSlots.map(time => renderTimeSlot(time, selectedDate))}
                  </div>
                </div>
                <hr className="border-gray-200 opacity-20" />
                <div>
                  <h4 className="text-sm font-medium text-left text-black">Afternoon</h4>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {afternoonSlots.map(time => renderTimeSlot(time, selectedDate))}
                  </div>
                </div>
                <hr className="border-gray-200 opacity-20" />
                <div>
                  <h4 className="text-sm font-medium text-left text-black">Evening</h4>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {eveningSlots.map(time => renderTimeSlot(time, selectedDate))}
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
        date={pendingSlot?.date}
        time={pendingSlot?.time}
      />
    </>
  );

  // Slot rendering method with mobile-friendly adjustments
  
}