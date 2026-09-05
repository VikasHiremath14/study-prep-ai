import React from 'react';
import { User, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';

const GRADE_LEVELS = [
  { id: '10th', label: '10th Standard', desc: 'Secondary School Foundation' },
  { id: '12th', label: '12th Standard', desc: 'Higher Secondary & Entrance Prep' },
  { id: 'engineering', label: 'Engineering / Undergrad', desc: 'B.Tech / B.E. / STEM Degree' },
  { id: 'mtech', label: 'M.Tech / Postgrad', desc: 'Master / Research Specialization' }
];

export default function StepStudentInfo({ data, onChange, onNext }) {
  const isValid = data.student_name.trim().length > 0 && data.grade_level;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="badge" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} />
          Step 1 of 5 &bull; Student Profile
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>
          Welcome to <span className="gradient-text">Study-Prep AI</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Before studying begins, we calibrate your personal attention endurance through behavioral proxies.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        {/* Name Input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
            Student Full Name
          </label>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="e.g. Vikash Sharma"
              value={data.student_name}
              onChange={(e) => onChange({ ...data, student_name: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-light)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
          </div>
        </div>

        {/* Grade Level Selection */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>
            Academic Level & Stream
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {GRADE_LEVELS.map((g) => {
              const isSelected = data.grade_level === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => onChange({ ...data, grade_level: g.id })}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isSelected ? 'var(--primary-light)' : 'var(--border-subtle)'}`,
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <GraduationCap size={18} color={isSelected ? 'var(--primary-light)' : 'var(--text-dim)'} />
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>
                      {g.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', paddingLeft: '28px' }}>
                    {g.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '1rem', opacity: isValid ? 1 : 0.6 }}
          disabled={!isValid}
          onClick={onNext}
        >
          Continue to Series Habit Test
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
