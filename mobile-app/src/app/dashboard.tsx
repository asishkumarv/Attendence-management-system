import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, router } from 'expo-router';

const API_BASE = 'http://192.168.0.8:5000/api';

export default function DashboardScreen() {
  const { token } = useLocalSearchParams();
  const [stats, setStats] = useState([]);
  const [holidays, setHolidays] = useState([]);
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
          onPress={() => router.push({ pathname: '/terminal', params: { token } })}
        >
          <Text style={styles.terminalButtonText}>Open Terminal</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Stats</Text>
      {stats.length === 0 ? (
        <Text style={styles.emptyText}>No attendance records found.</Text>
      ) : (
        stats.map((s: any) => (
          <View key={s.id} style={styles.card}>
            <Text style={styles.cardText}>Date: {s.loginTime ? new Date(s.loginTime).toLocaleDateString() : new Date(s.date).toLocaleDateString()}</Text>
            <Text style={styles.cardText}>In: {s.loginTime ? new Date(s.loginTime).toLocaleTimeString() : '-'}</Text>
            <Text style={styles.cardText}>Out: {s.logoffTime ? new Date(s.logoffTime).toLocaleTimeString() : '-'}</Text>
            <Text style={styles.cardText}>Hours: {s.totalWorkingMinutes ? (s.totalWorkingMinutes / 60).toFixed(2) : '-'}</Text>
          </View>
        ))
      )}

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
