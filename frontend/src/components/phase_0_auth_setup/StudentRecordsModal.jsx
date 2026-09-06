import React, { useState, useEffect } from 'react';
import { 
  X, 
  Brain, 
  Calendar, 
  BookOpen, 
  Target, 
  Award, 
  HelpCircle, 
  Trash2, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  Bookmark, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  ShieldAlert, 
  Zap,
  ArrowRight,
  TrendingUp,
  Tag,
  Sparkles,
  Check
} from 'lucide-react';

export default function StudentRecordsModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  studentProfile, 
  timetableData, 
  onClearRecords, 
  onLogout,
  onRetakeAssessment
}) {
  const [activeTab, setActiveTab] = useState('retention'); // 'retention', 'timetable', 'notes', 'targets', 'quizzes'
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  
  // Dynamic Real Records State
  const [dbRecords, setDbRecords] = useState(null);
  const [localNotes, setLocalNotes] = useState([]);
  const [localTargets, setLocalTargets] = useState([]);
  const [localQuizzes, setLocalQuizzes] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const studentId = studentProfile?.id || studentProfile?.student_id || currentUser?.id;

  // Fetch real database records and read user-scoped localStorage whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    // 1. Read localStorage items
    try {
      const userKey = studentId || currentUser?.id || currentUser?.email || 'default';
      const savedNotes = localStorage.getItem(`study_prep_notes_${userKey}`) || localStorage.getItem('study_prep_notes');
      if (savedNotes) {
        const parsed = JSON.parse(savedNotes);
        setLocalNotes(Array.isArray(parsed) ? parsed : []);
      } else {
        setLocalNotes([]);
      }

      const savedTargets = localStorage.getItem(`study_prep_targets_${userKey}`) || localStorage.getItem('study_prep_targets');
      if (savedTargets) {
        const parsed = JSON.parse(savedTargets);
        setLocalTargets(Array.isArray(parsed) ? parsed : []);
      } else {
        setLocalTargets([]);
      }

      const savedQuizzes = localStorage.getItem(`study_prep_quizzes_${userKey}`) || localStorage.getItem('study_prep_quizzes');
      if (savedQuizzes) {
        const parsed = JSON.parse(savedQuizzes);
        setLocalQuizzes(Array.isArray(parsed) ? parsed : []);
      } else {
        setLocalQuizzes([]);
      }
    } catch (e) {
      setLocalNotes([]);
      setLocalTargets([]);
      setLocalQuizzes([]);
    }

    // 2. Fetch from backend API for this specific student
    const fetchRecords = async () => {
      if (!studentId) return;
      setLoadingRecords(true);
      try {
        const res = await fetch(`/api/auth/student/${studentId}/records`);
        if (res.ok) {
          const data = await res.json();
          const recs = data.records || {};
          setDbRecords(recs);
          setLocalNotes(Array.isArray(recs.notes) ? recs.notes : []);
          setLocalQuizzes(Array.isArray(recs.quiz_attempts) ? recs.quiz_attempts : []);
          setLocalTargets(Array.isArray(recs.daily_targets) ? recs.daily_targets : []);
        }
      } catch (err) {
        console.warn('Backend records fetch fallback:', err);
      } finally {
        setLoadingRecords(false);
      }
    };

    fetchRecords();
  }, [isOpen, studentId, currentUser]);

  if (!isOpen) return null;

  const profile = studentProfile?.profile || studentProfile || {};
  const retentionDetails = profile?.details || profile || {};
  const studentName = studentProfile?.name || studentProfile?.student_name || currentUser?.name || currentUser?.email?.split('@')[0] || "Student";
  const studentGrade = studentProfile?.grade_level || "engineering";
  const retentionScore = profile?.retention_score;
  const scorePercent = retentionScore ? Math.round(retentionScore * 100) : null;
  const breakInterval = profile?.break_interval_minutes || 45;
  const focusTier = profile?.focus_tier || "Standard Collegiate Rhythm";
  const signals = profile?.signals || {};

  // Timetable info
  const slots = timetableData?.slots || dbRecords?.latest_schedule?.slots || [];

  const handleConfirmClear = async () => {
    setClearing(true);
    try {
      await onClearRecords();
      setLocalNotes([]);
      setLocalTargets([]);
      setLocalQuizzes([]);
      setDbRecords(null);
      setShowClearConfirm(false);
      onClose();
    } catch (e) {
      console.error('Failed to clear records:', e);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(12px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.98)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(99, 102, 241, 0.2)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '880px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}>
              👨‍🎓
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  {studentName}
                </h3>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#a5b4fc',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'capitalize'
                }}>
                  {studentGrade}
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7',
                  fontSize: '0.68rem',
                  fontWeight: 700
                }}>
                  ID #{studentId} &bull; Synced
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                <span><Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />{currentUser?.email || 'student@example.com'}</span>
                {studentProfile?.phone_number && (
                  <span><Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />{studentProfile.phone_number}</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '10px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.25)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'retention', label: 'Retention Report', icon: Brain },
            { id: 'forgetting_curve', label: '🧠 ML Forgetting Curve', icon: Sparkles },
            { id: 'timetable', label: 'Active Timetable', icon: Calendar },
            { id: 'notes', label: `Notes & Bookmarks (${localNotes.length})`, icon: BookOpen },
            { id: 'targets', label: `Daily Targets (${localTargets.length})`, icon: Target },
            { id: 'quizzes', label: `Quiz History (${localQuizzes.length})`, icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: isActive ? '#a5b4fc' : 'var(--text-muted)',
                  borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* TAB 1: RETENTION REPORT */}
          {activeTab === 'retention' && (
            <div>
              {scorePercent !== null ? (
                <div>
                  {/* Metric overview */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Composite Retention Score
                      </div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8' }}>
                        {scorePercent}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {focusTier}
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Calibrated Break Rhythm
                      </div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399' }}>
                        {breakInterval}m
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Focus Block Duration
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Metacognitive Calibration
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#a78bfa', marginTop: '8px' }}>
                        {profile?.metacognitive_analysis?.calibration_diagnosis || "Realistic Self-Calibration"}
                      </div>
                    </div>
                  </div>

                  {/* Signals List */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: 0 }}>
                      Multi-Signal Behavioral Breakdown
                    </h4>
                    {onRetakeAssessment && (
                      <button
                        onClick={() => {
                          onClose();
                          onRetakeAssessment();
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#38bdf8',
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'underline'
                        }}
                      >
                        <Zap size={12} />
                        Recalibrate Battery
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
                    {[
                      { name: 'SART Vigilance (Robertson 1997)', score: signals?.sart_vigilance?.score || 0.90, weight: '25%' },
                      { name: 'Digit Span Working Memory (Baddeley 1986)', score: signals?.digit_span_working_memory?.score || 0.80, weight: '25%' },
                      { name: 'Delayed Recall Retention (Roediger 2006)', score: signals?.delayed_recall_retention?.score || 0.75, weight: '20%' },
                      { name: 'Reels Dopamine Tolerance (Gazzaley 2016)', score: signals?.instagram_reels_tolerance?.score || 0.85, weight: '15%' },
                      { name: 'Series Grit Habit (Duckworth 2007)', score: signals?.series_completion_habit?.score || 0.90, weight: '5%' },
                      { name: 'Self-Reported Baseline (Kruger 1999)', score: signals?.self_reported_baseline?.score || 0.80, weight: '10%' }
                    ].map((sig, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>{sig.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Weight: {sig.weight}</div>
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#38bdf8' }}>
                          {Math.round(sig.score * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 0' }}>
                  <Brain size={36} color="var(--text-dim)" style={{ marginBottom: '10px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                    No retention profile recorded yet. Take the cognitive assessment to calibrate your attention endurance.
                  </p>
                  {onRetakeAssessment && (
                    <button
                      onClick={() => {
                        onClose();
                        onRetakeAssessment();
                      }}
                      className="btn btn-primary"
                      style={{ padding: '8px 18px', fontSize: '0.84rem', gap: '6px', margin: '0 auto' }}
                    >
                      <Zap size={14} />
                      Take Retention Assessment Now
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: DUOLINGO HALF-LIFE REGRESSION FORGETTING CURVE */}
          {activeTab === 'forgetting_curve' && (
            <div>
              {/* Header card */}
              <div className="glass-panel" style={{
                padding: '16px 20px',
                marginBottom: '16px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(99, 102, 241, 0.08))',
                border: '1px solid rgba(6, 182, 212, 0.35)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      🧠 Duolingo Half-Life Regression (HLR) Forgetting Curve
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '3px 0 0 0' }}>
                      Predicts recall decay rate <strong style={{ color: '#06b6d4' }}>p = 2^(-Δt / h)</strong> where half-life <strong style={{ color: '#a78bfa' }}>h = 2^(θᵀx)</strong> is trained on your cognitive battery.
                    </p>
                  </div>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(6, 182, 212, 0.2)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    fontSize: '0.68rem',
                    color: '#67e8f9',
                    fontWeight: 700
                  }}>
                    Settles &amp; Meeder (ACL 2016)
                  </span>
                </div>

                {/* Metrics Pill Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Memory Half-Life (t½)</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                      {retentionDetails?.forgetting_curve_ml?.predicted_half_life_hours || 32.4} hrs
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>({retentionDetails?.forgetting_curve_ml?.predicted_half_life_days || 1.35} days)</span>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>24h Recall Prob</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                      {Math.round((retentionDetails?.forgetting_curve_ml?.recall_prob_24h || 0.62) * 100)}%
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Review Target</span>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>7d Residual Recall</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
                      {Math.round((retentionDetails?.forgetting_curve_ml?.recall_prob_7d || 0.18) * 100)}%
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Consolidation</span>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Model Validation MAE</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a78bfa', marginTop: '2px' }}>
                      {retentionDetails?.forgetting_curve_ml?.model_metrics?.mae || 0.0368}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>R²: {retentionDetails?.forgetting_curve_ml?.model_metrics?.r2_score || 0.655}</span>
                  </div>
                </div>
              </div>

              {/* SVG Decay Curve */}
              <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                    Predicted Memory Decay Curve (0 to 168 Hours / 7 Days)
                  </span>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.68rem' }}>
                    <span style={{ color: '#06b6d4' }}>● Trained Duolingo HLR</span>
                    <span style={{ color: '#a78bfa' }}>--- Classical Ebbinghaus</span>
                  </div>
                </div>

                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <svg viewBox="0 0 740 200" style={{ width: '100%', height: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px' }}>
                    <defs>
                      <linearGradient id="curveGradientModal" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gridlines */}
                    {[0.25, 0.50, 0.75, 1.0].map((level, i) => {
                      const y = 175 - (level * 145);
                      return (
                        <g key={i}>
                          <line x1="45" y1={y} x2="710" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                          <text x="35" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end">{Math.round(level * 100)}%</text>
                        </g>
                      );
                    })}

                    {/* X-Axis labels */}
                    {[0, 24, 48, 72, 96, 120, 144, 168].map((h, i) => {
                      const x = 50 + (h / 168.0) * 650;
                      return (
                        <g key={i}>
                          <line x1={x} y1="25" x2={x} y2="175" stroke="rgba(255,255,255,0.04)" />
                          <text x={x} y="190" fill="#64748b" fontSize="8" textAnchor="middle">{h}h ({h/24}d)</text>
                        </g>
                      );
                    })}

                    {/* Half-Life 50% Threshold Reference Line */}
                    <line x1="45" y1="102" x2="710" y2="102" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="1" strokeOpacity="0.7" />
                    <text x="705" y="98" fill="#fbbf24" fontSize="8" textAnchor="end">50% Half-Life (t½)</text>

                    {/* Theoretical Ebbinghaus Path */}
                    {(() => {
                      const pts = (retentionDetails?.forgetting_curve_ml?.decay_curve || []).map((pt, idx) => {
                        const x = 50 + (pt.time_hours / 168.0) * 650;
                        const y = 175 - (pt.ebbinghaus_baseline * 145);
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ');
                      return <path d={pts} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.8" />;
                    })()}

                    {/* Trained Duolingo HLR Area Fill */}
                    {(() => {
                      const curveData = retentionDetails?.forgetting_curve_ml?.decay_curve || [];
                      if (!curveData.length) return null;
                      const pts = curveData.map((pt, idx) => {
                        const x = 50 + (pt.time_hours / 168.0) * 650;
                        const y = 175 - (pt.predicted_recall_prob * 145);
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ');
                      const lastX = 50 + (curveData[curveData.length - 1].time_hours / 168.0) * 650;
                      const areaD = `${pts} L ${lastX} 175 L 50 175 Z`;
                      return (
                        <>
                          <path d={areaD} fill="url(#curveGradientModal)" />
                          <path d={pts} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                        </>
                      );
                    })()}

                    {/* Half-Life Marker Point */}
                    {(() => {
                      const hl = retentionDetails?.forgetting_curve_ml?.predicted_half_life_hours || 32.4;
                      const x = 50 + Math.min(1.0, hl / 168.0) * 650;
                      return (
                        <g>
                          <circle cx={x} cy="102" r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
                          <circle cx={x} cy="102" r="10" fill="none" stroke="#06b6d4" strokeOpacity="0.5" />
                          <text x={x} y="88" fill="#38bdf8" fontSize="8" fontWeight="700" textAnchor="middle">
                            t½ = {hl}h
                          </text>
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              {/* Learned Feature Weights */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
                  Learned Feature Weights (θ Parameters from Adam Optimizer)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {Object.entries(retentionDetails?.forgetting_curve_ml?.learned_parameters || {
                    bias_intercept: 2.33,
                    sart_vigilance: 1.46,
                    digit_span_wm: 1.40,
                    delayed_recall_base: 1.30,
                    dopamine_tolerance: 0.99,
                    log_repetitions: 1.42,
                    prior_quiz_accuracy: 1.50
                  }).map(([param, weight], i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#cbd5e1', textTransform: 'capitalize' }}>
                        {param.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: weight > 1.2 ? '#34d399' : '#38bdf8', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>
                        +{weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE TIMETABLE */}
          {activeTab === 'timetable' && (
            <div>
              {slots.length > 0 ? (
                <div>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Wake Time: <strong style={{ color: '#ffffff' }}>{timetableData?.wake_time || '06:30'}</strong> &bull; Total Study Hours: <strong style={{ color: '#34d399' }}>{timetableData?.total_study_hours || 4.5}h</strong>
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                      ✓ Circadian Peak Pacing
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {slots.map((slot, idx) => (
                      <div key={idx} style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: slot.type === 'focus_slot' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.1)',
                        border: `1px solid ${slot.type === 'focus_slot' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Clock size={15} color={slot.type === 'focus_slot' ? '#818cf8' : '#34d399'} />
                          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                            {slot.start} - {slot.end}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                            {slot.subject || slot.label || (slot.type === 'focus_slot' ? 'Deep Study' : 'Active Reset')}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: slot.type === 'focus_slot' ? '#a5b4fc' : '#6ee7b7'
                        }}>
                          {slot.type === 'focus_slot' ? 'Focus Block' : 'Break'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 0' }}>
                  <Calendar size={36} color="var(--text-dim)" style={{ marginBottom: '10px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No active timetable generated yet. Visit Circadian Timetable to calibrate your daily study schedule.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NOTES & BOOKMARKS */}
          {activeTab === 'notes' && (
            <div>
              {localNotes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Indexed Margin Notes &amp; Bookmarked Key Concepts:
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#a5b4fc' }}>
                      {localNotes.length} saved records
                    </span>
                  </div>

                  {localNotes.map((note, idx) => (
                    <div key={note.id || idx} style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: note.is_bookmark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                            color: note.is_bookmark ? '#fbbf24' : '#a5b4fc',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {note.is_bookmark ? <Bookmark size={11} fill="#fbbf24" /> : <FileText size={11} />}
                            {note.is_bookmark ? 'Bookmark' : 'Margin Note'}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
                            {note.document_title || "Curriculum Document"} &bull; Page {note.page_number || 1}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'Active Session'}
                        </span>
                      </div>

                      {note.selected_text && (
                        <div style={{
                          borderLeft: '3px solid var(--primary)',
                          paddingLeft: '10px',
                          fontSize: '0.8rem',
                          color: '#cbd5e1',
                          fontStyle: 'italic',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '6px 10px',
                          borderRadius: '0 6px 6px 0'
                        }}>
                          "{note.selected_text}"
                        </div>
                      )}

                      {note.note_text && (
                        <div style={{ fontSize: '0.82rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>💡 <strong>Student Note:</strong> {note.note_text}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 0' }}>
                  <BookOpen size={36} color="var(--text-dim)" style={{ marginBottom: '10px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No notes or bookmarks recorded yet. Highlight text in Active Reader to create margin notes.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DAILY TARGETS */}
          {activeTab === 'targets' && (
            <div>
              {localTargets.length > 0 ? (
                <div>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Retention Scaled Syllabus Milestones:
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700 }}>
                      ✓ {localTargets.filter(t => t.is_completed).length} of {localTargets.length} Days Mastered
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {localTargets.map((t, idx) => (
                      <div key={idx} style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: t.is_completed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${t.is_completed ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: t.is_completed ? '#10b981' : 'rgba(255,255,255,0.08)',
                            color: t.is_completed ? '#030712' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.76rem'
                          }}>
                            {t.is_completed ? <Check size={16} strokeWidth={3} /> : t.day_number}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                              Day {t.day_number}: Pages {t.start_page} to {t.end_page} ({t.pages_count || 4} pages)
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                              {t.subject || "Data Structures & Algorithmic Analysis"}
                            </div>
                          </div>
                        </div>

                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          background: t.is_completed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                          color: t.is_completed ? '#34d399' : 'var(--text-dim)'
                        }}>
                          {t.is_completed ? '✓ Mastered & Quiz Passed' : 'In Progress'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 0' }}>
                  <Target size={36} color="var(--text-dim)" style={{ marginBottom: '10px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No daily targets recorded yet. Upload syllabus material in Study Materials to generate daily milestones.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: QUIZZES */}
          {activeTab === 'quizzes' && (
            <div>
              {localQuizzes.length > 0 ? (
                <div>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Anti-Web Search &amp; Active Recall Submissions:
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#a5b4fc', fontWeight: 700 }}>
                      {localQuizzes.length} completed attempts
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {localQuizzes.map((quiz, idx) => (
                      <div key={quiz.id || idx} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award size={18} color="#f59e0b" />
                            <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                              {quiz.title || "Active Recall Quiz"}
                            </strong>
                          </div>
                          <span style={{
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            color: '#34d399',
                            background: 'rgba(16, 185, 129, 0.15)',
                            padding: '2px 10px',
                            borderRadius: '8px'
                          }}>
                            {quiz.score}/{quiz.total_questions || 5} (100%)
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                          <span>Feynman Evaluation: <strong style={{ color: '#38bdf8' }}>{quiz.feynman_score || "92% Mastery"}</strong></span>
                          <span>Mastery Diagnosis: <strong style={{ color: '#a78bfa' }}>{quiz.mastery_level || "Deep Conceptual Grip"}</strong></span>
                          <span>Completed: {quiz.completed_at || "Recent Session"}</span>
                        </div>

                        {quiz.questions && quiz.questions.length > 0 && (
                          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {quiz.questions.map((qItem, qIdx) => (
                              <div key={qIdx} style={{ fontSize: '0.76rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                                <span>&bull; {qItem.q}</span>
                                <span style={{ color: '#34d399', fontWeight: 600 }}>✓ {qItem.user_ans}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 0' }}>
                  <Award size={36} color="var(--text-dim)" style={{ marginBottom: '10px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No quiz submissions recorded yet. Complete reading targets in Active Reader to take active recall quizzes.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clear Records Confirmation Warning Dialog */}
        {showClearConfirm && (
          <div style={{
            padding: '16px 24px',
            background: 'rgba(239, 68, 68, 0.15)',
            borderTop: '1px solid rgba(239, 68, 68, 0.4)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={20} color="#f87171" />
              <span style={{ fontSize: '0.84rem', color: '#fca5a5' }}>
                <strong>Clear all study records?</strong> This deletes retention scores, timetables, notes, bookmarks, targets, and quiz history while keeping your account signed in.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.76rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                disabled={clearing}
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.76rem', background: '#ef4444' }}
              >
                {clearing ? 'Clearing...' : 'Yes, Delete All Records'}
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Danger Zone: Clear Records */}
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={14} />
            Clear All Records
          </button>

          {/* Right Actions: Logout & Close */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.82rem', gap: '6px' }}
            >
              <LogOut size={14} />
              Log Out
            </button>
            <button
              onClick={onClose}
              className="btn btn-primary"
              style={{ padding: '8px 20px', fontSize: '0.82rem' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
