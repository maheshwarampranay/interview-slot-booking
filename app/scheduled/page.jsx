'use client'

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Users } from 'lucide-react';
import { db } from '@/utils/firebase';
import { Document, Page, View, Text, StyleSheet, pdf,  Image as PDFImage } from '@react-pdf/renderer';
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

const TimelinePDF = ({ slots, panel }) => {
  const groupedByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  Object.keys(groupedByDate).forEach(date => {
    groupedByDate[date].sort((a, b) => a.time.localeCompare(b.time));
  });

  const dates = ['2025-01-10', '2025-01-11'];

  return (
    <Document>
      {dates.map(date => (
        <Page key={date} size="A4" style={styles.page}>
        <PDFImage src="/cosc.png" style={styles.logo} />
        <Text style={styles.header}>COSC Recruitments 2025 - Panel {panel}</Text>
        <Text style={styles.dateHeader}>
            {new Date(date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.nameCell, styles.headerText]}>Name</Text>
              <Text style={[styles.rollCell, styles.headerText]}>Roll Number</Text>
              <Text style={[styles.timeCell, styles.headerText]}>Time Allotted</Text>
            </View>
            
            {(groupedByDate[date] || []).map(slot => (
              <View key={slot.id} style={styles.tableRow}>
                <Text style={styles.nameCell}>{slot.name}</Text>
                <Text style={styles.rollCell}>{slot.rollNumber}</Text>
                <Text style={styles.timeCell}>
                  {new Date(`${slot.date}T${slot.time}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      ))}
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
  const time = new Date(`${slot.date}T${slot.time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="relative pl-8 pb-8">
      <div className="absolute left-0 top-0 h-full w-px bg-purple-200">
        <div className="absolute top-2 left-0 w-2 h-2 -ml-1 rounded-full bg-purple-600" />
      </div>
      <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
        <p className="text-sm text-purple-600 font-medium">{time}</p>
        <p className="font-medium text-lg mt-1">{slot.name}</p>
        <p className="text-sm text-gray-600">Roll Number: {slot.rollNumber}</p>
        {slot.userId && (
          <p className="text-sm text-gray-600 mt-1">User ID: {slot.userId}</p>
        )}
      </div>
    </div>
  );
};

const PanelTimeline = ({ slots, date }) => {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium text-gray-700">{formattedDate}</h3>
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
  const [selectedPanel, setSelectedPanel] = useState('all');
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
        if (data.date && data.time) {
          scheduledSlots.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      scheduledSlots.sort((a, b) => {
        if (a.panel !== b.panel) return Number(a.panel) - Number(b.panel);
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
      
      setSlots(scheduledSlots);
    } catch (err) {
      setError('Failed to fetch scheduled slots');
      console.error('Error fetching scheduled slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (panel, allSlots) => {
    try {
      const panelSlots = allSlots.filter(slot => slot.panel === panel);
      
      const blob = await pdf(
        <TimelinePDF 
          slots={panelSlots}
          panel={panel}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `panel${panel}.pdf`;
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
      if (selectedPanel === 'all') {
        for (const panel of ['1', '2', '3', '4']) {
          await downloadPDF(panel, slots);
        }
      } else {
        await downloadPDF(selectedPanel, slots);
      }
    } finally {
      setPdfLoading(false);
    }
  };

  const filteredSlots = selectedPanel === 'all' 
    ? slots 
    : slots.filter(slot => slot.panel === selectedPanel);

  const panelCounts = slots.reduce((acc, slot) => {
    acc[slot.panel] = (acc[slot.panel] || 0) + 1;
    return acc;
  }, {});

  const groupedSlots = filteredSlots.reduce((acc, slot) => {
    const panel = slot.panel;
    const date = slot.date;
    
    if (!acc[panel]) acc[panel] = {};
    if (!acc[panel][date]) acc[panel][date] = [];
    
    acc[panel][date].push(slot);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-48">
            <Select value={selectedPanel} onValueChange={setSelectedPanel}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by panel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Panels</SelectItem>
                <SelectItem value="1">Panel 1</SelectItem>
                <SelectItem value="2">Panel 2</SelectItem>
                <SelectItem value="3">Panel 3</SelectItem>
                <SelectItem value="4">Panel 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleDownloadPDF}
            disabled={loading || pdfLoading || Object.keys(groupedSlots).length === 0}
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard 
          title="Total Scheduled" 
          value={slots.length}
          className="md:col-span-1"
        />
        {Object.entries(panelCounts).map(([panel, count]) => (
          <StatsCard
            key={panel}
            title={`Panel ${panel}`}
            value={count}
            className="md:col-span-1"
          />
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : Object.keys(groupedSlots).length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          No scheduled candidates found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedSlots).map(([panel, dateGroups]) => (
            <Card key={panel} className="overflow-hidden">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-xl">Panel {panel}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {Object.entries(dateGroups).map(([date, slots]) => (
                  <PanelTimeline key={date} date={date} slots={slots} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}