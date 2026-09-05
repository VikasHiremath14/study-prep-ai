import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Coffee, 
  Sun, 
  Moon, 
  Utensils, 
  BookOpen, 
  RotateCcw, 
  Zap, 
  ShieldCheck, 
  Brain, 
  Download, 
  Play, 
  Pause, 
  Check, 
  Sliders, 
  ChevronDown, 
  ChevronUp,
  Briefcase,
  AlertTriangle,
  Flame,
  Search,
  BookMarked,
  Activity,
  Layers,
  Edit3
} from 'lucide-react';

const SUGGESTED_SUBJECT_PILLS = [
  { name: 'Data Structures & Algorithms', difficulty: 'hard', icon: '💻' },
  { name: 'Operating Systems: Three Easy Pieces', difficulty: 'hard', icon: '⚡' },
  { name: 'Advanced Mathematics & Calculus', difficulty: 'hard', icon: '📐' },
  { name: 'Computer Networks & TCP/IP', difficulty: 'medium', icon: '🌐' },
  { name: 'Database Management Systems (DBMS)', difficulty: 'medium', icon: '🗄️' },
  { name: 'Machine Learning & Neural Nets', difficulty: 'hard', icon: '🤖' },
  { name: 'System Design & Distributed Systems', difficulty: 'medium', icon: '🏗️' },
  { name: 'Active Recall & Flashcard Revision', difficulty: 'light', icon: '🧠' }
];

const DEFAULT_SUBJECTS = [
  { name: 'Data Structures & Algorithmic Analysis', difficulty: 'hard', allocated_hours: 1.5, icon: '💻' },
  { name: 'Operating Systems: Three Easy Pieces', difficulty: 'hard', allocated_hours: 1.5, icon: '⚡' },
  { name: 'Advanced Mathematics & Calculus', difficulty: 'medium', allocated_hours: 1.0, icon: '📐' },
  { name: 'Active Recall & Flashcard Revision', difficulty: 'light', allocated_hours: 1.0, icon: '🧠' }
];

const DEFAULT_BUSY_SLOTS = [
  { title: "College Lectures / Classes", start_time: "10:30", end_time: "13:00", category: "college" },
  { title: "Gym / Workout & Commute", start_time: "17:30", end_time: "18:45", category: "gym" }
];

const DELUSION_PRESETS = [
  {
    name: "10-Hour Nonstop Cramming",
    desc: "Unrealistic 10 hours with 4h continuous study blocks and 0 scheduled breaks.",
    wake: "06:00",
    sleep: "01:00",
    blocks: [
      { start_time: "08:00", end_time: "12:00", subject: "Advanced Mathematics", difficulty: "hard" },
      { start_time: "12:00", end_time: "16:00", subject: "Data Structures & Algorithms", difficulty: "hard" },
      { start_time: "17:00", end_time: "21:00", subject: "Operating Systems", difficulty: "medium" },
      { start_time: "22:00", end_time: "01:00", subject: "Late Night Cramming", difficulty: "hard" }
    ]
  },
  {
    name: "All-Nighter Pre-Exam Panic",
    desc: "Only 3.5h sleep with heavy analytical calculus past midnight.",
    wake: "05:30",
    sleep: "02:00",
    blocks: [
      { start_time: "07:00", end_time: "11:30", subject: "Engineering Calculus", difficulty: "hard" },
      { start_time: "13:00", end_time: "17:30", subject: "Computer Architecture", difficulty: "hard" },
      { start_time: "23:00", end_time: "02:00", subject: "Midnight Panic Revision", difficulty: "hard" }
    ]
  },
  {
    name: "No-Breaks Afternoon Sprint",
    desc: "Back-to-back 5-hour continuous blocks with no food or recovery buffers.",
    wake: "07:00",
    sleep: "23:30",
    blocks: [
      { start_time: "09:00", end_time: "14:00", subject: "Deep Machine Learning", difficulty: "hard" },
      { start_time: "14:30", end_time: "19:30", subject: "System Design & Algorithms", difficulty: "hard" }
    ]
  }
];

// Web Audio API Synthesizer for study chimes
function playChime(type = 'start') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'complete') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }
  } catch (e) {
    console.log("Audio chime error:", e);
  }
}

export default function TimetableCorrector({ activeProfile, onNavigateToReader }) {
  const studentName = activeProfile?.name || activeProfile?.student_name || "Student";
  const gradeLevel = activeProfile?.grade_level || "engineering";
  const retentionScore = activeProfile?.profile?.retention_score != null ? activeProfile.profile.retention_score : 0.78;
  const focusTier = activeProfile?.profile?.focus_tier || (retentionScore >= 0.75 ? "Deep Focus Master" : "Standard Collegiate");
  const breakInterval = activeProfile?.profile?.break_interval_minutes || 45;

  // View Mode: 'autopilot' (Circadian Auto-Pacing) or 'scanner' (Delusion & Burnout Audit)
  const [activeSubTab, setActiveSubTab] = useState('autopilot');

  // Generation state - timeline is hidden until user enters subjects and generates timetable
  const [isGenerated, setIsGenerated] = useState(false);

  // Schedule parameters
  const [wakeTime, setWakeTime] = useState(activeProfile?.wake_time || "06:30");
  const [sleepTime, setSleepTime] = useState(activeProfile?.sleep_time || "23:30");
  const [targetHours, setTargetHours] = useState(5.0);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDiff, setNewSubjectDiff] = useState("hard");

  // In-Between Daily Commitments / Work / College
  const [busySlots, setBusySlots] = useState(DEFAULT_BUSY_SLOTS);
  const [newBusyTitle, setNewBusyTitle] = useState("");
  const [newBusyStart, setNewBusyStart] = useState("14:00");
  const [newBusyEnd, setNewBusyEnd] = useState("16:00");
  const [newBusyCat, setNewBusyCat] = useState("college");

  const [loading, setLoading] = useState(false);
  const [calibratedSchedule, setCalibratedSchedule] = useState(null);
  const [error, setError] = useState(null);

  // Live Slot Statuses & Active Countdown Timer
  const [slotStatuses, setSlotStatuses] = useState({});
  const [activeSlotId, setActiveSlotId] = useState(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  // Delusion Scanner State
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [rawWakeTime, setRawWakeTime] = useState(DELUSION_PRESETS[0].wake);
  const [rawSleepTime, setRawSleepTime] = useState(DELUSION_PRESETS[0].sleep);
  const [rawBlocks, setRawBlocks] = useState(DELUSION_PRESETS[0].blocks);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  // Timer countdown hook
  useEffect(() => {
    if (isTimerRunning && timerSecondsLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            playChime('complete');
            if (activeSlotId) {
              setSlotStatuses((s) => ({ ...s, [activeSlotId]: 'completed' }));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isTimerRunning, timerSecondsLeft, activeSlotId]);

  const handleStartTimerForSlot = (slot) => {
    const sId = slot.id || `${slot.start}-${slot.end}`;
    setActiveSlotId(sId);
    const duration = slot.duration_minutes || 45;
    setTimerSecondsLeft(duration * 60);
    setIsTimerRunning(true);
    setSlotStatuses((prev) => ({ ...prev, [sId]: 'in_progress' }));
    playChime('start');
  };

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    if (activeSlotId && calibratedSchedule) {
      const slot = calibratedSchedule.slots?.find(s => (s.id || `${s.start}-${s.end}`) === activeSlotId);
      if (slot) {
        setTimerSecondsLeft((slot.duration_minutes || 45) * 60);
      }
    }
  };

  const handleToggleSlotStatus = async (slot) => {
    const sId = slot.id || `${slot.start}-${slot.end}`;
    const current = slotStatuses[sId] || 'pending';
    const next = current === 'completed' ? 'pending' : 'completed';
    setSlotStatuses((prev) => ({ ...prev, [sId]: next }));

    if (next === 'completed') {
      playChime('complete');
    }

    try {
      await fetch('/api/scheduler/slot-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: activeProfile?.student_id || null,
          slot_id: sId,
          status: next,
          slot_info: slot
        })
      });
    } catch (err) {
      console.log("Slot progress log error:", err);
    }
  };

  const handleAddSuggestedSubject = (sugg) => {
    if (subjects.some(s => s.name.toLowerCase() === sugg.name.toLowerCase())) return;
    setSubjects([
      ...subjects,
      { name: sugg.name, difficulty: sugg.difficulty, allocated_hours: 1.5, icon: sugg.icon || '📚' }
    ]);
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    setSubjects([
      ...subjects,
      { name: newSubjectName.trim(), difficulty: newSubjectDiff, allocated_hours: 1.0, icon: '📚' }
    ]);
    setNewSubjectName("");
  };

  const handleRemoveSubject = (idx) => {
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  const handleAddBusySlot = () => {
    if (!newBusyTitle.trim()) return;
    setBusySlots([
      ...busySlots,
      { title: newBusyTitle.trim(), start_time: newBusyStart, end_time: newBusyEnd, category: newBusyCat }
    ]);
    setNewBusyTitle("");
  };

  const handleRemoveBusySlot = (idx) => {
    setBusySlots(busySlots.filter((_, i) => i !== idx));
  };

  const handleGenerateSchedule = async () => {
    if (subjects.length === 0) {
      setError("Please add at least one subject you will be studying today.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        student_id: activeProfile?.student_id || null,
        student_name: studentName,
        grade_level: gradeLevel,
        wake_time: wakeTime,
        sleep_time: sleepTime,
        target_study_hours: parseFloat(targetHours),
        retention_score: retentionScore,
        break_interval_minutes: breakInterval,
        busy_slots: busySlots,
        subjects: subjects
      };

      const res = await fetch('/api/scheduler/calibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const data = await res.json();
      setCalibratedSchedule(data);
      setIsGenerated(true);
      
      // Save in localStorage
      try {
        localStorage.setItem('study_prep_timetable', JSON.stringify(data));
        localStorage.setItem('study_prep_subjects', JSON.stringify(subjects));
      } catch (e) {}

    } catch (err) {
      console.error("Scheduler error:", err);
      setError("Failed to calibrate timetable. Please verify backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportICS = async (customSlots = null) => {
    const slotsToExport = customSlots || calibratedSchedule?.slots;
    if (!slotsToExport) return;
    try {
      const res = await fetch('/api/scheduler/export-ics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          slots: slotsToExport
        })
      });

      if (!res.ok) throw new Error("ICS generation failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_schedule_${studentName.toLowerCase().replace(/\s+/g, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Calendar export error:", err);
      alert("Failed to export .ics calendar.");
    }
  };

  const handleSelectPreset = (idx) => {
    setSelectedPresetIdx(idx);
    const preset = DELUSION_PRESETS[idx];
    setRawWakeTime(preset.wake);
    setRawSleepTime(preset.sleep);
    setRawBlocks(preset.blocks);
    setAuditResult(null);
  };

  const handleRunDelusionAudit = async () => {
    setScannerLoading(true);
    try {
      const payload = {
        student_id: activeProfile?.student_id || null,
        student_name: studentName,
        grade_level: gradeLevel,
        wake_time: rawWakeTime,
        sleep_time: rawSleepTime,
        retention_score: retentionScore,
        break_interval_minutes: retentionScore >= 0.75 ? 60 : 45,
        break_duration_minutes: retentionScore >= 0.75 ? 15 : 10,
        busy_slots: busySlots,
        raw_blocks: rawBlocks
      };

      const res = await fetch('/api/scheduler/diagnose-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Audit failed");
      const data = await res.json();
      setAuditResult(data);
    } catch (err) {
      console.error("Scanner error:", err);
      alert("Failed to run Delusion Audit.");
    } finally {
      setScannerLoading(false);
    }
  };

  // Stats
  const studySlots = calibratedSchedule?.slots?.filter(s => s.type === 'study') || [];
  const completedCount = studySlots.filter(s => slotStatuses[s.id || `${s.start}-${s.end}`] === 'completed').length;
  const progressPercent = studySlots.length > 0 ? Math.round((completedCount / studySlots.length) * 100) : 0;
  const activeSlot = calibratedSchedule?.slots?.find(s => (s.id || `${s.start}-${s.end}`) === activeSlotId);

  const formatTimer = (secs) => {
    if (secs == null) return "00:00";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div className="badge badge-primary" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} />
          Phase 2 &bull; Timetable Formation &amp; Circadian Calibration
        </div>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Form Today's Circadian Study Timetable
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '720px', margin: '0 auto' }}>
          Calibrated using your <strong>Phase 1 Retention Score ({Math.round(retentionScore * 100)}% &bull; {focusTier})</strong>. Specify what you are studying today and your daily commitments to construct your non-uniform bio-rhythmic schedule.
        </p>
      </div>

      {/* Sub-Tabs: Auto-Pacing vs Raw Delusion Scanner */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          gap: '6px'
        }}>
          <button
            onClick={() => setActiveSubTab('autopilot')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.86rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeSubTab === 'autopilot' ? 'var(--primary)' : 'transparent',
              color: activeSubTab === 'autopilot' ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <Zap size={15} />
            ⚡ Form Timetable &amp; Circadian Pacing
          </button>

          <button
            onClick={() => setActiveSubTab('scanner')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.86rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeSubTab === 'scanner' ? '#ef4444' : 'transparent',
              color: activeSubTab === 'scanner' ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <Search size={15} />
            🔍 Raw Delusion Scanner
          </button>
        </div>
      </div>

      {activeSubTab === 'autopilot' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Phase 1 Retention Profile Insights Bar */}
          <div className="glass-panel" style={{
            padding: '14px 20px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Brain size={20} color="#34d399" />
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff', display: 'block' }}>
                  Phase 1 Retention Profiler Result Active
                </strong>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  {Math.round(retentionScore * 100)}% Retention Score &bull; {focusTier} &bull; {breakInterval}m Optimal Session Interval
                </span>
              </div>
            </div>
            <div className="badge badge-success" style={{ fontSize: '0.72rem' }}>
              ✓ Retention Calibrated
            </div>
          </div>

          {/* STEP 1: WHAT ARE YOU STUDYING TODAY? (Subject Intake) */}
          <div className="glass-panel" style={{ padding: '22px 24px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}>
                  1
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    What are you studying today?
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Add the subjects, topics, or exam modules you will tackle today
                  </span>
                </div>
              </div>
              <span className="badge" style={{ fontSize: '0.74rem' }}>
                {subjects.length} Subjects Selected
              </span>
            </div>

            {/* Quick Pick Suggested Pills */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                + Quick Pick Suggestions for Engineering &amp; CS:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SUGGESTED_SUBJECT_PILLS.map((sugg, sIdx) => {
                  const isSelected = subjects.some(s => s.name.toLowerCase() === sugg.name.toLowerCase());
                  return (
                    <button
                      key={sIdx}
                      onClick={() => !isSelected && handleAddSuggestedSubject(sugg)}
                      disabled={isSelected}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '100px',
                        border: isSelected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: isSelected ? '#34d399' : '#e2e8f0',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: isSelected ? 'default' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{sugg.icon}</span>
                      <span>{sugg.name}</span>
                      {isSelected ? <Check size={12} color="#34d399" /> : <Plus size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Selected Subjects Tray */}
            <div style={{ marginBottom: '18px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                Active Today's Subjects List:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subjects.map((sub, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.84rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{sub.icon || '📚'}</span>
                      <strong style={{ color: '#ffffff' }}>{sub.name}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: sub.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.2)' : (sub.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'),
                        color: sub.difficulty === 'hard' ? '#f87171' : (sub.difficulty === 'medium' ? '#fbbf24' : '#34d399')
                      }}>
                        {sub.difficulty === 'hard' ? '🔥 Hard (Morning Peak)' : (sub.difficulty === 'medium' ? '⚡ Medium (Afternoon)' : '💡 Light (Night Recall)')}
                      </span>

                      {subjects.length > 1 && (
                        <button
                          onClick={() => handleRemoveSubject(idx)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                          title="Remove subject"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Subject Addition Row */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Or type custom subject (e.g. Distributed Consensus, Linear Algebra)..."
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                style={{
                  flex: 1,
                  minWidth: '240px',
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              />
              <select
                value={newSubjectDiff}
                onChange={(e) => setNewSubjectDiff(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: '#1e293b',
                  color: '#ffffff',
                  fontSize: '0.82rem'
                }}
              >
                <option value="hard">Hard (Morning Peak Analytical)</option>
                <option value="medium">Medium (Afternoon Applied)</option>
                <option value="light">Light (Evening Active Recall)</option>
              </select>
              <button
                onClick={handleAddSubject}
                className="btn btn-secondary"
                style={{ padding: '9px 16px', gap: '6px', fontSize: '0.82rem' }}
              >
                <Plus size={14} />
                Add Subject
              </button>
            </div>
          </div>

          {/* STEP 2: SCHEDULE SETTINGS & DAILY COMMITMENTS */}
          <div className="glass-panel" style={{ padding: '22px 24px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.9rem'
              }}>
                2
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Schedule Settings &amp; Daily Commitments
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Set your sleep-wake schedule and personal commitments (classes, gym, commute)
                </span>
              </div>
            </div>

            {/* Sleep / Wake / Target Hours */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                  Wake-Up Time
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <Sun size={15} color="#f59e0b" />
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.9rem', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                  Sleep Time
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <Moon size={15} color="#a855f7" />
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.9rem', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Target Study Hours:</span>
                  <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>{targetHours}h</strong>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="8.0"
                  step="0.5"
                  value={targetHours}
                  onChange={(e) => setTargetHours(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--primary)', marginTop: '8px' }}
                />
              </div>
            </div>

            {/* In-Between Work / College / Gym Commitments */}
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Briefcase size={14} />
                In-Between Daily Commitments (Classes, Office, Gym, Commute):
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
                The AI pauses study during these windows and arranges focus blocks around your actual free time.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {busySlots.map((b, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 14px',
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem'
                  }}>
                    <div>
                      <strong style={{ color: '#ffffff', marginRight: '8px' }}>{b.title}</strong>
                      <span style={{ fontFamily: 'monospace', color: '#fbbf24' }}>{b.start_time} - {b.end_time}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveBusySlot(idx)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Busy Slot Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px auto', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Commitment name (e.g. Lab, Gym)..."
                  value={newBusyTitle}
                  onChange={(e) => setNewBusyTitle(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: '4px', background: '#1e293b', border: '1px solid var(--border-subtle)', color: '#ffffff', fontSize: '0.8rem' }}
                />
                <input
                  type="time"
                  value={newBusyStart}
                  onChange={(e) => setNewBusyStart(e.target.value)}
                  style={{ padding: '7px', borderRadius: '4px', background: '#1e293b', border: '1px solid var(--border-subtle)', color: '#ffffff', fontSize: '0.78rem' }}
                />
                <input
                  type="time"
                  value={newBusyEnd}
                  onChange={(e) => setNewBusyEnd(e.target.value)}
                  style={{ padding: '7px', borderRadius: '4px', background: '#1e293b', border: '1px solid var(--border-subtle)', color: '#ffffff', fontSize: '0.78rem' }}
                />
                <button
                  onClick={handleAddBusySlot}
                  className="btn btn-secondary"
                  style={{ padding: '7px 12px' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* PRIMARY TIMETABLE GENERATION BUTTON */}
            <button
              onClick={handleGenerateSchedule}
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '13px 24px',
                fontSize: '0.96rem',
                fontWeight: 800,
                gap: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Sparkles size={18} />
              {loading ? "✨ Synthesizing Calibrated Circadian Schedule..." : (isGenerated ? "🔄 Re-Calibrate Timetable with New Settings" : "✨ Generate Calibrated Circadian Timetable")}
            </button>
          </div>

          {error && (
            <div style={{ padding: '14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#fca5a5', fontSize: '0.88rem' }}>
              {error}
            </div>
          )}

          {/* ACTIVE COUNTDOWN TIMER WIDGET (If a slot is started) */}
          {activeSlotId && (
            <div className="glass-panel" style={{
              padding: '18px 24px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(168, 85, 247, 0.18))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                  Live Active Focus Tracker
                </span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                  {activeSlot?.title || "Focus Block"}
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {activeSlot?.start} - {activeSlot?.end} &bull; {activeSlot?.duration_minutes}m session
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '2.2rem',
                  fontWeight: 900,
                  color: timerSecondsLeft > 60 ? '#ffffff' : '#f87171',
                  letterSpacing: '0.05em'
                }}>
                  {formatTimer(timerSecondsLeft)}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleToggleTimer}
                    className="btn btn-primary"
                    style={{ padding: '10px 14px', borderRadius: '50%' }}
                    title={isTimerRunning ? "Pause" : "Start"}
                  >
                    {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={handleResetTimer}
                    className="btn btn-secondary"
                    style={{ padding: '10px 14px', borderRadius: '50%' }}
                    title="Reset Block"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CALIBRATED TIMETABLE OUTPUT (ONLY SHOWN AFTER GENERATION) */}
          {isGenerated && calibratedSchedule && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Top Cognitive Rhythm Metric Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px'
              }}>
                <div className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Calibrated Pacing Tier
                  </span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--primary-light)' }}>
                    {calibratedSchedule?.pacing_tier ? calibratedSchedule.pacing_tier.split('(')[0] : focusTier}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                    {retentionScore >= 0.75 ? "70m/55m/50m Varied Blocks" : "50m/40m/35m Varied Blocks"}
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Nutrition &amp; Rest Buffers
                  </span>
                  <strong style={{ fontSize: '1.2rem', color: '#34d399' }}>
                    Lunch, Tea &amp; Dinner
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                    Prevents postprandial drop
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Total Focus Target
                  </span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)' }}>
                    {calibratedSchedule?.actual_scheduled_study_hours || targetHours} hrs Focus
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                    {studySlots.length} structured sessions
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    In-Between Commitments
                  </span>
                  <strong style={{ fontSize: '1.2rem', color: '#fbbf24' }}>
                    {busySlots.length} Work/College Slots
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                    Protected focus windows
                  </span>
                </div>
              </div>

              {/* Daily Progress & Calendar Export Bar */}
              <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Daily Progress:</span>
                    <strong style={{ fontSize: '0.95rem', color: '#34d399' }}>
                      {calibratedSchedule.actual_scheduled_study_hours}h Focus Target
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      ({completedCount} / {studySlots.length} study blocks completed)
                    </span>
                  </div>
                  <div style={{ width: '240px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #34d399)', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                <button
                  onClick={() => handleExportICS()}
                  className="btn btn-secondary"
                  style={{ gap: '8px', fontSize: '0.85rem', padding: '8px 16px', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                >
                  <Download size={14} color="var(--primary-light)" />
                  Export .ics Calendar
                </button>
              </div>

              {/* AI Strategic Rationale Card */}
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Brain size={18} color="var(--primary-light)" />
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>AI Strategic Pacing &amp; Nutrition Rationale</h4>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                  {calibratedSchedule.ai_rationale}
                </p>
              </div>

              {/* Visual Schedule Timeline (NON-UNIFORM BLOCKS) */}
              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="var(--accent-cyan)" />
                    Circadian Daily Timeline
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Non-uniform blocks &bull; Click 'Focus' to start timer
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {calibratedSchedule.slots?.map((slot, idx) => {
                    const sId = slot.id || `${slot.start}-${slot.end}`;
                    const isStudy = slot.type === 'study';
                    const isBreak = slot.type === 'break';
                    const isMeal = slot.type === 'meal';
                    const isWork = slot.type === 'work';
                    const isRoutine = slot.type === 'routine';
                    const isCompleted = slotStatuses[sId] === 'completed';
                    const isCurrent = activeSlotId === sId;

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: isCompleted
                            ? 'rgba(16, 185, 129, 0.12)'
                            : (isCurrent
                              ? 'rgba(99, 102, 241, 0.2)'
                              : (isWork 
                                ? 'rgba(251, 191, 36, 0.1)' 
                                : (isStudy 
                                  ? 'rgba(99, 102, 241, 0.1)' 
                                  : (isMeal ? 'rgba(245, 158, 11, 0.08)' : (isBreak ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.02)'))))),
                          border: `1px solid ${
                            isCompleted
                              ? 'rgba(16, 185, 129, 0.4)'
                              : (isCurrent
                                ? 'var(--primary)'
                                : (isWork 
                                  ? 'rgba(251, 191, 36, 0.35)' 
                                  : (isStudy 
                                    ? 'rgba(99, 102, 241, 0.25)' 
                                    : (isMeal ? 'rgba(245, 158, 11, 0.25)' : (isBreak ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-subtle)')))))
                          }`,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Icon or Checkbox */}
                        {isStudy ? (
                          <button
                            onClick={() => handleToggleSlotStatus(slot)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              background: isCompleted ? '#10b981' : 'rgba(255,255,255,0.06)',
                              border: isCompleted ? 'none' : '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#ffffff',
                              flexShrink: 0
                            }}
                            title={isCompleted ? "Mark incomplete" : "Mark completed"}
                          >
                            {isCompleted && <Check size={14} />}
                          </button>
                        ) : (
                          <div style={{ width: '24px', flexShrink: 0, textAlign: 'center' }}>
                            {isWork && <Briefcase size={15} color="#fbbf24" />}
                            {isMeal && (slot.title.includes('Tea') || slot.title.includes('Snack') ? <Coffee size={15} color="#f59e0b" /> : <Utensils size={15} color="#f59e0b" />)}
                            {isBreak && <Zap size={15} color="#34d399" />}
                            {isRoutine && <Sun size={15} color="#94a3b8" />}
                          </div>
                        )}

                        {/* Time Column */}
                        <div style={{ minWidth: '95px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.84rem', color: isStudy ? 'var(--primary-light)' : (isWork ? '#fbbf24' : '#94a3b8') }}>
                          {slot.start} - {slot.end}
                        </div>

                        {/* Content Column */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.88rem', color: isCompleted ? '#34d399' : (isWork ? '#fef08a' : '#ffffff'), textDecoration: isCompleted ? 'line-through' : 'none' }}>
                              {slot.title}
                            </strong>
                            {slot.difficulty && (
                              <span style={{
                                fontSize: '0.66rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                backgroundColor: slot.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.2)' : (slot.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'),
                                color: slot.difficulty === 'hard' ? '#f87171' : (slot.difficulty === 'medium' ? '#fbbf24' : '#34d399')
                              }}>
                                {slot.difficulty}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                            {slot.description}
                          </span>
                        </div>

                        {/* Duration Pill / Focus Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {slot.duration_minutes && (
                            <span style={{ fontSize: '0.75rem', color: isStudy ? 'var(--accent-cyan)' : (isWork ? '#fbbf24' : '#34d399'), fontWeight: 700 }}>
                              {slot.duration_minutes}m
                            </span>
                          )}

                          {isStudy && !isCompleted && (
                            <button
                              onClick={() => handleStartTimerForSlot(slot)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.72rem', gap: '4px' }}
                              title="Start Live Focus Timer for this block"
                            >
                              <Play size={12} />
                              Focus
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NEXT STEP CTA: PROCEED TO PHASE 3 MATERIAL INGESTION */}
              {onNavigateToReader && (
                <div className="glass-panel" style={{
                  padding: '20px 24px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.2)'
                }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                      Ready to upload materials for your {subjects.length} study subjects?
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
                      Proceed to <strong>Study Material Ingestion (Phase 3)</strong> to add textbooks and notes matching today's timetable.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateToReader({ schedule: calibratedSchedule, subjects: subjects })}
                    className="btn btn-primary"
                    style={{
                      padding: '11px 22px',
                      gap: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    Proceed to Study Material Ingestion
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* RAW DELUSION & BURNOUT SCANNER TAB */}
      {activeSubTab === 'scanner' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Flame size={20} color="#ef4444" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                Delusion Scanner: Audit Raw / Overambitious Study Plans
              </h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Select a sample uncalibrated study schedule or test your own raw plan. The AI will audit it against cognitive science principles, flag burnout violations, calculate a Delusion Score, and auto-correct it.
            </p>

            {/* Presets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {DELUSION_PRESETS.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPreset(idx)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${selectedPresetIdx === idx ? '#ef4444' : 'var(--border-subtle)'}`,
                    background: selectedPresetIdx === idx ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <strong style={{ fontSize: '0.88rem', color: selectedPresetIdx === idx ? '#f87171' : '#ffffff', display: 'block', marginBottom: '4px' }}>
                    {p.name}
                  </strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                    {p.desc}
                  </span>
                </div>
              ))}
            </div>

            {/* Raw Blocks Preview */}
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '18px' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Raw Input Schedule Blocks ({rawWakeTime} wake &bull; {rawSleepTime} sleep)
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {rawBlocks.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ fontFamily: 'monospace', color: '#94a3b8', marginRight: '10px' }}>{b.start_time} - {b.end_time}</span>
                      <strong style={{ color: '#ffffff' }}>{b.subject}</strong>
                    </div>
                    <span style={{ color: '#f87171', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>{b.difficulty}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunDelusionAudit}
              disabled={scannerLoading}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                borderColor: '#ef4444',
                padding: '10px 24px',
                fontSize: '0.9rem',
                gap: '8px'
              }}
            >
              <Flame size={16} />
              {scannerLoading ? "Running Delusion Audit..." : "Run AI Delusion & Burnout Audit"}
            </button>
          </div>

          {/* Audit Results */}
          {auditResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Top Score Banner */}
              <div className="glass-panel" style={{
                padding: '24px',
                borderLeft: `5px solid ${auditResult.risk_color}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>
                    AI Delusion Risk Assessment
                  </span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: auditResult.risk_color, margin: '4px 0' }}>
                    {auditResult.delusion_risk_score}% &bull; {auditResult.risk_tier}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#cbd5e1', maxWidth: '560px', marginTop: '4px' }}>
                    {auditResult.agent_feedback}
                  </p>
                </div>

                <div style={{
                  width: '85px',
                  height: '85px',
                  borderRadius: '50%',
                  border: `4px solid ${auditResult.risk_color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.3)'
                }}>
                  <strong style={{ fontSize: '1.4rem', color: auditResult.risk_color, lineHeight: 1 }}>
                    {Math.round(auditResult.delusion_risk_score)}%
                  </strong>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Delusion</span>
                </div>
              </div>

              {/* Violations List */}
              <div className="glass-panel" style={{ padding: '20px 24px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} color="#f59e0b" />
                  Detected Cognitive &amp; Circadian Violations ({auditResult.violations_count})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {auditResult.violations?.map((v, i) => (
                    <div key={i} style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ color: '#fca5a5', fontSize: '0.88rem' }}>{v.title}</strong>
                        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', color: '#f87171', fontWeight: 700 }}>
                          {v.category}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '6px', lineHeight: 1.4 }}>
                        {v.description}
                      </p>
                      {v.citation && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <BookOpen size={11} color="var(--accent-cyan)" />
                          Scientific Citation: {v.citation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto-Corrected Solution */}
              {auditResult.calibrated_schedule && (
                <div className="glass-panel" style={{ padding: '20px 24px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} />
                      Auto-Corrected Timetable ({auditResult.calibrated_schedule.actual_scheduled_study_hours}h Study)
                    </h4>
                    <button
                      onClick={() => handleExportICS(auditResult.calibrated_schedule.slots)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
                    >
                      <Download size={13} />
                      Export Fixed Plan (.ics)
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {auditResult.calibrated_schedule.slots?.map((slot, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: slot.type === 'study' ? 'rgba(99, 102, 241, 0.1)' : (slot.type === 'meal' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.02)'),
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontFamily: 'monospace', color: 'var(--primary-light)', fontWeight: 700 }}>
                            {slot.start} - {slot.end}
                          </span>
                          <span style={{ color: '#ffffff' }}>{slot.title}</span>
                        </div>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>{slot.duration_minutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}
