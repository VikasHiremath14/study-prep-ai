import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Award, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  Check,
  Mic,
  MicOff,
  BrainCircuit,
  Target,
  Zap,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Volume2
} from 'lucide-react';

// Audio silenced
function playMasteryChime() {}

export default function AntiWebSearchQuizModal({
  isOpen,
  onClose,
  studentId = 1,
  documentId = 1,
  dayNumber = 1,
  documentTitle = "Academic Textbook",
  currentPageNum = 1,
  currentPageText = "",
  topic = "",
  pageStart = 1,
  pageEnd = 4,
  pagesText = [],
  gradeLevel = "engineering",
  onProceedNextDay
}) {
  // Active Studio Mode: 'scenario_quiz' | 'feynman_studio'
  const [activeTab, setActiveTab] = useState('scenario_quiz');

  // Scenario Challenges State
  const [quizData, setQuizData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Feynman Explainer Studio State
  const [feynmanTopic, setFeynmanTopic] = useState("Academic Foundations & Core Invariants");
  const [feynmanExplanation, setFeynmanExplanation] = useState("");
  const [isEvaluatingFeynman, setIsEvaluatingFeynman] = useState(false);
  const [feynmanResult, setFeynmanResult] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Derive Feynman Topic dynamically from page text / document title or prop
  useEffect(() => {
    if (!isOpen) return;
    if (topic && topic !== "Page Academic Concepts" && topic.length > 3) {
      setFeynmanTopic(topic);
      return;
    }
    const sampleText = currentPageText || (pagesText && pagesText.length > 0 ? pagesText[0] : "");
    if (sampleText) {
      const firstLine = sampleText.split('\n')[0].replace(/^#+\s*/, '').trim();
      if (firstLine && firstLine.length > 5 && firstLine.length < 60) {
        setFeynmanTopic(firstLine);
        return;
      }
      const lower = sampleText.toLowerCase();
      if (lower.includes('shift register') || lower.includes('sipo') || lower.includes('piso')) {
        setFeynmanTopic("Shift Registers & Sequential Timing");
      } else if (lower.includes('flip-flop') || lower.includes('latch')) {
        setFeynmanTopic("Flip-Flops & Clock Synchronization");
      } else if (lower.includes('karnaugh') || lower.includes('k-map') || lower.includes('boolean')) {
        setFeynmanTopic("Boolean Minimization & Logic Gates");
      } else if (lower.includes('process control block') || lower.includes('pcb') || lower.includes('context switch')) {
        setFeynmanTopic("Operating System Context Switching & PCB");
      } else if (lower.includes('array') || lower.includes('amortized')) {
        setFeynmanTopic("Amortized Analysis & Dynamic Resizing");
      } else if (documentTitle) {
        setFeynmanTopic(`${documentTitle} (Page ${currentPageNum || pageStart})`);
      }
    } else if (documentTitle) {
      setFeynmanTopic(`${documentTitle} (Page ${currentPageNum || pageStart})`);
    }
  }, [isOpen, currentPageNum, currentPageText, documentTitle, topic, pagesText]);

  // Initialize Speech Recognition for Feynman Voice Explainer
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setFeynmanExplanation((prev) => prev + " " + transcript);
      };

      rec.onerror = (e) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceDictation = () => {
    if (!recognitionRef.current) {
      alert("Voice speech recognition is not supported in this browser. Please type your explanation.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech start error:", e);
      }
    }
  };

  // Fetch / Generate Anti-Web Search Scenario Quiz on Open
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    setQuizData(null);
    setIsGenerating(true);
    setSubmissionResult(null);
    setSelectedAnswers({});

    const generateQuiz = async () => {
      try {
        const textPayload = (currentPageText && currentPageText.trim().length > 10)
          ? [currentPageText]
          : (pagesText && pagesText.length > 0 ? pagesText : []);

        const res = await fetch('/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: documentId || 1,
            document_title: documentTitle || "Academic Textbook",
            pages_text: textPayload,
            page_start: currentPageNum || pageStart || 1,
            page_end: currentPageNum || pageEnd || 1,
            student_grade: gradeLevel || "engineering",
            num_questions: 3
          })
        });

        if (res.ok && !isCancelled) {
          const data = await res.json();
          setQuizData(data.quiz_data);
        }
      } catch (err) {
        console.error("Quiz generation error:", err);
      } finally {
        if (!isCancelled) {
          setIsGenerating(false);
        }
      }
    };

    generateQuiz();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, documentId, currentPageNum, currentPageText, pageStart, pageEnd, documentTitle, gradeLevel]);

  if (!isOpen) return null;

  const questions = quizData?.questions || [];

  const handleSelectOption = (qIdx, optIdx) => {
    if (submissionResult) return; // Locked after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx
    }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert("Please answer all scenario questions before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: 1,
          document_id: documentId,
          day_number: dayNumber,
          student_answers: selectedAnswers,
          questions_data: questions
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSubmissionResult(data);
        playMasteryChime(data.is_mastered);
      }
    } catch (err) {
      console.error("Quiz submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEvaluateFeynman = async () => {
    if (!feynmanExplanation.trim() || feynmanExplanation.trim().length < 15) {
      alert("Please provide a thorough explanation of at least 1-2 sentences to evaluate.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsEvaluatingFeynman(true);
    try {
      const res = await fetch('/api/quiz/feynman-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_title: documentTitle,
          concept_topic: feynmanTopic,
          pages_context: pagesText.join("\n\n"),
          student_explanation: feynmanExplanation,
          student_grade: gradeLevel
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFeynmanResult(data.evaluation);
        playMasteryChime(data.evaluation?.is_passed);
      }
    } catch (err) {
      console.error("Feynman evaluation error:", err);
    } finally {
      setIsEvaluatingFeynman(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.88)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      animation: 'fadeIn 0.25s ease'
    }}>
      
      <div style={{
        width: '100%',
        maxWidth: '860px',
        maxHeight: '92vh',
        background: 'linear-gradient(135deg, #090e1a 0%, #0f172a 100%)',
        border: '1px solid rgba(245, 158, 11, 0.45)',
        borderRadius: '24px',
        boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.9), 0 0 45px rgba(245, 158, 11, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 18px rgba(245, 158, 11, 0.4)',
              fontSize: '1.1rem'
            }}>
              🎯
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Anti-Web Search Active Recall &amp; Target Mastery
                </h3>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  fontWeight: 700
                }}>
                  Active Recall Engine
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Target Pages {pageStart}&ndash;{pageEnd} &bull; Tests genuine conceptual invariants &amp; intuitive mental models (Non-Searchable)
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '7px',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '4px 20px 0 20px',
          gap: '8px'
        }}>
          <button
            onClick={() => setActiveTab('scenario_quiz')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'scenario_quiz' ? '3px solid #f59e0b' : '3px solid transparent',
              color: activeTab === 'scenario_quiz' ? '#fbbf24' : 'var(--text-muted)',
              fontWeight: activeTab === 'scenario_quiz' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Target size={16} />
            🎯 Scenario Invariant Challenges (Anti-Web Search MCQs)
          </button>

          <button
            onClick={() => setActiveTab('feynman_studio')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'feynman_studio' ? '3px solid #10b981' : '3px solid transparent',
              color: activeTab === 'feynman_studio' ? '#34d399' : 'var(--text-muted)',
              fontWeight: activeTab === 'feynman_studio' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <BrainCircuit size={16} />
            🧠 Feynman Explainer Studio (Teach It Simply)
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          
          {/* TAB 1: SCENARIO CHALLENGES */}
          {activeTab === 'scenario_quiz' && (
            <>
              {isGenerating ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: 'var(--text-dim)',
                  fontSize: '0.9rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <Sparkles size={32} color="#f59e0b" className="spin-disc" />
                  <div>
                    <h4 style={{ color: '#ffffff', margin: '0 0 6px 0', fontSize: '1rem' }}>
                      Synthesizing Anti-Web Search Scenario Challenges...
                    </h4>
                    <span>
                      Generating non-searchable edge cases and invariant questions directly from Pages {pageStart}&ndash;{pageEnd}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Score & Mastery Celebration Banner when Submitted */}
                  {submissionResult && (
                    <div style={{
                      background: submissionResult.is_mastered 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)' 
                        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(245, 158, 11, 0.18) 100%)',
                      border: `1px solid ${submissionResult.is_mastered ? '#10b981' : '#f59e0b'}`,
                      borderRadius: '18px',
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      boxShadow: submissionResult.is_mastered ? '0 0 30px rgba(16, 185, 129, 0.25)' : 'none'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                            Target Day {dayNumber} Mastery Evaluation
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: submissionResult.is_mastered ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                            color: submissionResult.is_mastered ? '#34d399' : '#f87171',
                            fontWeight: 800
                          }}>
                            {submissionResult.is_mastered ? 'PASSED & ADVANCED' : 'REVISION NEEDED'}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', margin: '4px 0' }}>
                          Mastery Score: {submissionResult.score} / {submissionResult.total_questions} ({submissionResult.score_percent}%)
                        </h4>

                        <span style={{ fontSize: '0.86rem', color: submissionResult.is_mastered ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                          🏆 {submissionResult.mastery_tier}
                        </span>
                      </div>

                      {/* Advance Button */}
                      {onProceedNextDay && (
                        <button
                          onClick={onProceedNextDay}
                          className="btn btn-primary"
                          style={{
                            padding: '10px 22px',
                            fontSize: '0.86rem',
                            gap: '8px',
                            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                            boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
                          }}
                        >
                          Unlock Next Day Targets &amp; Continue
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Weak Spot Radar & Strengths Breakdown */}
                  {submissionResult && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '12px'
                    }}>
                      {/* Strengths */}
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.06)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '12px',
                        padding: '14px 16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#34d399', fontSize: '0.82rem', fontWeight: 800 }}>
                          <CheckCircle2 size={16} />
                          Conceptual Strengths ({submissionResult.strengths?.length || 0})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {submissionResult.strengths?.length > 0 ? (
                            submissionResult.strengths.map((s, idx) => (
                              <span key={idx} style={{
                                fontSize: '0.74rem',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#a7f3d0',
                                padding: '3px 8px',
                                borderRadius: '6px'
                              }}>
                                ✓ {s}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Review concepts below to build mastery</span>
                          )}
                        </div>
                      </div>

                      {/* Weak Spot Radar */}
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.06)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '12px',
                        padding: '14px 16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#f87171', fontSize: '0.82rem', fontWeight: 800 }}>
                          <AlertTriangle size={16} />
                          Weak Spot Radar &amp; Micro-Remedy ({submissionResult.weak_spots?.length || 0})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {submissionResult.weak_spots?.length > 0 ? (
                            submissionResult.weak_spots.map((w, idx) => (
                              <span key={idx} style={{
                                fontSize: '0.74rem',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#fca5a5',
                                padding: '3px 8px',
                                borderRadius: '6px'
                              }}>
                                ⚠️ {w.concept}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.74rem', color: '#34d399' }}>Zero weak spots detected! Flawless conceptual retention.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Questions List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {questions.map((q, qIdx) => {
                      const resultDetail = submissionResult?.detailed_results?.[qIdx];
                      const studentSelected = selectedAnswers[qIdx];

                      return (
                        <div
                          key={q.id || qIdx}
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            transition: 'border-color 0.2s ease'
                          }}
                        >
                          {/* Question Header */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Scenario Challenge {qIdx + 1} &bull; {q.concept_tested || "Invariant Reasoning"}
                              </span>
                              {resultDetail && (
                                <span style={{
                                  fontSize: '0.76rem',
                                  fontWeight: 800,
                                  color: resultDetail.is_correct ? '#34d399' : '#f87171',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  {resultDetail.is_correct ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                                  {resultDetail.is_correct ? "Correct Concept" : "Misconception Detected"}
                                </span>
                              )}
                            </div>

                            <p style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 600, margin: 0, lineHeight: 1.55 }}>
                              {q.question}
                            </p>
                          </div>

                          {/* Options Grid */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {q.options.map((opt, optIdx) => {
                              const isSelected = studentSelected === optIdx;
                              const isCorrect = optIdx === q.correct_index;
                              const isSubmitted = !!submissionResult;

                              let bg = 'rgba(255, 255, 255, 0.03)';
                              let border = '1px solid rgba(255, 255, 255, 0.08)';
                              let textCol = '#e2e8f0';

                              if (isSubmitted) {
                                if (isCorrect) {
                                  bg = 'rgba(16, 185, 129, 0.2)';
                                  border = '1px solid #10b981';
                                  textCol = '#34d399';
                                } else if (isSelected && !isCorrect) {
                                  bg = 'rgba(239, 68, 68, 0.2)';
                                  border = '1px solid #ef4444';
                                  textCol = '#f87171';
                                }
                              } else if (isSelected) {
                                bg = 'rgba(245, 158, 11, 0.2)';
                                border = '1px solid #f59e0b';
                                textCol = '#ffffff';
                              }

                              return (
                                <div
                                  key={optIdx}
                                  onClick={() => handleSelectOption(qIdx, optIdx)}
                                  style={{
                                    padding: '11px 16px',
                                    borderRadius: '10px',
                                    background: bg,
                                    border: border,
                                    cursor: isSubmitted ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    fontSize: '0.84rem',
                                    color: textCol,
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <span style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)',
                                    color: isSelected ? '#000000' : '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.74rem',
                                    fontWeight: 900
                                  }}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span style={{ flex: 1, lineHeight: 1.4 }}>{opt}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation Box when submitted */}
                          {resultDetail && (
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.35)',
                              borderLeft: '4px solid #f59e0b',
                              padding: '12px 16px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              color: '#cbd5e1',
                              lineHeight: 1.55,
                              marginTop: '6px'
                            }}>
                              <strong style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <Lightbulb size={14} />
                                Pedagogical Rationale &amp; Proof:
                              </strong>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit Quiz Action Button */}
                  {!submissionResult && (
                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={isSubmitting || Object.keys(selectedAnswers).length < questions.length}
                        className="btn btn-primary"
                        style={{
                          padding: '12px 36px',
                          fontSize: '0.92rem',
                          gap: '8px',
                          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                          boxShadow: '0 0 25px rgba(245, 158, 11, 0.35)'
                        }}
                      >
                        <Check size={18} />
                        {isSubmitting ? "Evaluating Retention & Invariants..." : "Submit Anti-Web Search Quiz"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* TAB 2: FEYNMAN EXPLAINER STUDIO */}
          {activeTab === 'feynman_studio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Feynman Prompt Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                  fontSize: '1.2rem'
                }}>
                  👨‍🏫
                </div>
                <div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
                    The Feynman Technique: If you cannot explain it simply, you do not understand it.
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
                    Explain the core mechanism below in plain language as if teaching a 10-year-old or non-technical friend. 
                    The AI will score your simplicity, flag jargon crutches, and evaluate your mental model.
                  </p>
                </div>
              </div>

              {/* Topic Selector */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Select Concept to Explain:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    "Amortized Complexity & Dynamic Arrays",
                    "Big-O Upper Bound vs Theta Tight Bound",
                    "AVL Tree Balance Invariants & Rotations",
                    "CPU Virtualization & Context Switching"
                  ].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setFeynmanTopic(topic)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: feynmanTopic === topic ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: feynmanTopic === topic ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: feynmanTopic === topic ? '#34d399' : 'var(--text-dim)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Explainer Input Area with Voice Dictation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                    Your Plain-Language Explanation:
                  </label>
                  
                  {/* Voice Button */}
                  <button
                    onClick={toggleVoiceDictation}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: isListening ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                      border: isListening ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isListening ? '#f87171' : 'var(--text-muted)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                    {isListening ? "Listening... (Click to stop)" : "Voice Dictation"}
                  </button>
                </div>

                <textarea
                  value={feynmanExplanation}
                  onChange={(e) => setFeynmanExplanation(e.target.value)}
                  placeholder={`Explain ${feynmanTopic} in 2-4 simple sentences without relying on buzzwords... (e.g. Imagine a backpack that doubles in size every time you run out of room...)`}
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    resize: 'vertical'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                    {feynmanExplanation.trim().split(/\s+/).filter(Boolean).length} words
                  </span>

                  <button
                    onClick={handleEvaluateFeynman}
                    disabled={isEvaluatingFeynman || feynmanExplanation.trim().length < 15}
                    className="btn btn-primary"
                    style={{
                      padding: '9px 24px',
                      fontSize: '0.84rem',
                      gap: '6px',
                      background: 'linear-gradient(135deg, #10b981, #06b6d4)'
                    }}
                  >
                    <Sparkles size={15} />
                    {isEvaluatingFeynman ? "Evaluating Feynman Depth..." : "Evaluate Feynman Explanation"}
                  </button>
                </div>
              </div>

              {/* Feynman Evaluation Results Card */}
              {feynmanResult && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${feynmanResult.is_passed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  borderRadius: '18px',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
                }}>
                  {/* Results Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-dim)' }}>
                        Feynman Technique Assessment
                      </span>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '2px 0' }}>
                        {feynmanResult.feedback_title || "Conceptual Evaluation"}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      {/* Overall Score Badge */}
                      <div style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        background: feynmanResult.is_passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        border: `1px solid ${feynmanResult.is_passed ? '#10b981' : '#f59e0b'}`,
                        textAlign: 'center'
                      }}>
                        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block' }}>Mastery</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: feynmanResult.is_passed ? '#34d399' : '#fbbf24' }}>
                          {feynmanResult.overall_mastery_score}%
                        </span>
                      </div>

                      {/* Simplicity Score */}
                      <div style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        textAlign: 'center'
                      }}>
                        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block' }}>Simplicity</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8' }}>
                          {feynmanResult.simplicity_score}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Critique */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    color: '#e2e8f0',
                    lineHeight: 1.55
                  }}>
                    <strong style={{ color: '#34d399', display: 'block', marginBottom: '4px' }}>
                      🎓 AI Pedagogical Critique:
                    </strong>
                    {feynmanResult.ai_critique}
                  </div>

                  {/* Jargon Crutches Flagged */}
                  <div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                      Jargon Crutches Flagged:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {feynmanResult.jargon_crutches_flagged?.length > 0 ? (
                        feynmanResult.jargon_crutches_flagged.map((jargon, idx) => (
                          <span key={idx} style={{
                            fontSize: '0.74rem',
                            background: 'rgba(239, 68, 68, 0.18)',
                            color: '#fca5a5',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}>
                            ⚠️ Replace "{jargon}" with plain words
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: '#34d399' }}>
                          ✨ Zero jargon crutches detected! Pure intuitive clarity.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recommended Mental Model & Analogy */}
                  {feynmanResult.recommended_mental_model && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      borderLeft: '4px solid #10b981',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      color: '#cbd5e1',
                      lineHeight: 1.5
                    }}>
                      <strong style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Lightbulb size={15} />
                        Recommended Mental Model &amp; Analogy:
                      </strong>
                      {feynmanResult.recommended_mental_model}
                    </div>
                  )}

                  {/* Advance Button on Passed */}
                  {feynmanResult.is_passed && onProceedNextDay && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <button
                        onClick={onProceedNextDay}
                        className="btn btn-primary"
                        style={{
                          padding: '10px 22px',
                          fontSize: '0.84rem',
                          gap: '6px',
                          background: 'linear-gradient(135deg, #10b981, #06b6d4)'
                        }}
                      >
                        Advance to Day {dayNumber + 1} Target
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
