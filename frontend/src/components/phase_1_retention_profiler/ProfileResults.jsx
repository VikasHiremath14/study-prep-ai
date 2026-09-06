import React, { useState } from 'react';
import { 
  Award, 
  Clock, 
  BrainCircuit, 
  Tv, 
  Video, 
  ShieldAlert, 
  History, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  Target, 
  Brain, 
  FileText, 
  Compass, 
  GraduationCap 
} from 'lucide-react';

export default function ProfileResults({ profileData, onRetake, onProceedToScheduler }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'scholarship'

  if (!profileData) return null;

  const { student_id, name, grade_level, profile } = profileData;
  const scorePercent = Math.round((profile?.retention_score || 0) * 100);
  const signals = profile?.signals || {};
  const meta = profile?.metacognitive_analysis || {};
  const dvi = profile?.distraction_vulnerability || {};
  const references = profile?.scholarly_references || [];

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', paddingBottom: '36px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div className="badge badge-success" style={{ marginBottom: '12px' }}>
          <CheckCircle2 size={14} />
          Neurocognitive &amp; Retention Profile Calibrated
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
          Attention Profile for <span className="gradient-text">{name}</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Academic Stream: <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{grade_level}</strong> &bull; Student ID: #{student_id}
        </p>

        {/* View Mode Toggle */}
        <div style={{ display: 'inline-flex', marginTop: '16px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeTab === 'overview' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'overview' ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            Neurocognitive Metrics &amp; Rhythm
          </button>
          <button
            onClick={() => setActiveTab('scholarship')}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: activeTab === 'scholarship' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'scholarship' ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <BookOpen size={14} />
            Scientific Papers &amp; Scholars ({references.length})
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Main Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Retention Score Card */}
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', fontWeight: 700 }}>
                Composite Retention Score
              </span>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `conic-gradient(var(--primary) ${scorePercent * 3.6}deg, rgba(255, 255, 255, 0.06) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 0 30px var(--primary-glow)'
              }}>
                <div style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
                    {scorePercent}%
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    Score: {profile?.retention_score}
                  </span>
                </div>
              </div>
              <div className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)' }}>
                {profile?.focus_tier}
              </div>
            </div>

            {/* Recommended Interval Card */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 700 }}>
                Calibrated Study Rhythm
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '2.6rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {profile?.break_interval_minutes}
                </span>
                <span style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  min Focus Blocks
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: '#34d399', marginBottom: '16px' }}>
                <Clock size={16} />
                Paired with {profile?.recommended_break_duration_minutes || 10} min active recovery breaks
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                {profile?.explanation}
              </p>
            </div>
          </div>

          {/* Metacognitive Optimism Bias & Distraction Vulnerability Card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Metacognitive Gap */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Compass size={18} color="var(--primary-light)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Metacognitive Optimism Gap</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Kruger &amp; Dunning (1999) bias analysis: Comparing self-assessed stamina vs empirical SART &amp; Memory battery.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Diagnosis:</span>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: meta.risk_level === 'high' ? '#f87171' : (meta.risk_level === 'low' ? '#38bdf8' : '#34d399')
                }}>
                  {meta.calibration_diagnosis || 'Realistic Self-Calibration'}
                </span>
              </div>
            </div>

            {/* Distraction Vulnerability Index */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <ShieldAlert size={18} color="#f59e0b" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Distraction Vulnerability (DVI)</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Executive inhibition failure &amp; short-form dopamine susceptibility index.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Interference Risk:</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: (dvi.dvi_score || 0) > 0.4 ? '#fbbf24' : '#34d399' }}>
                  DVI: {dvi.dvi_score || 0.20} &bull; {dvi.sart_commission_errors || 0} inhibitory slips
                </span>
              </div>
            </div>
          </div>

          {/* Neurocognitive Signal Breakdown */}
          <div className="glass-panel" style={{ padding: '28px', marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BrainCircuit size={18} color="var(--primary-light)" />
              Neurocognitive Assessment Battery (Weights Grounded in Literature)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Signal 1: SART */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600 }}>
                    <Target size={15} color="#38bdf8" />
                    1. SART Sustained Vigilance &amp; Inhibition (25% weight)
                  </span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                    Score: {signals.sart_vigilance?.score} ({Math.round((signals.sart_vigilance?.score || 0) * 100)}%)
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(signals.sart_vigilance?.score || 0) * 100}%`, height: '100%', backgroundColor: '#38bdf8', borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                  📚 {signals.sart_vigilance?.citation || 'Robertson et al. (1997) - SART Vigilance'}
                </span>
              </div>

              {/* Signal 2: Digit Span */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600 }}>
                    <Brain size={15} color="#a855f7" />
                    2. Working Memory Digit Span Buffer (25% weight)
                  </span>
                  <span style={{ fontWeight: 700, color: '#a855f7' }}>
                    Score: {signals.digit_span_working_memory?.score} (Span: {signals.digit_span_working_memory?.max_span_capacity || 6} digits)
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(signals.digit_span_working_memory?.score || 0) * 100}%`, height: '100%', backgroundColor: '#a855f7', borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                  📚 {signals.digit_span_working_memory?.citation || 'Baddeley (1986) / Miller (1956) - Working Memory Capacity'}
                </span>
              </div>

              {/* Signal 3: Delayed Recall */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600 }}>
                    <BookOpen size={15} color="#34d399" />
                    3. Delayed Free Recall &amp; Memory Retention (20% weight)
                  </span>
                  <span style={{ fontWeight: 700, color: '#34d399' }}>
                    Score: {signals.delayed_recall_retention?.score} ({signals.delayed_recall_retention?.recalled_count || 6}/{signals.delayed_recall_retention?.target_count || 8} words)
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(signals.delayed_recall_retention?.score || 0) * 100}%`, height: '100%', backgroundColor: '#34d399', borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                  📚 {signals.delayed_recall_retention?.citation || 'Roediger & Karpicke (2006) - Testing Effect & Delayed Recall'}
                </span>
              </div>

              {/* Signal 4: Instagram Reels */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600 }}>
                    <Video size={15} color="#ec4899" />
                    4. Short-Form Video Dopamine Tolerance (15% weight)
                  </span>
                  <span style={{ fontWeight: 700, color: '#ec4899' }}>
                    Score: {signals.instagram_reels_tolerance?.score} ({Math.round((signals.instagram_reels_tolerance?.score || 0) * 100)}%)
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(signals.instagram_reels_tolerance?.score || 0) * 100}%`, height: '100%', backgroundColor: '#ec4899', borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                  📚 {signals.instagram_reels_tolerance?.citation || 'Gazzaley & Rosen (MIT Press 2016) - Media Multitasking'}
                </span>
              </div>

              {/* Signal 5: Series Habit */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600 }}>
                    <Tv size={15} color="#f59e0b" />
                    5. Long-Term Follow-Through Habit (5% weight)
                  </span>
                  <span style={{ fontWeight: 700, color: '#fbbf24' }}>
                    Score: {signals.series_completion_habit?.score} ({Math.round((signals.series_completion_habit?.score || 0) * 100)}%)
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(signals.series_completion_habit?.score || 0) * 100}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                  📚 {signals.series_completion_habit?.citation || 'Duckworth et al. (2007) - Grit & Zeigarnik Effect'}
                </span>
              </div>

              {/* Signal 6: Self-Report */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600 }}>
                    <History size={15} color="#10b981" />
                    6. Self-Reported Baseline &amp; Optimism Discount (10% weight)
                  </span>
                  <span style={{ fontWeight: 700, color: '#34d399' }}>
                    Score: {signals.self_reported_baseline?.score} ({Math.round((signals.self_reported_baseline?.score || 0) * 100)}%)
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(signals.self_reported_baseline?.score || 0) * 100}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                  📚 {signals.self_reported_baseline?.citation || 'Kruger & Dunning (1999) - Metacognitive Monitoring'}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Scholarship & Research Papers Tab */
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={20} color="var(--primary-light)" />
            Seminal Research Papers &amp; Scholars Referenced
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
            The retention profiling algorithms and break interval calibrations are grounded in peer-reviewed cognitive science and neuropsychology literature.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {references.map((ref, idx) => (
              <div key={idx} style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    color: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {idx + 1}
                  </span>
                  <strong style={{ color: '#ffffff', fontSize: '0.92rem' }}>{ref.scholar}</strong>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--primary-light)', fontStyle: 'italic', marginBottom: '6px', paddingLeft: '32px' }}>
                  "{ref.publication}"
                </p>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', paddingLeft: '32px', lineHeight: '1.4' }}>
                  <strong>How our system uses it:</strong> {ref.application}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar & Timetable Bridge Card */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(99, 102, 241, 0.1))',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.2)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)'
          }}>
            <BookOpen size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
              Circadian Timetable &amp; .ICS Calendar Ready
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
              Your {scorePercent}% score will now shape your non-uniform focus intervals, meal breaks, and college schedule.
            </p>
          </div>
        </div>
      </div>

      {/* Save Record Notice Banner */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '10px',
        background: 'rgba(16, 185, 129, 0.12)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6ee7b7', fontSize: '0.84rem', fontWeight: 600 }}>
          <CheckCircle2 size={16} />
          Retention baseline profile calibrated &amp; saved to your student account.
        </div>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
          Permanent Record &bull; Student #{student_id || 1}
        </span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <button className="btn btn-secondary" onClick={onRetake} style={{ gap: '8px', fontSize: '0.85rem' }}>
          <RotateCcw size={15} />
          Retake Neurocognitive Tests
        </button>

        <button 
          className="btn btn-primary" 
          onClick={onProceedToScheduler}
          style={{ 
            padding: '12px 24px', 
            fontSize: '0.92rem', 
            gap: '10px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Sparkles size={16} />
          Save Retention Record &amp; Proceed to Timetable
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
