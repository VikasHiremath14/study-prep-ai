import React, { useState } from 'react';
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
  Highlighter,
  Mic,
  MicOff
} from 'lucide-react';

export default function LineLevelPopover({
  selectedText,
  pageNumber,
  documentId,
  documentTitle = "Academic Textbook",
  gradeLevel = "engineering",
  position = { top: 100, left: 200 },
  onClose,
  onSaveNote
}) {
  const [activeTab, setActiveTab] = useState('eli5'); // 'eli5' | 'deep_dive' | 'exam_crux' | 'ask_doubt' | 'note'
  const [loading, setLoading] = useState(false);
  const [explanationResult, setExplanationResult] = useState(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [doubtAnswer, setDoubtAnswer] = useState(null);
  const [noteContent, setNoteContent] = useState("");
  const [highlightColor, setHighlightColor] = useState("emerald"); // emerald, amber, cyan, purple
  const [noteSaved, setNoteSaved] = useState(false);

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
        console.error("Speech recognition error:", event.error);
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

  const fetchExplanation = async (mode) => {
    setActiveTab(mode);
    setLoading(true);
    setExplanationResult(null);
    try {
      const res = await fetch('/api/reader/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId || 1,
          page_number: pageNumber,
          selected_text: selectedText,
          grade_level: gradeLevel,
          mode: mode,
          document_title: documentTitle
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
          question: customQuestion.trim(),
          grade_level: gradeLevel,
          document_title: documentTitle
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
      const res = await fetch('/api/reader/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId || 1,
          page_number: pageNumber,
          selected_text: selectedText,
          note_text: noteContent.trim() || "Highlighted Key Excerpt",
          color_tag: highlightColor
        })
      });

      if (res.ok) {
        const data = await res.json();
        setNoteSaved(true);
        if (onSaveNote) onSaveNote(data);

        // Update local storage so student records modal is immediately updated
        try {
          const prev = JSON.parse(localStorage.getItem('study_prep_notes') || '[]');
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
          localStorage.setItem('study_prep_notes', JSON.stringify([newEntry, ...prev]));
        } catch (e) {}

        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (e) {
      console.error("Note save error:", e);
    }
  };

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

      {/* Action Mode Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: '3px',
        borderRadius: '8px',
        marginBottom: '14px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => fetchExplanation('eli5')}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'eli5' ? '#10b981' : 'transparent',
            color: activeTab === 'eli5' ? '#030712' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Lightbulb size={12} />
          ELI5
        </button>

        <button
          onClick={() => fetchExplanation('deep_dive')}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'deep_dive' ? '#06b6d4' : 'transparent',
            color: activeTab === 'deep_dive' ? '#030712' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <BookOpen size={12} />
          Deep Dive
        </button>

        <button
          onClick={() => fetchExplanation('exam_crux')}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'exam_crux' ? '#fbbf24' : 'transparent',
            color: activeTab === 'exam_crux' ? '#030712' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Zap size={12} />
          Exam Crux
        </button>

        <button
          onClick={() => { setActiveTab('ask_doubt'); setExplanationResult(null); }}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'ask_doubt' ? '#a855f7' : 'transparent',
            color: activeTab === 'ask_doubt' ? '#ffffff' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <HelpCircle size={12} />
          Ask
        </button>

        <button
          onClick={() => { setActiveTab('note'); setExplanationResult(null); }}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'note' ? '#f59e0b' : 'transparent',
            color: activeTab === 'note' ? '#030712' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Bookmark size={12} />
          Note
        </button>
      </div>

      {/* Tab 1, 2, 3: Explanation Output */}
      {(activeTab === 'eli5' || activeTab === 'deep_dive' || activeTab === 'exam_crux') && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              ✨ Grounding line against textbook vector chunks...
            </div>
          ) : explanationResult ? (
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              color: '#f1f5f9',
              lineHeight: 1.5,
              maxHeight: '220px',
              overflowY: 'auto',
              whiteSpace: 'pre-line'
            }}>
              {explanationResult}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <button
                onClick={() => fetchExplanation(activeTab)}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.8rem', gap: '6px' }}
              >
                <Sparkles size={13} />
                Generate {activeTab.replace('_', ' ').toUpperCase()} Explanation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Ask Custom Doubt */}
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

      {/* Tab 5: Highlight & Add Sticky Margin Note */}
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
