import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Activity, ShieldCheck, ImageIcon, AlertCircle, 
  RefreshCcw, LayoutDashboard, History, Settings, LogOut,
  TrendingUp, Users, CheckCircle, Clock, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([
    { id: 1, date: '2026-04-25', diagnosis: 'Melanocytic nevi', confidence: 0.98, status: 'Completed' },
    { id: 2, date: '2026-04-24', diagnosis: 'Benign keratosis', confidence: 0.92, status: 'Completed' },
    { id: 3, date: '2026-04-22', diagnosis: 'Vascular lesions', confidence: 0.88, status: 'Completed' },
  ]);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('https://skin-disease-detection-c79p.onrender.com/predict', formData);
      setTimeout(() => {
        const newResult = response.data;
        setResult(newResult);
        setHistory([{ 
          id: Date.now(), 
          date: new Date().toISOString().split('T')[0], 
          diagnosis: newResult.class, 
          confidence: newResult.confidence, 
          status: 'Completed' 
        }, ...history]);
        setLoading(false);
      }, 2000);
    } catch (error) {
      alert("Error connecting to server. Please try again.");
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const Dashboard = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Medical Dashboard</h1>
          <p style={{ color: 'var(--text-dim)' }}>Welcome back, Dr. Shivangi</p>
        </div>
        <button className="neon-button" onClick={() => setActiveTab('predict')}>
          <Search size={18} />
          New Scan
        </button>
      </div>

      <div className="stat-grid">
        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Total Scans</span>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
          <div className="stat-value">1,284</div>
          <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>+12% from last month</span>
        </div>
        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Accuracy</span>
            <CheckCircle size={20} color="var(--success)" />
          </div>
          <div className="stat-value">97.6%</div>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Model: DermScan v2.1</span>
        </div>
        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Avg. Confidence</span>
            <Activity size={20} color="var(--secondary)" />
          </div>
          <div className="stat-value">94.2%</div>
          <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Optimized precision</span>
        </div>
      </div>

      <h2 style={{ marginBottom: '20px' }}>Recent Activity</h2>
      <div className="glass-card" style={{ padding: '0' }}>
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Diagnosis</th>
              <th>Confidence</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 3).map(item => (
              <tr key={item.id}>
                <td>{item.date}</td>
                <td style={{ color: 'var(--primary)', fontWeight: '600' }}>{item.diagnosis}</td>
                <td>{(item.confidence * 100).toFixed(1)}%</td>
                <td>
                  <span style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '100px', fontSize: '0.75rem' }}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const HistoryView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 style={{ marginBottom: '30px' }}>Scan History</h1>
      <div className="glass-card" style={{ padding: '0' }}>
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Diagnosis</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map(item => (
              <tr key={item.id}>
                <td>{item.date}</td>
                <td style={{ color: 'var(--primary)', fontWeight: '600' }}>{item.diagnosis}</td>
                <td>{(item.confidence * 100).toFixed(1)}%</td>
                <td>{item.status}</td>
                <td><button style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>View Report</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const PredictView = () => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <h1 style={{ marginBottom: '30px' }}>Diagnostic Scan</h1>
      <div style={{ display: 'grid', gridTemplateColumns: result ? '1.2fr 1fr' : '1fr', gap: '30px' }}>
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          {!preview ? (
            <div 
              style={{ border: '2px dashed rgba(255,255,255,0.1)', padding: '60px', borderRadius: '20px', cursor: 'pointer' }}
              onClick={() => fileInputRef.current.click()}
            >
              <Upload size={48} color="var(--primary)" style={{ marginBottom: '20px' }} />
              <h3>Drop Patient Image</h3>
              <p style={{ color: 'var(--text-dim)', marginTop: '10px' }}>JPG, PNG or DICOM format supported</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            </div>
          ) : (
            <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden' }}>
              <img src={preview} style={{ width: '100%', borderRadius: '20px' }} />
              {loading && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--primary)', boxShadow: '0 0 20px var(--primary)', animation: 'scan 2s infinite ease-in-out' }} />}
              {!loading && !result && (
                <div style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button className="neon-button" onClick={handleUpload}>Run Analysis</button>
                  <button className="neon-button" style={{ background: 'var(--surface)' }} onClick={reset}>Reset</button>
                </div>
              )}
            </div>
          )}
        </div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="glass-card" style={{ height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                  <ShieldCheck size={30} color="var(--success)" />
                  <h2 style={{ fontSize: '1.5rem' }}>Analysis Result</h2>
                </div>
                <div style={{ marginBottom: '25px' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>DETECTION</span>
                  <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginTop: '5px' }}>{result.class}</h3>
                </div>
                <div style={{ marginBottom: '25px' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>CONFIDENCE LEVEL</span>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${result.confidence * 100}%` }} style={{ height: '100%', background: 'var(--primary)' }} />
                  </div>
                  <div style={{ marginTop: '5px', textAlign: 'right', color: 'var(--primary)', fontWeight: '700' }}>{(result.confidence * 100).toFixed(2)}%</div>
                </div>
                <div style={{ background: 'rgba(0, 242, 254, 0.03)', padding: '15px', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                  {result.details}
                </div>
                <button className="neon-button" style={{ width: '100%', marginTop: '30px' }} onClick={reset}>New Diagnosis</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 10px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity color="white" size={24} />
          </div>
          <h2 style={{ fontSize: '1.4rem' }}>DermScan</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div className={`nav-item ${activeTab === 'predict' ? 'active' : ''}`} onClick={() => setActiveTab('predict')}>
            <Search size={20} /> Diagnostic
          </div>
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <History size={20} /> History
          </div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} /> Settings
          </div>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div className="nav-item" style={{ color: 'var(--danger)' }}>
            <LogOut size={20} /> Logout
          </div>
        </div>
      </aside>

      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'predict' && <PredictView />}
        {activeTab === 'settings' && <div style={{ textAlign: 'center', padding: '100px' }}><Settings size={80} color="var(--text-dim)" /><h2 style={{ marginTop: '20px' }}>System Settings</h2></div>}
      </main>
    </div>
  );
};

export default App;
