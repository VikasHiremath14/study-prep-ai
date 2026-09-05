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
  RotateCcw,
  Sparkles,
  Search,
  ExternalLink,
  BookOpen,
  Brain,
  Cpu,
  Rocket,
  Code2,
  TrendingUp
} from 'lucide-react';

const INTEREST_TOPICS = [
  {
    id: 'neuroscience',
    title: 'Brain & Neuroscience',
    icon: Brain,
    color: '#10b981',
    video: {
      id: 'H-XfCl-HpRM',
      title: 'How Your Brain Works & Changes with Focused Attention',
      channel: 'Huberman Lab (Stanford Neuroscience)',
      durationSeconds: 180,
      embedUrl: 'https://www.youtube.com/embed/H-XfCl-HpRM?autoplay=1&enablejsapi=1&playsinline=1&rel=0',
      description: 'Dr. Andrew Huberman explains how intense cognitive focus triggers acetylcholine and epinephrine release to drive synaptic neuroplasticity.'
    }
  },
  {
    id: 'ai_ml',
    title: 'AI & Neural Networks',
    icon: Cpu,
    color: '#6366f1',
    video: {
      id: 'aircAruvnKk',
      title: 'But What is a Neural Network? (Deep Learning Chapter 1)',
      channel: '3Blue1Brown',
      durationSeconds: 180,
      embedUrl: 'https://www.youtube.com/embed/aircAruvnKk?autoplay=1&enablejsapi=1&playsinline=1&rel=0',
      description: 'Grant Sanderson provides a visual breakdown of multilayer perceptrons, neuron activations, and high-dimensional weight matrices.'
    }
  },
  {
    id: 'astrophysics',
    title: 'Space & Quantum Physics',
    icon: Rocket,
    color: '#a855f7',
    video: {
      id: 'HEheh1BH34Q',
      title: 'Star & Universe Size Comparison in 3D Real Scale',
      channel: 'morn1415 & Science Hub',
      durationSeconds: 180,
      embedUrl: 'https://www.youtube.com/embed/HEheh1BH34Q?autoplay=1&enablejsapi=1&playsinline=1&rel=0',
      description: 'A 3D cosmic journey scaling from atomic particles up through celestial bodies, supermassive black holes, and the observable universe.'
    }
  },
  {
    id: 'computer_science',
    title: 'Algorithms & Computing',
    icon: Code2,
    color: '#06b6d4',
    video: {
      id: 'kPRA0W1kECg',
      title: '15 Sorting & Partitioning Algorithms Visualized',
      channel: 'Timo Bingmann (CS Research)',
      durationSeconds: 180,
      embedUrl: 'https://www.youtube.com/embed/kPRA0W1kECg?autoplay=1&enablejsapi=1&playsinline=1&rel=0',
      description: 'Visual and auditory breakdown of QuickSort, MergeSort, HeapSort, and RadixSort executing across high-throughput memory buffers.'
    }
  },
  {
    id: 'robotics',
    title: 'Robotics & Hardware',
    icon: Sparkles,
    color: '#f59e0b',
    video: {
      id: 'tF4DML7FIWk',
      title: 'Inside Next-Gen Autonomous Robotics & Dynamic Parkour',
      channel: 'Boston Dynamics',
      durationSeconds: 180,
      embedUrl: 'https://www.youtube.com/embed/tF4DML7FIWk?autoplay=1&enablejsapi=1&playsinline=1&rel=0',
      description: 'How model-predictive control, real-time balance trajectory generation, and neural vision systems power agile bipedal robots.'
    }
  },
  {
    id: 'finance',
    title: 'Finance & Economics',
    icon: TrendingUp,
    color: '#ec4899',
    video: {
      id: 'p7HKvqRI_Bo',
      title: 'How Does the Stock Market & High-Speed Trading Work?',
      channel: 'TED-Ed & Oliver Elfenbaum',
      durationSeconds: 180,
      embedUrl: 'https://www.youtube.com/embed/p7HKvqRI_Bo?autoplay=1&enablejsapi=1&playsinline=1&rel=0',
      description: 'An engaging animated breakdown of market liquidity, company IPOs, and modern high-frequency electronic exchanges.'
    }
  }
];

export default function StepYouTubeAttention({ data, onChange, onNext, onPrev }) {
  // Find initial topic based on data.interest or fallback to first
  const initialTopic = INTEREST_TOPICS.find(t => t.id === data.interest) || INTEREST_TOPICS[0];
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopic.id);
  const [customUrl, setCustomUrl] = useState('');
  const [customVideoData, setCustomVideoData] = useState(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [watchedSec, setWatchedSec] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);

  const timerRef = useRef(null);

  // Active topic & video
  const activeTopic = INTEREST_TOPICS.find(t => t.id === selectedTopicId) || INTEREST_TOPICS[0];
  const currentVideo = customVideoData || activeTopic.video;

  // Extract YouTube ID helper
  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleApplyCustomUrl = () => {
    const videoId = extractYouTubeId(customUrl);
    if (videoId) {
      const custom = {
        id: videoId,
        title: 'Custom YouTube Video Topic',
        channel: 'Your Selected YouTube Video',
        durationSeconds: 180,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&playsinline=1&rel=0`,
        description: `Custom video loaded from your link: ${customUrl}`
      };
      setCustomVideoData(custom);
      setWatchedSec(0);
      setIsPlaying(true);
    } else {
      alert("Please enter a valid YouTube link (e.g. https://www.youtube.com/watch?v=...)");
    }
  };

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
          if (next >= currentVideo.durationSeconds) {
            setIsPlaying(false);
            return currentVideo.durationSeconds;
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, currentVideo.durationSeconds]);

  // When changing topics, reset timer and update active topic
  const handleSelectTopic = (topicId) => {
    setSelectedTopicId(topicId);
    setCustomVideoData(null);
    setWatchedSec(0);
    setIsPlaying(true);
  };

  const completionRatio = Math.min(watchedSec / currentVideo.durationSeconds, 1.0);

  const getStatus = (ratio) => {
    if (ratio >= 0.85) return 'full';
    if (ratio >= 0.40) return 'halfway';
    return 'dropped';
  };

  const currentStatus = getStatus(completionRatio);

  const handleProceed = () => {
    const youtubeData = {
      video_id: currentVideo.id,
      video_title: currentVideo.title,
      duration_seconds: currentVideo.durationSeconds,
      watched_seconds: Math.round(watchedSec),
      tab_switches_during_video: tabSwitches,
      completed_ratio: round(completionRatio, 2),
      status: currentStatus
    };

    onChange({
      ...data,
      interest: selectedTopicId,
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
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div className="badge" style={{ marginBottom: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <Youtube size={14} />
          Signal 3 of 6 &bull; Real YouTube Video Attention Test
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>
          Interest-Based Video Attention Test
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Select any topic below to switch the video. Watch naturally while we measure your sustained focus and tab-switching resistance.
        </p>
      </div>

      {/* Topic Interest Selector Bar */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Choose Your Study / Research Domain:
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 700 }}>
            Active: {activeTopic.title}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          {INTEREST_TOPICS.map((topic) => {
            const isSelected = selectedTopicId === topic.id && !customVideoData;
            const TopicIcon = topic.icon;
            return (
              <button
                key={topic.id}
                onClick={() => handleSelectTopic(topic.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${isSelected ? topic.color : 'var(--border-subtle)'}`,
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 0 12px ${topic.color}45` : 'none'
                }}
              >
                <TopicIcon size={16} color={isSelected ? topic.color : 'var(--text-dim)'} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {topic.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom YouTube URL Input */}
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Or paste any YouTube video URL to test attention on your own video..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomUrl()}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--text-main)',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          />
          <button
            onClick={handleApplyCustomUrl}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Search size={14} />
            Load Video
          </button>
        </div>
      </div>

      {/* Main Video & Telemetry Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '20px', alignItems: 'start', marginBottom: '24px' }}>
        
        {/* Left: Real YouTube Video Embed */}
        <div className="glass-panel" style={{ padding: '18px', overflow: 'hidden' }}>
          {/* Channel Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 0 12px rgba(239,68,68,0.4)' }}>
                <Youtube size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'block', lineHeight: '1.2' }}>{currentVideo.channel}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>Topic: {activeTopic.title}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, color: '#f87171' }}>
              HD Video &bull; 3:00 min
            </div>
          </div>

          {/* Real YouTube Video Player Frame */}
          <div style={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%', /* 16:9 Aspect Ratio */
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            backgroundColor: '#000000',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 20px rgba(239, 68, 68, 0.15)'
          }}>
            <iframe
              key={currentVideo.id}
              src={currentVideo.embedUrl}
              title={currentVideo.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Video Title & Description */}
          <div style={{ marginTop: '12px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', lineHeight: '1.3' }}>
              {currentVideo.title}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {currentVideo.description}
            </p>
          </div>

          {/* Playback Focus Controls & Timer Syncer */}
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="btn btn-primary"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  backgroundColor: isPlaying ? 'rgba(239, 68, 68, 0.2)' : '#ef4444',
                  borderColor: '#ef4444',
                  color: '#ffffff'
                }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? 'Pause Focus Timer' : 'Resume Focus Tracking'}
              </button>

              <button
                onClick={() => { setWatchedSec(0); setIsPlaying(true); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '6px' }}
                title="Restart Timer"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 700 }}>
              {formatTime(watchedSec)} / {formatTime(currentVideo.durationSeconds)}
            </span>
          </div>
        </div>

        {/* Right: Real-time Attention Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Status Metric Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Timer size={16} color="#ef4444" />
              Video Engagement Telemetry
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Watch Duration:</span>
                <span style={{ fontWeight: 700, color: '#f87171' }}>
                  {watchedSec}s / 180s ({Math.round(completionRatio * 100)}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${completionRatio * 100}%`,
                  height: '100%',
                  backgroundColor: currentStatus === 'full' ? '#10b981' : (currentStatus === 'halfway' ? '#f59e0b' : '#ef4444'),
                  transition: 'width 0.3s ease'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Completion Tier:</span>
                <span style={{
                  padding: '4px 10px',
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

              {/* Tab Blur Events with Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={14} color={tabSwitches > 0 ? '#f87171' : '#34d399'} />
                  Tab Blur / Distractions:
                </span>
                <span style={{
                  color: tabSwitches > 0 ? '#fbbf24' : '#34d399',
                  fontWeight: 700,
                  backgroundColor: tabSwitches > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {tabSwitches} switch{tabSwitches === 1 ? '' : 'es'}
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Note */}
          <div className="glass-panel" style={{ padding: '16px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            <strong style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Sparkles size={14} color="var(--primary-light)" />
              Behavioral Diagnostic Insight:
            </strong>
            Watching video content in your chosen domain without switching tabs indicates strong cognitive bandwidth for sustained lecture retention (weighted at 25% of your retention score).
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
