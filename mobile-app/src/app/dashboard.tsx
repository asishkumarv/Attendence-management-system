import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, router } from 'expo-router';

const API_BASE = 'http://192.168.0.8:5000/api';

export default function DashboardScreen() {
  const { token } = useLocalSearchParams();
  const [stats, setStats] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [statsRes, holidaysRes] = await Promise.all([
        axios.get(`${API_BASE}/employee/stats`, config),
        axios.get(`${API_BASE}/employee/holidays`, config)
      ]);
      setStats(statsRes.data);
      setHolidays(holidaysRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity 
          style={styles.terminalButton} 
          onPress={() => {
            const today = new Date().toDateString();
            const todayRecord = stats.find((s: any) => {
              const recordDate = s.loginTime ? new Date(s.loginTime).toDateString() : new Date(s.date).toDateString();
              return recordDate === today;
            });
            const hasClockedIn = !!todayRecord?.loginTime;
            const hasClockedOut = !!todayRecord?.logoffTime;
            const isOnBreak = todayRecord?.breaks?.some((b: any) => !b.breakEndTime);

            router.push({ 
              pathname: '/terminal', 
              params: { 
                token, 
                hasClockedIn: hasClockedIn ? 'true' : 'false',
                hasClockedOut: hasClockedOut ? 'true' : 'false',
                isOnBreak: isOnBreak ? 'true' : 'false'
              } 
            });
          }}
        >
          <Text style={styles.terminalButtonText}>Open Terminal</Text>
        </TouchableOpacity>
      </View>

      {(() => {
        const calculateRecordStats = (record: any) => {
          if (!record.loginTime) return { workMins: 0, breakMins: 0 };
          const login = new Date(record.loginTime).getTime();
          const logoff = record.logoffTime ? new Date(record.logoffTime).getTime() : new Date().getTime();
          let breakMins = 0;
          if (record.breaks) {
            record.breaks.forEach((b: any) => {
              const bStart = new Date(b.breakStartTime).getTime();
              const bEnd = b.breakEndTime ? new Date(b.breakEndTime).getTime() : new Date().getTime();
              breakMins += Math.floor((bEnd - bStart) / 60000);
            });
          }
          const totalMins = Math.floor((logoff - login) / 60000);
          return { workMins: Math.max(0, totalMins - breakMins), breakMins };
        };

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let monthlyWorkMins = 0;
        let monthlyBreakMins = 0;

        stats.forEach((s: any) => {
          const d = s.loginTime ? new Date(s.loginTime) : new Date(s.date);
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const { workMins, breakMins } = calculateRecordStats(s);
            monthlyWorkMins += workMins;
            monthlyBreakMins += breakMins;
          }
        });

        const formatHours = (mins: number) => (mins / 60).toFixed(2) + 'h';

        return (
          <>
            <Text style={styles.sectionTitle}>This Month</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <View style={[styles.card, { flex: 1, alignItems: 'center' }]}>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>Work Hours</Text>
                <Text style={{ color: '#3b82f6', fontSize: 24, fontWeight: 'bold' }}>{formatHours(monthlyWorkMins)}</Text>
              </View>
              <View style={[styles.card, { flex: 1, alignItems: 'center' }]}>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>Break Hours</Text>
                <Text style={{ color: '#f59e0b', fontSize: 24, fontWeight: 'bold' }}>{formatHours(monthlyBreakMins)}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Daily Records</Text>
            {stats.length === 0 ? (
              <Text style={styles.emptyText}>No attendance records found.</Text>
            ) : (
              stats.map((s: any) => {
                const { workMins, breakMins } = calculateRecordStats(s);
                return (
                  <View key={s.id} style={styles.card}>
                    <Text style={styles.cardText}>Date: {s.loginTime ? new Date(s.loginTime).toLocaleDateString() : new Date(s.date).toLocaleDateString()}</Text>
                    <Text style={styles.cardText}>In: {s.loginTime ? new Date(s.loginTime).toLocaleTimeString() : '-'}</Text>
                    <Text style={styles.cardText}>Out: {s.logoffTime ? new Date(s.logoffTime).toLocaleTimeString() : (s.loginTime ? 'Active' : '-')}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 8 }}>
                      <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>Work: {formatHours(workMins)}</Text>
                      <Text style={{ color: '#f59e0b', fontWeight: 'bold' }}>Break: {formatHours(breakMins)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </>
        );
      })()}

      <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Upcoming Holidays</Text>
      {holidays.length === 0 ? (
        <Text style={styles.emptyText}>No holidays scheduled.</Text>
      ) : (
        holidays.map((h: any) => (
          <View key={h.id} style={styles.card}>
            <Text style={[styles.cardText, { fontWeight: 'bold' }]}>
              {new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
            <Text style={[styles.cardText, { color: '#9ca3af' }]}>{h.description}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: 'bold',
  },
  terminalButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  terminalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardText: {
    color: '#f8fafc',
    marginBottom: 5,
  },
  emptyText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  }
});
