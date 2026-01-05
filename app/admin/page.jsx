'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db } from '@/utils/firebase';
import * as XLSX from 'xlsx';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [panelno, setPanelno] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

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
    } catch {
      setErrorMessage('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      const userRef = await addDoc(collection(db, 'users'), {
        ...userData,
        createdAt: new Date(),
        hasScheduled: false
      });
      return userRef.id;
    } catch {
      throw new Error('Failed to create user');
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
    setErrorMessage('');
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file first');
      return;
    }

    setImportLoading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data.every(row => row.name && row.rollno && row.panelno)) {
          throw new Error('Excel file must contain "name", "rollno", and "panelno" columns');
        }

        const baseUrl = window.location.origin;
        const results = [];

        for (const row of data) {
          const userId = await handleCreateUser({
            name: row.name,
            rollNumber: row.rollno,
            panelno: row.panelno,
            email: row.email || '',
          });

          results.push({
            name: row.name,
            rollno: row.rollno,
            panelno: row.panelno,
            email: row.email || '',
            Link: `${baseUrl}/schedule/${userId}`
          });
        }

        await fetchUsers();
        setSelectedFile(null);
        const fileInput = document.getElementById('excel-upload');
        if (fileInput) fileInput.value = '';
      } catch (importError) {
        setErrorMessage(importError.message || 'Error processing Excel file');
      } finally {
        setImportLoading(false);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = await handleCreateUser({
        name,
        rollNumber,
        panelno,
        email: ''
      });
      const link = `${window.location.origin}/schedule/${userId}`;
      setGeneratedLink(link);
      await fetchUsers();
      
      setName('');
      setRollNumber('');
      setPanelno('');
      setErrorMessage('');
    } catch (submitError) {
      setErrorMessage(submitError.message);
    }
  };

  const handleExport = () => {
    const exportData = users.map(user => ({
      name: user.name,
      rollno: user.rollNumber,
      panelno: user.panelno,
      email: user.email || '',
      Link: `${window.location.origin}/schedule/${user.id}`
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    XLSX.writeFile(wb, 'candidates_with_links.xlsx');
  };

  const handleExportSlots = async () => {
    try {
      const slotsRef = collection(db, 'slots');
      const slotsSnap = await getDocs(slotsRef);
      const slotsData = [];
      
      slotsSnap.forEach(doc => {
        const data = doc.data();
        slotsData.push({
          date: data.date,
          time: data.time,
          panelno: data.panelno,
          name: data.name,
          rollno: data.rollNumber,
          email: data.email || '',
          'booked_at': data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleString() : ''
        });
      });

      // Sort by date and time
      slotsData.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });

      const ws = XLSX.utils.json_to_sheet(slotsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Booked Slots');
      XLSX.writeFile(wb, 'booked_slots.xlsx');
    } catch (err) {
  console.error(err);
  setErrorMessage('Failed to export slots data');
}

  };

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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-purple-600">Import/Export Candidates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="excel-upload">Import Excel</Label>
              <Input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="mt-2"
                disabled={importLoading}
              />
            </div>
            <div className="flex space-x-4">
              <Button 
                onClick={handleImport} 
                disabled={!selectedFile || importLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {importLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Start Import'
                )}
              </Button>
              <Button 
                onClick={handleExport}
                disabled={users.length === 0 || loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Export Candidates
              </Button>
              <Button 
                onClick={handleExportSlots}
                className="bg-green-600 hover:bg-green-700"
              >
                Download Slots Excel
              </Button>
            </div>
          </div>
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-purple-600">Create Candidate</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter candidate name"
                required
              />
            </div>
            <div>
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Enter roll number"
                required
              />
            </div>
            <div>
              <Label htmlFor="panelno">Panel Number</Label>
              <Input
                id="panelno"
                value={panelno}
                onChange={(e) => setPanelno(e.target.value)}
                placeholder="Enter panel number"
                required
              />
            </div>
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
          <CardTitle className="text-2xl text-purple-600">Created Candidates</CardTitle>
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
                      <p className="text-sm text-gray-600">Panel Number: {user.panelno}</p>
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