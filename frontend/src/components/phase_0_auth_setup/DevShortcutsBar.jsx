import React, { useState } from 'react';
import { Wrench, Zap, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export default function DevShortcutsBar({ 
  onSkipToPhase2, 
  onSkipToPhase3, 
  onSkipToPhase4, 
  onReset 
}) {
  const [minimized, setMinimized] = useState(false);

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 9998,
      fontFamily: 'monospace'
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(245, 158, 11, 0.2)',
        borderRadius: '8px',
        padding: minimized ? '6px 12px' : '10px 14px',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'all 0.2s ease'
      }}>
        {/* Header / Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          userSelect: 'none'
        }} onClick={() => setMinimized(!minimized)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wrench size={13} color="#fbbf24" />
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Developer Fast-Forward
            </span>
          </div>
          <button style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex' }}>
            {minimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Action Buttons */}
        {!minimized && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
            <button
              onClick={onSkipToPhase2}
              style={{
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                color: '#38bdf8',
                padding: '5px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Fast-forward to Circadian Timetable"
            >
              <Zap size={11} />
              Timetable
            </button>

            <button
              onClick={onSkipToPhase3}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                padding: '5px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Fast-forward to Course Material Ingestion"
            >
              <Zap size={11} />
              Materials
            </button>

            {onSkipToPhase4 && (
              <button
                onClick={onSkipToPhase4}
                style={{
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#c084fc',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Fast-forward to Active Document Reader"
              >
                <Zap size={11} />
                Active Reader
              </button>
            )}

            <button
              onClick={onReset}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#cbd5e1',
                padding: '5px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Reset session and return to Login"
            >
              <RotateCcw size={11} />
              Reset
            </button>

          </div>
        )}
      </div>
    </div>
  );
}
