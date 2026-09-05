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
  AlertCircle,
  X,
  Send,
  Film,
  ExternalLink
} from 'lucide-react';

const REELS = [
  {
    id: 'reel_1',
    creator: 'python_quick_tips',
    avatar: '⚡',
    title: 'How Python Code Compiles to Bytecode in 15s ⚡',
    audio: 'Original Audio - Python Bytecode & AST',
    duration: 15,
    likes: '84.2K',
    comments: '1.2K',
    ytShortId: 'k1BneeJTDcU',
    embedUrl: 'https://www.youtube.com/embed/k1BneeJTDcU?autoplay=1&mute=0&controls=1&loop=1&playlist=k1BneeJTDcU&modestbranding=1&playsinline=1&rel=0',
    concept: 'Python parses your source into an Abstract Syntax Tree (AST), compiles it to bytecode (.pyc), and executes it via the CPython VM.',
    sampleComments: [
      { user: 'dev_alex', text: 'Bytecode disassembly with dis.dis() is so cool! 🔥', likes: 210 },
      { user: 'coding_sam', text: '15 seconds of pure knowledge 🚀', likes: 145 },
      { user: 'algo_queen', text: 'Finally understand pyc files!', likes: 98 }
    ]
  },
  {
    id: 'reel_2',
    creator: 'neuro_hub_daily',
    avatar: '🧠',
    title: 'Why Your Brain Craves Reels While Studying 🧠 (30s)',
    audio: 'Lo-Fi Chill - Dopamine Reset Alpha Waves',
    duration: 30,
    likes: '194.5K',
    comments: '3.4K',
    ytShortId: '8aGhZQkoFbQ',
    embedUrl: 'https://www.youtube.com/embed/8aGhZQkoFbQ?autoplay=1&mute=0&controls=1&loop=1&playlist=8aGhZQkoFbQ&modestbranding=1&playsinline=1&rel=0',
    concept: 'Dopamine drops as working memory fills; the brain seeks instant micro-rewards to relieve prefrontal cognitive strain.',
    sampleComments: [
      { user: 'study_master', text: 'This is literally happening to me right now 😂', likes: 620 },
      { user: 'priya_mtech', text: 'Understanding the neuroscience helps me fight distraction 💡', likes: 312 },
      { user: 'focus_ninja', text: 'Put phone in another room = problem solved.', likes: 184 }
    ]
  },
  {
    id: 'reel_3',
    creator: 'algorithms_visualized',
    avatar: '🏛️',
    title: 'How QuickSort & MergeSort Actually Partition Data 🚀 (45s)',
    audio: 'Silicon Valley Engineering Insights #44',
    duration: 45,
    likes: '126.8K',
    comments: '2.1K',
    ytShortId: '3JZ_D3ELwOQ',
    embedUrl: 'https://www.youtube.com/embed/3JZ_D3ELwOQ?autoplay=1&mute=0&controls=1&loop=1&playlist=3JZ_D3ELwOQ&modestbranding=1&playsinline=1&rel=0',
    concept: 'Divide and conquer recursively partitions arrays around a pivot in O(N log N) time, creating optimal cache locality.',
    sampleComments: [
      { user: 'system_design_guru', text: 'Visualizing pivot partitioning makes it stick forever!', likes: 450 },
      { user: 'rahul_swe', text: '45 seconds of solid algorithmic insight 💯', likes: 230 },
      { user: 'tech_maya', text: 'Saved for my technical interview prep!', likes: 115 }
    ]
  }
];

export default function StepReelSimulation({ data, onChange, onNext, onPrev }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [watchedSec, setWatchedSec] = useState(0);
  const [reelLogs, setReelLogs] = useState(data.reel_watches || []);
  const [allFinished, setAllFinished] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [customReelId, setCustomReelId] = useState('');

  const activeReel = REELS[currentIdx];
  const timerRef = useRef(null);

  // Sync state when active reel changes
  useEffect(() => {
    setIsLiked(false);
    setWatchedSec(0);
    setIsPlaying(true);
    setShowComments(false);
  }, [currentIdx]);

  // Live timer tracking playback seconds
  useEffect(() => {
    if (isPlaying && !allFinished) {
      timerRef.current = setInterval(() => {
        setWatchedSec((prev) => {
          const next = prev + 1;
          if (next >= activeReel.duration) {
            handleCompleteReel(activeReel.duration);
            return activeReel.duration;
          }
          return next;
        });
      }, 1000);
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
      watched_seconds: Math.min(Math.round(finalSec), activeReel.duration),
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
    } else {
      setAllFinished(true);
      setIsPlaying(false);
      onChange({ ...data, reel_watches: updated });
    }
  };

  const handleHeartClick = (e) => {
    e.stopPropagation();
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    if (newLiked) {
      const heartId = Date.now();
      setFloatingHearts(prev => [...prev, heartId]);
      setTimeout(() => {
        setFloatingHearts(prev => prev.filter(h => h !== heartId));
      }, 900);
    }
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    setToastMessage("Reel link copied to clipboard!");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleContinue = () => {
    let finalLogs = [...reelLogs];
    if (finalLogs.length === 0) {
      finalLogs = REELS.map(r => ({
        clip_id: r.id,
        title: r.title,
        clip_type: r.duration <= 15 ? 'short' : (r.duration <= 30 ? 'medium' : 'long'),
        duration_seconds: r.duration,
        watched_seconds: r.duration * 0.75,
        completion_status: 'halfway',
        skipped: false
      }));
    }
    onChange({ ...data, reel_watches: finalLogs });
    onNext();
  };

  const currentRatio = Math.min(watchedSec / activeReel.duration, 1.0);
  const liveStatus = classifyWatch(watchedSec, activeReel.duration);

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div className="badge" style={{ marginBottom: '10px' }}>
          <Sparkles size={14} />
          Signal 2 of 6 &bull; Real Instagram Reels Video Simulation
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>
          Real Instagram Reels Attention Feed
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Watch these actual video reels (<strong>15s, 30s, and 45s</strong>) naturally. We evaluate your cognitive endurance vs quick-scroll impulses.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(310px, 350px) 1fr', gap: '24px', alignItems: 'start', marginBottom: '24px' }}>
        
        {/* Instagram Phone Mockup Frame */}
        <div style={{
          width: '100%',
          maxWidth: '350px',
          margin: '0 auto',
          height: '580px',
          borderRadius: '38px',
          border: '4px solid #334155',
          background: '#000000',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.35)',
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
            width: '110px',
            height: '18px',
            backgroundColor: '#0f172a',
            borderRadius: '10px',
            zIndex: 40
          }} />

          {/* Toast Notification */}
          {toastMessage && (
            <div style={{
              position: 'absolute',
              top: '36px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              zIndex: 50,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.15)',
              whiteSpace: 'nowrap'
            }}>
              {toastMessage}
            </div>
          )}

          {/* Floating Hearts Animation */}
          {floatingHearts.map(id => (
            <div key={id} className="floating-heart">
              <Heart size={70} fill="#f43f5e" color="#f43f5e" />
            </div>
          ))}

          {/* Video Viewport: Real Video Player / Embed */}
          <div style={{
            flex: 1,
            position: 'relative',
            backgroundColor: '#000000',
            overflow: 'hidden'
          }}>
            {/* Real Video Embed (Full Bleed Vertical Format) */}
            <iframe
              key={activeReel.id}
              src={activeReel.embedUrl}
              title={activeReel.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                objectFit: 'cover'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />

            {/* Top Bar Overlay */}
            <div style={{
              position: 'absolute',
              top: '28px',
              left: '14px',
              right: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 20,
              pointerEvents: 'none'
            }}>
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(8px)',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span style={{ color: '#ec4899' }}>Reels</span> &bull; {currentIdx + 1}/{REELS.length} ({activeReel.duration}s)
              </div>
            </div>

            {/* Floating Right Interaction Sidebar */}
            <div style={{
              position: 'absolute',
              right: '10px',
              bottom: '70px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center',
              zIndex: 30
            }}>
              {/* Like */}
              <div onClick={handleHeartClick} style={{ cursor: 'pointer', textAlign: 'center' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isLiked ? '#f43f5e' : '#ffffff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
                }}>
                  <Heart size={20} fill={isLiked ? '#f43f5e' : 'none'} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                  {activeReel.likes}
                </span>
              </div>

              {/* Comment */}
              <div onClick={() => setShowComments(!showComments)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
                }}>
                  <MessageCircle size={20} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                  {activeReel.comments}
                </span>
              </div>

              {/* Share */}
              <div onClick={handleShareClick} style={{ cursor: 'pointer', textAlign: 'center' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
                }}>
                  <Share2 size={18} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                  Share
                </span>
              </div>

              {/* Spinning Music Disc */}
              <div className="spin-disc" style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
                border: '3px solid #6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(99,102,241,0.6)'
              }}>
                <Music2 size={12} color="#a5b4fc" />
              </div>
            </div>

            {/* Comments Drawer Overlay */}
            {showComments && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '65%',
                backgroundColor: '#0f172a',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                zIndex: 35,
                display: 'flex',
                flexDirection: 'column',
                padding: '16px',
                boxShadow: '0 -10px 30px rgba(0,0,0,0.8)',
                borderTop: '1px solid rgba(255,255,255,0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>Comments ({activeReel.comments})</span>
                  <button onClick={() => setShowComments(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeReel.sampleComments.map((c, i) => (
                    <div key={i} style={{ fontSize: '0.78rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                      <strong style={{ color: 'var(--primary-light)' }}>@{c.user}</strong>
                      <p style={{ color: '#cbd5e1', marginTop: '2px' }}>{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Progress Bar */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              zIndex: 30
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#ffffff',
                width: `${currentRatio * 100}%`,
                transition: 'width 0.3s ease',
                boxShadow: '0 0 6px rgba(255,255,255,0.8)'
              }} />
            </div>
          </div>

          {/* Quick Playback & Navigation Bar */}
          <div style={{
            backgroundColor: '#090d16',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
              {Math.min(Math.round(watchedSec), activeReel.duration)}s / {activeReel.duration}s
            </span>

            <button
              onClick={handleSkipReel}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Skip Reel
              <SkipForward size={15} />
            </button>
          </div>
        </div>

        {/* Right Side: Real-time Telemetry & Reel Selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Active Reel Telemetry */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Timer size={16} color="var(--primary-light)" />
              Active Reel Video Telemetry
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Reel:</span>
                <span style={{ fontWeight: 700 }}>Reel #{currentIdx + 1} &bull; {activeReel.duration}s Target</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Watch Progress:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {Math.min(Math.round(watchedSec), activeReel.duration)}s ({Math.round(currentRatio * 100)}%)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Completion Status:</span>
                <span style={{
                  padding: '4px 10px',
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

              {/* Progress Bar Visualizer */}
              <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{
                  width: `${currentRatio * 100}%`,
                  height: '100%',
                  backgroundColor: liveStatus === 'full' ? '#10b981' : (liveStatus === 'halfway' ? '#f59e0b' : '#ef4444'),
                  transition: 'width 0.2s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Quick 15s / 30s / 45s Reel Jump Switcher */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Jump to Specific Video Reel:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {REELS.map((reel, idx) => {
                const isSelected = currentIdx === idx;
                const log = reelLogs.find(r => r.clip_id === reel.id);
                return (
                  <button
                    key={reel.id}
                    onClick={() => setCurrentIdx(idx)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? 'var(--primary-light)' : 'var(--border-subtle)'}`,
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                      color: isSelected ? '#ffffff' : 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div>{reel.duration}s Video</div>
                    <div style={{ fontSize: '0.7rem', color: log ? (log.completion_status === 'full' ? '#34d399' : '#fbbf24') : 'var(--text-dim)' }}>
                      {log ? log.completion_status : 'Pending'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reel History Breakdown */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
              Reels Completion Breakdown ({reelLogs.length}/{REELS.length}):
            </h4>

            {reelLogs.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Watch or skip the active video reels to record your attention retention curve.
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
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.title.slice(0, 26)}...</span>
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
          Proceed to Interest-Based YouTube Attention Test
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
