import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Check, X, Calendar as CalendarIcon, Users, BarChart3 } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const AdminDashboard = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [stats, setStats] = useState([]);
  
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayDesc, setNewHolidayDesc] = useState('');

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchEmployees();
    fetchHolidays();
    fetchStats();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/employees`, axiosConfig);
      setEmployees(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchHolidays = async () => {
    try {
      // Reusing employee endpoint for holidays since it is public logic but protected in our new setup. Wait, admin can also hit employee/holidays if we export it or we can just fetch it directly.
      const res = await axios.get(`${API_BASE}/employee/holidays`, axiosConfig);
      setHolidays(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/stats`, axiosConfig);
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`${API_BASE}/admin/employees/${id}/status`, { status }, axiosConfig);
      fetchEmployees();
    } catch (err) { console.error(err); }
  };

  const addHoliday = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/admin/holidays`, { date: newHolidayDate, description: newHolidayDesc }, axiosConfig);
      setNewHolidayDate('');
      setNewHolidayDesc('');
      fetchHolidays();
    } catch (err) { console.error(err); }
  };

  const deleteHoliday = async (id) => {
    try {
      await axios.delete(`${API_BASE}/admin/holidays/${id}`, axiosConfig);
      fetchHolidays();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="glass-container" style={{ minHeight: '600px', marginTop: '20px' }}>
      <div className="header-flex" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
        <div className="button-group">
          <button className={`btn ${activeTab === 'employees' ? 'btn-success' : ''}`} onClick={() => setActiveTab('employees')}>
            <Users size={16} style={{ marginRight: '8px' }}/> Employees
          </button>
          <button className={`btn ${activeTab === 'stats' ? 'btn-success' : ''}`} onClick={() => setActiveTab('stats')}>
            <BarChart3 size={16} style={{ marginRight: '8px' }}/> Stats
          </button>
          <button className={`btn ${activeTab === 'calendar' ? 'btn-success' : ''}`} onClick={() => setActiveTab('calendar')}>
            <CalendarIcon size={16} style={{ marginRight: '8px' }}/> Calendar
          </button>
        </div>
      </div>

      {activeTab === 'employees' && (
        <div>
          <h3>Employee Approvals</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>
                      <span className="status-tag" style={{ 
                        background: emp.status === 'APPROVED' ? '#f6ffed' : emp.status === 'REJECTED' ? '#fff2f0' : '#fffbe6',
                        borderColor: emp.status === 'APPROVED' ? '#b7eb8f' : emp.status === 'REJECTED' ? '#ffccc7' : '#ffe58f',
                        color: emp.status === 'APPROVED' ? '#389e0d' : emp.status === 'REJECTED' ? '#cf1322' : '#d48806'
                      }}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className="button-group">
                        {emp.status !== 'APPROVED' && (
                          <button onClick={() => handleStatusChange(emp.id, 'APPROVED')} className="btn" style={{ background: '#52c41a' }}><Check size={14}/></button>
                        )}
                        {emp.status !== 'REJECTED' && (
                          <button onClick={() => handleStatusChange(emp.id, 'REJECTED')} className="btn" style={{ background: '#ff4d4f' }}><X size={14}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No employees found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div>
          <h3>Company Stats</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Login Time</th>
                  <th>Logoff Time</th>
                  <th>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(s => (
                  <tr key={s.id}>
                    <td>{s.loginTime ? new Date(s.loginTime).toLocaleDateString() : new Date(s.date).toLocaleDateString()}</td>
                    <td>{s.user?.name || 'Unknown'}</td>
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
                {stats.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No stats available.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div>
          <h3>Holiday Calendar</h3>
          <form onSubmit={addHoliday} className="header-flex" style={{ background: '#fafafa', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} required style={{ margin: 0, flex: 1, minWidth: '150px' }} />
            <input type="text" placeholder="Holiday Name (e.g. Christmas)" value={newHolidayDesc} onChange={e => setNewHolidayDesc(e.target.value)} required style={{ margin: 0, flex: 2, minWidth: '200px' }} />
            <button type="submit" className="btn btn-success" style={{ height: '32px' }}>Add Holiday</button>
          </form>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Holiday</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map(h => (
                  <tr key={h.id}>
                    <td>{new Date(h.date).toLocaleDateString()}</td>
                    <td>{h.description}</td>
                    <td>
                      <button onClick={() => deleteHoliday(h.id)} className="btn btn-danger"><X size={14}/></button>
                    </td>
                  </tr>
                ))}
                {holidays.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No holidays added.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
