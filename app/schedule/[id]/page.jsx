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
import { CalendarIcon, Clock, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import InstructionsModal from '@/components/InstructionsModal';
import Image from 'next/image';

const WHATSAPP_GROUPS = {
  '1': 'https://chat.whatsapp.com/E2L5kn6IJ9SEuysmp6GyKv',
  '2': 'https://chat.whatsapp.com/CGb5zQI16FtJ0mU1dN6b3r',
  '3': 'https://chat.whatsapp.com/Kjdt1ponnoO6RdqMQ7Y639',
  '4': 'https://chat.whatsapp.com/JKdr7TRZsUFHiQKXWWSg95',
};

const generateTimeSlots = (startTime, endTime) => {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    
    if (timeString !== '12:55' && timeString !== '16:55') {
      slots.push(timeString);
    }
    
    currentMinute += 25;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute = currentMinute - 60;
    }
  }
  
  return slots;
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
  const [pendingBookings, setPendingBookings] = useState(new Set());
  const [loadError, setLoadError] = useState(null);
  
  const dates = ['2025-01-10', '2025-01-11'];
  const morningSlots = generateTimeSlots('10:00', '13:00');
  const afternoonSlots = generateTimeSlots('14:00', '17:00');
  const eveningSlots = ['17:00', '17:25'];

  const fetchUserAndBookings = useCallback(async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', id));
      if (!userDoc.exists()) {
        setLoadError('Invalid interview link');
        toast.error('Invalid interview link');
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
        setConfirmedSlot({ date: bookingData.date, time: bookingData.time });
      }
  
      const panelBookingsQuery = query(bookingsRef, where('panel', '==', userData.panel));
      const bookingsSnap = await getDocs(panelBookingsQuery);
      const bookingsData = {};
      
      bookingsSnap.forEach(doc => {
        const data = doc.data();
        const key = `${data.date}-${data.time}`;
        bookingsData[key] = data;
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
    if (user?.panel) {
      const unsubscribe = onSnapshot(
        query(collection(db, 'slots'), where('panel', '==', user.panel)),
        (snapshot) => {
          const newBookings = {};
          snapshot.forEach(doc => {
            const data = doc.data();
            const key = `${data.date}-${data.time}`;
            newBookings[key] = data;
          });
          setBookings(newBookings);
        },
        () => {
          toast.error('Failed to sync booking updates. Please refresh the page.');
          setLoadError('Failed to sync booking updates');
        }
      );

      return () => unsubscribe();
    }
  }, [user?.panel]);

  const handleSlotSelect = (date, time) => {
    const slotKey = `panel${user?.panel}-${date}-${time}`;
    if (bookings[slotKey]) {
      toast.error('This slot is already booked');
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
      const slotKey = `${date}-${time}`;
      
      setPendingBookings(prev => new Set(prev).add(slotKey));
      
      await runTransaction(db, async (transaction) => {
        const slotRef = doc(slotsRef, slotKey);
        const slotDoc = await transaction.get(slotRef);
        
        if (slotDoc.exists()) {
          throw new Error('This slot was just taken by someone else');
        }

        const existingBookingsQuery = query(slotsRef, where('userId', '==', user.id));
        const existingBookings = await getDocs(existingBookingsQuery);
        
        if (!existingBookings.empty) {
          throw new Error('You already have an active booking');
        }

        transaction.set(slotRef, {
          userId: user.id,
          name: user.name,
          rollNumber: user.rollNumber,
          panel: user.panel,
          date,
          time,
          timestamp: serverTimestamp()
        });

        transaction.update(doc(db, 'users', user.id), {
          hasScheduled: true
        });
      });

      toast.success('Interview slot booked successfully!', {
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
      setPendingBookings(prev => {
        const next = new Set(prev);
        next.delete(`${pendingSlot.date}-${pendingSlot.time}`);
        return next;
      });
    }
  };

  const isSlotBooked = (date, time) => {
    const slotKey = `${date}-${time}`;
    return bookings[slotKey] || pendingBookings.has(slotKey);
  };

  const renderTimeSlot = (date, time) => {
    const isBooked = isSlotBooked(date, time);
    const isSelected = selectedSlot?.date === date && selectedSlot?.time === time;
    
    return (
      <Button
        key={time}
        onClick={() => handleSlotSelect(date, time)}
        disabled={isBooked || isSelected || confirmedSlot}
        className={`p-2 text-sm ${
          isSelected
            ? 'bg-green-500 hover:bg-green-600'
            : isBooked
            ? 'bg-gray-300 text-black cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {time}
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
    const formattedDate = new Date(slot.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl text-green-600">
            {confirmedSlot ? 'Interview Scheduled!' : 'Your Interview Details'}
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
            <p className="text-lg font-medium">Hi {user?.name}, your interview has been scheduled!</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-green-600" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span>{slot.time}</span>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-3">
                Please join the meet 5 minutes before your scheduled time.
              </p>
              <a 
                href={WHATSAPP_GROUPS[user?.panel]} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Join Panel {user?.panel} WhatsApp Group
                </Button>
              </a>
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
            <p className="text-gray-600">Please choose your preferred interview time slot</p>
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
            {dates.map(date => (
              <div key={date} className="space-y-4">
                <h3 className="text-lg font-semibold text-black">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-black mb-2">
                      Morning Slots (10 AM - 1 PM)
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {morningSlots.map(time => renderTimeSlot(date, time))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-black mb-2">
                      Afternoon Slots (2 PM - 5 PM)
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {afternoonSlots.map(time => renderTimeSlot(date, time))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-black mb-2">
                    Evening Slots (5 PM - 6 PM)
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {eveningSlots.map(time => renderTimeSlot(date, time))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
}