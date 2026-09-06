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
  Brain, 
  Download, 
  Play, 
  Pause, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Briefcase,
  Radio,
  X
} from 'lucide-react';

const DEFAULT_SUBJECTS = [];
const DEFAULT_BUSY_SLOTS = [];



export default function TimetableCorrector({ activeProfile, existingSchedule, onTimetableUpdated, onNavigateToReader }) {
  const studentName = activeProfile?.name || activeProfile?.student_name || "Student";
  const gradeLevel = activeProfile?.grade_level || "engineering";
  const retentionScore = activeProfile?.profile?.retention_score != null ? activeProfile.profile.retention_score : 0.78;
  const focusTier = activeProfile?.profile?.focus_tier || (retentionScore >= 0.75 ? "Deep Focus Master" : "Standard Collegiate");
  const breakInterval = activeProfile?.profile?.break_interval_minutes || 45;

  // Existing schedule detection
  const [existingScheduleData, setExistingScheduleData] = useState(() => {
    if (existingSchedule && existingSchedule.slots && existingSchedule.slots.length > 0) {
      return existingSchedule;
    }
    if (activeProfile?.latest_schedule && activeProfile.latest_schedule.slots && activeProfile.latest_schedule.slots.length > 0) {
      return activeProfile.latest_schedule;
    }
    try {
      const saved = localStorage.getItem('study_prep_timetable');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.slots && parsed.slots.length > 0) return parsed;
      }
    } catch (e) {}
    return null;
  });

  const [showExistingPrompt, setShowExistingPrompt] = useState(() => {
    return Boolean(
      (existingSchedule && existingSchedule.slots && existingSchedule.slots.length > 0) ||
      (activeProfile?.latest_schedule && activeProfile.latest_schedule.slots && activeProfile.latest_schedule.slots.length > 0)
    );
  });

  // More Options Neon Tray Popover state
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Generation state - timeline is hidden until user enters subjects and generates timetable or views existing
  const [isGenerated, setIsGenerated] = useState(false);

  // Accordion open/collapse state for the 3 grouped boxes (ALL COLLAPSED BY DEFAULT)
  const [openSections, setOpenSections] = useState({
    retention: false,
    subjects: false,
    settings: false
  });

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Schedule parameters
  const [wakeTime, setWakeTime] = useState(activeProfile?.wake_time || "06:30");
  const [sleepTime, setSleepTime] = useState(activeProfile?.sleep_time || "23:30");
  const [targetHours, setTargetHours] = useState(5.0);
  const [subjects, setSubjects] = useState(() => {
    try {
      const savedSubs = localStorage.getItem('study_prep_subjects');
      if (savedSubs) {
        const parsed = JSON.parse(savedSubs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isOldDummy = parsed.some(p => p.name === 'Operating Systems: Three Easy Pieces');
          if (!isOldDummy) return parsed;
        }
      }
    } catch (e) {}
    return [];
  });
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDiff, setNewSubjectDiff] = useState("hard");

  // In-Between Daily Commitments / Work / College
  const [busySlots, setBusySlots] = useState([]);
  const [newBusyTitle, setNewBusyTitle] = useState("");
  const [newBusyStart, setNewBusyStart] = useState("14:00");
  const [newBusyEnd, setNewBusyEnd] = useState("16:00");
  const [newBusyCat, setNewBusyCat] = useState("college");

  const [loading, setLoading] = useState(false);
  const [calibratedSchedule, setCalibratedSchedule] = useState(null);
  // Live Local Clock & Timetable Running Tracker
  const [localTimeStr, setLocalTimeStr] = useState("");
  const [currentSlotInfo, setCurrentSlotInfo] = useState(null);
  const [nextSlotInfo, setNextSlotInfo] = useState(null);
  const [remainingSlotSeconds, setRemainingSlotSeconds] = useState(0);

  useEffect(() => {
    const activeSched = calibratedSchedule || existingScheduleData;
    const slots = activeSched?.slots || [];

    const updateClockAndSlots = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const s = now.getSeconds();
      setLocalTimeStr(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);

      if (!slots || slots.length === 0) {
        setCurrentSlotInfo(null);
        setNextSlotInfo(null);
        return;
      }

      const currentSecsInDay = h * 3600 + m * 60 + s;
      let matched = null;
      let next = null;

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        if (!slot.start || !slot.end) continue;
        const [sh, sm] = slot.start.split(':').map(Number);
        const [eh, em] = slot.end.split(':').map(Number);
        
        let startSecs = sh * 3600 + sm * 60;
        let endSecs = eh * 3600 + em * 60;
        if (endSecs <= startSecs) endSecs += 86400;

        if (currentSecsInDay >= startSecs && currentSecsInDay < endSecs) {
          matched = slot;
          const rem = Math.max(0, endSecs - currentSecsInDay);
          setRemainingSlotSeconds(rem);
          next = slots[(i + 1) % slots.length];
          break;
        } else if (startSecs > currentSecsInDay && !next) {
          next = slot;
        }
      }

      if (!next && slots.length > 0) {
        next = slots[0];
      }

      if (matched) {
        setCurrentSlotInfo({
          isActive: true,
          title: matched.title || matched.subject || "Study Block",
          type: matched.type || "study",
          start: matched.start,
          end: matched.end,
          duration_minutes: matched.duration_minutes || 45
        });
      } else {
        setCurrentSlotInfo({
          isActive: false,
          title: "Wind-down / Free Interval",
          type: "routine",
          start: slots[slots.length - 1]?.end || "23:00",
          end: slots[0]?.start || "06:30",
          duration_minutes: 45
        });
      }

      if (next) {
        setNextSlotInfo({
          title: next.title || next.subject || "Study Block",
          type: next.type || "study",
          start: next.start,
          end: next.end,
          duration_minutes: next.duration_minutes || 45
        });
      }
    };

    updateClockAndSlots();
    const timer = setInterval(updateClockAndSlots, 1000);
    return () => clearInterval(timer);
  }, [calibratedSchedule, existingScheduleData]);

  const formatRemainingSeconds = (secs) => {
    if (!secs || secs <= 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [error, setError] = useState(null);

  const handleAddSubject = () => {
    const updated = [
      ...subjects,
      { name: newSubjectName.trim(), difficulty: newSubjectDiff, allocated_hours: 1.0, icon: '📚' }
    ];
    setSubjects(updated);
    setNewSubjectName("");
    try {
      localStorage.setItem('study_prep_subjects', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleRemoveSubject = (idx) => {
    const updated = subjects.filter((_, i) => i !== idx);
    setSubjects(updated);
    try {
      localStorage.setItem('study_prep_subjects', JSON.stringify(updated));
    } catch (e) {}
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

  const handleUseExistingTimetable = () => {
    if (!existingScheduleData) return;
    setCalibratedSchedule(existingScheduleData);
    setIsGenerated(true);
    setShowExistingPrompt(false);
    setShowMoreOptions(false);
    if (onNavigateToReader) {
      onNavigateToReader({ schedule: existingScheduleData, subjects: subjects });
    }
  };

  const handleViewCurrentTimetable = () => {
    if (!existingScheduleData) return;
    setCalibratedSchedule(existingScheduleData);
    setIsGenerated(true);
    setShowExistingPrompt(false);
    setShowMoreOptions(false);
  };

  const handleCreateNewTimetable = () => {
    setCalibratedSchedule(null);
    setIsGenerated(false);
    setShowExistingPrompt(false);
    setShowMoreOptions(false);
    setOpenSections({
      retention: false,
      subjects: false,
      settings: false
    });
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
        student_id: activeProfile?.student_id || activeProfile?.id || null,
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
      setExistingScheduleData(data);
      setIsGenerated(true);
      setShowExistingPrompt(false);
      
      // Save in localStorage & notify parent
      try {
        localStorage.setItem('study_prep_timetable', JSON.stringify(data));
        localStorage.setItem('study_prep_subjects', JSON.stringify(subjects));
      } catch (e) {}

      if (onTimetableUpdated) {
        onTimetableUpdated(data, subjects);
      }

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

  // Stats
  const studySlots = calibratedSchedule?.slots?.filter(s => s.type === 'study') || [];

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* One Piece Nautical & Haki Animations */}
      <style>{`
        @keyframes pirateGoldGlow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(245, 158, 11, 0.7), 0 0 28px rgba(239, 68, 68, 0.4), inset 0 0 10px rgba(245, 158, 11, 0.25);
            border-color: #f59e0b;
          }
          50% {
            box-shadow: 0 0 25px rgba(251, 191, 36, 1), 0 0 42px rgba(225, 29, 72, 0.7), inset 0 0 15px rgba(251, 191, 36, 0.4);
            border-color: #fbbf24;
          }
        }
        @keyframes strawHatBadgePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
        @keyframes waveFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* LIVE LOCAL CLOCK & CIRCADIAN RUNNING TIMETABLE TRACKER (SMALL & SWEET) */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '18px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(15, 23, 42, 0.92)',
          padding: '5px 16px',
          borderRadius: '100px',
          border: '1.5px solid rgba(245, 158, 11, 0.55)',
          boxShadow: '0 0 20px rgba(245, 158, 11, 0.25), 0 4px 15px rgba(0, 0, 0, 0.6)',
          fontSize: '0.75rem',
          flexWrap: 'wrap',
          backdropFilter: 'blur(10px)'
        }}>
          {/* 1. Live Local Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={13} color="#38bdf8" />
            <span style={{ fontFamily: 'monospace', fontSize: '0.88rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em' }}>
              {localTimeStr || "23:30:16"}
            </span>
            <span style={{ fontSize: '0.64rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>LOCAL</span>
          </div>

          <div style={{ height: '14px', width: '1px', background: 'rgba(245, 158, 11, 0.35)' }} />

          {/* 2. Middle Luffy Sitting Avatar (Matched 26px x 26px) */}
          <img 
            src="/luffy_sitting.png" 
            alt="Luffy Sitting" 
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1.5px solid #f59e0b',
              boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)',
              flexShrink: 0
            }} 
          />

          {/* 3. Current Running Timetable Block with Name & Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: currentSlotInfo?.isActive ? '#34d399' : '#fcd34d', fontWeight: 800 }}>
              {currentSlotInfo?.isActive ? "🟢 Active:" : "Current:"}
            </span>
            <strong style={{ color: '#ffffff', fontWeight: 800 }}>
              {currentSlotInfo?.start}&ndash;{currentSlotInfo?.end}
            </strong>
            <span style={{ color: '#cbd5e1' }}>
              ({currentSlotInfo?.title?.replace(/[📚⚔️🍖🌊⚓🌅]/g, '').trim() || "Free Window"})
            </span>
            {currentSlotInfo?.isActive && remainingSlotSeconds > 0 && (
              <span style={{
                fontFamily: 'monospace',
                fontWeight: 900,
                fontSize: '0.74rem',
                color: remainingSlotSeconds < 300 ? '#f87171' : '#34d399',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '1px 5px',
                borderRadius: '4px'
              }}>
                ⏱️ {formatRemainingSeconds(remainingSlotSeconds)}
              </span>
            )}
          </div>

          <div style={{ height: '14px', width: '1px', background: 'rgba(245, 158, 11, 0.35)' }} />

          {/* 4. 3rd Image: Luffy Smiling Headshot Avatar (Matched 26px x 26px) */}
          <img 
            src="/luffy_smiling.png" 
            alt="Luffy Smiling" 
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1.5px solid #ef4444',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
              flexShrink: 0
            }} 
          />

          {/* 5. Next Block & Total Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: '#38bdf8', fontWeight: 800 }}>Next Block:</span>
            <strong style={{ color: '#ffffff', fontWeight: 800 }}>
              {nextSlotInfo?.start}&ndash;{nextSlotInfo?.end}
            </strong>
            <span style={{ color: '#cbd5e1' }}>
              ({nextSlotInfo?.title?.replace(/[📚⚔️🍖🌊⚓🌅]/g, '').trim() || "Study Block"}&bull;{nextSlotInfo?.duration_minutes || 45}m)
            </span>
          </div>
        </div>
      </div>

      {/* ONE PIECE HERO BANNER WITH ANIME ARTWORK BACKDROP */}
      <div style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        marginBottom: '26px',
        border: '1.5px solid rgba(245, 158, 11, 0.45)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(245, 158, 11, 0.15)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 25, 47, 0.98) 100%)'
      }}>
        {/* Subtle anime background artwork overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '45%',
          backgroundImage: 'url(/onepiece_luffy_bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: 0.22,
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2, padding: '26px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '100px',
              fontSize: '0.74rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 14px rgba(239, 68, 68, 0.4)'
            }}>
              ⚡ Circadian Study Timetable &amp; Chronobiology Calibration
            </span>
            <span style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fcd34d',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              padding: '4px 10px',
              borderRadius: '100px',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              Retention Profile: {Math.round(retentionScore * 100)}% &bull; {focusTier}
            </span>
          </div>

          <h2 style={{
            fontSize: '2.1rem',
            fontWeight: 900,
            marginBottom: '8px',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffffff 0%, #fef08a 50%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Your Circadian Study Timetable
          </h2>

          <p style={{ color: '#cbd5e1', fontSize: '0.92rem', maxWidth: '680px', margin: 0, lineHeight: 1.5 }}>
            Calibrated using your <strong>Retention Score ({Math.round(retentionScore * 100)}% &bull; {focusTier})</strong>. Review your daily timetable, customize your subjects, or adjust circadian schedule anchors below.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* EXISTING TIMETABLE CONTAINER WITH LIST AND MORE OPTIONS BUTTON */}
        {showExistingPrompt && existingScheduleData && (
          <div className="glass-panel" style={{
            padding: '24px 28px',
            background: 'radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.16) 0%, rgba(99, 102, 241, 0.12) 50%, rgba(15, 23, 42, 0.96) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.45)',
            borderRadius: '18px',
            boxShadow: '0 0 35px rgba(245, 158, 11, 0.2), 0 10px 30px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Golden glow */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '130px',
              height: '130px',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />

            {/* Banner Top Row: Title + Blinking More Options Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
                  flexShrink: 0
                }}>
                  🗓️
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                      Your Circadian Timetable
                    </h3>
                    <span style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      padding: '2px 8px',
                      borderRadius: '100px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      Saved in Records
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#cbd5e1', margin: 0 }}>
                    Calibrated for <strong>Wake {existingScheduleData.wake_time || '06:30'}</strong> &bull; <strong>{existingScheduleData.total_study_hours || existingScheduleData.actual_scheduled_study_hours || 4.5}h focus target</strong> &bull; <strong>{existingScheduleData.slots?.length || 4} total pacing slots</strong>
                  </p>
                </div>
              </div>

              {/* MORE OPTIONS NEON PULSING BUTTON */}
              <button
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '100px',
                  border: '2px solid #f59e0b',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(239, 68, 68, 0.3))',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  animation: 'pirateGoldGlow 2.2s infinite ease-in-out',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                title="Click to view action options"
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#fbbf24',
                  boxShadow: '0 0 10px #fbbf24',
                  animation: 'strawHatBadgePulse 1s infinite ease-in-out'
                }} />
                <span>⚡ More Options</span>
                <ChevronDown size={15} style={{ transform: showMoreOptions ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </button>
            </div>

            {/* MORE OPTIONS POPUP PANEL */}
            {showMoreOptions && (
              <div style={{
                marginTop: '12px',
                marginBottom: '16px',
                padding: '18px 20px',
                borderRadius: '14px',
                background: 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.98), rgba(245, 158, 11, 0.15))',
                border: '1.5px solid rgba(245, 158, 11, 0.6)',
                boxShadow: '0 0 30px rgba(245, 158, 11, 0.3), 0 10px 35px rgba(0, 0, 0, 0.8)',
                animation: 'fadeIn 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#fcd34d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} color="#f59e0b" />
                    ⚡ Timetable Quick Actions
                  </span>
                  <button
                    onClick={() => setShowMoreOptions(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                    title="Close options"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  {/* Option 1: Keep Timetable & Proceed */}
                  <button
                    onClick={handleUseExistingTimetable}
                    className="btn btn-primary"
                    style={{
                      padding: '12px 16px',
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      gap: '10px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                      boxShadow: '0 0 20px rgba(245, 158, 11, 0.45)',
                      justifyContent: 'flex-start',
                      textAlign: 'left'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <div>
                      <strong style={{ display: 'block' }}>Keep Timetable &amp; Proceed</strong>
                      <span style={{ fontSize: '0.72rem', opacity: 0.9, fontWeight: 500 }}>Go directly to Study Materials</span>
                    </div>
                  </button>

                  {/* Option 2: View & Track Current Timetable */}
                  <button
                    onClick={handleViewCurrentTimetable}
                    className="btn btn-secondary"
                    style={{
                      padding: '12px 16px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      gap: '10px',
                      borderColor: 'rgba(99, 102, 241, 0.6)',
                      color: '#a5b4fc',
                      background: 'rgba(99, 102, 241, 0.15)',
                      justifyContent: 'flex-start',
                      textAlign: 'left'
                    }}
                  >
                    <Clock size={18} />
                    <div>
                      <strong style={{ display: 'block' }}>View &amp; Track Current Timetable</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 500 }}>View chronological daily timeline</span>
                    </div>
                  </button>

                  {/* Option 3: Create / Calibrate New Timetable */}
                  <button
                    onClick={handleCreateNewTimetable}
                    className="btn btn-secondary"
                    style={{
                      padding: '12px 16px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      gap: '10px',
                      borderColor: 'rgba(245, 158, 11, 0.6)',
                      color: '#fcd34d',
                      background: 'rgba(245, 158, 11, 0.12)',
                      justifyContent: 'flex-start',
                      textAlign: 'left'
                    }}
                  >
                    <RotateCcw size={18} />
                    <div>
                      <strong style={{ display: 'block' }}>Create / Calibrate New Timetable</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 500 }}>Set fresh subjects &amp; study hours</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* FULL LIST VIEW OF TIMETABLE SLOTS */}
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: '#fcd34d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span>📋</span> Daily Timetable Schedule List:
              </span>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
                paddingRight: '6px'
              }}>
                {existingScheduleData.slots?.map((slot, sIdx) => {
                  const isStudy = slot.type === 'study';
                  const isBreak = slot.type === 'break';
                  const isMeal = slot.type === 'meal';
                  const isWork = slot.type === 'work';

                  return (
                    <div
                      key={sIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isStudy 
                          ? 'rgba(245, 158, 11, 0.12)' 
                          : (isBreak ? 'rgba(6, 182, 212, 0.12)' : (isMeal ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)')),
                        border: `1px solid ${
                          isStudy 
                            ? 'rgba(245, 158, 11, 0.35)' 
                            : (isBreak ? 'rgba(6, 182, 212, 0.3)' : (isMeal ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)'))
                        }`,
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          color: isStudy ? '#fcd34d' : (isBreak ? '#38bdf8' : (isMeal ? '#f87171' : '#fbbf24')),
                          minWidth: '95px'
                        }}>
                          {slot.start} - {slot.end}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ color: '#ffffff' }}>
                            {slot.title || slot.subject || slot.label}
                          </strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {slot.difficulty && (
                          <span style={{
                            fontSize: '0.66rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            background: slot.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.25)' : (slot.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.2)'),
                            color: slot.difficulty === 'hard' ? '#f87171' : (slot.difficulty === 'medium' ? '#fbbf24' : '#34d399')
                          }}>
                            {slot.difficulty}
                          </span>
                        )}
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                          {slot.duration_minutes || 45}m
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* UNIFIED CONTAINER BOX: 3 POP-OPEN (PRESS TO OPEN) COLLAPSIBLE SECTIONS */}
        <div className="glass-panel" style={{
          padding: '24px',
          border: '1.5px solid rgba(245, 158, 11, 0.45)',
          borderRadius: '18px',
          background: 'radial-gradient(circle at 50% 0%, rgba(30, 41, 59, 0.85) 0%, rgba(10, 25, 47, 0.98) 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(245, 158, 11, 0.15)'
        }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.18rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚙️</span> Schedule Configuration &amp; Parameters
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '3px 0 0 0' }}>
                Press any section below to configure your Retention Profile, Subjects, and Schedule Settings.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setOpenSections({ retention: true, subjects: true, settings: true })}
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fcd34d',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => setOpenSections({ retention: false, subjects: false, settings: false })}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* 1. RETENTION PROFILE ACTIVE (PRESS TO OPEN) */}
          <div style={{
            borderRadius: '12px',
            border: `1px solid ${openSections.retention ? 'rgba(245, 158, 11, 0.5)' : 'rgba(245, 158, 11, 0.25)'}`,
            background: openSections.retention ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            overflow: 'hidden',
            transition: 'all 0.25s ease'
          }}>
            <button
              type="button"
              onClick={() => toggleSection('retention')}
              style={{
                width: '100%',
                padding: '14px 18px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(239, 68, 68, 0.35))',
                  border: '1px solid rgba(245, 158, 11, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  flexShrink: 0
                }}>
                  🧠
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.98rem', color: '#ffffff' }}>
                      Retention Profile Active
                    </strong>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '100px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      fontWeight: 800
                    }}>
                      Retention Score: {Math.round(retentionScore * 100)}%
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                    {focusTier} &bull; {breakInterval}m Optimal Study Session Interval
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: openSections.retention ? '#fcd34d' : 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  {openSections.retention ? 'Press to Close' : 'Press to Open'}
                </span>
                {openSections.retention ? <ChevronUp size={18} color="#fcd34d" /> : <ChevronDown size={18} color="var(--text-muted)" />}
              </div>
            </button>

            {openSections.retention && (
              <div style={{ padding: '0 18px 18px 18px', borderTop: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  marginTop: '14px',
                  marginBottom: '12px'
                }}>
                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                      Retention Score
                    </span>
                    <strong style={{ fontSize: '1.25rem', color: '#fcd34d' }}>
                      {Math.round(retentionScore * 100)}%
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                      Focus Tier
                    </span>
                    <strong style={{ fontSize: '1rem', color: '#f87171' }}>
                      {focusTier}
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                      Optimal Break Interval
                    </span>
                    <strong style={{ fontSize: '1.25rem', color: '#38bdf8' }}>
                      {breakInterval} mins
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                      Memory Decay Model
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: '#34d399' }}>
                      Half-Life Regression (HLR)
                    </strong>
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                  💡 Study block lengths and break frequencies in your circadian timetable are calibrated based on this profile to prevent synaptic saturation and fatigue.
                </p>
              </div>
            )}
          </div>

          {/* 2. WHAT ARE YOU STUDYING TODAY? (PRESS TO OPEN) */}
          <div style={{
            borderRadius: '12px',
            border: `1px solid ${openSections.subjects ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.25)'}`,
            background: openSections.subjects ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            overflow: 'hidden',
            transition: 'all 0.25s ease'
          }}>
            <button
              type="button"
              onClick={() => toggleSection('subjects')}
              style={{
                width: '100%',
                padding: '14px 18px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.35), rgba(245, 158, 11, 0.35))',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  flexShrink: 0
                }}>
                  📚
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.98rem', color: '#ffffff' }}>
                      What are you studying today?
                    </strong>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '100px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      fontWeight: 800
                    }}>
                      {subjects.length} Subjects Added
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                    {subjects.length > 0 ? subjects.map(s => s.name).join(', ') : 'No subjects added yet — press to add'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: openSections.subjects ? '#f87171' : 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  {openSections.subjects ? 'Press to Close' : 'Press to Open'}
                </span>
                {openSections.subjects ? <ChevronUp size={18} color="#f87171" /> : <ChevronDown size={18} color="var(--text-muted)" />}
              </div>
            </button>

            {openSections.subjects && (
              <div style={{ padding: '0 18px 18px 18px', borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {/* Active Selected Subjects List */}
                <div style={{ marginTop: '14px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#fcd34d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span>📖</span> Active Study Subjects:
                  </span>

                  {subjects.length === 0 ? (
                    <div style={{
                      padding: '16px',
                      textAlign: 'center',
                      background: 'rgba(0, 0, 0, 0.25)',
                      borderRadius: '8px',
                      border: '1px dashed rgba(245, 158, 11, 0.3)',
                      color: 'var(--text-dim)',
                      fontSize: '0.82rem'
                    }}>
                      No subjects added yet. Enter a subject name below and click <strong>Add Subject</strong>.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {subjects.map((sub, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            fontSize: '0.84rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.1rem' }}>📚</span>
                            <strong style={{ color: '#ffffff' }}>{sub.name}</strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: sub.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.25)' : (sub.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.2)'),
                              color: sub.difficulty === 'hard' ? '#f87171' : (sub.difficulty === 'medium' ? '#fbbf24' : '#34d399')
                            }}>
                              {sub.difficulty === 'hard' ? 'Hard (Morning Peak Focus)' : (sub.difficulty === 'medium' ? 'Medium (Afternoon Applied)' : 'Light (Evening Review)')}
                            </span>

                            <button
                              onClick={() => handleRemoveSubject(idx)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                              title="Remove subject"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Subject Addition Row */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Enter subject name (e.g. Operating Systems, Machine Learning, Data Structures)..."
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      padding: '9px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
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
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      background: '#1e293b',
                      color: '#ffffff',
                      fontSize: '0.82rem'
                    }}
                  >
                    <option value="hard">Hard (Morning Peak Focus)</option>
                    <option value="medium">Medium (Afternoon Applied)</option>
                    <option value="light">Light (Evening Review)</option>
                  </select>
                  <button
                    onClick={handleAddSubject}
                    className="btn btn-secondary"
                    style={{ padding: '9px 16px', gap: '6px', fontSize: '0.82rem', borderColor: 'rgba(245, 158, 11, 0.5)', color: '#fcd34d' }}
                  >
                    <Plus size={14} />
                    Add Subject
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. SCHEDULE SETTINGS & DAILY COMMITMENTS (PRESS TO OPEN) */}
          <div style={{
            borderRadius: '12px',
            border: `1px solid ${openSections.settings ? 'rgba(245, 158, 11, 0.5)' : 'rgba(245, 158, 11, 0.25)'}`,
            background: openSections.settings ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            overflow: 'hidden',
            transition: 'all 0.25s ease'
          }}>
            <button
              type="button"
              onClick={() => toggleSection('settings')}
              style={{
                width: '100%',
                padding: '14px 18px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(6, 182, 212, 0.35))',
                  border: '1px solid rgba(245, 158, 11, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  flexShrink: 0
                }}>
                  ⏰
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.98rem', color: '#ffffff' }}>
                      Schedule Settings &amp; Daily Commitments
                    </strong>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '100px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      fontWeight: 800
                    }}>
                      {targetHours}h Target &bull; {busySlots.length} Commitments
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                    Wake: {wakeTime} &bull; Sleep: {sleepTime} &bull; Configure circadian anchors &amp; busy windows
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: openSections.settings ? '#fbbf24' : 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  {openSections.settings ? 'Press to Close' : 'Press to Open'}
                </span>
                {openSections.settings ? <ChevronUp size={18} color="#fbbf24" /> : <ChevronDown size={18} color="var(--text-muted)" />}
              </div>
            </button>

            {openSections.settings && (
              <div style={{ padding: '0 18px 18px 18px', borderTop: '1px solid rgba(245, 158, 11, 0.2)' }}>
                {/* Sleep / Wake / Target Hours */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '14px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 700 }}>
                      🌅 Wake-Up Time
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
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
                    <label style={{ display: 'block', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 700 }}>
                      🌙 Sleep Time
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
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
                      <span style={{ color: '#cbd5e1', fontWeight: 700 }}>🎯 Daily Focus Target:</span>
                      <strong style={{ color: '#fcd34d', fontSize: '0.95rem' }}>{targetHours}h</strong>
                    </div>
                    <input
                      type="range"
                      min="2.0"
                      max="8.0"
                      step="0.5"
                      value={targetHours}
                      onChange={(e) => setTargetHours(e.target.value)}
                      style={{ width: '100%', accentColor: '#f59e0b', marginTop: '8px' }}
                    />
                  </div>
                </div>

                {/* In-Between Work / College / Gym Commitments */}
                <div style={{ padding: '14px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.25)', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Briefcase size={14} />
                    💼 Daily Commitments &amp; Busy Windows (Classes, Office, Gym, Commute):
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
                    The AI pauses study during these windows and arranges focus blocks around your actual free time.
                  </p>

                  {busySlots.length === 0 ? (
                    <div style={{
                      padding: '10px 14px',
                      textAlign: 'center',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '6px',
                      border: '1px dashed rgba(251, 191, 36, 0.2)',
                      color: 'var(--text-dim)',
                      fontSize: '0.78rem',
                      marginBottom: '10px'
                    }}>
                      No commitments added. (Optional: Add classes, gym, or commute)
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                      {busySlots.map((b, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
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
                  )}

                  {/* Add Busy Slot Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px auto', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Activity name (e.g. College Lecture, Gym)..."
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
                      style={{ padding: '7px 12px', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fcd34d' }}
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
                    fontSize: '0.98rem',
                    fontWeight: 900,
                    gap: '10px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)',
                    border: '1px solid rgba(251, 191, 36, 0.6)'
                  }}
                >
                  <Sparkles size={20} />
                  {loading ? "✨ Calibrating Circadian Timetable..." : (isGenerated ? "🔄 Re-Calibrate Timetable with New Settings" : "⚡ Generate Calibrated Circadian Timetable")}
                </button>
              </div>
            )}
          </div>

        </div>

        {error && (
          <div style={{ padding: '14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#fca5a5', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {/* CALIBRATED TIMETABLE OUTPUT (ONLY SHOWN AFTER GENERATION OR WHEN VIEWING EXISTING) */}
        {isGenerated && calibratedSchedule && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Top Cognitive Rhythm Metric Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px'
            }}>
              <div className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                <span style={{ fontSize: '0.74rem', color: '#fcd34d', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                  ⚡ Pacing Tier
                </span>
                <strong style={{ fontSize: '1.2rem', color: '#ffffff' }}>
                  {calibratedSchedule?.pacing_tier ? calibratedSchedule.pacing_tier.split('(')[0] : focusTier}
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                  {retentionScore >= 0.75 ? "70m/55m/50m Varied Blocks" : "50m/40m/35m Varied Blocks"}
                </span>
              </div>

              <div className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.35)' }}>
                <span style={{ fontSize: '0.74rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                  🥗 Meal &amp; Rest Buffers
                </span>
                <strong style={{ fontSize: '1.2rem', color: '#fbbf24' }}>
                  Lunch, Dinner &amp; Rest Buffers
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                  Prevents postprandial dip
                </span>
              </div>

              <div className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center', border: '1px solid rgba(6, 182, 212, 0.35)' }}>
                <span style={{ fontSize: '0.74rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                  🎯 Daily Focus Target
                </span>
                <strong style={{ fontSize: '1.2rem', color: '#38bdf8' }}>
                  {calibratedSchedule?.actual_scheduled_study_hours || targetHours} hrs Focus
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                  {studySlots.length} structured sessions
                </span>
              </div>

              <div className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                <span style={{ fontSize: '0.74rem', color: '#fcd34d', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                  💼 Daily Commitments
                </span>
                <strong style={{ fontSize: '1.2rem', color: '#fbbf24' }}>
                  {busySlots.length} Busy Slots
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                  Protected focus windows
                </span>
              </div>
            </div>

            {/* Daily Schedule Overview & Calendar Export Bar */}
            <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', border: '1.5px solid rgba(245, 158, 11, 0.4)', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 700 }}>📈 Schedule Target Progress:</span>
                  <strong style={{ fontSize: '0.95rem', color: '#fcd34d' }}>
                    {calibratedSchedule.actual_scheduled_study_hours || targetHours}h Focus Target
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    ({studySlots.length} study sessions planned)
                  </span>
                </div>
                <div style={{ width: '240px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={handleCreateNewTimetable}
                  className="btn btn-secondary"
                  style={{ gap: '6px', fontSize: '0.82rem', padding: '8px 14px', borderColor: 'rgba(245, 158, 11, 0.5)', color: '#fcd34d' }}
                  title="Change subjects or study hours and calibrate a fresh schedule"
                >
                  <RotateCcw size={13} />
                  Recalibrate Timetable
                </button>
                <button
                  onClick={() => handleExportICS()}
                  className="btn btn-secondary"
                  style={{ gap: '8px', fontSize: '0.82rem', padding: '8px 14px', borderColor: 'rgba(245, 158, 11, 0.5)', color: '#ffffff' }}
                >
                  <Download size={13} color="#f59e0b" />
                  Export Calendar (.ics)
                </button>
              </div>
            </div>

            {/* AI Strategic Rationale Card */}
            {calibratedSchedule.ai_rationale && (
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #f59e0b', background: 'rgba(15, 23, 42, 0.85)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Brain size={18} color="#fcd34d" />
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fcd34d' }}>🧠 AI Strategic &amp; Circadian Rationale</h4>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                  {calibratedSchedule.ai_rationale}
                </p>
              </div>
            )}

            {/* Visual Schedule Timeline (NON-UNIFORM BLOCKS) */}
            <div className="glass-panel" style={{ padding: '22px', border: '1.5px solid rgba(245, 158, 11, 0.35)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '1.08rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
                  <Calendar size={18} color="#f59e0b" />
                  🗓️ Circadian Daily Timeline (Chronological)
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Non-uniform circadian blocks calibrated to your retention profile
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {calibratedSchedule.slots?.map((slot, idx) => {
                  const isStudy = slot.type === 'study';
                  const isBreak = slot.type === 'break';
                  const isMeal = slot.type === 'meal';
                  const isWork = slot.type === 'work';
                  const isRoutine = slot.type === 'routine';

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isWork 
                          ? 'rgba(251, 191, 36, 0.1)' 
                          : (isStudy 
                            ? 'rgba(245, 158, 11, 0.1)' 
                            : (isMeal ? 'rgba(239, 68, 68, 0.1)' : (isBreak ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.02)'))),
                        border: `1px solid ${
                          isWork 
                            ? 'rgba(251, 191, 36, 0.35)' 
                            : (isStudy 
                              ? 'rgba(245, 158, 11, 0.35)' 
                              : (isMeal ? 'rgba(239, 68, 68, 0.3)' : (isBreak ? 'rgba(6, 182, 212, 0.25)' : 'var(--border-subtle)')))
                        }`,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Clean Category Icon */}
                      <div style={{ width: '24px', flexShrink: 0, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isStudy && <BookOpen size={16} color="#fcd34d" />}
                        {isWork && <Briefcase size={15} color="#fbbf24" />}
                        {isMeal && (slot.title?.includes('Tea') || slot.title?.includes('Snack') ? <Coffee size={15} color="#f59e0b" /> : <Utensils size={15} color="#ef4444" />)}
                        {isBreak && <Zap size={15} color="#38bdf8" />}
                        {isRoutine && <Sun size={15} color="#fcd34d" />}
                      </div>

                      {/* Time Column */}
                      <div style={{ minWidth: '95px', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.84rem', color: isStudy ? '#fcd34d' : (isWork ? '#fbbf24' : (isMeal ? '#f87171' : (isBreak ? '#38bdf8' : '#94a3b8'))) }}>
                        {slot.start} - {slot.end}
                      </div>

                      {/* Content Column */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.88rem', color: isWork ? '#fef08a' : '#ffffff' }}>
                            {slot.title}
                          </strong>
                          {slot.difficulty && (
                            <span style={{
                              fontSize: '0.66rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              fontWeight: 800,
                              backgroundColor: slot.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.25)' : (slot.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.2)'),
                              color: slot.difficulty === 'hard' ? '#f87171' : (slot.difficulty === 'medium' ? '#fbbf24' : '#34d399')
                            }}>
                              {slot.difficulty === 'hard' ? 'Hard (Peak)' : (slot.difficulty === 'medium' ? 'Medium' : 'Light')}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                          {slot.description}
                        </span>
                      </div>

                      {/* Duration Pill */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {slot.duration_minutes && (
                          <span style={{ fontSize: '0.75rem', color: isStudy ? '#fcd34d' : (isWork ? '#fbbf24' : '#38bdf8'), fontWeight: 800 }}>
                            {slot.duration_minutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NEXT STEP CTA: PROCEED TO MATERIAL INGESTION */}
            {onNavigateToReader && (
              <div className="glass-panel" style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(239, 68, 68, 0.18))',
                border: '1.5px solid rgba(245, 158, 11, 0.5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)'
              }}>
                <div>
                  <h4 style={{ fontSize: '1.08rem', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
                    Ready to upload study materials for your {subjects.length} subjects?
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0 }}>
                    Proceed to <strong>Study Material Ingestion</strong> to add textbooks and notes matching today's calibrated timetable.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToReader({ schedule: calibratedSchedule, subjects: subjects })}
                  className="btn btn-primary"
                  style={{
                    padding: '11px 22px',
                    gap: '8px',
                    fontSize: '0.92rem',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    boxShadow: '0 0 25px rgba(245, 158, 11, 0.5)',
                    border: '1px solid rgba(251, 191, 36, 0.6)'
                  }}
                >
                  Proceed to Study Materials
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}

