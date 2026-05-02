import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Activity, ShieldCheck, FileImage, AlertCircle, 
  RefreshCcw, LayoutDashboard, History, Settings, LogOut,
  TrendingUp, Users, CheckCircle, Clock, Search,
  Camera, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const App = () => {
  const [view, setView] = useState('home'); // 'home', 'scan', 'history', 'settings'
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview/Crop, 3: Analyzing, 4: Result
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem('scanHistory');
    if (savedHistory) {
      try {
        return JSON.parse(savedHistory);
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('scanHistory', JSON.stringify(history));
  }, [history]);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
      setStep(2);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStep(3); // Analyzing
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/predict', formData);
      const newResult = response.data;
      
      if (newResult.error) {
        setError(newResult.class + " - " + newResult.details);
        setStep(2);
        return;
      }
      
      setResult({
        class: newResult.class || 'Unknown',
        confidence: newResult.confidence ? (newResult.confidence * 100).toFixed(2) : 0,
        details: newResult.details
      });
      
      setHistory([{ 
        id: Date.now(), 
        date: new Date().toISOString().split('T')[0], 
        diagnosis: newResult.class, 
        confidence: newResult.confidence, 
        status: 'Completed' 
      }, ...history]);
      
      setStep(4);
    } catch (err) {
      setError("Error connecting to server. Please try again.");
      setStep(2); // Back to preview
    }
  };

  const resetScan = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStep(1);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const startScan = () => {
    setView('scan');
    resetScan();
  };

  const HomeView = () => (
    <div className="hero-section">
      <div className="hero-content">
        <motion.h1 
          className="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Check your skin <br/>with AI Precision.
        </motion.h1>
        <motion.p 
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Get instant, secure, and accurate at-home screening for various skin conditions. Powered by a novel Hybrid Ensemble CNN architecture utilizing 8 state-of-the-art models.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button className="btn-primary" onClick={startScan}>
            <Camera size={20} />
            Start Skin Scan
          </button>
        </motion.div>

        <div style={{ marginTop: '60px' }}>
          <div className="step-box">
            <div className="step-num">1</div>
            <div>Take a clear photo of your skin concern</div>
          </div>
          <div className="step-box">
            <div className="step-num">2</div>
            <div>Hybrid AI ensemble (VGG, ResNet, DenseNet, etc.) processes features</div>
          </div>
          <div className="step-box">
            <div className="step-num">3</div>
            <div>Receive your personalized risk assessment</div>
          </div>
        </div>
      </div>
      <div className="hero-image-wrapper">
        <div className="hero-image-blob" />
        <img src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80" alt="Skin Care" style={{ width: '400px', height: '500px', objectFit: 'cover', borderRadius: '30px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );

  const ScanWizard = () => (
    <motion.div className="wizard-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      {step === 1 && (
        <div>
          <h2 className="wizard-title">Upload Photo</h2>
          <p className="wizard-subtitle">Ensure the area is well-lit and the image is in focus.</p>
          
          <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
            <FileImage size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Click to upload skin photo</h3>
            <p style={{ color: 'var(--text-muted)' }}>Supported formats: JPG, PNG</p>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="preview-container">
          <h2 className="wizard-title">Review Photo</h2>
          <p className="wizard-subtitle">Make sure the lesion is clearly visible in the center.</p>
          
          <img src={preview} className="preview-image" alt="Preview" />
          
          {error && (
            <div style={{ background: 'var(--danger)', color: 'white', padding: '12px 20px', borderRadius: '8px', width: '100%', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>Re-upload</button>
            <button className="btn-primary" onClick={handleUpload}>Run AI Analysis</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="preview-container" style={{ textAlign: 'center' }}>
          <h2 className="wizard-title">Analyzing...</h2>
          <p className="wizard-subtitle">Extracting features across 8 distinct CNN architectures.</p>
          
          <img src={preview} className="preview-image" style={{ opacity: 0.5 }} alt="Scanning" />
          
          <div className="progress-container">
            <motion.div 
              className="progress-bar"
              initial={{ width: "0%" }}
              animate={{ width: "95%" }}
              transition={{ duration: 5, ease: "easeOut" }}
            />
          </div>
          <p style={{ marginTop: '16px', color: 'var(--primary)', fontWeight: '600' }}>Processing image data...</p>
        </div>
      )}

      {step === 4 && result && (
        <div className="preview-container">
          <div className="status-badge status-success" style={{ alignSelf: 'center', marginBottom: '10px' }}>
            <Check size={16} /> Analysis Complete
          </div>
          
          <img src={preview} className="preview-image" style={{ maxHeight: '250px' }} alt="Result" />
          
          <div className="result-box" style={{ width: '100%' }}>
            <p style={{ textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>Detection</p>
            <h3 className="result-class">{result.class}</h3>
            
            <div style={{ marginTop: '20px', background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600' }}>Confidence Level</span>
                <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{result.confidence}%</span>
              </div>
              <div className="progress-container" style={{ marginTop: '0', height: '6px' }}>
                <div className="progress-bar" style={{ width: `${result.confidence}%` }} />
              </div>
            </div>
            
            <p style={{ marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              {result.details || "Please consult a medical professional for an official diagnosis."}
            </p>
            <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500' }}>
              Analysis powered by Hybrid Ensemble CNN Model.
            </p>
          </div>

          <button className="btn-primary" style={{ marginTop: '20px' }} onClick={resetScan}>New Scan</button>
        </div>
      )}
    </motion.div>
  );

  const HistoryView = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Your History</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Review your past scans and AI assessments.</p>
      
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--surface)', borderRadius: '24px', border: `1px solid var(--border)` }}>
          <History size={48} color="var(--border)" style={{ marginBottom: '20px' }} />
          <h3>No scans yet</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '24px' }}>Start your first skin assessment today.</p>
          <button className="btn-primary" onClick={startScan}>Start Scan</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Diagnosis</th>
                <th>Confidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={index}>
                  <td>{item.date}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: '600' }}>{item.diagnosis}</td>
                  <td>{(item.confidence ? parseFloat(item.confidence) : 0).toFixed(1)}%</td>
                  <td>
                    <span className="status-badge status-success">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );

  const SettingsView = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '60px' }}>
      <Settings size={64} color="var(--border)" style={{ marginBottom: '24px' }} />
      <h1 style={{ fontSize: '2rem' }}>Settings</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>Your account preferences will appear here.</p>
    </motion.div>
  );

  return (
    <div>
      <header className="top-header">
        <div className="logo" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
          <Activity size={28} />
          DermScan AI
        </div>
        <nav className="nav-links">
          <span className={`nav-link ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>Home</span>
          <span className={`nav-link ${view === 'scan' ? 'active' : ''}`} onClick={() => setView('scan')}>Scanner</span>
          <span className={`nav-link ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>History</span>
          <span className={`nav-link ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>Settings</span>
        </nav>
      </header>

      <main className="main-container">
        {view === 'home' && <HomeView />}
        {view === 'scan' && <ScanWizard />}
        {view === 'history' && <HistoryView />}
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export default App;
