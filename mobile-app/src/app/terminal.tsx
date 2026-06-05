import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { useLocalSearchParams, router } from 'expo-router';

const API_BASE = 'http://192.168.0.8:5000/api';

export default function TerminalScreen() {
  const { token } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <TouchableOpacity style={[styles.button, styles.btnSuccess]} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAction = async (endpoint: string) => {
    setLoading(true);
    setStatus('Capturing face...');

    try {
      const formData = new FormData();

      if (endpoint === 'login' || endpoint === 'logoff') {
        if (!cameraRef.current) throw new Error('Camera not ready');
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: false });
        if (!photo) throw new Error('Failed to take picture');
        if (Platform.OS === 'web') {
          const res = await fetch(photo.uri);
          const blob = await res.blob();
          formData.append('image', blob, 'face.jpg');
        } else {
          formData.append('image', {
            uri: photo.uri,
            name: 'face.jpg',
            type: 'image/jpeg'
          } as any);
        }
      }

      const res = await axios.post(`${API_BASE}/employee/terminal/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      setStatus(`Success: ${res.data.message}`);
    } catch (err: any) {
      setStatus(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back to Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Face Terminal</Text>
      <Text style={styles.subtitle}>Position your face and select an action</Text>
      
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="front" ref={cameraRef} />
      </View>

      {status ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginBottom: 20 }} />
      ) : (
        <>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.btnSuccess]} onPress={() => handleAction('login')}>
              <Text style={styles.btnText}>Clock In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.btnDanger]} onPress={() => handleAction('logoff')}>
              <Text style={styles.btnText}>Clock Out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={() => handleAction('break-in')}>
              <Text style={styles.btnText}>Break In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => handleAction('break-out')}>
              <Text style={styles.btnText}>Break Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', padding: 20, paddingTop: 60 },
  backButton: { alignSelf: 'flex-start', marginBottom: 20 },
  backText: { color: '#3b82f6', fontSize: 16 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { color: '#9ca3af', fontSize: 14, marginBottom: 20 },
  cameraContainer: { width: '100%', height: 350, borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  camera: { flex: 1 },
  statusBox: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8, marginBottom: 15, width: '100%' },
  statusText: { color: '#fff', textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  button: { backgroundColor: '#3b82f6', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 8, minWidth: 120, alignItems: 'center' },
  btnSuccess: { backgroundColor: '#10b981' },
  btnDanger: { backgroundColor: '#ef4444' },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});
