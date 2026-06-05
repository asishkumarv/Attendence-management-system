import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const Register = () => {
  const webcamRef = useRef(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const capture = useCallback(() => {
    return webcamRef.current.getScreenshot();
  }, [webcamRef]);

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setStatus('Please fill all fields');
      return;
    }
    
    setLoading(true);
    setStatus('Capturing face and registering...');
    
    try {
      const imageSrc = capture();
      if (!imageSrc) throw new Error('Could not capture image from webcam');
      const imageBlob = dataURItoBlob(imageSrc);

      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('image', imageBlob, 'face.jpg');

      await axios.post(`${API_BASE}/auth/register`, formData);
      setStatus('Registration successful! Waiting for Admin approval.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-container" style={{ maxWidth: '500px', margin: '6vh auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '8px' }}>Employee Registration</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
        Register your face so you can log attendance easily.
      </p>
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={{ margin: 0 }} />
        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required style={{ margin: 0 }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ margin: 0 }} />
        
        <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            style={{ width: '100%', height: 'auto', borderRadius: '8px', display: 'block' }}
          />
          <p style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', margin: 0, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            Look into the camera
          </p>
        </div>

        {status && (
          <div style={{ padding: '12px', background: status.includes('Error') ? '#fff2f0' : '#f6ffed', border: `1px solid ${status.includes('Error') ? '#ffccc7' : '#b7eb8f'}`, color: status.includes('Error') ? '#cf1322' : '#389e0d', borderRadius: '6px', fontSize: '14px' }}>
            {status}
          </div>
        )}
        
        <button type="submit" disabled={loading} className="btn btn-success" style={{ width: '100%', height: '40px', fontSize: '16px' }}>
          {loading ? <Loader2 className="animate-spin" /> : 'Register'}
        </button>
      </form>
      
      <p style={{ marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
        Already registered? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Back to Login</Link>
      </p>
    </div>
  );
};

export default Register;
