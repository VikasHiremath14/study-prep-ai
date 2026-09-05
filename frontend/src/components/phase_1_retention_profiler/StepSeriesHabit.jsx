import React, { useState } from 'react';
import { Tv, Plus, Trash2, CheckCircle2, Clock, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const SUGGESTIONS = [
  'Breaking Bad', 'Stranger Things', 'Chernobyl', 'Dark', 
  'Game of Thrones', 'Money Heist', 'One Piece', 'Interstellar'
];

export default function StepSeriesHabit({ data, onChange, onNext, onPrev }) {
  const [customTitle, setCustomTitle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('completed');

  const addShow = (title, status = 'completed') => {
    if (!title.trim()) return;
    if (data.series_habits.some(s => s.title.toLowerCase() === title.trim().toLowerCase())) return;
    onChange({
      ...data,
      series_habits: [...data.series_habits, { title: title.trim(), status }]
    });
    setCustomTitle('');
  };

  const removeShow = (index) => {
    const updated = data.series_habits.filter((_, idx) => idx !== index);
    onChange({ ...data, series_habits: updated });
  };

  const updateStatus = (index, status) => {
    const updated = [...data.series_habits];
    updated[index].status = status;
    onChange({ ...data, series_habits: updated });
  };

  const hasEnoughShows = data.series_habits.length >= 2;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div className="badge" style={{ marginBottom: '12px' }}>
          <Tv size={14} />
          Signal 1 of 5 &bull; Series & Movie Completion Habit
        </div>
        <h2 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '8px' }}>
          Long-Term Follow-Through Proxy
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          How you consume multi-episode media correlates with how naturally you follow multi-day academic modules through to completion.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '28px', marginBottom: '20px' }}>
        {/* Quick Add Suggestions */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Add Popular Shows / Franchises:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {SUGGESTIONS.map((item) => {
              const alreadyAdded = data.series_habits.some(s => s.title.toLowerCase() === item.toLowerCase());
              return (
                <button
                  key={item}
                  disabled={alreadyAdded}
                  onClick={() => addShow(item, 'completed')}
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    opacity: alreadyAdded ? 0.4 : 1,
                    cursor: alreadyAdded ? 'default' : 'pointer'
                  }}
                >
                  <Plus size={12} />
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Or type any show/movie you watched..."
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addShow(customTitle, selectedStatus)}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.92rem',
              outline: 'none'
            }}
          />
          <button
            className="btn btn-secondary"
            onClick={() => addShow(customTitle, selectedStatus)}
            disabled={!customTitle.trim()}
            style={{ padding: '10px 18px' }}
          >
            <Plus size={16} />
            Add Show
          </button>
        </div>

        {/* Show List */}
        <div>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>
            Your Logged Shows ({data.series_habits.length}) — Select Completion Status:
          </label>

          {data.series_habits.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 16px',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-dim)',
              fontSize: '0.9rem'
            }}>
              Please add at least 2 shows or movies to calculate your completion ratio.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.series_habits.map((show, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{show.title}</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Status Toggle Buttons */}
                    <button
                      onClick={() => updateStatus(idx, 'completed')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        border: show.status === 'completed' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                        backgroundColor: show.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        color: show.status === 'completed' ? '#34d399' : 'var(--text-dim)'
                      }}
                    >
                      <CheckCircle2 size={13} />
                      Finished All
                    </button>

                    <button
                      onClick={() => updateStatus(idx, 'partially_completed')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        border: show.status === 'partially_completed' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                        backgroundColor: show.status === 'partially_completed' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        color: show.status === 'partially_completed' ? '#fbbf24' : 'var(--text-dim)'
                      }}
                    >
                      <Clock size={13} />
                      Partially
                    </button>

                    <button
                      onClick={() => updateStatus(idx, 'dropped')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        border: show.status === 'dropped' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
                        backgroundColor: show.status === 'dropped' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                        color: show.status === 'dropped' ? '#f87171' : 'var(--text-dim)'
                      }}
                    >
                      <XCircle size={13} />
                      Dropped
                    </button>

                    <button
                      onClick={() => removeShow(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '6px',
                        marginLeft: '4px'
                      }}
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <button className="btn btn-secondary" onClick={onPrev}>
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={!hasEnoughShows}
          onClick={onNext}
          style={{ opacity: hasEnoughShows ? 1 : 0.6 }}
        >
          Proceed to Reel-Watch Simulation
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
