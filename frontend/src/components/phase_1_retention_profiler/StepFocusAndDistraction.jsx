import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Eye, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  X,
  MessageSquare
} from 'lucide-react';

const PASSAGE = {
  title: 'Synaptic Pruning and Cognitive Load in Deep Technical Learning',
  paragraphs: [
    'The human prefrontal cortex manages active working memory with an effective bandwidth of approximately four to seven discrete conceptual chunks simultaneously. When an engineer or student engages with multi-layered algorithmic abstractions, cognitive load bifurcates into intrinsic complexity (the fundamental difficulty of the material) and extraneous interference (distractions and inefficient context switches).',
    'During periods of sustained, uninterrupted focus, neurons synthesize brain-derived neurotrophic factor (BDNF), reinforcing synaptic connections along the active memory pathways. Conversely, switching tabs or checking micro-notifications causes "attention residue"—a lingering cognitive tax that can degrade analytical depth for up to 15–20 minutes following the disruption.',
    'Systematic learning efficacy therefore depends less on raw daily study duration and far more on the biological calibration between intense focus blocks and deliberate metabolic recovery intervals.'
  ],
  questions: [
    {
      id: 'q1',
      question: 'According to the passage, what happens biologically during uninterrupted deep focus?',
      options: [
        'Cognitive load shifts entirely to extraneous interference.',
        'Neurons synthesize BDNF, reinforcing synaptic memory connections.',
        'Working memory capacity permanently doubles to fourteen chunks.',
        'Attention residue increases exponentially.'
      ],
      correctIndex: 1
    },
    {
      id: 'q2',
      question: 'What is the primary consequence of frequent micro-notifications and tab switches?',
      options: [
        'Enhanced parallel multi-tasking bandwidth.',
        'Faster neural pruning of obsolete facts.',
        'Attention residue that degrades analytical depth for 15–20 minutes.',
        'Immediate reduction of intrinsic cognitive load.'
      ],
      correctIndex: 2
    }
  ]
};

export default function StepFocusAndDistraction({ data, onChange, onNext, onPrev }) {
  const [answers, setAnswers] = useState({});
  const [tabSwitches, setTabSwitches] = useState(0);
  const [unfocusedSeconds, setUnfocusedSeconds] = useState(0);
  const [distractionActive, setDistractionActive] = useState(false);
  const [distractionHandled, setDistractionHandled] = useState(false);
  const [reactionDelay, setReactionDelay] = useState(null);

  const startTimeRef = useRef(Date.now());
  const blurTimeRef = useRef(null);
  const distractionTriggerTimeRef = useRef(null);

  // 1. Page Visibility API Listener to detect tab switches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1);
        blurTimeRef.current = Date.now();
      } else if (blurTimeRef.current) {
        const offTime = (Date.now() - blurTimeRef.current) / 1000;
        setUnfocusedSeconds((prev) => prev + offTime);
        blurTimeRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 2. Trigger deliberate distraction test after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!distractionHandled) {
        setDistractionActive(true);
        distractionTriggerTimeRef.current = Date.now();
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [distractionHandled]);

  const handleDismissDistraction = () => {
    if (distractionTriggerTimeRef.current) {
      const delay = (Date.now() - distractionTriggerTimeRef.current) / 1000;
      setReactionDelay(Math.round(delay * 10) / 10);
    }
    setDistractionActive(false);
    setDistractionHandled(true);
  };

  const handleAnswerChange = (qId, optionIdx) => {
    setAnswers({ ...answers, [qId]: optionIdx });
  };

  const handleContinue = () => {
    const totalTimeSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    // Calculate correct answers
    let correctCount = 0;
    PASSAGE.questions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const focusTaskData = {
      passage_id: 'synaptic_pruning_article',
      total_time_seconds: totalTimeSeconds,
      tab_switch_count: tabSwitches,
      unfocused_duration_seconds: Math.round(unfocusedSeconds),
      answered_correctly: correctCount,
      total_questions: PASSAGE.questions.length
    };

    const distractionData = {
      distraction_type: 'urgent_peer_notification',
      reaction_delay_seconds: reactionDelay !== null ? reactionDelay : 3.5
    };

    onChange({
      ...data,
      focus_task: focusTaskData,
      distraction_test: distractionData
    });

    onNext();
  };

  const allAnswered = Object.keys(answers).length === PASSAGE.questions.length;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative' }}>
      {/* Deliberate Distraction Popup Overlay */}
      {distractionActive && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          maxWidth: '380px',
          backgroundColor: '#1e1b4b',
          border: '1px solid #818cf8',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(99, 102, 241, 0.4)',
          animation: 'pulse-glow 1.5s infinite'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7d2fe', fontWeight: 600, fontSize: '0.88rem' }}>
              <Bell size={16} color="#818cf8" />
              Discord &bull; Study Group Alert
            </div>
            <button
              onClick={handleDismissDistraction}
              style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#e0e7ff', marginBottom: '12px' }}>
            <strong>Alex:</strong> "Hey! Someone just leaked the new university syllabus outline in general chat. Are you online?"
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleDismissDistraction}
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#6366f1' }}
            >
              Dismiss & Refocus
            </button>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div className="badge" style={{ marginBottom: '12px' }}>
          <BrainCircuit size={14} />
          Signals 3 & 4 of 5 &bull; Sustained Focus & Distraction Recovery
        </div>
        <h2 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '8px' }}>
          Deep Reading & Distraction Resistance
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Read the short technical passage below carefully and answer the comprehension questions.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '28px', marginBottom: '20px' }}>
        {/* Telemetry live pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={14} color="var(--primary-light)" />
            Page Visibility Tracking Active
          </span>
          {tabSwitches > 0 && (
            <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={14} />
              {tabSwitches} tab switch(es) detected
            </span>
          )}
        </div>

        {/* Reading Passage */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          marginBottom: '28px',
          lineHeight: '1.7',
          fontSize: '0.94rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--primary-light)' }}>
            {PASSAGE.title}
          </h3>
          {PASSAGE.paragraphs.map((p, idx) => (
            <p key={idx} style={{ marginBottom: '12px', color: '#cbd5e1' }}>
              {p}
            </p>
          ))}
        </div>

        {/* Questions */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
            Comprehension & Analysis Questions:
          </h4>

          {PASSAGE.questions.map((q, qIdx) => (
            <div key={q.id} style={{ marginBottom: '20px' }}>
              <p style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '10px' }}>
                {qIdx + 1}. {q.question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {q.options.map((opt, optIdx) => {
                  const isSelected = answers[q.id] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleAnswerChange(q.id, optIdx)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isSelected ? 'var(--primary-light)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--primary-light)' : 'var(--text-dim)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-light)' }} />}
                      </div>
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
          disabled={!allAnswered}
          onClick={handleContinue}
          style={{ opacity: allAnswered ? 1 : 0.6 }}
        >
          Proceed to Study Baseline
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
