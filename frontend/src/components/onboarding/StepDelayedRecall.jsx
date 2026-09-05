import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Sparkles, CheckCircle2, ArrowRight, Play, RotateCcw, Zap, Clock, Plus, Trash2 } from 'lucide-react';

const TARGET_WORDS = [
  "Mitochondria",
  "Algorithm",
  "Synapse",
  "Entropy",
  "Calculus",
  "Heuristic",
  "Polymorphism",
  "Latency"
];

const ENCODING_SECONDS = 18;
const DISTRACTOR_SECONDS = 12;

export default function StepDelayedRecall({ data, onChange, onNext, onPrev }) {
  const [phase, setPhase] = useState('intro'); // 'intro', 'encoding', 'delay', 'recall', 'finished'
  const [secondsLeft, setSecondsLeft] = useState(ENCODING_SECONDS);
  const [currentWordInput, setCurrentWordInput] = useState("");
  const [enteredWords, setEnteredWords] = useState([]);
  
  const timerRef = useRef(null);

  // Countdown timer for Encoding and Delay phases
  useEffect(() => {
    if (phase === 'encoding' || phase === 'delay') {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            if (phase === 'encoding') {
              setPhase('delay');
              setSecondsLeft(DISTRACTOR_SECONDS);
            } else if (phase === 'delay') {
              setPhase('recall');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const startTest = () => {
    setPhase('encoding');
    setSecondsLeft(ENCODING_SECONDS);
    setEnteredWords([]);
  };

  const handleAddWord = () => {
    const word = currentWordInput.trim();
    if (!word) return;
    if (!enteredWords.map(w => w.toLowerCase()).includes(word.toLowerCase())) {
      setEnteredWords([...enteredWords, word]);
    }
    setCurrentWordInput("");
  };

  const handleRemoveWord = (idx) => {
    setEnteredWords(enteredWords.filter((_, i) => i !== idx));
  };

  const handleSubmitRecall = () => {
    setPhase('finished');
  };

  // Evaluation & Scoring
  const targetLower = TARGET_WORDS.map(w => w.toLowerCase());
  const correctlyRecalled = enteredWords.filter(w => targetLower.includes(w.toLowerCase()));
  const intrusions = enteredWords.filter(w => !targetLower.includes(w.toLowerCase()));
  const recallScore = Math.round((correctlyRecalled.length / TARGET_WORDS.length) * 1000) / 1000;

  const handleContinue = () => {
    onChange({
      ...data,
      delayed_recall_test: {
        total_target_words: TARGET_WORDS.length,
        correct_recalled_count: correctlyRecalled.length,
        intrusions_count: intrusions.length,
        recall_score: recallScore,
        recalled_words: enteredWords,
        target_words: TARGET_WORDS
      }
    });
    onNext();
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      
      {/* INTRO SCREEN */}
      {phase === 'intro' && (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <div className="badge" style={{ marginBottom: '16px' }}>
            <BookOpen size={14} color="var(--primary-light)" />
            Episodic Memory &amp; Retention Decay &bull; Roediger &amp; Karpicke (2006)
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '12px' }}>
            Delayed Free Recall Retention Task
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Measures your long-term memory encoding strength, retention decay rate, and hippocampal retrieval fidelity without cues.
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
              Protocol Structure:
            </h4>
            <ul style={{ color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: '1.6', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>1. Encoding Phase (18s):</strong> 8 academic concepts will be shown. Commit them to memory.</li>
              <li><strong>2. Distractor Phase (12s):</strong> A brief mental task will clear your short-term acoustic buffer.</li>
              <li><strong>3. Free Recall:</strong> Type in as many words as you remember from the list.</li>
            </ul>
          </div>

          <button
            onClick={startTest}
            className="btn btn-primary"
            style={{ padding: '14px 32px', fontSize: '1rem', gap: '10px' }}
          >
            <Play size={18} />
            Start Memory Encoding Phase
          </button>
        </div>
      )}

      {/* 1. ENCODING PHASE */}
      {phase === 'encoding' && (
        <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 700, textTransform: 'uppercase' }}>
              Phase 1: Memorize Words
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>
              <Clock size={16} />
              {secondsLeft}s remaining
            </div>
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '20px' }}>
            Memorize these 8 Academic Concepts:
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '24px'
          }}>
            {TARGET_WORDS.map((w, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#ffffff',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.1)'
                }}
              >
                {w}
              </div>
            ))}
          </div>

          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Do not write them down &bull; Rely purely on biological memory encoding
          </span>
        </div>
      )}

      {/* 2. DISTRACTOR DELAY PHASE */}
      {phase === 'delay' && (
        <div className="glass-panel" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>
              Phase 2: Working Memory Buffer Flush
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>
              <Clock size={16} />
              {secondsLeft}s
            </div>
          </div>

          <div style={{
            margin: '20px auto',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#f59e0b'
          }}>
            {secondsLeft}
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
            Quick Distractor Calculation:
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '420px', margin: '0 auto' }}>
            Mentally count backwards by 3s: <strong>99, 96, 93, 90, 87, 84...</strong> until the timer expires.
          </p>
        </div>
      )}

      {/* 3. FREE RECALL PHASE */}
      {phase === 'recall' && (
        <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
            Phase 3: Free Recall Retrieval
          </span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', marginBottom: '8px' }}>
            Type all words you can recall:
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
            Enter one word at a time and press Enter or click Add.
          </p>

          {/* Word Input */}
          <div style={{ display: 'flex', gap: '8px', maxWidth: '440px', margin: '0 auto 20px auto' }}>
            <input
              type="text"
              placeholder="Type recalled concept (e.g. Synapse)..."
              value={currentWordInput}
              onChange={(e) => setCurrentWordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none'
              }}
              autoFocus
            />
            <button
              onClick={handleAddWord}
              className="btn btn-secondary"
              style={{ padding: '10px 18px', gap: '6px' }}
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {/* Entered Words Chips */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            minHeight: '60px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '24px'
          }}>
            {enteredWords.length === 0 ? (
              <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No words entered yet. Type above and press Add.</span>
            ) : (
              enteredWords.map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '100px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 600
                  }}
                >
                  {w}
                  <button
                    onClick={() => handleRemoveWord(idx)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleSubmitRecall}
            className="btn btn-primary"
            style={{ padding: '12px 32px', fontSize: '0.95rem', gap: '8px' }}
          >
            Submit Free Recall ({enteredWords.length} words entered)
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* 4. FINAL RESULTS */}
      {phase === 'finished' && (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <div className="badge" style={{ marginBottom: '14px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle2 size={14} />
            Delayed Free Recall Completed
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>
            Retention Score: {correctlyRecalled.length} / {TARGET_WORDS.length} Words
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Grounded in Roediger &amp; Karpicke (2006) Testing Effect &amp; Ebbinghaus Retention Decay.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
            marginBottom: '28px'
          }}>
            <div style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Accuracy Rate</span>
              <strong style={{ fontSize: '1.8rem', color: '#34d399' }}>
                {Math.round(recallScore * 100)}%
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                {correctlyRecalled.length} of {TARGET_WORDS.length} items preserved
              </span>
            </div>

            <div style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Memory Consolidation</span>
              <strong style={{ fontSize: '1.8rem', color: 'var(--accent-cyan)' }}>
                {recallScore >= 0.75 ? "High" : (recallScore >= 0.5 ? "Moderate" : "Needs Pacing")}
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                Episodic retrieval efficiency
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
              Retake Task
            </button>

            <button
              onClick={handleContinue}
              className="btn btn-primary"
              style={{ padding: '12px 28px', gap: '8px' }}
            >
              Next: Short-Form Reels Simulation
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
