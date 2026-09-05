import React from 'react';
import { 
  History, 
  Clock, 
  Sun, 
  Sunrise, 
  Sunset, 
  Moon, 
  ArrowRight, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';

const TIME_OF_DAY_OPTIONS = [
  { id: 'morning', label: 'Morning (6 AM - 12 PM)', icon: Sunrise, desc: 'Highest analytical clarity' },
  { id: 'afternoon', label: 'Afternoon (12 PM - 5 PM)', icon: Sun, desc: 'Steady work cadence' },
  { id: 'evening', label: 'Evening (5 PM - 9 PM)', icon: Sunset, desc: 'Post-college study rhythm' },
  { id: 'night', label: 'Night Owl (9 PM - 2 AM)', icon: Moon, desc: 'Quiet, uninterrupted focus' }
];

export default function StepSelfReport({ data, onChange, onSubmit, loading, onPrev }) {
  const selfReport = data.self_report;

  const updateSelfReport = (field, val) => {
    onChange({
      ...data,
      self_report: { ...selfReport, [field]: val }
    });
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div className="badge" style={{ marginBottom: '12px' }}>
          <History size={14} />
          Signal 6 of 6 &bull; Self-Reported Study Baseline
        </div>
        <h2 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '8px' }}>
          Personal Study History
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Direct questions regarding your past study habits (weighted lower at 10% to prevent optimism bias).
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
        {/* 1. Longest continuous session */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Longest continuous study session in the last month:
            </label>
            <span style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.95rem' }}>
              {selfReport.longest_session_minutes} Minutes
            </span>
          </div>
          <input
            type="range"
            min="15"
            max="180"
            step="15"
            value={selfReport.longest_session_minutes}
            onChange={(e) => updateSelfReport('longest_session_minutes', parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            <span>15 min (Micro)</span>
            <span>45 min (Standard)</span>
            <span>90 min (Intense)</span>
            <span>180 min (Marathon)</span>
          </div>
        </div>

        {/* 2. Typical break frequency */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
              How frequently do you usually take breaks?
            </label>
            <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
              Every {selfReport.typical_break_frequency_minutes} Minutes
            </span>
          </div>
          <input
            type="range"
            min="15"
            max="120"
            step="15"
            value={selfReport.typical_break_frequency_minutes}
            onChange={(e) => updateSelfReport('typical_break_frequency_minutes', parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            <span>Every 15 min</span>
            <span>Every 30 min</span>
            <span>Every 60 min</span>
            <span>Every 120 min</span>
          </div>
        </div>

        {/* 3. Preferred Study Time */}
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>
            When do you feel most alert and productive?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            {TIME_OF_DAY_OPTIONS.map((item) => {
              const isSelected = selfReport.preferred_study_time === item.id;
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => updateSelfReport('preferred_study_time', item.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isSelected ? 'var(--primary-light)' : 'var(--border-subtle)'}`,
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <IconComp size={16} color={isSelected ? 'var(--primary-light)' : 'var(--text-dim)'} />
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>
                      {item.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', paddingLeft: '24px' }}>
                    {item.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation & Submit */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <button className="btn btn-secondary" onClick={onPrev}>
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={loading}
          style={{ padding: '12px 24px' }}
        >
          {loading ? 'Synthesizing Signals...' : 'Calculate Retention Profile'}
          <Sparkles size={16} />
        </button>
      </div>
    </div>
  );
}
