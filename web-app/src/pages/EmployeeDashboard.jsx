import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Camera, Calendar as CalendarIcon, BarChart3, Loader2 } from 'lucide-react';
import Webcam from 'react-webcam';

const API_BASE = 'http://localhost:5000/api';

const EmployeeDashboard = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState([]);
  const [holidays, setHolidays] = useState([]);
  
  const webcamRef = useRef(null);
  const [terminalStatus, setTerminalStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchStats();
    fetchHolidays();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/employee/stats`, axiosConfig);
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchHolidays = async () => {
    try {
      const res = await axios.get(`${API_BASE}/employee/holidays`, axiosConfig);
      setHolidays(res.data);
    } catch (err) { console.error(err); }
  };

  const capture = useCallback(() => {
    return webcamRef.current?.getScreenshot();
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

  const handleAction = async (endpoint) => {
    setLoading(true);
    setTerminalStatus('Capturing face...');
    
    try {
      let imageBlob = null;
      if (endpoint === 'login' || endpoint === 'logoff') {
        const imageSrc = capture();
        if (!imageSrc) throw new Error('Could not capture image');
        imageBlob = dataURItoBlob(imageSrc);
      }

      const formData = new FormData();
      if (imageBlob) {
        formData.append('image', imageBlob, 'face.jpg');
      }

      const res = await axios.post(`${API_BASE}/employee/terminal/${endpoint}`, formData, {
        headers: {
          ...axiosConfig.headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setTerminalStatus(`Success: ${res.data.message}`);
      fetchStats(); // refresh stats immediately
    } catch (err) {
      setTerminalStatus(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-container" style={{ minHeight: '600px', marginTop: '20px' }}>
      <div className="header-flex" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Employee Dashboard</h2>
        <div className="button-group">
          <button className={`btn ${activeTab === 'overview' ? 'btn-success' : ''}`} onClick={() => setActiveTab('overview')}>
            <BarChart3 size={16} style={{ marginRight: '8px' }}/> Overview
          </button>
          <button className={`btn ${activeTab === 'calendar' ? 'btn-success' : ''}`} onClick={() => setActiveTab('calendar')}>
            <CalendarIcon size={16} style={{ marginRight: '8px' }}/> Calendar
          </button>
          <button className={`btn ${activeTab === 'terminal' ? 'btn-success' : ''}`} onClick={() => setActiveTab('terminal')}>
            <Camera size={16} style={{ marginRight: '8px' }}/> Terminal
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div>
          <h3>My Attendance Stats</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Login Time</th>
                  <th>Logoff Time</th>
                  <th>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(s => (
                  <tr key={s.id}>
                    <td>{s.loginTime ? new Date(s.loginTime).toLocaleDateString() : new Date(s.date).toLocaleDateString()}</td>
                    <td>{s.loginTime ? new Date(s.loginTime).toLocaleTimeString() : '-'}</td>
                    <td>
                      {s.logoffTime ? new Date(s.logoffTime).toLocaleTimeString() : (
                        <span className="status-tag" style={{ background: s.autoLoggedOff ? '#fff1f0' : '#e6f4ff', borderColor: s.autoLoggedOff ? '#ffa39e' : '#91caff', color: s.autoLoggedOff ? '#cf1322' : '#0958d9' }}>
                          {s.autoLoggedOff ? 'Auto-off' : 'Active'}
                        </span>
                      )}
                    </td>
                    <td>{s.totalWorkingMinutes ? (s.totalWorkingMinutes / 60).toFixed(2) + 'h' : '-'}</td>
                  </tr>
                ))}
                {stats.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No stats available yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div>
          <h3>Company Holidays</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {holidays.map(h => (
              <li key={h.id} style={{ padding: '16px', background: '#fafafa', border: '1px solid var(--border-color)', marginBottom: '8px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>{new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{h.description}</span>
              </li>
            ))}
            {holidays.length === 0 && <li style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No upcoming holidays.</li>}
          </ul>
        </div>
      )}

      {activeTab === 'terminal' && (
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h3>Face Terminal</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Please position your face in the camera frame before acting.</p>
          
          <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              style={{ width: '100%', height: 'auto', borderRadius: '8px', display: 'block' }}
            />
          </div>

          {terminalStatus && (
            <div style={{ marginBottom: '16px', padding: '12px', background: terminalStatus.includes('Error') ? '#fff2f0' : '#f6ffed', border: `1px solid ${terminalStatus.includes('Error') ? '#ffccc7' : '#b7eb8f'}`, color: terminalStatus.includes('Error') ? '#cf1322' : '#389e0d', borderRadius: '6px' }}>
              {terminalStatus}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
            <button onClick={() => handleAction('login')} disabled={loading} className="btn btn-success" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              {loading ? <Loader2 className="animate-spin" /> : 'Log In (Shift Start)'}
            </button>
            <button onClick={() => handleAction('logoff')} disabled={loading} className="btn btn-danger" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              {loading ? <Loader2 className="animate-spin" /> : 'Log Off (Shift End)'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => handleAction('break-in')} disabled={loading} className="btn" style={{ flex: 1 }}>Break In</button>
            <button onClick={() => handleAction('break-out')} disabled={loading} className="btn" style={{ flex: 1 }}>Break Out</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
