'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';

const dates = ['2026-01-06', '2026-01-07', '2026-01-08'];

const TIME_SLOTS = [
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

export default function BookedPage() {
  const [bookedUsers, setBookedUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === 'COSC2526') {
      setAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  useEffect(() => {
    const fetchBookedUsers = async () => {
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const bookings = bookingsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const groupedUsers = {};
      dates.forEach(date => {
        groupedUsers[date] = {};
        const dateBookings = bookings.filter(booking => booking.date === date);
        TIME_SLOTS.forEach(slot => {
          const slotBookings = dateBookings.filter(booking => booking.time === slot);
          groupedUsers[date][slot] = slotBookings.map(booking => {
            const user = users.find(u => u.id === booking.userId);
            return {
              ...user,
              bookingId: booking.id
            };
          });
        });
      });

      setBookedUsers(groupedUsers);
      setLoading(false);
    };

    fetchBookedUsers();
  }, []);

  if (!authenticated) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <form onSubmit={handlePasswordSubmit} className="bg-white p-6 rounded shadow-md">
          <h1 className="text-2xl font-bold mb-4">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="border p-2 w-full mb-4"
          />
          <button type="submit" className="bg-blue-500 text-white p-2 w-full">Submit</button>
        </form>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Booked Users</h1>
      {dates.map(date => (
        <div key={date} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{new Date(date).toLocaleDateString()}</h2>
          {TIME_SLOTS.map(slot => (
            <div key={slot} className="mb-4">
              <h3 className="text-lg font-medium">{slot}</h3>
              <ul className="list-disc pl-5">
                {bookedUsers[date][slot].map(user => (
                  <li key={user.id}>{user.name} - {user.rollNumber}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}