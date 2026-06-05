import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Face Login Terminal</Text>
      <View style={styles.cameraPlaceholder}>
        <Text style={{ color: '#94a3b8' }}>Camera View (Expo Camera)</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.btnSuccess]}>
          <Text style={styles.btnText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.btnDanger]}>
          <Text style={styles.btnText}>Logoff</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.btnText}>Break In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.btnText}>Break Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Dark theme background
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cameraPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  btnSuccess: {
    backgroundColor: '#10b981',
  },
  btnDanger: {
    backgroundColor: '#ef4444',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
