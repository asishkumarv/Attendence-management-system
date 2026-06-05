import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setStatus('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setStatus('');
    
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      login(res.data.user, res.data.token);
      
      if (res.data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/employee');
      }
    } catch (err) {
      setStatus(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-container" style={{ maxWidth: '400px', margin: '10vh auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '24px' }}>Login to Attendify</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input 
          type="email" 
          placeholder="Email Address" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required
          style={{ margin: 0 }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required
          style={{ margin: 0 }}
        />
        
        {status && <div style={{ color: '#cf1322', background: '#fff2f0', border: '1px solid #ffccc7', padding: '8px', borderRadius: '6px', fontSize: '14px' }}>{status}</div>}
        
        <button type="submit" disabled={loading} className="btn" style={{ width: '100%', height: '40px', fontSize: '16px' }}>
          {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
        </button>
      </form>
      <p style={{ marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Register here</Link>
      </p>
    </div>
  );
};

export default Login;
