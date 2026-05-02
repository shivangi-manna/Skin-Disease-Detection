import React, { useState, useRef } from 'react';
import { 
  Stethoscope, LayoutDashboard, FileText, Settings, Power,
  Plus, Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('https://skin-disease-detection-c79p.onrender.com/predict', formData);
      const newResult = response.data;
      setResult({
        class: newResult.class || 'Unknown',
        confidence: newResult.confidence ? (newResult.confidence * 100).toFixed(2) : 0
      });
      setLoading(false);
    } catch (err) {
      setError("Error connecting to server. Please try again.");
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 10px', marginBottom: '10px' }}>
          <Stethoscope color="var(--text)" size={28} />
          <h2 style={{ fontSize: '1.4rem', lineHeight: '1.2' }}>Skin Cancer<br/>Diagnosis</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
            <FileText size={20} /> My Analysis
          </div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} /> Settings
          </div>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '10px', paddingRight: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
              A
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)' }}>Admin User</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Administrator</div>
            </div>
          </div>
          <Power size={20} color="var(--text-dim)" style={{ cursor: 'pointer' }} />
        </div>
      </aside>

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Dashboard</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Welcome back, Admin</p>
              </div>
              <button className="neon-button" onClick={reset}>
                <Plus size={18} />
                New Analysis
              </button>
            </div>

            <div className="jinja-text">{'{% if error %}'}</div>
            
            {/* We show the error block if there's an actual error, otherwise it's just the empty placeholder or we can mock it. */}
            <AnimatePresence>
              {error ? (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="error-banner">
                  {error}
                </motion.div>
              ) : (
                <div className="error-banner" style={{ opacity: 0.5 }}>
                  {'{'} {'{'} error {'}'} {'}'}
                </div>
              )}
            </AnimatePresence>
            <div className="jinja-text" style={{ marginTop: '-10px', marginBottom: '30px' }}>{'{% endif %}'}</div>

            <div className="upload-area" onClick={() => !preview && fileInputRef.current?.click()}>
              {!preview ? (
                <>
                  <Folder size={48} color="#94a3b8" strokeWidth={1.5} />
                  <h3>Click to Upload Image</h3>
                  <p>Supported: JPG, PNG</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                </>
              ) : (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <img src={preview} alt="Preview" style={{ maxHeight: '250px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <button className="neon-button" onClick={(e) => { e.stopPropagation(); handleUpload(); }} disabled={loading}>
                      {loading ? 'Analyzing...' : 'Run Analysis'}
                    </button>
                    <button className="neon-button" style={{ background: '#e2e8f0', color: 'var(--text)' }} onClick={(e) => { e.stopPropagation(); reset(); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="jinja-text" style={{ marginTop: '40px' }}>{'{% if prediction %}'}</div>
            <AnimatePresence>
              {result ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="result-card">
                   <div style={{ 
                      width: '80px', height: '80px', borderRadius: '16px', background: '#f8fafc', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', overflow: 'hidden'
                    }}>
                      <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   </div>
                   <div className="result-info">
                     <h3>Analysis Result</h3>
                     <p>Confidence: {result.confidence}%</p>
                   </div>
                   <div className="result-prediction">
                     {result.class}
                   </div>
                </motion.div>
              ) : (
                 <div className="result-card" style={{ opacity: 0.5 }}>
                   <div style={{ 
                      width: '80px', height: '80px', borderRadius: '16px', background: '#f8fafc', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' 
                    }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '5px' }}>Result<br/>Image</div>
                   </div>
                   <div className="result-info">
                     <h3>Analysis Result</h3>
                     <p>Confidence: {'{'} {'{'} confidence {'}'} {'}'}%</p>
                   </div>
                   <div className="result-prediction" style={{ fontSize: '1rem', fontWeight: 600 }}>
                     {'{'} {'{'} PREDICTION {'}'} {'}'}
                   </div>
                 </div>
              )}
            </AnimatePresence>
            <div className="jinja-text" style={{ marginTop: '10px' }}>{'{% endif %}'}</div>

          </motion.div>
        )}

        {activeTab === 'analysis' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1>My Analysis</h1>
            <p style={{ color: 'var(--text-dim)', marginTop: '10px' }}>Your past analysis results will appear here.</p>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1>Settings</h1>
            <p style={{ color: 'var(--text-dim)', marginTop: '10px' }}>Manage your preferences and account settings.</p>
          </motion.div>
        )}
      </main>

      {/* Mobile nav fallback */}
      <div className="bottom-nav">
        <div className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </div>
        <div className={`bottom-nav-item ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
          <FileText size={20} />
          <span>Analysis</span>
        </div>
        <div className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </div>
    </div>
  );
};

export default App;
