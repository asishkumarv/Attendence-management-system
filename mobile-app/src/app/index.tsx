import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { router } from 'expo-router';

const API_BASE = 'http://192.168.0.8:5000/api'; // Replace with local IPv4

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setStatus('Please enter email and password');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      
      // Store token globally or pass it as query params for simplicity in this demo.
      // Better to use SecureStore or AsyncStorage in production.
      const token = res.data.token;
      
      if (res.data.user.role !== 'EMPLOYEE') {
        setStatus('Mobile app is for employees only.');
        return;
      }

      setStatus('Login successful');
      router.push({ pathname: '/dashboard', params: { token } });
    } catch (err: any) {
      setStatus(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendify Mobile</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        placeholderTextColor="#94a3b8"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {status ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginBottom: 20 }} />
      ) : (
        <TouchableOpacity style={[styles.button, styles.btnSuccess]} onPress={handleLogin}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    marginBottom: 15,
  },
  statusBox: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  statusText: {
    color: '#ef4444',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSuccess: {
    backgroundColor: '#3b82f6',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
