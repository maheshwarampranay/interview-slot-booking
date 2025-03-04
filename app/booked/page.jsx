'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { Loader2 } from 'lucide-react';

const TIME_SLOTS = [
  '09:40 AM to 10:30 AM',
  '10:30 AM to 11:20 AM', 
  '11:20 AM to 12:10 PM', 
  '12:10 PM to 01:30 PM'
];

export default function BookedUsersPage() {
  const [bookedUsers, setBookedUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

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
        const timeSlot = data.time;
        
        if (data.date === '2024-03-05') {
          if (!groupedUsers[timeSlot]) {
            groupedUsers[timeSlot] = [];
          }
          
          groupedUsers[timeSlot].push({
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
  const handleExport = (timeSlot) => {
    if (!bookedUsers[timeSlot]) return;
  
    const sanitizedTimeSlot = timeSlot
      .replace(/\s+/g, '_')
      .replace(/:/g, '_')
      .replace(/\./g, '_');
  
    const exportData = bookedUsers[timeSlot].map((user, index) => ({
      'S.No': index + 1,
      'Name': user.name,
      'Roll Number': user.rollNumber,
      'Time Slot': timeSlot
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
    const allExportData = Object.entries(bookedUsers).flatMap(([timeSlot, users]) => 
      users.map(user => ({
        Name: user.name,
        'Roll Number': user.rollNumber,
        Time: timeSlot
      }))
    );

    const ws = XLSX.utils.json_to_sheet(allExportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All_Booked_Slots');
    XLSX.writeFile(wb, 'all_booked_users.xlsx');
  };

  const renderTimeSlotUsers = (timeSlot) => {
    const users = bookedUsers[timeSlot] || [];
    return (
      <Card key={timeSlot} className="mb-4">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>{timeSlot}</CardTitle>
          <div className="flex space-x-2">
            <Button 
              onClick={() => handleExport(timeSlot)}
              disabled={users.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Export {timeSlot} Users
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

      {TIME_SLOTS.map(slot => renderTimeSlotUsers(slot))}
    </div>
  );
}