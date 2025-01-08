// app/admin/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from '@/utils/firebase';

export default function AdminPage() {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [panel, setPanel] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      const usersData = [];
      usersSnap.forEach(doc => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setGeneratedLink('');

    if (!name.trim() || !rollNumber.trim() || !panel) {
      setError('Please fill in all fields including panel number');
      return;
    }

    try {
      const userRef = await addDoc(collection(db, 'users'), {
        name,
        rollNumber,
        panel,
        createdAt: new Date(),
        hasScheduled: false
      });

      const baseUrl = window.location.origin;
      const scheduleLink = `${baseUrl}/schedule/${userRef.id}`;
      setGeneratedLink(scheduleLink);
      setName('');
      setRollNumber('');
      setPanel('');
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-purple-600">Create Interview Slot</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter candidate name"
              />
            </div>
            <div>
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Enter roll number"
              />
            </div>
            <div>
              <Label htmlFor="panel">Panel Number</Label>
              <Select value={panel} onValueChange={setPanel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select panel number" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Panel 1</SelectItem>
                  <SelectItem value="2">Panel 2</SelectItem>
                  <SelectItem value="3">Panel 3</SelectItem>
                  <SelectItem value="4">Panel 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              Generate Interview Link
            </Button>
          </form>
          
          {generatedLink && (
            <div className="mt-4">
              <Alert>
                <AlertDescription>
                  Interview Link: 
                  <Input 
                    value={generatedLink} 
                    readOnly 
                    className="mt-2"
                    onClick={(e) => e.target.select()}
                  />
                  <Button
                    className="mt-2 bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigator.clipboard.writeText(generatedLink)}
                  >
                    Copy Link
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-purple-600">Created Interview Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">Roll Number: {user.rollNumber}</p>
                      <p className="text-sm text-gray-600">Panel: {user.panel}</p>
                      <p className="text-sm text-gray-600">
                        Status: {user.hasScheduled ? 'Scheduled' : 'Pending'}
                      </p>
                    </div>
                    <Button
                      className="text-sm bg-purple-600 hover:bg-purple-700"
                      onClick={() => {
                        const link = `${window.location.origin}/schedule/${user.id}`;
                        navigator.clipboard.writeText(link);
                      }}
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}