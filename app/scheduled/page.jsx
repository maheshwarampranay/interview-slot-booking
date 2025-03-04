'use client'

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Users } from 'lucide-react';
import { db } from '@/utils/firebase';
import { Document, Page, View, Text, StyleSheet, pdf, Image as PDFImage } from '@react-pdf/renderer';
import { toast } from 'react-hot-toast';
import AutoAllotButton from '@/components/AutoAllotButton';

const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: 'Helvetica',
      position: 'relative'
    },
    logo: {
      position: 'absolute',
      top: 30,
      right: 40,
      width: 60,
      height: 60
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 30,
      color: '#4C1D95',
      textAlign: 'left',
      fontFamily: 'Helvetica-Bold'
    },
    dateHeader: {
      fontSize: 18,
      marginBottom: 20,
      color: '#6D28D9',
      fontFamily: 'Helvetica-Bold'
    },
    tableContainer: {
      width: '90%',
      marginHorizontal: 'auto',
      marginTop: 20
    },
    table: {
      display: 'table',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      marginBottom: 20
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#7C3AED',
      padding: 12,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8
    },
    tableRow: {
      flexDirection: 'row',
      padding: 12,
      borderTopWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: '#FFFFFF'
    },
    tableRowAlternate: {
      flexDirection: 'row',
      padding: 12,
      borderTopWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: '#F5F3FF'
    },
    nameCell: {
      flex: 2,
      fontSize: 11,
      paddingHorizontal: 8
    },
    rollCell: {
      flex: 1,
      fontSize: 11,
      textAlign: 'center'
    },
    timeCell: {
      flex: 1,
      fontSize: 11,
      textAlign: 'center'
    },
    headerText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontFamily: 'Helvetica-Bold'
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 10,
      color: '#6B7280'
    }
  });

const TimelinePDF = ({ slots }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFImage src="/cosc.png" style={styles.logo} />
        <Text style={styles.header}>Decipher Event Slot Booking</Text>
        <Text style={styles.dateHeader}>March 5th, 2024</Text>
        
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.nameCell, styles.headerText]}>Name</Text>
            <Text style={[styles.rollCell, styles.headerText]}>Roll Number</Text>
            <Text style={[styles.timeCell, styles.headerText]}>Time Allotted</Text>
          </View>
          
          {slots.map((slot, index) => (
            <View 
              key={slot.id} 
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlternate}
            >
              <Text style={styles.nameCell}>{slot.name}</Text>
              <Text style={styles.rollCell}>{slot.rollNumber}</Text>
              <Text style={styles.timeCell}>{slot.time}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

const StatsCard = ({ title, value, className = "" }) => (
  <Card className={className}>
    <CardContent className="pt-6">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-purple-600" />
        <p className="text-sm font-medium text-gray-500">{title}</p>
      </div>
      <p className="text-2xl font-bold text-purple-600 mt-2">{value}</p>
    </CardContent>
  </Card>
);

const TimelineEvent = ({ slot }) => {
  return (
    <div className="relative pl-8 pb-8">
      <div className="absolute left-0 top-0 h-full w-px bg-purple-200">
        <div className="absolute top-2 left-0 w-2 h-2 -ml-1 rounded-full bg-purple-600" />
      </div>
      <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
        <p className="text-sm text-purple-600 font-medium">{slot.time}</p>
        <p className="font-medium text-lg mt-1">{slot.name}</p>
        <p className="text-sm text-gray-600">Roll Number: {slot.rollNumber}</p>
      </div>
    </div>
  );
};

const PanelTimeline = ({ slots }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium text-gray-700">Scheduled Slots</h3>
      <div className="pl-4">
        {slots.map(slot => (
          <TimelineEvent key={slot.id} slot={slot} />
        ))}
      </div>
    </div>
  );
};

export default function ScheduledCandidatesPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetchScheduledSlots();
  }, []);

  const fetchScheduledSlots = async () => {
    try {
      setLoading(true);
      const slotsRef = collection(db, 'slots');
      const querySnapshot = await getDocs(slotsRef);
      
      const scheduledSlots = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.date === '2024-03-05') {
          scheduledSlots.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      scheduledSlots.sort((a, b) => a.time.localeCompare(b.time));
      
      setSlots(scheduledSlots);
    } catch (err) {
      setError('Failed to fetch scheduled slots');
      console.error('Error fetching scheduled slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const blob = await pdf(<TimelinePDF slots={slots} />).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'decipher_event_slots.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF');
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await downloadPDF();
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleDownloadPDF}
            disabled={loading || pdfLoading || slots.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {pdfLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>
          <AutoAllotButton onComplete={fetchScheduledSlots} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Total Scheduled" 
          value={slots.length}
          className="md:col-span-1"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : slots.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          No scheduled candidates found
        </div>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-xl">Scheduled Slots</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <PanelTimeline slots={slots} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}