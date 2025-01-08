'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db, generateTimeSlots } from '@/utils/firebase';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { CalendarIcon, Clock, MessageCircle } from 'lucide-react';

const WHATSAPP_GROUPS = {
    '1': 'https://chat.whatsapp.com/panel1link',
    '2': 'https://chat.whatsapp.com/panel2link',
    '3': 'https://chat.whatsapp.com/panel3link',
    '4': 'https://chat.whatsapp.com/panel4link',
  };

export default function SchedulePage() {
  const params = useParams();
  const id = params.id;
  
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmedSlot, setConfirmedSlot] = useState(null);
  const [existingBooking, setExistingBooking] = useState(null);
  const [bookings, setBookings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingSlot, setPendingSlot] = useState(null);

  const dates = ['2025-01-10', '2025-01-11'];
  const morningSlots = generateTimeSlots('10:00', '13:00');
  const afternoonSlots = generateTimeSlots('14:00', '17:00');

  useEffect(() => {
    if (id) {
      fetchUserAndBookings();
    }
  }, [id]);

  const fetchUserAndBookings = async () => {
    try {
      // Fetch user data
      const userDoc = await getDoc(doc(db, 'users', id));
      if (!userDoc.exists()) {
        setError('Invalid interview link');
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      setUser({ id: userDoc.id, ...userData });

      // Fetch bookings for the specific panel
      const bookingsRef = collection(db, 'bookings');
      const panelBookingsQuery = query(bookingsRef, where('panel', '==', userData.panel));
      const bookingsSnap = await getDocs(panelBookingsQuery);
      const bookingsData = {};
      
      bookingsSnap.forEach(doc => {
        const data = doc.data();
        const key = `${data.date}-${data.time}`;
        if (!bookingsData[key]) bookingsData[key] = [];
        bookingsData[key].push(data);
        
        // If this booking belongs to current user, set it as existing booking
        if (data.userId === userDoc.id) {
          setExistingBooking(data);
          setConfirmedSlot({ date: data.date, time: data.time });
        }
      });
      
      setBookings(bookingsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleSlotSelect = (date, time) => {
    const slotKey = `${date}-${time}`;
    const currentBookings = bookings[slotKey] || [];

    if (currentBookings.length >= 1) {
      setError('This slot is already booked');
      return;
    }

    setPendingSlot({ date, time });
    setShowConfirmation(true);
  };

  const handleConfirmSlot = async () => {
    try {
      const { date, time } = pendingSlot;
      
      await addDoc(collection(db, 'bookings'), {
        userId: user.id,
        name: user.name,
        rollNumber: user.rollNumber,
        panel: user.panel,
        date,
        time,
        timestamp: new Date()
      });

      await updateDoc(doc(db, 'users', user.id), {
        hasScheduled: true
      });

      setConfirmedSlot({ date, time });
      setSelectedSlot({ date, time });
      setShowConfirmation(false);
      setError('');
    } catch (error) {
      console.error('Error booking slot:', error);
      setError('Failed to book slot');
      setShowConfirmation(false);
    }
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

  if (error && !confirmedSlot) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
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
        <CardHeader>
          <CardTitle className="text-2xl text-green-600">
            {confirmedSlot ? 'Interview Scheduled!' : 'Your Interview Details'}
          </CardTitle>
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
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-2xl text-purple-600">Welcome, {user?.name}! 🎉</CardTitle>
          <p className="text-gray-600">Please choose your preferred interview time slot for Panel {user?.panel}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {dates.map(date => (
              <div key={date} className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-600">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-purple-500 mb-2">
                      Morning Slots (10 AM - 1 PM)
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {morningSlots.map(time => {
                        const slotKey = `${date}-${time}`;
                        const isBooked = (bookings[slotKey]?.length ?? 0) > 0;
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
                                ? 'bg-gray-300'
                                : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                          >
                            {time}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-purple-500 mb-2">
                      Afternoon Slots (2 PM - 5 PM)
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {afternoonSlots.map(time => {
                        const slotKey = `${date}-${time}`;
                        const isBooked = (bookings[slotKey]?.length ?? 0) > 0;
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
                                ? 'bg-gray-300'
                                : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                          >
                            {time}
                          </Button>
                        );
                      })}
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