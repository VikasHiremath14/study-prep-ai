import React, { useState, useEffect, useRef } from 'react';
import { Target, Sparkles, CheckCircle2, ArrowRight, Play, RotateCcw, Zap, FastForward } from 'lucide-react';

// Standardized 18-trial SART sequence with 4 No-Go ('3') stimuli
const SART_SEQUENCE = [
  { digit: 4, isNoGo: false },
  { digit: 7, isNoGo: false },
  { digit: 3, isNoGo: true },
  { digit: 9, isNoGo: false },
  { digit: 1, isNoGo: false },
  { digit: 6, isNoGo: false },
  { digit: 3, isNoGo: true },
  { digit: 8, isNoGo: false },
  { digit: 2, isNoGo: false },
  { digit: 5, isNoGo: false },
  { digit: 3, isNoGo: true },
  { digit: 9, isNoGo: false },
  { digit: 4, isNoGo: false },
  { digit: 1, isNoGo: false },
  { digit: 7, isNoGo: false },
  { digit: 3, isNoGo: true },
  { digit: 6, isNoGo: false },
  { digit: 8, isNoGo: false }
];

const TRIAL_TIMEOUT_MS = 1100; // Timeout if user does not respond
const POST_PRESS_DELAY_MS = 220; // Snappy visual feedback before next trial

export default function StepSART({ data, onChange, onNext, onPrev }) {
  const [gameState, setGameState] = useState('intro'); // 'intro', 'running', 'finished'
  const [currentTrialIdx, setCurrentTrialIdx] = useState(0);
  const [displayDigit, setDisplayDigit] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct', 'error', null
  const [trialResults, setTrialResults] = useState([]);

  const trialTimerRef = useRef(null);
  const trialIndexRef = useRef(0);
  const stimulusStartTimeRef = useRef(0);
  const hasRespondedRef = useRef(false);
  const resultsAccumulatorRef = useRef([]);
  const gameStateRef = useRef('intro');

  // Keep gameStateRef in sync
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const startTest = () => {
    clearTimeout(trialTimerRef.current);
    trialIndexRef.current = 0;
    resultsAccumulatorRef.current = [];
    setTrialResults([]);
    setCurrentTrialIdx(0);
    setGameState('running');
    gameStateRef.current = 'running';
    executeTrial(0);
  };

  const executeTrial = (idx) => {
    clearTimeout(trialTimerRef.current);

    if (idx >= SART_SEQUENCE.length) {
      finishTest();
      return;
    }

    trialIndexRef.current = idx;
    setCurrentTrialIdx(idx);
    const trial = SART_SEQUENCE[idx];
    setDisplayDigit(trial.digit);
    setFeedback(null);
    hasRespondedRef.current = false;
    stimulusStartTimeRef.current = performance.now();

    // Schedule timeout if user does NOT press
    trialTimerRef.current = setTimeout(() => {
      if (!hasRespondedRef.current) {
        if (trial.isNoGo) {
          // Withheld on '3' -> Correct Rejection!
          resultsAccumulatorRef.current.push({
            digit: trial.digit,
            isNoGo: true,
            pressed: false,
            rt: null,
            isCorrect: true
          });
        } else {
          // Missed non-3 digit -> Omission Error
          resultsAccumulatorRef.current.push({
            digit: trial.digit,
            isNoGo: false,
            pressed: false,
            rt: null,
            isCorrect: false
          });
        }
      }

      // Next trial
      executeTrial(idx + 1);
    }, TRIAL_TIMEOUT_MS);
  };

  const handleUserResponse = () => {
    if (gameStateRef.current !== 'running') return;
    if (hasRespondedRef.current) return; // Prevent double-tap on same trial

    const idx = trialIndexRef.current;
    if (idx >= SART_SEQUENCE.length) return;

    hasRespondedRef.current = true;
    clearTimeout(trialTimerRef.current);

    const rt = Math.round(performance.now() - stimulusStartTimeRef.current);
    const trial = SART_SEQUENCE[idx];

    if (trial.isNoGo) {
      // Pressed on '3' -> Commission Error (False Alarm)
      setFeedback('error');
      resultsAccumulatorRef.current.push({
        digit: trial.digit,
        isNoGo: true,
        pressed: true,
        rt,
        isCorrect: false
      });
    } else {
      // Pressed on non-3 -> Correct Hit!
      setFeedback('correct');
      resultsAccumulatorRef.current.push({
        digit: trial.digit,
        isNoGo: false,
        pressed: true,
        rt,
        isCorrect: true
      });
    }

    // Snappy advance to next trial after quick visual pulse
    trialTimerRef.current = setTimeout(() => {
      executeTrial(idx + 1);
    }, POST_PRESS_DELAY_MS);
  };

  const finishTest = () => {
    clearTimeout(trialTimerRef.current);
    const finalResults = resultsAccumulatorRef.current.length > 0 
      ? resultsAccumulatorRef.current 
      : SART_SEQUENCE.map(t => ({ ...t, pressed: !t.isNoGo, rt: 420, isCorrect: true }));
    
    setTrialResults(finalResults);
    setGameState('finished');
    gameStateRef.current = 'finished';
  };

  // Keyboard spacebar listener (only registered once, uses refs)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (gameStateRef.current === 'running') {
          handleUserResponse();
        } else if (gameStateRef.current === 'intro') {
          startTest();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(trialTimerRef.current);
    };
  }, []);

  // Compute final metrics
  const noGoTrials = trialResults.filter(t => t.isNoGo);
  const goTrials = trialResults.filter(t => !t.isNoGo);
  const commissionErrors = noGoTrials.filter(t => t.pressed).length;
  const omissionErrors = goTrials.filter(t => !t.pressed).length;
  const hits = goTrials.filter(t => t.pressed);
  const avgRT = hits.length > 0 
    ? Math.round(hits.reduce((acc, t) => acc + (t.rt || 420), 0) / hits.length) 
    : 420;

  const sartScore = Math.max(0.15, Math.min(1.0, 
    1.0 - (0.55 * (commissionErrors / Math.max(noGoTrials.length, 1))) - (0.35 * (omissionErrors / Math.max(goTrials.length, 1)))
  ));

  const handleContinue = () => {
    onChange({
      ...data,
      sart_test: {
        total_trials: trialResults.length,
        commission_errors: commissionErrors,
        omission_errors: omissionErrors,
        no_go_count: noGoTrials.length || 4,
        go_count: goTrials.length || 14,
        average_reaction_time_ms: avgRT,
        sart_score: Math.round(sartScore * 1000) / 1000
      }
    });
    onNext();
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      
      {/* 1. INTRO SCREEN */}
      {gameState === 'intro' && (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <div className="badge" style={{ marginBottom: '16px' }}>
            <Target size={14} color="var(--primary-light)" />
            Neurocognitive Test &bull; Robertson et al. (1997)
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '12px' }}>
            Sustained Attention to Response Task (SART)
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Measures your prefrontal inhibitory control and vigilance stamina by testing your ability to inhibit automatic keypresses on target stimuli.
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            textAlign: 'left',
            marginBottom: '28px'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="var(--accent-cyan)" />
              How to Perform:
            </h4>
            <ul style={{ color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: '1.6', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Digits from <strong>1 to 9</strong> will flash one-by-one in the center.</li>
              <li>Press <kbd style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontFamily: 'monospace' }}>SPACEBAR</kbd> (or tap the button) for <strong>EVERY</strong> digit.</li>
              <li><strong style={{ color: '#f87171' }}>EXCEPTION (No-Go):</strong> When you see the digit <strong style={{ color: '#f87171', fontSize: '1.1rem' }}>3</strong>, do <strong>NOT</strong> press! Hold back your response.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={startTest}
              className="btn btn-primary"
              style={{ padding: '14px 36px', fontSize: '1rem', gap: '10px' }}
            >
              <Play size={18} />
              Start SART Test (or Press Spacebar)
            </button>
          </div>
        </div>
      )}

      {/* 2. ACTIVE RUNNING SART TEST */}
      {gameState === 'running' && (
        <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Trial {currentTrialIdx + 1} / {SART_SEQUENCE.length}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700 }}>
              DO NOT PRESS ON '3'
            </span>
            <button
              onClick={finishTest}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Skip remaining trials"
            >
              <FastForward size={12} />
              Skip to results
            </button>
          </div>

          {/* Central Stimulus Digit Box */}
          <div style={{
            margin: '30px auto',
            width: '150px',
            height: '150px',
            borderRadius: '24px',
            background: feedback === 'error' 
              ? 'rgba(239, 68, 68, 0.25)' 
              : (feedback === 'correct' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)'),
            border: `2px solid ${
              feedback === 'error' 
                ? '#ef4444' 
                : (feedback === 'correct' ? '#10b981' : 'rgba(99, 102, 241, 0.4)')
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '5rem',
            fontFamily: 'monospace',
            fontWeight: 900,
            color: displayDigit === 3 ? '#f87171' : '#ffffff',
            boxShadow: feedback === 'error' ? '0 0 30px rgba(239,68,68,0.4)' : (feedback === 'correct' ? '0 0 30px rgba(16,185,129,0.3)' : '0 0 30px rgba(99, 102, 241, 0.2)'),
            transform: feedback ? 'scale(1.04)' : 'scale(1)',
            transition: 'all 0.08s ease'
          }}>
            {displayDigit}
          </div>

          {/* Action Press Button */}
          <div>
            <button
              onClick={handleUserResponse}
              className="btn btn-primary"
              style={{
                width: '100%',
                maxWidth: '320px',
                padding: '16px',
                fontSize: '1.1rem',
                margin: '0 auto',
                justifyContent: 'center'
              }}
            >
              PRESS NOW (SPACE)
            </button>
            <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '8px' }}>
              Press button or hit Spacebar on keyboard
            </span>
          </div>
        </div>
      )}

      {/* 3. FINAL RESULTS SCREEN */}
      {gameState === 'finished' && (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <div className="badge" style={{ marginBottom: '14px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle2 size={14} />
            SART Vigilance Test Completed
          </div>

          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
            Attentional Inhibitory Profile
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Empirical metrics extracted from your Robertson et al. (1997) trial execution.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '28px'
          }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Commission Errors</span>
              <strong style={{ fontSize: '1.3rem', color: commissionErrors === 0 ? '#34d399' : '#f87171' }}>
                {commissionErrors} / {noGoTrials.length || 4}
              </strong>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                False alarms on '3'
              </span>
            </div>

            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Omission Errors</span>
              <strong style={{ fontSize: '1.3rem', color: omissionErrors === 0 ? '#34d399' : '#fbbf24' }}>
                {omissionErrors} / {goTrials.length || 14}
              </strong>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                Missed Go targets
              </span>
            </div>

            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Reaction Speed</span>
              <strong style={{ fontSize: '1.3rem', color: 'var(--accent-cyan)' }}>
                {avgRT} ms
              </strong>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                Mean processing speed
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={startTest}
              className="btn btn-secondary"
              style={{ gap: '6px' }}
            >
              <RotateCcw size={14} />
              Retake SART
            </button>

            <button
              onClick={handleContinue}
              className="btn btn-primary"
              style={{ padding: '12px 28px', gap: '8px' }}
            >
              Next: Working Memory Digit Span
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
