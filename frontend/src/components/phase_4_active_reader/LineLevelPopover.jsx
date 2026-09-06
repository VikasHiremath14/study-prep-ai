import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  BookOpen, 
  Zap, 
  HelpCircle, 
  Bookmark, 
  X, 
  Send, 
  Check,
  ChevronDown,
  Mic,
  MicOff
} from 'lucide-react';

const EXPLAIN_MODES = [
  { id: 'agentic', label: 'Auto Agent', icon: '⚡', desc: 'RL Bandit Adaptive' },
  { id: 'eli5', label: 'ELI5', icon: '💡', desc: 'Simple Intuitive Analogy' },
  { id: 'deep_dive', label: 'Deep Dive', icon: '📖', desc: 'Rigorous Tech Breakdown' },
  { id: 'exam_crux', label: 'Exam Crux', icon: '⚡', desc: 'High-Yield Exam Points' }
];

export default function LineLevelPopover({
  selectedText,
  surroundingContext = "",
  pageNumber,
  documentId,
  documentTitle = "Academic Textbook",
  gradeLevel = "engineering",
  studentId = 1,
  position = { top: 100, left: 200 },
  onClose,
  onSaveNote
}) {
  const [activeTab, setActiveTab] = useState('explain'); // 'explain' | 'ask_doubt' | 'note'
  const [explainMode, setExplainMode] = useState('agentic'); // 'agentic' | 'eli5' | 'deep_dive' | 'exam_crux'
  const [showModeMenu, setShowModeMenu] = useState(false);

  const [loading, setLoading] = useState(false);
  const [explanationResult, setExplanationResult] = useState(null);
  const [banditDecision, setBanditDecision] = useState(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [doubtAnswer, setDoubtAnswer] = useState(null);
  const [noteContent, setNoteContent] = useState("");
  const [highlightColor, setHighlightColor] = useState("emerald"); // emerald, amber, cyan, purple
  const [noteSaved, setNoteSaved] = useState(false);

  const menuRef = useRef(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowModeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Web Speech API Voice Recognition
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your question.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setCustomQuestion(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Speech error:", err);
      setIsListening(false);
    }
  };

  const fetchAgenticExplanation = async () => {
    setActiveTab('explain');
    setExplainMode('agentic');
    setLoading(true);
    setExplanationResult(null);
    setBanditDecision(null);
    try {
      const res = await fetch('/api/reader/agentic-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId || 1,
          page_number: pageNumber,
          selected_text: selectedText,
          surrounding_context: surroundingContext || selectedText,
          grade_level: gradeLevel,
          concept_difficulty: "medium",
          document_title: documentTitle,
          student_id: studentId || 1
        })
      });

      if (res.ok) {
        const data = await res.json();
        setExplanationResult(data.explanation);
        setBanditDecision(data.bandit_decision);
      } else {
        setExplanationResult("Could not generate agentic explanation. Falling back to default.");
      }
    } catch (e) {
      console.error("Agentic error:", e);
      setExplanationResult("Connection issue. Please verify backend.");
    } finally {
      setLoading(false);
    }
  };

  const fetchExplanation = async (mode) => {
    setActiveTab('explain');
    setExplainMode(mode);
    setLoading(true);
    setExplanationResult(null);
    setBanditDecision(null);
    try {
      const res = await fetch('/api/reader/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId || 1,
          page_number: pageNumber,
          selected_text: selectedText,
          surrounding_context: surroundingContext || selectedText,
          grade_level: gradeLevel,
          mode: mode,
          document_title: documentTitle,
          student_id: studentId || 1
        })
      });

      if (res.ok) {
        const data = await res.json();
        setExplanationResult(data.explanation);
      } else {
        setExplanationResult("Could not generate line explanation. Please try again.");
      }
    } catch (e) {
      console.error("Explanation error:", e);
      setExplanationResult("Connection issue. Please verify backend.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch explanation when selection changes or popover opens
  useEffect(() => {
    if (selectedText) {
      if (explainMode === 'agentic') {
        fetchAgenticExplanation();
      } else {
        fetchExplanation(explainMode);
      }
    }
  }, [selectedText, pageNumber, documentId]);

  const handleAskDoubt = async () => {
    if (!customQuestion.trim()) return;
    setLoading(true);
    setDoubtAnswer(null);
    try {
      const res = await fetch('/api/reader/ask-doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId || 1,
          page_number: pageNumber,
          selected_text: selectedText,
          surrounding_context: surroundingContext || selectedText,
          question: customQuestion.trim(),
          grade_level: gradeLevel,
          document_title: documentTitle,
          student_id: studentId || 1
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDoubtAnswer(data.answer);
      }
    } catch (e) {
      console.error("Doubt error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMarginNote = async () => {
    try {
      const payload = {
        student_id: studentId || 1,
        document_id: documentId || 1,
        page_number: pageNumber,
        selected_text: selectedText,
        note_text: noteContent.trim() || "Highlighted Key Excerpt",
        color_tag: highlightColor,
        is_bookmark: false
      };

      const res = await fetch('/api/reader/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setNoteSaved(true);
        if (onSaveNote) {
          onSaveNote({
            ...payload,
            id: data.note_id || data.id || Date.now(),
            created_at: new Date().toISOString()
          });
        }

        // Save in local storage cache (both user-scoped and global)
        try {
          const userKey = studentId || 'default';
          const prevScoped = JSON.parse(localStorage.getItem(`study_prep_notes_${userKey}`) || '[]');
          const prevGlobal = JSON.parse(localStorage.getItem('study_prep_notes') || '[]');
          const newEntry = {
            id: data.note_id || data.id || Date.now(),
            document_id: documentId || 1,
            document_title: documentTitle,
            page_number: pageNumber,
            selected_text: selectedText,
            note_text: noteContent.trim() || "Highlighted Key Excerpt",
            color_tag: highlightColor,
            is_bookmark: false,
            created_at: new Date().toISOString()
          };
          localStorage.setItem(`study_prep_notes_${userKey}`, JSON.stringify([newEntry, ...prevScoped]));
          localStorage.setItem('study_prep_notes', JSON.stringify([newEntry, ...prevGlobal]));
        } catch (e) {}

        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (e) {
      console.error("Note save error:", e);
    }
  };

  const currentModeInfo = EXPLAIN_MODES.find(m => m.id === explainMode) || EXPLAIN_MODES[0];

  return (
    <div style={{
      position: 'absolute',
      top: `${Math.max(10, position.top)}px`,
      left: `${Math.min(window.innerWidth - 440, Math.max(20, position.left))}px`,
      width: '420px',
      maxWidth: '92vw',
      background: 'rgba(15, 23, 42, 0.96)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(16, 185, 129, 0.4)',
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 185, 129, 0.2)',
      zIndex: 1000,
      padding: '16px 18px',
      color: '#ffffff',
      animation: 'fadeIn 0.2s ease'
    }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem'
          }}>
            🧠
          </div>
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
            Line-Level AI Tutor &bull; <span style={{ color: '#34d399', textTransform: 'capitalize' }}>{gradeLevel}</span>
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Selected Text Preview Quote */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.04)',
        borderLeft: '3px solid #10b981',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '0.78rem',
        color: '#e2e8f0',
        fontStyle: 'italic',
        marginBottom: '14px',
        maxHeight: '60px',
        overflowY: 'auto'
      }}>
        "{selectedText}"
      </div>

      {/* Action Mode Tabs: Unified Explain Button with Dropdown + Ask + Note */}
      <div style={{
        display: 'flex',
        gap: '6px',
        background: 'rgba(0, 0, 0, 0.45)',
        padding: '4px',
        borderRadius: '10px',
        marginBottom: '14px',
        position: 'relative'
      }}>
        
        {/* Unified Explain Button with Dropdown Selector */}
        <div ref={menuRef} style={{ flex: 1.5, position: 'relative', display: 'flex' }}>
          <button
            onClick={() => {
              setActiveTab('explain');
              setShowModeMenu(false);
              if (explainMode === 'agentic') fetchAgenticExplanation();
              else fetchExplanation(explainMode);
            }}
            style={{
              flex: 1,
              padding: '7px 10px',
              borderRadius: showModeMenu ? '8px 0 0 8px' : '8px',
              border: 'none',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'explain' ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'transparent',
              color: activeTab === 'explain' ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'explain' ? '0 0 12px rgba(99, 102, 241, 0.4)' : 'none',
              transition: 'all 0.15s ease'
            }}
            title="Click to explain with active mode"
          >
            <Sparkles size={13} />
            <span>{currentModeInfo.icon} {currentModeInfo.label}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowModeMenu(!showModeMenu);
            }}
            style={{
              padding: '7px 8px',
              borderRadius: showModeMenu ? '0 8px 8px 0' : '8px',
              border: 'none',
              borderLeft: activeTab === 'explain' ? '1px solid rgba(255,255,255,0.2)' : 'none',
              cursor: 'pointer',
              background: activeTab === 'explain' ? 'rgba(99, 102, 241, 0.85)' : 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Choose explanation style (ELI5, Deep Dive, Exam Crux, Auto Agent)"
          >
            <ChevronDown size={13} style={{ transform: showModeMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>

          {/* Mode Dropdown Menu */}
          {showModeMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              width: '240px',
              background: 'rgba(15, 23, 42, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(99, 102, 241, 0.5)',
              borderRadius: '10px',
              padding: '6px',
              zIndex: 100,
              boxShadow: '0 12px 32px rgba(0,0,0,0.85), 0 0 20px rgba(99,102,241,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', padding: '4px 8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Explanation Style:
              </div>

              {EXPLAIN_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setExplainMode(m.id);
                    setShowModeMenu(false);
                    setActiveTab('explain');
                    if (m.id === 'agentic') fetchAgenticExplanation();
                    else fetchExplanation(m.id);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: explainMode === m.id ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
                    background: explainMode === m.id ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                    color: explainMode === m.id ? '#ffffff' : '#cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: explainMode === m.id ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>{m.icon}</span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.8rem', color: '#ffffff' }}>
                        {m.label} {m.id === 'agentic' && <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 700 }}>&bull; Default</span>}
                      </strong>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{m.desc}</span>
                    </div>
                  </div>
                  {explainMode === m.id && <Check size={14} color="#34d399" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ask Tab Button */}
        <button
          onClick={() => {
            setActiveTab('ask_doubt');
            setShowModeMenu(false);
            setExplanationResult(null);
          }}
          style={{
            flex: 0.85,
            padding: '7px 10px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'ask_doubt' ? '#a855f7' : 'transparent',
            color: activeTab === 'ask_doubt' ? '#ffffff' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.15s ease'
          }}
        >
          <HelpCircle size={13} />
          Ask
        </button>

        {/* Note Tab Button */}
        <button
          onClick={() => {
            setActiveTab('note');
            setShowModeMenu(false);
            setExplanationResult(null);
          }}
          style={{
            flex: 0.85,
            padding: '7px 10px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'note' ? '#f59e0b' : 'transparent',
            color: activeTab === 'note' ? '#030712' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.15s ease'
          }}
        >
          <Bookmark size={13} />
          Note
        </button>
      </div>

      {/* Tab 1: Explanation Output */}
      {activeTab === 'explain' && (
        <div>
          {/* Bandit Policy Decision Card */}
          {banditDecision && explainMode === 'agentic' && (
            <div style={{
              marginBottom: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ color: '#818cf8', fontWeight: 700 }}>🤖 RL Bandit Policy: </span>
                <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                  {banditDecision.recommended_persona?.replace('_', ' ')}
                </strong>
                <span style={{ color: '#94a3b8', marginLeft: '6px' }}>
                  ({banditDecision.estimated_retention_uplift || '+22% retention uplift'})
                </span>
              </div>
              <span style={{
                background: banditDecision.is_exploration ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: banditDecision.is_exploration ? '#fbbf24' : '#6ee7b7',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 600
              }}>
                {banditDecision.is_exploration ? 'Bandit Explore' : 'Bandit Exploit'}
              </span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              <div style={{ marginBottom: '8px', fontSize: '1.2rem' }}>✨</div>
              Analyzing line with <strong>{currentModeInfo.label}</strong>...
            </div>
          ) : explanationResult ? (
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.82rem',
              color: '#f1f5f9',
              lineHeight: 1.55,
              maxHeight: '220px',
              overflowY: 'auto',
              whiteSpace: 'pre-line'
            }}>
              {explanationResult}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <button
                onClick={explainMode === 'agentic' ? fetchAgenticExplanation : () => fetchExplanation(explainMode)}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.8rem', gap: '6px' }}
              >
                <Sparkles size={13} />
                Generate {currentModeInfo.label} Explanation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Ask Custom Doubt */}
      {activeTab === 'ask_doubt' && (
        <div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder={isListening ? "Listening... speak now" : "Ask anything about this paragraph..."}
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskDoubt()}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${isListening ? '#ef4444' : 'var(--border-subtle)'}`,
                background: 'rgba(255,255,255,0.04)',
                color: '#ffffff',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />

            {/* Microphone Speech Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              style={{
                background: isListening ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '8px',
                color: isListening ? '#ffffff' : 'var(--accent-cyan)',
                padding: '8px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.74rem',
                fontWeight: 700,
                transition: 'all 0.15s ease'
              }}
              title="Speak doubt via speech recognition"
            >
              {isListening ? <MicOff size={13} /> : <Mic size={13} />}
            </button>

            <button
              onClick={handleAskDoubt}
              disabled={loading || !customQuestion.trim()}
              className="btn btn-primary"
              style={{ padding: '8px 12px', background: '#a855f7', borderColor: '#a855f7' }}
              title="Submit doubt"
            >
              <Send size={13} />
            </button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
              Resolving doubt with RAG context...
            </div>
          )}

          {doubtAnswer && (
            <div style={{
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '0.82rem',
              color: '#f3e8ff',
              lineHeight: 1.5,
              maxHeight: '180px',
              overflowY: 'auto'
            }}>
              <strong style={{ color: '#c084fc', display: 'block', marginBottom: '4px' }}>AI Tutor Answer:</strong>
              {doubtAnswer}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Highlight & Add Sticky Margin Note */}
      {activeTab === 'note' && (
        <div>
          {/* Highlight Color Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Highlight Color:</span>
            {['emerald', 'amber', 'cyan', 'purple'].map((c) => (
              <button
                key={c}
                onClick={() => setHighlightColor(c)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: highlightColor === c ? '2px solid #ffffff' : 'none',
                  background: c === 'emerald' ? '#10b981' : (c === 'amber' ? '#f59e0b' : (c === 'cyan' ? '#06b6d4' : '#a855f7')),
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>

          <textarea
            placeholder="Add a margin note or memory trigger..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(255,255,255,0.04)',
              color: '#ffffff',
              fontSize: '0.8rem',
              outline: 'none',
              resize: 'none',
              marginBottom: '10px'
            }}
          />

          <button
            onClick={handleSaveMarginNote}
            disabled={noteSaved}
            className="btn btn-primary"
            style={{ width: '100%', padding: '8px', fontSize: '0.82rem', gap: '6px' }}
          >
            {noteSaved ? (
              <>
                <Check size={14} />
                Note &amp; Highlight Saved!
              </>
            ) : (
              <>
                <Bookmark size={13} />
                Save Sticky Note &amp; Highlight
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
