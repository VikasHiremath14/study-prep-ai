import React, { useState, useEffect, useRef } from 'react';
import { Brain, Sparkles, CheckCircle2, ArrowRight, Play, RotateCcw, Zap, Delete } from 'lucide-react';

const SPAN_LEVELS = [
  { level: 1, length: 4, label: "Span 4 (Foundational)" },
  { level: 2, length: 5, label: "Span 5 (Average)" },
  { level: 3, length: 6, label: "Span 6 (Above Average)" },
  { level: 4, length: 7, label: "Span 7 (Miller's Benchmark)" },
  { level: 5, length: 8, label: "Span 8 (High Working Memory)" }
];

function generateRandomDigits(length) {
  const digits = [];
  for (let i = 0; i < length; i++) {
    // Avoid immediate repeat
    let d;
    do {
      d = Math.floor(Math.random() * 9) + 1; // 1-9
    } while (digits.length > 0 && digits[digits.length - 1] === d);
    digits.push(d);
  }
  return digits;
}

export default function StepDigitSpan({ data, onChange, onNext, onPrev }) {
  const [gameState, setGameState] = useState('intro'); // 'intro', 'presenting', 'input', 'level_result', 'finished'
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [currentSequence, setCurrentSequence] = useState([]);
  const [displayDigit, setDisplayDigit] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [maxSpanAchieved, setMaxSpanAchieved] = useState(0);
  const [levelResults, setLevelResults] = useState([]);

  const timerRef = useRef(null);

  const startTest = () => {
    setCurrentLevelIdx(0);
    setMaxSpanAchieved(0);
    setLevelResults([]);
    startLevel(0);
  };

  const startLevel = (idx) => {
    if (idx >= SPAN_LEVELS.length) {
      endTest(SPAN_LEVELS[SPAN_LEVELS.length - 1].length);
      return;
    }

    const lvl = SPAN_LEVELS[idx];
    const seq = generateRandomDigits(lvl.length);
    setCurrentSequence(seq);
    setUserInput("");
    setGameState('presenting');
    setDisplayDigit(null);

    // Present digits sequentially (950ms on, 250ms gap)
    let digitIdx = 0;
    
    const showNextDigit = () => {
      if (digitIdx < seq.length) {
        setDisplayDigit(seq[digitIdx]);
        digitIdx++;
        timerRef.current = setTimeout(() => {
          setDisplayDigit(null); // blank gap
          timerRef.current = setTimeout(showNextDigit, 250);
        }, 850);
      } else {
        // Finished presenting, open input state
        setDisplayDigit(null);
        setGameState('input');
      }
    };

    timerRef.current = setTimeout(showNextDigit, 600);
  };

  const handleKeypadPress = (val) => {
    if (userInput.length < currentSequence.length) {
      setUserInput((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    setUserInput((prev) => prev.slice(0, -1));
  };

  const handleSubmitInput = () => {
    const targetStr = currentSequence.join('');
    const isCorrect = userInput.trim() === targetStr;
    const currentLength = SPAN_LEVELS[currentLevelIdx].length;

    const newResult = {
      level: SPAN_LEVELS[currentLevelIdx].level,
      length: currentLength,
      sequence: targetStr,
      userInput: userInput.trim(),
      isCorrect
    };

    setLevelResults((prev) => [...prev, newResult]);

    if (isCorrect) {
      setMaxSpanAchieved(currentLength);
      if (currentLevelIdx + 1 < SPAN_LEVELS.length) {
        setCurrentLevelIdx((prev) => prev + 1);
        startLevel(currentLevelIdx + 1);
      } else {
        endTest(currentLength);
      }
    } else {
      // Failed on this level -> stop and record max span
      endTest(maxSpanAchieved || (currentLength - 1));
    }
  };

  const endTest = (finalSpan) => {
    clearTimeout(timerRef.current);
    setMaxSpanAchieved(finalSpan);
    setGameState('finished');
  };

  // Keyboard input listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState === 'input') {
        if (/^[1-9]$/.test(e.key)) {
          handleKeypadPress(e.key);
        } else if (e.key === 'Backspace') {
          handleBackspace();
        } else if (e.key === 'Enter') {
          if (userInput.length === currentSequence.length) {
            handleSubmitInput();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, userInput, currentSequence]);

  const workingMemoryScore = Math.max(0.2, Math.min(1.0, (maxSpanAchieved - 3) / 5.0));

  const handleContinue = () => {
    onChange({
      ...data,
      digit_span_test: {
        max_span_capacity: maxSpanAchieved || 4,
        working_memory_score: Math.round(workingMemoryScore * 1000) / 1000,
        levels_attempted: levelResults.length,
        trials: levelResults
      }
    });
    onNext();
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      
      {/* INTRO SCREEN */}
      {gameState === 'intro' && (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <div className="badge" style={{ marginBottom: '16px' }}>
            <Brain size={14} color="var(--primary-light)" />
            Working Memory Capacity &bull; Baddeley & Miller (1956)
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '12px' }}>
            Digit Span Working Memory Task
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Measures your active working memory buffer ($7 \pm 2$ items) and phonological loop capacity required for complex mathematical reasoning.
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
              How it works:
            </h4>
            <ul style={{ color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: '1.6', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>A sequence of numbers will appear on screen one at a time.</li>
              <li>Memorize the sequence in exact order (e.g. <code>7 &rarr; 2 &rarr; 9 &rarr; 4</code>).</li>
              <li>When the input keypad appears, enter the numbers in the order they appeared.</li>
              <li>The sequence length will progressively scale from <strong>4 up to 8 digits</strong>.</li>
            </ul>
          </div>

          <button
            onClick={startTest}
            className="btn btn-primary"
            style={{ padding: '14px 32px', fontSize: '1rem', gap: '10px' }}
          >
            <Play size={18} />
            Start Digit Span Test
          </button>
        </div>
      )}

      {/* PRESENTING SEQUENCE */}
      {gameState === 'presenting' && (
        <div className="glass-panel" style={{ padding: '40px 24px', textAlign: 'center', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
              {SPAN_LEVELS[currentLevelIdx].label}
            </span>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Memorize the sequence...
            </h4>
          </div>

          {/* Flash Box */}
          <div style={{
            margin: '30px auto',
            width: '160px',
            height: '160px',
            borderRadius: '24px',
            background: displayDigit ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
            border: `2px solid ${displayDigit ? 'var(--primary)' : 'var(--border-subtle)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '5rem',
            fontFamily: 'monospace',
            fontWeight: 900,
            color: '#ffffff',
            boxShadow: displayDigit ? '0 0 35px var(--primary-glow)' : 'none',
            transition: 'all 0.15s ease'
          }}>
            {displayDigit || ""}
          </div>

          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Watch the screen carefully
          </span>
        </div>
      )}

      {/* USER INPUT STATE */}
      {gameState === 'input' && (
        <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
            {SPAN_LEVELS[currentLevelIdx].label}
          </span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', marginBottom: '16px' }}>
            Enter the sequence in order:
          </h3>

          {/* Input Display Slots */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}>
            {Array.from({ length: currentSequence.length }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: '44px',
                  height: '52px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${userInput[idx] ? 'var(--primary-light)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  color: '#ffffff'
                }}
              >
                {userInput[idx] || ""}
              </div>
            ))}
          </div>

          {/* Keypad Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 72px)',
            gap: '10px',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleKeypadPress(num.toString())}
                style={{
                  height: '52px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.1s ease'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleBackspace}
              style={{
                height: '52px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Delete size={20} />
            </button>
            <button
              onClick={() => handleKeypadPress("0")}
              style={{
                height: '52px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                fontSize: '1.3rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              0
            </button>
            <button
              onClick={handleSubmitInput}
              disabled={userInput.length !== currentSequence.length}
              style={{
                height: '52px',
                borderRadius: '10px',
                background: userInput.length === currentSequence.length ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                border: '1px solid var(--primary-light)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: userInput.length === currentSequence.length ? 'pointer' : 'not-allowed'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* FINAL RESULTS */}
      {gameState === 'finished' && (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <div className="badge" style={{ marginBottom: '14px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle2 size={14} />
            Working Memory Assessment Completed
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>
            Digit Span Capacity: {maxSpanAchieved} Digits
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Grounded in George Miller's (1956) Information Capacity and Baddeley's Working Memory Model.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
            marginBottom: '28px'
          }}>
            <div style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Max Span Reached</span>
              <strong style={{ fontSize: '1.8rem', color: 'var(--primary-light)' }}>
                {maxSpanAchieved} items
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                {maxSpanAchieved >= 7 ? "Exceptional working memory" : (maxSpanAchieved >= 5 ? "Normal cognitive capacity" : "Needs bite-sized focus slicing")}
              </span>
            </div>

            <div style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Working Memory Score</span>
              <strong style={{ fontSize: '1.8rem', color: '#34d399' }}>
                {Math.round(workingMemoryScore * 100)}%
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                Normalized against WAIS-IV norms
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
              Next: Delayed Recall Retention Test
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
