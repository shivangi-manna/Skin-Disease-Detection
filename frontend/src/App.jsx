import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, Activity, ShieldCheck, FileImage, AlertCircle,
  LayoutDashboard, History, Settings, LogOut, Camera,
  Check, Search, Bell, User, Scan, TrendingUp, Eye,
  ChevronRight, Sun, Shield, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// ─── helpers ───────────────────────────────────────────────
const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U';
const getRiskBadge = (diag) => {
  const high = ['Melanoma','Basal cell carcinoma','Actinic keratoses'];
  const med  = ['Benign keratosis-like lesions','Dermatofibroma'];
  if (high.includes(diag)) return <span className="badge badge-danger">High Risk</span>;
  if (med.includes(diag))  return <span className="badge badge-warning">Moderate</span>;
  return <span className="badge badge-success">Low Risk</span>;
};

// ─── APP ────────────────────────────────────────────────────
export default function App() {
  const [authMode, setAuthMode]   = useState('login');
  const [user, setUser]           = useState(() => { try { return JSON.parse(localStorage.getItem('dermUser')); } catch { return null; } });
  const [form, setForm]           = useState({ name:'', email:'', password:'' });
  const [authErr, setAuthErr]     = useState('');

  const [view, setView]   = useState('dashboard');
  const [step, setStep]   = useState(1);
  const [file, setFile]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [settings, setSettings] = useState({ notifications: true, darkMode: false, autoSave: true });

  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dermHistory_' + (JSON.parse(localStorage.getItem('dermUser'))?.email || ''))) || []; }
    catch { return []; }
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) localStorage.setItem('dermHistory_' + user.email, JSON.stringify(history));
  }, [history, user]);

  // Auth
  const handleAuth = (e) => {
    e.preventDefault();
    setAuthErr('');
    if (authMode === 'login') {
      const saved = JSON.parse(localStorage.getItem('dermUser_' + form.email));
      if (!saved || saved.password !== form.password) { setAuthErr('Invalid email or password.'); return; }
      setUser(saved);
      localStorage.setItem('dermUser', JSON.stringify(saved));
      const h = JSON.parse(localStorage.getItem('dermHistory_' + form.email)) || [];
      setHistory(h);
    } else {
      if (!form.name || !form.email || !form.password) { setAuthErr('All fields are required.'); return; }
      const newUser = { name: form.name, email: form.email, password: form.password };
      localStorage.setItem('dermUser_' + form.email, JSON.stringify(newUser));
      localStorage.setItem('dermUser', JSON.stringify(newUser));
      setUser(newUser);
    }
  };
  const logout = () => { localStorage.removeItem('dermUser'); setUser(null); setForm({ name:'', email:'', password:'' }); };

  // Scan
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); setError(null); setStep(2); }
  };
  const handleUpload = async () => {
    if (!file) return;
    setStep(3); setError(null);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await axios.post('http://localhost:8000/predict', fd);
      const d = res.data;
      if (d.error) { setError(d.class + ' — ' + d.details); setStep(2); return; }
      const r = { class: d.class || 'Unknown', confidence: d.confidence ? (d.confidence * 100).toFixed(2) : 0, details: d.details };
      setResult(r);
      const entry = { id: Date.now(), date: new Date().toLocaleDateString(), diagnosis: d.class, confidence: d.confidence, status: 'Completed' };
      setHistory(h => [entry, ...h]);
      setStep(4);
    } catch { setError('Cannot connect to server.'); setStep(2); }
  };
  const resetScan = () => { setFile(null); setPreview(null); setResult(null); setError(null); setStep(1); if (fileInputRef.current) fileInputRef.current.value = ''; };

  // ─── AUTH PAGE ──────────────────────────────────────────
  if (!user) return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon"><Activity size={26} /></div>
          <h1>DermScan AI</h1>
        </div>
        <h2>AI-Powered Skin Cancer Detection</h2>
        <p>Upload a photo of your skin concern and get an instant, AI-driven risk assessment powered by a Hybrid Ensemble CNN with 8 state-of-the-art models.</p>
        <div className="auth-stats">
          <div className="auth-stat"><div className="num">98.4%</div><div className="label">Accuracy</div></div>
          <div className="auth-stat"><div className="num">7+</div><div className="label">Conditions</div></div>
          <div className="auth-stat"><div className="num">8</div><div className="label">CNN Models</div></div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-box">
          <h2>{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p>{authMode === 'login' ? 'Sign in to access your health history.' : 'Join DermScan AI today.'}</p>
          <div className="auth-tabs">
            <div className={`auth-tab ${authMode==='login'?'active':''}`} onClick={()=>{setAuthMode('login');setAuthErr('');}}>Sign In</div>
            <div className={`auth-tab ${authMode==='register'?'active':''}`} onClick={()=>{setAuthMode('register');setAuthErr('');}}>Register</div>
          </div>
          <form onSubmit={handleAuth}>
            {authMode === 'register' && (
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-input" placeholder="Dr. Jane Smith" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
              </div>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
            </div>
            {authErr && <div style={{color:'var(--danger)',fontSize:'0.85rem',marginBottom:'12px',fontWeight:600}}>{authErr}</div>}
            <button className="btn-auth" type="submit">{authMode==='login'?'Sign In':'Create Account'}</button>
          </form>
          <div className="auth-switch">
            {authMode==='login' ? <>Don't have an account? <span onClick={()=>setAuthMode('register')}>Register</span></> : <>Already have an account? <span onClick={()=>setAuthMode('login')}>Sign In</span></>}
          </div>
        </div>
      </div>
    </div>
  );

  // ─── DASHBOARD VIEW ─────────────────────────────────────
  const DashboardView = () => {
    const total = history.length;
    const highRisk = history.filter(h => ['Melanoma','Basal cell carcinoma','Actinic keratoses'].includes(h.diagnosis)).length;
    const recent = history.slice(0,5);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    return (
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div>
            <h2>{greeting}, <span>{user.name.split(' ')[0]}</span> 👋</h2>
            <p>Your skin health dashboard. Track scans and stay informed.</p>
            <button className="banner-btn" style={{marginTop:16}} onClick={()=>{setView('scan');resetScan();}}>
              <Camera size={16}/> New Scan
            </button>
          </div>
          <div className="banner-illustration">🩺</div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            {icon:<Scan size={22}/>, cls:'purple', label:'Total Scans', value:total, change:'+'+total+' all time'},
            {icon:<AlertCircle size={22}/>, cls:'orange', label:'High Risk Found', value:highRisk, change: highRisk>0?'Consult doctor':'All clear'},
            {icon:<ShieldCheck size={22}/>, cls:'green', label:'Low Risk Scans', value:total-highRisk, change:'Healthy'},
            {icon:<TrendingUp size={22}/>, cls:'cyan', label:'AI Accuracy', value:'98.4%', change:'Hybrid CNN'},
          ].map((s,i) => (
            <div className="stat-card" key={i}>
              <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-change">{s.change}</div>
            </div>
          ))}
        </div>

        <div className="dashboard-grid">
          {/* Recent Scans */}
          <div className="card">
            <div className="card-header">
              <div><div className="card-title">Recent Scans</div><div className="card-subtitle">Your latest AI analyses</div></div>
              <button style={{background:'none',border:'none',color:'var(--primary)',fontWeight:700,fontSize:'0.85rem',cursor:'pointer'}} onClick={()=>setView('history')}>View All <ChevronRight size={14} style={{verticalAlign:'middle'}}/></button>
            </div>
            <div className="card-body">
              {recent.length === 0 ? (
                <div style={{textAlign:'center',padding:'40px 0',color:'var(--text-muted)'}}>
                  <FileImage size={40} style={{marginBottom:12,opacity:0.4}}/>
                  <p>No scans yet. <span style={{color:'var(--primary)',cursor:'pointer',fontWeight:600}} onClick={()=>{setView('scan');resetScan();}}>Start your first scan</span></p>
                </div>
              ) : (
                <table className="scans-table">
                  <thead><tr><th>Date</th><th>Diagnosis</th><th>Confidence</th><th>Risk</th></tr></thead>
                  <tbody>
                    {recent.map(item=>(
                      <tr key={item.id}>
                        <td className="scan-date">{item.date}</td>
                        <td className="scan-diagnosis">{item.diagnosis}</td>
                        <td className="scan-confidence">{((item.confidence||0)*100).toFixed(1)}%</td>
                        <td>{getRiskBadge(item.diagnosis)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            {/* Quick Actions */}
            <div className="card">
              <div className="card-header"><div className="card-title">Quick Actions</div></div>
              <div className="card-body">
                <div className="quick-actions">
                  {[
                    {icon:<Camera size={20} color="var(--primary)"/>, label:'New Scan', action:()=>{setView('scan');resetScan();}},
                    {icon:<History size={20} color="#0891b2"/>, label:'History', action:()=>setView('history')},
                    {icon:<Shield size={20} color="#059669"/>, label:'Tips', action:()=>{}},
                    {icon:<User size={20} color="#ea580c"/>, label:'Profile', action:()=>setView('settings')},
                  ].map((a,i)=>(
                    <div className="quick-action" key={i} onClick={a.action}>
                      <div className="qa-icon">{a.icon}</div>
                      <span>{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skin Health Tips */}
            <div className="card">
              <div className="card-header"><div className="card-title">Health Tips</div></div>
              <div className="card-body" style={{padding:'8px 24px 20px'}}>
                {[
                  {icon:<Sun size={16}/>, bg:'#fef3c7', color:'#d97706', title:'Daily SPF', desc:'Apply SPF 30+ every morning, even on cloudy days.'},
                  {icon:<Eye size={16}/>, bg:'#ede9fe', color:'var(--primary)', title:'Self-Exam', desc:'Check your skin monthly for new or changing moles.'},
                  {icon:<BookOpen size={16}/>, bg:'#d1fae5', color:'#059669', title:'ABCDE Rule', desc:'Asymmetry, Border, Color, Diameter, Evolving.'},
                ].map((t,i)=>(
                  <div className="tip-item" key={i}>
                    <div className="tip-icon" style={{background:t.bg,color:t.color}}>{t.icon}</div>
                    <div><div className="tip-title">{t.title}</div><div className="tip-desc">{t.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // ─── SCAN WIZARD ────────────────────────────────────────
  const ScanView = () => (
    <motion.div className="scan-page" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
      <h1>AI Skin Scanner</h1>
      <p>Upload a clear photo of the skin area for AI-powered analysis.</p>
      <div className="wizard-card">
        {step===1 && (
          <div>
            <div className="wizard-title">Upload Photo</div>
            <div className="wizard-subtitle">Ensure the area is well-lit and in focus.</div>
            <div className="upload-area" onClick={()=>fileInputRef.current?.click()}>
              <FileImage size={48} color="var(--primary)" style={{marginBottom:16}}/>
              <h3 style={{fontSize:'1.1rem',marginBottom:8,color:'var(--text-main)'}}>Click to upload skin photo</h3>
              <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>JPG, PNG supported</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{display:'none'}}/>
            </div>
          </div>
        )}
        {step===2 && (
          <div className="preview-container">
            <div className="wizard-title">Review Photo</div>
            <div className="wizard-subtitle">Make sure the lesion is clearly visible.</div>
            <img src={preview} className="preview-image" alt="Preview"/>
            {error && <div style={{background:'#fee2e2',color:'var(--danger)',padding:'12px 20px',borderRadius:10,width:'100%',textAlign:'center',fontWeight:600,fontSize:'0.9rem'}}>{error}</div>}
            <div style={{display:'flex',gap:12}}>
              <button className="btn-secondary" onClick={()=>setStep(1)}>Re-upload</button>
              <button className="btn-primary" onClick={handleUpload}><Activity size={16}/>Run AI Analysis</button>
            </div>
          </div>
        )}
        {step===3 && (
          <div className="preview-container" style={{textAlign:'center'}}>
            <div className="wizard-title">Analyzing...</div>
            <div className="wizard-subtitle">Extracting features across 8 CNN architectures.</div>
            <img src={preview} className="preview-image" style={{opacity:0.5}} alt="Scanning"/>
            <div className="progress-container">
              <motion.div className="progress-bar" initial={{width:'0%'}} animate={{width:'95%'}} transition={{duration:5,ease:'easeOut'}}/>
            </div>
            <p style={{marginTop:14,color:'var(--primary)',fontWeight:600}}>Processing image data...</p>
          </div>
        )}
        {step===4 && result && (
          <>
            <div className="result-layout-grid">
              <div className="result-left-col">
                <div className="status-badge status-success"><Check size={14}/> Analysis Complete</div>
                <img src={preview} className="result-preview-img" alt="Result"/>
                <button className="btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={resetScan}><Camera size={16}/>New Scan</button>
              </div>
              <div>
                <div className="result-box-compact">
                  <p style={{fontSize:'0.75rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Detection Result</p>
                  <h3 className="result-class-title">{result.class}</h3>
                  <div className="confidence-panel">
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                      <span style={{fontWeight:600,fontSize:'0.9rem'}}>Confidence Level</span>
                      <span style={{color:'var(--primary)',fontWeight:700}}>{result.confidence}%</span>
                    </div>
                    <div className="progress-container-mini">
                      <div className="progress-bar" style={{width:`${result.confidence}%`}}/>
                    </div>
                  </div>
                  <p style={{marginTop:14,color:'var(--text-muted)',fontSize:'0.88rem',lineHeight:1.5}}>{result.details||'Please consult a medical professional for an official diagnosis.'}</p>
                  {parseFloat(result.confidence)>70 && (
                    <div className="medical-warning-box">
                      <AlertCircle size={18} color="var(--danger)" style={{flexShrink:0}}/>
                      <div><h4 style={{color:'var(--danger)',fontSize:'0.85rem',fontWeight:700}}>High Risk Detected</h4><p style={{fontSize:'0.8rem',color:'var(--text-muted)',lineHeight:1.4}}>Please consult a dermatologist immediately.</p></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="result-info-footer">
              <div className="info-card-grid">
                {[
                  {icon:<ShieldCheck size={20} color="#059669"/>, bg:'#d1fae5', title:'Prevention Tips', items:['Apply SPF 30+ daily','Avoid peak sun hours','Monthly self-exams']},
                  {icon:<Eye size={20} color="var(--primary)"/>, bg:'#ede9fe', title:'Watch For', items:['Asymmetric lesions','Irregular borders','Color/size changes']},
                  {icon:<User size={20} color="#ea580c"/>, bg:'#ffedd5', title:'Next Steps', items:['See a dermatologist','Log skin changes','Share with your doctor']},
                ].map((c,i)=>(
                  <div className="info-subcard" key={i}>
                    <div style={{width:40,height:40,borderRadius:10,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>{c.icon}</div>
                    <h4>{c.title}</h4>
                    <ul>{c.items.map((li,j)=><li key={j}>{li}</li>)}</ul>
                  </div>
                ))}
              </div>
              <div className="disclaimer-text"><p><strong>Disclaimer:</strong> This tool is for screening purposes only and is not a substitute for professional medical advice.</p></div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );

  // ─── HISTORY VIEW ────────────────────────────────────────
  const HistoryView = () => (
    <motion.div className="history-page" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
      <h1>Scan History</h1>
      <p>All your past AI skin analyses, saved to your account.</p>
      {history.length===0 ? (
        <div style={{background:'white',borderRadius:16,border:'1px solid var(--border)',padding:'60px',textAlign:'center'}}>
          <History size={48} style={{marginBottom:16,opacity:0.3}}/>
          <h3 style={{marginBottom:8}}>No scans yet</h3>
          <p style={{color:'var(--text-muted)',marginBottom:20}}>Start your first skin assessment today.</p>
          <button className="btn-primary" onClick={()=>{setView('scan');resetScan();}}><Camera size={16}/>Start Scan</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead><tr><th>#</th><th>Date</th><th>Diagnosis</th><th>Confidence</th><th>Risk Level</th><th>Status</th></tr></thead>
            <tbody>
              {history.map((item,i)=>(
                <tr key={item.id}>
                  <td style={{color:'var(--text-muted)'}}>{i+1}</td>
                  <td>{item.date}</td>
                  <td style={{fontWeight:600,color:'var(--primary)'}}>{item.diagnosis}</td>
                  <td>{((item.confidence||0)*100).toFixed(1)}%</td>
                  <td>{getRiskBadge(item.diagnosis)}</td>
                  <td><span className="badge badge-success">{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );

  // ─── SETTINGS VIEW ───────────────────────────────────────
  const SettingsView = () => (
    <motion.div className="settings-page" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
      <h1>Settings</h1>
      <p>Manage your account and preferences.</p>
      <div className="settings-card">
        <h3>Profile</h3>
        <div className="desc">Your account information.</div>
        <div style={{display:'flex',alignItems:'center',gap:16,padding:'16px',background:'var(--bg)',borderRadius:12}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,var(--primary),#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:800,fontSize:'1.2rem'}}>{getInitials(user.name)}</div>
          <div><div style={{fontWeight:700,fontSize:'1rem'}}>{user.name}</div><div style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{user.email}</div></div>
        </div>
      </div>
      <div className="settings-card">
        <h3>Preferences</h3>
        <div className="desc">Customize your experience.</div>
        {[
          {label:'Push Notifications', sub:'Get alerts for scan results', key:'notifications'},
          {label:'Auto-save Scans', sub:'Save all scans automatically', key:'autoSave'},
        ].map(s=>(
          <div className="settings-row" key={s.key}>
            <div><div className="settings-row-label">{s.label}</div><div className="settings-row-sub">{s.sub}</div></div>
            <div className={`toggle ${settings[s.key]?'on':''}`} onClick={()=>setSettings(p=>({...p,[s.key]:!p[s.key]}))}/>
          </div>
        ))}
      </div>
      <div className="settings-card">
        <h3>Data & Privacy</h3>
        <div className="desc">Manage your scan history and account data.</div>
        <div className="settings-row">
          <div><div className="settings-row-label">Clear All History</div><div className="settings-row-sub">Remove all scan records</div></div>
          <button style={{background:'#fee2e2',color:'var(--danger)',border:'none',padding:'8px 16px',borderRadius:8,fontWeight:600,cursor:'pointer',fontSize:'0.85rem'}} onClick={()=>{if(confirm('Clear all history?'))setHistory([])}}>Clear</button>
        </div>
        <div className="settings-row">
          <div><div className="settings-row-label">Sign Out</div><div className="settings-row-sub">Log out of your account</div></div>
          <button style={{background:'var(--primary)',color:'white',border:'none',padding:'8px 16px',borderRadius:8,fontWeight:600,cursor:'pointer',fontSize:'0.85rem'}} onClick={logout}>Sign Out</button>
        </div>
      </div>
    </motion.div>
  );

  const navItems = [
    {id:'dashboard', icon:<LayoutDashboard size={22}/>, label:'Home'},
    {id:'scan',      icon:<Scan size={22}/>,            label:'Scan'},
    {id:'history',   icon:<History size={22}/>,         label:'History'},
    {id:'settings',  icon:<Settings size={22}/>,        label:'Settings'},
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo"><Activity size={22} color="white"/></div>
        <nav className="sidebar-nav">
          {navItems.map(item=>(
            <div key={item.id} className={`sidebar-item ${view===item.id?'active':''}`} title={item.id} onClick={()=>{setView(item.id); if(item.id==='scan') resetScan();}}>
              {item.icon}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-logout" title="Sign Out" onClick={logout}><LogOut size={20}/></div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-search">
            <Search size={16} color="var(--text-light)"/>
            <input placeholder="Search scans, diagnoses..." readOnly/>
          </div>
          <div className="topbar-right">
            <div className="topbar-btn"><Bell size={18}/></div>
            <div className="topbar-user">
              <div className="topbar-avatar">{getInitials(user.name)}</div>
              <div className="topbar-user-info">
                <div className="topbar-user-name">{user.name}</div>
                <div className="topbar-user-role">Patient</div>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">
          <AnimatePresence mode="wait">
            {view==='dashboard' && <DashboardView key="dash"/>}
            {view==='scan'      && <ScanView key="scan"/>}
            {view==='history'   && <HistoryView key="hist"/>}
            {view==='settings'  && <SettingsView key="set"/>}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {navItems.map(item=>(
            <div key={item.id} className={`mobile-nav-item ${view===item.id?'active':''}`}
              onClick={()=>{setView(item.id); if(item.id==='scan') resetScan();}}>
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
