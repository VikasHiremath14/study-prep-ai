import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Youtube, 
  Timer, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';

const YOUTUBE_VIDEO = {
  id: 'brain_learning_mini',
  title: 'How The Brain Builds Deep Neural Pathways in 3 Minutes',
  channel: 'Cognitive Science Hub',
  durationSeconds: 180, // 3 minutes
  embedUrl: 'https://www.youtube.com/embed/YqUBCtoo40Y?enablejsapi=1&autoplay=0',
  description: 'An engaging 3-minute visual breakdown of synaptic long-term potentiation (LTP) and how cognitive focus thresholds govern memory retention.'
};

export default function StepYouTubeAttention({ data, onChange, onNext, onPrev }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchedSec, setWatchedSec] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [useSimulatedPlayer, setUseSimulatedPlayer] = useState(true);

  const timerRef = useRef(null);

  // 1. Page Visibility API to detect tab switching during YouTube viewing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        setTabSwitches((prev) => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying]);

  // 2. Playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setWatchedSec((prev) => {
          const next = prev + 1;
          if (next >= YOUTUBE_VIDEO.durationSeconds) {
            setIsPlaying(false);
            return YOUTUBE_VIDEO.durationSeconds;
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying]);

  const completionRatio = Math.min(watchedSec / YOUTUBE_VIDEO.durationSeconds, 1.0);

  const getStatus = (ratio) => {
    if (ratio >= 0.85) return 'full';
    if (ratio >= 0.40) return 'halfway';
    return 'dropped';
  };

  const currentStatus = getStatus(completionRatio);

  const handleProceed = () => {
    const youtubeData = {
      video_id: YOUTUBE_VIDEO.id,
      video_title: YOUTUBE_VIDEO.title,
      duration_seconds: YOUTUBE_VIDEO.durationSeconds,
      watched_seconds: Math.round(watchedSec),
      tab_switches_during_video: tabSwitches,
      completed_ratio: round(completionRatio, 2),
      status: currentStatus
    };

    onChange({
      ...data,
      youtube_watch: youtubeData
    });

    onNext();
  };

  function round(val, dec = 2) {
    return Math.round(val * Math.pow(10, dec)) / Math.pow(10, dec);
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div className="badge" style={{ marginBottom: '12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <Youtube size={14} />
          Signal 3 of 6 &bull; YouTube Video Attention Test
        </div>
        <h2 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '8px' }}>
          Long-Form Concept Attention
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Watch this short 3-minute concept video. We analyze your focus retention across longer-format technical content and measure if you get distracted or switch tabs.
        </p>
      </div>

      {/* Main Video & Telemetry Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', alignItems: 'start', marginBottom: '24px' }}>
        
        {/* Left: YouTube Player Frame */}
        <div className="glass-panel" style={{ padding: '16px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <Youtube size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', lineHeight: '1.2' }}>YouTube Concept Player</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{YOUTUBE_VIDEO.channel}</span>
              </div>
            </div>

            <button
              onClick={() => setUseSimulatedPlayer(!useSimulatedPlayer)}
              style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.72rem', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
            >
              {useSimulatedPlayer ? 'Switch to YouTube Embed' : 'Switch to Focus Player'}
            </button>
          </div>

          {/* Player Display */}
          {useSimulatedPlayer ? (
            <div style={{
              height: '240px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #064e3b 100%)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)'
            }}>
              {/* Overlay Top */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                  HD 1080p &bull; 3:00 Duration
                </span>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  style={{ background: 'rgba(0,0,0,0.6)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </div>

              {/* Animated Center Display */}
              <div style={{ textAlign: 'center', color: '#ffffff' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px', animation: isPlaying ? 'pulse-glow 2s infinite' : 'none' }}>
                  🧠⚡
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  {YOUTUBE_VIDEO.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  {isPlaying ? '▶️ Video is playing... Stay focused on this tab' : '⏸️ Video paused. Click Play to resume.'}
                </div>
              </div>

              {/* Progress & Controls */}
              <div>
                <div style={{
                  height: '4px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '2px',
                  marginBottom: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    backgroundColor: '#ef4444',
                    width: `${completionRatio * 100}%`,
                    transition: 'width 0.5s linear'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem', backgroundColor: '#ef4444' }}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                      {isPlaying ? 'Pause' : 'Play Video'}
                    </button>
                    <button
                      onClick={() => { setWatchedSec(0); setIsPlaying(true); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                      title="Restart"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 600 }}>
                    {formatTime(watchedSec)} / {formatTime(YOUTUBE_VIDEO.durationSeconds)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: '240px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <iframe
                width="100%"
                height="100%"
                src={YOUTUBE_VIDEO.embedUrl}
                title={YOUTUBE_VIDEO.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.4' }}>
            {YOUTUBE_VIDEO.description}
          </p>
        </div>

        {/* Right: Real-time Attention Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Status Metric */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Timer size={16} color="#ef4444" />
              Video Engagement Telemetry
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Watch Duration:</span>
                <span style={{ fontWeight: 700, color: '#f87171' }}>{watchedSec}s / 180s ({Math.round(completionRatio * 100)}%)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Completion Tier:</span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  backgroundColor: currentStatus === 'full' ? 'rgba(16, 185, 129, 0.2)' : (currentStatus === 'halfway' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                  color: currentStatus === 'full' ? '#34d399' : (currentStatus === 'halfway' ? '#fbbf24' : '#f87171')
                }}>
                  {currentStatus === 'full' ? 'Watched Fully (≥85%)' : (currentStatus === 'halfway' ? 'Watched Halfway (40-84%)' : 'Dropped Early (<40%)')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tab Blur Events:</span>
                <span style={{ color: tabSwitches > 0 ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                  {tabSwitches} switch(es)
                </span>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="glass-panel" style={{ padding: '16px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>💡 Behavioral Diagnostic Note:</strong>
            Watching longer video lectures without switching tabs indicates strong cognitive bandwidth for sustained lecture retention.
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <button className="btn btn-secondary" onClick={onPrev}>
          <ArrowLeft size={16} />
          Back
        </button>
        <button className="btn btn-primary" onClick={handleProceed}>
          Proceed to Reading Focus Task
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
