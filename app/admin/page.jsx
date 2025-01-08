// app/admin/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from '@/utils/firebase';
import * as XLSX from 'xlsx';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [panel, setPanel] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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
      setError('Failed to load users');
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
    setError('');
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
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

        if (!data.every(row => row.Name && row['Roll Number'])) {
          throw new Error('Excel file must contain "Name" and "Roll Number" columns');
        }

        const baseUrl = window.location.origin;
        const results = [];

        for (let i = 0; i < data.length; i++) {
          const panelNumber = ((i % 4) + 1).toString();
          const userId = await handleCreateUser({
            name: data[i].Name,
            rollNumber: data[i]['Roll Number'],
            email: data[i].Email || '',
            panel: panelNumber
          });
          results.push({
            Name: data[i].Name,
            'Roll Number': data[i]['Roll Number'],
            Email: data[i].Email || '',
            Link: `${baseUrl}/schedule/${userId}`
          });
        }

        await fetchUsers();
        setSelectedFile(null);
        const fileInput = document.getElementById('excel-upload');
        if (fileInput) fileInput.value = '';
      } catch (error) {
        setError(error.message || 'Error processing Excel file');
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
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
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