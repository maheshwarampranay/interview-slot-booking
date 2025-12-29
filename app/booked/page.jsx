'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
} from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { Loader2 } from 'lucide-react';

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

const DATES = ['2026-01-06', '2026-01-07', '2026-01-08'];

export default function BookedUsersPage() {
  const [bookedUsers, setBookedUsers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookedUsers();
  }, []);

  const fetchBookedUsers = async () => {
    try {
      const slotsRef = collection(db, 'slots');
      const slotsSnapshot = await getDocs(slotsRef);
      const groupedUsers = {};
  
      slotsSnapshot.forEach(doc => {
        const data = doc.data();
        const slotKey = `${data.date}-${data.time}`;
        
        if (!groupedUsers[slotKey]) {
          groupedUsers[slotKey] = [];
        }
        
        groupedUsers[slotKey].push({
          id: doc.id,
            ...data
          });
        }
      });
  
      setBookedUsers(groupedUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching booked users:', error);
      setLoading(false);
    }
  };
  const handleExport = (slotKey) => {
    if (!bookedUsers[slotKey]) return;
  
    const [date, time] = slotKey.split('-');
    const sanitizedTimeSlot = time
      .replace(/\s+/g, '_')
      .replace(/:/g, '_')
      .replace(/\./g, '_');
  
    const exportData = bookedUsers[slotKey].map((user, index) => ({
      'S.No': index + 1,
      'Name': user.name,
      'Roll Number': user.rollNumber,
      'Date': date,
      'Time Slot': time
    }));
  
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Adjust column widths
    ws['!cols'] = [
      { wch: 5 },   // S.No
      { wch: 25 },  // Name
      { wch: 15 },  // Roll Number
      { wch: 25 }   // Time Slot
    ];
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sanitizedTimeSlot);
    
    XLSX.writeFile(wb, `${sanitizedTimeSlot}_booked_users.xlsx`, { 
      bookSST: true,  // Use Shared String Table
      compression: true  // Enable compression
    });
  };

  const handleExportAll = () => {
    const allExportData = Object.entries(bookedUsers).flatMap(([slotKey, users]) => {
      const [date, time] = slotKey.split('-');
      return users.map(user => ({
        Name: user.name,
        'Roll Number': user.rollNumber,
        Date: date,
        Time: time
      }));
    });

    const ws = XLSX.utils.json_to_sheet(allExportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All_Booked_Slots');
    XLSX.writeFile(wb, 'all_booked_users.xlsx');
  };

  const renderTimeSlotUsers = (slotKey) => {
    const users = bookedUsers[slotKey] || [];
    const [date, time] = slotKey.split('-');
    return (
      <Card key={slotKey} className="mb-4">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>{time}</CardTitle>
          <div className="flex space-x-2">
            <Button 
              onClick={() => handleExport(slotKey)}
              disabled={users.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Export {time} Users
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user, index) => (
              <div 
                key={user.id} 
                className="border p-3 rounded-lg"
              >
                <p className="font-medium">{index + 1}. {user.name}</p>
                <p className="text-sm text-gray-600">Roll Number: {user.rollNumber}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Total Users: {users.length}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl text-purple-600 flex justify-between items-center">
            Booked Interview Slots
            <Button 
              onClick={handleExportAll}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={Object.values(bookedUsers).every(users => users.length === 0)}
            >
              Export All Users
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {DATES.map(date => (
        <div key={date} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
          {TIME_SLOTS.map(slot => renderTimeSlotUsers(`${date}-${slot}`))}
        </div>
      ))}
    </div>
  );
}