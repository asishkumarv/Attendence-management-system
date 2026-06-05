import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Camera, Users, LayoutDashboard, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import './index.css';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roleRequired && user.role !== roleRequired) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/employee'} replace />;
  return children;
};

const Navigation = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="glass-container header-flex" style={{ padding: '16px 24px', marginBottom: '24px', borderRadius: '8px' }}>
      <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--accent)', fontWeight: 700 }}>
        Attendify
      </h2>
      <div className="button-group" style={{ alignItems: 'center' }}>
        {!user ? (
          <>
            <Link to="/login" style={{ textDecoration: 'none' }}><button className="btn"><Users size={16} style={{ marginRight: '8px' }}/> Login</button></Link>
            <Link to="/register" style={{ textDecoration: 'none' }}><button className="btn"><Camera size={16} style={{ marginRight: '8px' }}/> Register</button></Link>
          </>
        ) : (
          <>
            <span style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>Hi, {user.name}</span>
            {user.role === 'ADMIN' && (
              <Link to="/admin" style={{ textDecoration: 'none' }}><button className="btn"><LayoutDashboard size={16} style={{ marginRight: '8px' }}/> Admin</button></Link>
            )}
            {user.role === 'EMPLOYEE' && (
              <Link to="/employee" style={{ textDecoration: 'none' }}><button className="btn"><LayoutDashboard size={16} style={{ marginRight: '8px' }}/> Dashboard</button></Link>
            )}
            <button onClick={logout} className="btn btn-danger"><LogOut size={16} style={{ marginRight: '8px' }}/> Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
          <Navigation />
          
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/admin/*" element={
              <ProtectedRoute roleRequired="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/employee/*" element={
              <ProtectedRoute roleRequired="EMPLOYEE">
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
