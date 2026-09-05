import React from 'react';
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
  CheckCircle2
} from 'lucide-react';

export default function ProfileResults({ profileData, onRetake, onProceedToScheduler }) {
  if (!profileData) return null;

  const { student_id, name, grade_level, profile } = profileData;
  const scorePercent = Math.round((profile?.retention_score || 0) * 100);
  const signals = profile?.signals || {};

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="badge badge-success" style={{ marginBottom: '12px' }}>
          <CheckCircle2 size={14} />
          Retention Profile Calibrated
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
          Attention Profile for <span className="gradient-text">{name}</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Academic Level: <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{grade_level}</strong> &bull; Student ID: #{student_id}
        </p>
      </div>

      {/* Main Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Retention Score Card */}
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Overall Retention Score
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
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Calibrated Rhythm Recommendation
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
            Paired with {profile?.recommended_break_duration_minutes || 10} min recovery breaks
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            {profile?.explanation}
          </p>
        </div>
      </div>

      {/* 5-Signal Breakdown Detail */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainCircuit size={18} color="var(--primary-light)" />
          Explainable Behavioral Signal Weights (0.0 to 1.0)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Signal 1: Series */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 500 }}>
                <Tv size={15} color="#ec4899" />
                Series / Show Completion (15% weight)
              </span>
              <span style={{ fontWeight: 600, color: '#ec4899' }}>
                Score: {signals.series_completion?.score} ({Math.round(signals.series_completion?.score * 100)}%)
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${(signals.series_completion?.score || 0) * 100}%`, height: '100%', backgroundColor: '#ec4899', borderRadius: '4px' }} />
            </div>
          </div>

          {/* Signal 2: Instagram Reels */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 500 }}>
                <Video size={15} color="#ec4899" />
                Instagram Reels Completion (25% weight)
              </span>
              <span style={{ fontWeight: 600, color: '#ec4899' }}>
                Score: {signals.instagram_reels?.score} ({Math.round((signals.instagram_reels?.score || 0) * 100)}%)
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${(signals.instagram_reels?.score || 0) * 100}%`, height: '100%', backgroundColor: '#ec4899', borderRadius: '4px' }} />
            </div>
          </div>

          {/* Signal 3: YouTube Video Attention */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 500 }}>
                <Video size={15} color="#ef4444" />
                YouTube Video Endurance (25% weight)
              </span>
              <span style={{ fontWeight: 600, color: '#ef4444' }}>
                Score: {signals.youtube_video_endurance?.score} ({Math.round((signals.youtube_video_endurance?.score || 0) * 100)}%)
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${(signals.youtube_video_endurance?.score || 0) * 100}%`, height: '100%', backgroundColor: '#ef4444', borderRadius: '4px' }} />
            </div>
          </div>

          {/* Signal 3: Sustained Focus */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 500 }}>
                <BrainCircuit size={15} color="#6366f1" />
                Sustained Focus & Tab Integrity (30% weight)
              </span>
              <span style={{ fontWeight: 600, color: '#818cf8' }}>
                Score: {signals.sustained_focus?.score} ({Math.round(signals.sustained_focus?.score * 100)}%)
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${(signals.sustained_focus?.score || 0) * 100}%`, height: '100%', backgroundColor: '#6366f1', borderRadius: '4px' }} />
            </div>
          </div>

          {/* Signal 4: Distraction */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 500 }}>
                <ShieldAlert size={15} color="#f59e0b" />
                Distraction Recovery Latency (20% weight)
              </span>
              <span style={{ fontWeight: 600, color: '#f59e0b' }}>
                Score: {signals.distraction_recovery?.score} ({Math.round(signals.distraction_recovery?.score * 100)}%)
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${(signals.distraction_recovery?.score || 0) * 100}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px' }} />
            </div>
          </div>

          {/* Signal 5: Self-Report */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 500 }}>
                <History size={15} color="#10b981" />
                Self-Reported Baseline (10% weight)
              </span>
              <span style={{ fontWeight: 600, color: '#10b981' }}>
                Score: {signals.self_reported_baseline?.score} ({Math.round(signals.self_reported_baseline?.score * 100)}%)
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${(signals.self_reported_baseline?.score || 0) * 100}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <button className="btn btn-secondary" onClick={onRetake}>
          <RotateCcw size={16} />
          Retake Assessment
        </button>
        <button className="btn btn-primary" onClick={onProceedToScheduler} style={{ padding: '12px 24px' }}>
          Proceed to Timetable Calibration (Phase 2)
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
