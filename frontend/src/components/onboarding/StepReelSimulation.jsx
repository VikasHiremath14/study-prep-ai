import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Heart, 
  MessageCircle, 
  Share2, 
  Music2, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Timer, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

const REELS = [
  {
    id: 'reel_1',
    creator: 'ai_daily',
    avatar: '🤖',
    title: 'How Transformer Attention Heads Filter Information in 15s ⚡',
    audio: 'Original Audio - AI & Cognitive Hacks',
    duration: 15,
    likes: '42.8K',
    comments: '812',
    bgGradient: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)',
    animationSymbol: '⚡',
    concept: 'Query, Key, and Value vectors computed in parallel across 32 attention heads.'
  },
  {
    id: 'reel_2',
    creator: 'neuro_code',
    avatar: '🧠',
    title: 'Why your brain craves reels after 10 mins of deep coding 🧪',
    audio: 'Lo-fi Study Beats - NeuroFocus',
    duration: 30,
    likes: '128.4K',
    comments: '2.4K',
    bgGradient: 'linear-gradient(180deg, #1e293b 0%, #0f766e 50%, #022c22 100%)',
    animationSymbol: '🧬',
    concept: 'Dopamine drops as working memory fills; the brain seeks immediate micro-rewards to avoid cognitive strain.'
  },
  {
    id: 'reel_3',
    creator: 'deep_tech_insight',
    avatar: '💡',
    title: 'The 80/20 Rule: Mastering Complex Algorithmic Logic 🚀',
    audio: 'Tech Talk Daily Podcast Ep. 44',
    duration: 45,
    likes: '95.1K',
    comments: '1.7K',
    bgGradient: 'linear-gradient(180deg, #3b0764 0%, #4c1d95 50%, #09090b 100%)',
    animationSymbol: '🏛️',
    concept: '20% of core data structure invariants resolve 80% of edge cases in production systems.'
  }
];

export default function StepReelSimulation({ data, onChange, onNext, onPrev }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [watchedSec, setWatchedSec] = useState(0);
  const [reelLogs, setReelLogs] = useState(data.reel_watches || []);
  const [allFinished, setAllFinished] = useState(false);

  const activeReel = REELS[currentIdx];
  const timerRef = useRef(null);

  // Playback timer ticker
  useEffect(() => {
    if (isPlaying && !allFinished) {
      timerRef.current = setInterval(() => {
        setWatchedSec((prev) => {
          const next = prev + 0.5;
          if (next >= activeReel.duration) {
            handleCompleteReel(activeReel.duration);
            return activeReel.duration;
          }
          return next;
        });
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, currentIdx, allFinished]);

  const classifyWatch = (watched, total) => {
    const ratio = watched / total;
    if (ratio >= 0.88) return 'full';
    if (ratio >= 0.38) return 'halfway';
    return 'dropped';
  };

  const recordCurrentWatch = (finalSec, wasSkipped = false) => {
    const status = classifyWatch(finalSec, activeReel.duration);
    const logItem = {
      clip_id: activeReel.id,
      title: activeReel.title,
      clip_type: activeReel.duration <= 15 ? 'short' : (activeReel.duration <= 30 ? 'medium' : 'long'),
      duration_seconds: activeReel.duration,
      watched_seconds: Math.round(finalSec),
      completion_status: status,
      skipped: wasSkipped
    };

    const updated = [...reelLogs.filter(r => r.clip_id !== activeReel.id), logItem];
    setReelLogs(updated);
    return updated;
  };

  const handleCompleteReel = (finalSec) => {
    const updated = recordCurrentWatch(finalSec, false);
    if (currentIdx < REELS.length - 1) {
      setCurrentIdx(i => i + 1);
      setWatchedSec(0);
      setIsLiked(false);
      setIsPlaying(true);
    } else {
      setAllFinished(true);
      setIsPlaying(false);
      onChange({ ...data, reel_watches: updated });
    }
  };

  const handleSkipReel = () => {
    const updated = recordCurrentWatch(watchedSec, true);
    if (currentIdx < REELS.length - 1) {
      setCurrentIdx(i => i + 1);
      setWatchedSec(0);
      setIsLiked(false);
      setIsPlaying(true);
    } else {
      setAllFinished(true);
      setIsPlaying(false);
      onChange({ ...data, reel_watches: updated });
    }
  };

  const handleContinue = () => {
    let finalLogs = [...reelLogs];
    if (finalLogs.length === 0) {
      finalLogs = REELS.map(r => ({
        clip_id: r.id,
        title: r.title,
        clip_type: r.duration <= 15 ? 'short' : 'medium',
        duration_seconds: r.duration,
        watched_seconds: r.duration * 0.6,
        completion_status: 'halfway',
        skipped: false
      }));
    }
    onChange({ ...data, reel_watches: finalLogs });
    onNext();
  };

  const currentRatio = (watchedSec / activeReel.duration);
  const liveStatus = classifyWatch(watchedSec, activeReel.duration);

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div className="badge" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} />
          Signal 2 of 6 &bull; Instagram Reels Behavioral Simulation
        </div>
        <h2 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '8px' }}>
          Instagram Reels Attention Feed
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Interact naturally with this simulated Instagram Reels feed. We detect whether you watch reels <strong>fully</strong>, <strong>halfway</strong>, or <strong>skip early</strong>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: '24px', alignItems: 'start', marginBottom: '24px' }}>
        
        {/* Instagram Phone Mockup Container */}
        <div style={{
          width: '100%',
          maxWidth: '340px',
          margin: '0 auto',
          height: '520px',
          borderRadius: '36px',
          border: '4px solid #334155',
          background: '#000000',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(99, 102, 241, 0.25)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Phone Top Notch */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100px',
            height: '18px',
            backgroundColor: '#0f172a',
            borderRadius: '10px',
            zIndex: 30
          }}></div>

          {/* Reel Video Simulation Area */}
          <div style={{
            flex: 1,
            background: activeReel.bgGradient,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '28px 16px 16px 16px',
            color: '#ffffff'
          }}>
            {/* Top Reel Info Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                <span style={{ color: '#ec4899' }}>Reels</span> &bull; {currentIdx + 1}/{REELS.length}
              </div>
              <button
                onClick={() => setIsMuted(!isMuted)}
                style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>

            {/* Center Visual Animation */}
            <div style={{ textAlign: 'center', zIndex: 10, padding: '0 8px' }}>
              <div style={{
                fontSize: '3.2rem',
                marginBottom: '12px',
                animation: isPlaying ? 'pulse-glow 1.8s infinite' : 'none'
              }}>
                {activeReel.animationSymbol}
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: '1.35', marginBottom: '8px', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                {activeReel.title}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#e2e8f0', opacity: 0.9, lineHeight: '1.4', background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: '10px' }}>
                {activeReel.concept}
              </p>
            </div>

            {/* Right Action Icons (Like, Comment, Share) */}
            <div style={{
              position: 'absolute',
              right: '12px',
              bottom: '90px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'center',
              zIndex: 20
            }}>
              <div onClick={() => setIsLiked(!isLiked)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLiked ? '#f43f5e' : '#ffffff' }}>
                  <Heart size={20} fill={isLiked ? '#f43f5e' : 'none'} />
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{activeReel.likes}</span>
              </div>

              <div style={{ cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={20} />
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{activeReel.comments}</span>
              </div>

              <div style={{ cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Share2 size={18} />
                </div>
              </div>
            </div>

            {/* Bottom Reel Caption & Audio */}
            <div style={{ zIndex: 10, paddingRight: '48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.1rem' }}>{activeReel.avatar}</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>@{activeReel.creator}</span>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.4)' }}>Follow</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#cbd5e1' }}>
                <Music2 size={12} />
                <span>{activeReel.audio}</span>
              </div>
            </div>

            {/* Progress Bar at very bottom */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: 'rgba(255,255,255,0.2)'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#ffffff',
                width: `${(watchedSec / activeReel.duration) * 100}%`,
                transition: 'width 0.5s linear'
              }} />
            </div>
          </div>

          {/* Quick Playback Controls */}
          <div style={{
            backgroundColor: '#090d16',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {Math.round(watchedSec)}s / {activeReel.duration}s
            </span>

            <button
              onClick={handleSkipReel}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600 }}
            >
              Skip Reel
              <SkipForward size={14} />
            </button>
          </div>
        </div>

        {/* Right Side: Real-time Telemetry & Reel Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Current Reel Live Status Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Timer size={16} color="var(--primary-light)" />
              Active Reel Telemetry
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Reel:</span>
                <span style={{ fontWeight: 600 }}>Reel #{currentIdx + 1} ({activeReel.duration}s)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Elapsed Watch:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{Math.round(watchedSec)} seconds ({Math.round(currentRatio * 100)}%)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Classification:</span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  backgroundColor: liveStatus === 'full' ? 'rgba(16, 185, 129, 0.2)' : (liveStatus === 'halfway' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                  color: liveStatus === 'full' ? '#34d399' : (liveStatus === 'halfway' ? '#fbbf24' : '#f87171')
                }}>
                  {liveStatus === 'full' ? 'Fully Watched (≥90%)' : (liveStatus === 'halfway' ? 'Watched Halfway (40-89%)' : 'Dropped / Skipping (<40%)')}
                </span>
              </div>
            </div>
          </div>

          {/* Reel History List */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
              Reels Completion Breakdown ({reelLogs.length}/{REELS.length}):
            </h4>

            {reelLogs.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Watch or skip the active reel to record your initial behavioral pattern.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {reelLogs.map((log, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.82rem'
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.title.slice(0, 24)}...</span>
                    <span style={{
                      color: log.completion_status === 'full' ? '#34d399' : (log.completion_status === 'halfway' ? '#fbbf24' : '#f87171'),
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {log.watched_seconds}s / {log.duration_seconds}s &bull; {log.completion_status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <button className="btn btn-secondary" onClick={onPrev}>
          <ArrowLeft size={16} />
          Back
        </button>
        <button className="btn btn-primary" onClick={handleContinue}>
          Proceed to YouTube Video Attention Test
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
