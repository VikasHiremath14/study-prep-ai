import React, { useState, useRef } from 'react';
import { 
  Scan, 
  Upload, 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Check, 
  HelpCircle, 
  Send, 
  Mic, 
  MicOff, 
  Eye, 
  Layers, 
  Zap, 
  FileText 
} from 'lucide-react';

const SAMPLE_DIAGRAMS = [
  {
    id: "avl_rotation",
    title: "AVL Tree LR Double Rotation",
    description: "Binary Tree node 20 with left child 10 and right child 15 undergoing Left-Right Double Rotation",
    tag: "Tree Balancing",
    icon: "🌳"
  },
  {
    id: "tlb_paging",
    title: "Virtual Memory TLB Translation",
    description: "Virtual Address (VPN + Offset) lookup in Translation Lookaside Buffer (TLB) and multi-level page table fallback",
    tag: "Operating Systems",
    icon: "💾"
  },
  {
    id: "knapsack_dp",
    title: "0/1 Knapsack DP State Table",
    description: "2D Dynamic Programming table showing item inclusion vs exclusion recurrence relation DP[i][w] = max(DP[i-1][w], DP[i-1][w-wt[i]] + val[i])",
    tag: "Dynamic Programming",
    icon: "📊"
  }
];

export default function DiagramLensModal({
  isOpen,
  onClose,
  documentId = 1,
  pageNumber = 1,
  documentTitle = "Academic Textbook",
  gradeLevel = "engineering"
}) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imageDescription, setImageDescription] = useState("");
  const [studentQuestion, setStudentQuestion] = useState("What is this diagram and explain its core components, mechanics, and exam pitfalls?");
  const [isLoading, setIsLoading] = useState(false);
  const [lensResult, setLensResult] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle local image file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setImageDescription(`Uploaded diagram snapshot: ${file.name}`);
    }
  };

  // Handle choosing a sample diagram preset
  const handleSelectSample = (sample) => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setImageDescription(sample.description);
    setStudentQuestion(`Explain the mechanics and invariants shown in this ${sample.title} diagram.`);
  };

  // Web Speech API for voice doubt
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
        setStudentQuestion(transcript);
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

  // Call Lens Explain API
  const handleAnalyzeDiagram = async () => {
    setIsLoading(true);
    setLensResult(null);

    try {
      const res = await fetch('/api/reader/lens-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId,
          page_number: pageNumber,
          image_description: imageDescription || "Academic Diagram / Chart",
          student_question: studentQuestion.trim(),
          grade_level: gradeLevel,
          document_title: documentTitle
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLensResult(data);
      } else {
        setLensResult({
          explanation: "Could not analyze diagram. Please verify backend service."
        });
      }
    } catch (err) {
      console.error("Lens error:", err);
      setLensResult({
        explanation: "Network error while connecting to Diagram Lens Agent."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.82)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      animation: 'fadeIn 0.2s ease'
    }}>
      
      <div style={{
        width: '100%',
        maxWidth: '820px',
        maxHeight: '90vh',
        background: 'linear-gradient(135deg, #0b1120 0%, #0f172a 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(16, 185, 129, 0.15)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#030712',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
            }}>
              <Scan size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
                AI Diagram Lens Scanner (Google Lens Style)
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Page {pageNumber} &bull; Multimodal visual breakdown for charts, trees, circuits &amp; formulas
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
              padding: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          
          {/* Upload Dropzone or Preset Selection */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            
            {/* Custom Image Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(16, 185, 129, 0.4)',
                borderRadius: '14px',
                padding: '20px',
                textAlign: 'center',
                background: 'rgba(16, 185, 129, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {imagePreviewUrl ? (
                <div>
                  <img
                    src={imagePreviewUrl}
                    alt="Diagram Snapshot"
                    style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '8px', marginBottom: '8px' }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700, display: 'block' }}>
                    ✓ Snapshot Loaded ({selectedImage?.name})
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', color: '#34d399' }}>
                    <Upload size={20} />
                  </div>
                  <strong style={{ fontSize: '0.86rem', color: '#ffffff', display: 'block', marginBottom: '2px' }}>
                    Upload Diagram Snapshot / Photo
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    PNG, JPG, WEBP &bull; Paste or click to browse
                  </span>
                </>
              )}
            </div>

            {/* Sample Diagrams Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Or select a textbook diagram:
              </span>
              {SAMPLE_DIAGRAMS.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectSample(s)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: imageDescription === s.description ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${imageDescription === s.description ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block' }}>
                      {s.title}
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {s.tag}
                    </span>
                  </div>
                  {imageDescription === s.description && (
                    <Check size={14} color="#34d399" />
                  )}
                </div>
              ))}
            </div>

          </div>

          {/* Question / Doubt Prompt Input with Voice Speech Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              What do you want the Diagram Lens to explain?
            </label>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: `1px solid ${isListening ? '#ef4444' : 'rgba(255, 255, 255, 0.12)'}`,
              borderRadius: '12px',
              padding: '6px 12px'
            }}>
              <input
                type="text"
                value={studentQuestion}
                onChange={(e) => setStudentQuestion(e.target.value)}
                placeholder={isListening ? "Listening... speak now" : "Ask about components, state transitions, or invariants..."}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  outline: 'none'
                }}
              />

              {/* Voice Speech Recognition Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                style={{
                  background: isListening ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '8px',
                  color: isListening ? '#ffffff' : 'var(--accent-cyan)',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  transition: 'all 0.15s ease'
                }}
                title="Click to speak your doubt via speech recognition"
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                {isListening ? "Listening..." : "Speech"}
              </button>

              <button
                onClick={handleAnalyzeDiagram}
                disabled={isLoading}
                className="btn btn-primary"
                style={{
                  padding: '6px 16px',
                  fontSize: '0.8rem',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
                }}
              >
                <Sparkles size={13} />
                {isLoading ? "Analyzing..." : "Scan & Explain"}
              </button>
            </div>
          </div>

          {/* Lens AI Result View */}
          {isLoading && (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '14px',
              color: 'var(--text-dim)',
              fontSize: '0.88rem'
            }}>
              ✨ Multimodal Lens Agent is decomposing diagram components, data transitions &amp; invariants...
            </div>
          )}

          {lensResult && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '0.86rem', fontWeight: 800 }}>
                <Check size={16} />
                Diagram Breakdown &amp; Invariant Analysis
              </div>

              <div style={{
                fontSize: '0.85rem',
                color: '#e2e8f0',
                lineHeight: 1.6,
                whiteSpace: 'pre-line'
              }}>
                {lensResult.explanation}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
