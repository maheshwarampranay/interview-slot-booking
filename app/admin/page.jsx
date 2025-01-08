// app/admin/page.jsx
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
    } catch (error) {
      setErrorMessage('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    const userRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: new Date(),
      hasScheduled: false
    });
    return userRef.id;
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

        if (!data.every(row => row.Name && row['Roll Number'] && row.Panel)) {
          throw new Error('Excel file must contain "Name", "Roll Number", and "Panel" columns');
        }

        const baseUrl = window.location.origin;
        const results = [];

        for (const row of data) {
          if (!['1', '2', '3', '4'].includes(row.Panel.toString())) {
            throw new Error(`Invalid panel number ${row.Panel}. Panel must be 1, 2, 3, or 4`);
          }

          const userId = await handleCreateUser({
            name: row.Name,
            rollNumber: row['Roll Number'],
            email: row.Email || '',
            panel: row.Panel.toString()
          });

          results.push({
            Name: row.Name,
            'Roll Number': row['Roll Number'],
            Email: row.Email || '',
            Link: `${baseUrl}/schedule/${userId}`
          });
        }

        await fetchUsers();
        setSelectedFile(null);
        const fileInput = document.getElementById('excel-upload');
        if (fileInput) fileInput.value = '';
      } catch (error) {
        setErrorMessage(error.message || 'Error processing Excel file');
      } finally {
        setImportLoading(false);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleExport = () => {
    const exportData = users.map(user => ({
      Name: user.name,
      'Roll Number': user.rollNumber,
      Email: user.email || '',
      Link: `${window.location.origin}/schedule/${user.id}`
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    XLSX.writeFile(wb, 'candidates_with_links.xlsx');
  };

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
                Export Data
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