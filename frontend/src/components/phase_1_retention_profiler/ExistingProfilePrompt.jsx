import React from 'react';
import { 
  Zap, 
  RotateCcw, 
  Brain, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Calendar,
  Sparkles,
  ShieldCheck,
  Target
} from 'lucide-react';

export default function ExistingProfilePrompt({ 
  profileData, 
  timetableData,
  onSkipToTimetable, 
  onRetakeExam, 
  onBackToProfile 
}) {
  const profile = profileData?.profile || profileData || {};
  const retentionScore = profile?.retention_score || 0.78;
  const scorePercent = Math.round(retentionScore * 100);
  const breakInterval = profile?.break_interval_minutes || 45;
  const focusTier = profile?.focus_tier || "Deep Focus Master";
  const studentName = profileData?.name || profileData?.student_name || "Student";
  const gradeLevel = profileData?.grade_level || "engineering";

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '10px 0' }}>
      {/* Top Breadcrumb */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBackToProfile}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
        >
          <ArrowLeft size={14} />
          Back to Profile Setup
        </button>
        <div className="badge badge-success" style={{ fontSize: '0.74rem' }}>
          <CheckCircle2 size={13} />
          Existing Profile Available
        </div>
      </div>

      {/* Main Glass Panel */}
      <div className="glass-panel" style={{
        padding: '32px 28px',
        borderRadius: '18px',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 25px rgba(99, 102, 241, 0.15)',
        textAlign: 'center'
      }}>
        {/* Header Icon */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: '#818cf8',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)'
        }}>
          <Brain size={28} />
        </div>

        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '6px', color: '#ffffff' }}>
          Welcome Back, <span className="gradient-text">{studentName}</span>!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '580px', margin: '0 auto 24px auto' }}>
          You have an active calibrated **Neurocognitive Retention Profile**. You can jump directly to your smart timetable or retake the assessment to recalibrate.
        </p>

        {/* Existing Profile Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '28px'
        }}>
          {/* 1. Score Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Retention Score
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
              {scorePercent}%
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
              Empirically Calibrated
            </div>
          </div>

          {/* 2. Focus Tier Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Focus Tier
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#a78bfa', marginTop: '6px' }}>
              {focusTier}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
              Stream: <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>{gradeLevel}</strong>
            </div>
          </div>

          {/* 3. Break Interval Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Calibrated Rhythm
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
              {breakInterval}m
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
              Focus Block Pacing
            </div>
          </div>
        </div>

        {/* Action Decision Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '460px',
          margin: '0 auto'
        }}>
          {/* Primary Action: Skip to Timetable */}
          <button
            onClick={onSkipToTimetable}
            className="btn btn-primary"
            style={{
              padding: '14px 20px',
              fontSize: '0.95rem',
              fontWeight: 700,
              gap: '10px',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Zap size={18} />
            Skip to Study Timetable (Phase 2)
            <ArrowRight size={16} />
          </button>

          {/* Secondary Action: Take Exam Again */}
          <button
            onClick={onRetakeExam}
            className="btn btn-secondary"
            style={{
              padding: '12px 18px',
              fontSize: '0.88rem',
              fontWeight: 600,
              gap: '8px',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.06)'
            }}
          >
            <RotateCcw size={15} />
            Take Exam Again (Recalibrate Attention Profiler)
          </button>
        </div>
      </div>
    </div>
  );
}
