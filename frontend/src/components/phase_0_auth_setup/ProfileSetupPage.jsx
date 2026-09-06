import React, { useState } from 'react';
import { 
  User, 
  GraduationCap, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  BrainCircuit, 
  Clock, 
  Sun, 
  Moon 
} from 'lucide-react';

const EDUCATION_LEVELS = [
  { id: '10th', label: '10th Standard (High School)', desc: 'Foundational STEM, board exams' },
  { id: '12th', label: '12th Standard / Pre-University', desc: 'Higher secondary, competitive entrances (JEE/NEET)' },
  { id: 'engineering', label: 'Engineering / B.Tech', desc: 'Core CS, DSA, Systems, Math, Labs' },
  { id: 'mtech', label: 'M.Tech / Postgraduate / Research', desc: 'Advanced specializations & thesis' },
  { id: 'competitive', label: 'Competitive Exams (GATE, UPSC, GRE)', desc: 'High-volume intensive syllabus' }
];

export default function ProfileSetupPage({ initialData, onBack, onProceedToRetention }) {
  const [studentName, setStudentName] = useState(initialData?.student_name || initialData?.name || '');
  const [gradeLevel, setGradeLevel] = useState(initialData?.grade_level || 'engineering');
  const [wakeTime, setWakeTime] = useState(initialData?.wake_time || '06:30');
  const [sleepTime, setSleepTime] = useState(initialData?.sleep_time || '23:30');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('Please enter your name to personalize your cognitive profile.');
      return;
    }

    const profileData = {
      ...initialData,
      name: studentName.trim(),
      student_name: studentName.trim(),
      grade_level: gradeLevel,
      wake_time: wakeTime,
      sleep_time: sleepTime
    };

    onProceedToRetention(profileData);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '30px auto', padding: '0 16px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div className="badge" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} />
          Step 1 of 2 &bull; Student Profile Setup
        </div>
        <h2 style={{ fontSize: '1.95rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Tell Us About Yourself
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto' }}>
          Your academic level and sleep cycles allow the AI to calibrate cognitive capacity limits and prefrontal peak alert windows.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '28px' }}>
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.82rem',
            marginBottom: '18px'
          }}>
            {error}
          </div>
        )}

        {/* Name Field */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
            Full Name or Preferred Nickname
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px'
          }}>
            <User size={16} color="var(--primary-light)" />
            <input
              type="text"
              placeholder="e.g. Vikas Hiremath"

              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.92rem',
                outline: 'none',
                width: '100%',
                fontWeight: 600
              }}
              required
            />
          </div>
        </div>

        {/* Education / Grade Level Selector */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
            Current Education Level / Academic Stream
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {EDUCATION_LEVELS.map((lvl) => {
              const isSelected = gradeLevel === lvl.id;
              return (
                <div
                  key={lvl.id}
                  onClick={() => setGradeLevel(lvl.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? 'var(--primary-light)' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'var(--primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: isSelected ? '#ffffff' : 'var(--text-main)', display: 'block' }}>
                        {lvl.label}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                        {lvl.desc}
                      </span>
                    </div>
                  </div>
                  <GraduationCap size={16} color={isSelected ? 'var(--primary-light)' : 'var(--text-dim)'} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Circadian Sleep / Wake Window */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
              Typical Wake-Up Time
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <Sun size={15} color="#f59e0b" />
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.85rem', outline: 'none', width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
              Typical Sleep Time
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <Moon size={15} color="#a855f7" />
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.85rem', outline: 'none', width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={onBack}
            className="btn btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.85rem', gap: '6px' }}
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '10px 22px', fontSize: '0.9rem', gap: '8px' }}
          >
            Start Retention Profiling Battery
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
