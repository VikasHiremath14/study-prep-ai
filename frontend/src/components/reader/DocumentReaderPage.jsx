import React, { useState, useEffect, useRef } from 'react';
import LineLevelPopover from './LineLevelPopover';
import ReaderNotesSidebar from './ReaderNotesSidebar';
import DiagramLensModal from './DiagramLensModal';
import PageReferencesDrawer from './PageReferencesDrawer';
import AntiWebSearchQuizModal from './AntiWebSearchQuizModal';
import { 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  FileText, 
  Sun, 
  Moon, 
  Coffee, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Eye, 
  CheckCircle2, 
  Check, 
  Zap, 
  Clock, 
  Scan, 
  Youtube, 
  Globe, 
  Award, 
  Radio, 
  FileDown, 
  ZoomIn, 
  ZoomOut,
  FolderOpen,
  Compass,
  TrendingDown
} from 'lucide-react';

const THEMES = {
  dark: {
    name: "Cyber Dark",
    bg: "#090d16",
    sheetBg: "#0f172a",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    border: "rgba(255, 255, 255, 0.1)",
    accent: "#10b981",
    sheetShadow: "0 15px 45px rgba(0, 0, 0, 0.7)"
  },
  sepia: {
    name: "Sepia Parchment",
    bg: "#ede3cb",
    sheetBg: "#fbf6e9",
    text: "#2c2416",
    textMuted: "#6b5d4d",
    border: "rgba(107, 93, 77, 0.2)",
    accent: "#b45309",
    sheetShadow: "0 10px 35px rgba(44, 36, 22, 0.15)"
  },
  light: {
    name: "Clean Document Light",
    bg: "#e2e8f0",
    sheetBg: "#ffffff",
    text: "#0f172a",
    textMuted: "#64748b",
    border: "rgba(0, 0, 0, 0.12)",
    accent: "#0ea5e9",
    sheetShadow: "0 10px 35px rgba(0, 0, 0, 0.1)"
  }
};

const DEFAULT_FALLBACK_SLOTS = [
  { id: "slot-1", title: "📚 Data Structures & Algorithmic Analysis", type: "study", start: "07:15", end: "08:25", duration_minutes: 70 },
  { id: "slot-2", title: "📚 Operating Systems: Three Easy Pieces", type: "study", start: "08:40", end: "09:35", duration_minutes: 55 },
  { id: "slot-3", title: "📚 Advanced Mathematics & Calculus", type: "study", start: "14:00", end: "14:50", duration_minutes: 50 },
  { id: "slot-4", title: "📚 Computer Networks & Distributed Systems", type: "study", start: "15:15", end: "16:05", duration_minutes: 50 },
  { id: "slot-5", title: "📚 Active Recall & Flashcard Revision", type: "study", start: "21:30", end: "22:00", duration_minutes: 30 }
];

export default function DocumentReaderPage({
  documentData,
  allDocuments = [],
  timetableData,
  selectedSubjects = [],
  activeProfile,
  onBackToIngestion,
  onProceedToQuiz,
  onNavigateToWeakTopics
}) {
  const studentName = activeProfile?.name || activeProfile?.student_name || "Student";
  const gradeLevel = activeProfile?.grade_level || "engineering";
  const retentionScore = activeProfile?.profile?.retention_score != null ? activeProfile.profile.retention_score : 0.78;

  // Active documents catalog
  const availableDocs = allDocuments.length > 0 
    ? allDocuments 
    : (documentData ? [documentData] : []);

  // Currently active document selection
  const [selectedDocId, setSelectedDocId] = useState(() => {
    return availableDocs[0]?.id || availableDocs[0]?.document_id || 'primary';
  });

  // Current active doc data
  const currentDoc = availableDocs.find(d => (d.id || d.document_id) === selectedDocId) || availableDocs[0] || documentData || {};

  // Pages of current document
  const pages = currentDoc?.pages || [
    { page_number: 1, text: "Chapter 1: Asymptotic Analysis & Big-O Notation. The running time of an algorithm depends upon the input size and growth rate. Big-O defines the upper bound, Omega defines the lower bound, and Theta defines the tight asymptotic bound. Understanding cache locality and memory hierarchy is essential." },
    { page_number: 2, text: "Chapter 1.2: Amortized Complexity. Dynamic arrays double in size when capacity is reached. While a single reallocation takes O(N) time, the amortized cost across N insertions is strictly O(1)." }
  ];
  const totalPages = Math.max(1, pages.length);
  const docTitle = currentDoc?.title || "Academic Study Material";
  
  // Dynamic daily targets state
  const [targetsState, setTargetsState] = useState(() => {
    return currentDoc?.target_plan?.daily_targets || [
      { day_number: 1, start_page: 1, end_page: Math.min(4, totalPages), is_completed: false },
      { day_number: 2, start_page: Math.min(5, totalPages), end_page: Math.min(8, totalPages), is_completed: false },
      { day_number: 3, start_page: Math.min(9, totalPages), end_page: Math.min(12, totalPages), is_completed: false }
    ];
  });

  useEffect(() => {
    if (currentDoc?.target_plan?.daily_targets) {
      setTargetsState(currentDoc.target_plan.daily_targets);
    }
  }, [currentDoc]);

  // Reader Settings State
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [themeKey, setThemeKey] = useState('dark');
  const [zoomScale, setZoomScale] = useState(100);
  const [showNotesSidebar, setShowNotesSidebar] = useState(false);
  const [showLensModal, setShowLensModal] = useState(false);
  const [showReferencesDrawer, setShowReferencesDrawer] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [masteryToast, setMasteryToast] = useState(null);

  // Notes, Bookmarks & Doubts State
  const [notesList, setNotesList] = useState([]);
  const [doubtsList, setDoubtsList] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Line-Level Selection Popover State
  const [selectedText, setSelectedText] = useState("");
  const [popoverPosition, setPopoverPosition] = useState(null);
  const textContainerRef = useRef(null);

  // Live Local Clock & Timetable Auto-Sync State
  const [localTimeStr, setLocalTimeStr] = useState("");
  const [activeSlotInfo, setActiveSlotInfo] = useState(null);
  const [remainingSlotSeconds, setRemainingSlotSeconds] = useState(0);
  const [hasAutoMatchedInitialDoc, setHasAutoMatchedInitialDoc] = useState(false);

  const theme = THEMES[themeKey] || THEMES.dark;
  const currentPage = pages.find(p => p.page_number === currentPageNum) || pages[0] || { page_number: 1, text: "No content available on this page." };

  // Current Target info
  const activeTarget = targetsState.find(t => currentPageNum >= t.start_page && currentPageNum <= t.end_page) || targetsState[0];
  const isTargetCompleted = activeTarget && currentPageNum >= activeTarget.end_page;

  // Real-Time Local Laptop Clock & Timetable Slot Sync
  useEffect(() => {
    const slots = timetableData?.slots || DEFAULT_FALLBACK_SLOTS;

    const updateClockAndSlot = () => {
      const now = new Date();
      // Format local time
      const h = now.getHours();
      const m = now.getMinutes();
      const s = now.getSeconds();
      const hStr = h.toString().padStart(2, '0');
      const mStr = m.toString().padStart(2, '0');
      const sStr = s.toString().padStart(2, '0');
      setLocalTimeStr(`${hStr}:${mStr}:${sStr}`);

      const currentSecsInDay = h * 3600 + m * 60 + s;

      let matchedSlot = null;
      let nextStudySlot = null;

      for (const slot of slots) {
        if (!slot.start || !slot.end) continue;
        const [sh, sm] = slot.start.split(':').map(Number);
        const [eh, em] = slot.end.split(':').map(Number);
        
        let startSecs = sh * 3600 + sm * 60;
        let endSecs = eh * 3600 + em * 60;
        if (endSecs <= startSecs) endSecs += 86400; // overnight crossing

        if (currentSecsInDay >= startSecs && currentSecsInDay < endSecs) {
          matchedSlot = slot;
          const rem = Math.max(0, endSecs - currentSecsInDay);
          setRemainingSlotSeconds(rem);
          break;
        } else if (startSecs > currentSecsInDay && slot.type === 'study' && !nextStudySlot) {
          nextStudySlot = slot;
        }
      }

      if (matchedSlot) {
        setActiveSlotInfo({
          isActive: true,
          title: matchedSlot.title,
          type: matchedSlot.type,
          start: matchedSlot.start,
          end: matchedSlot.end,
          duration_minutes: matchedSlot.duration_minutes
        });

        // Auto-match document corresponding to this active slot on initial discovery
        if (!hasAutoMatchedInitialDoc && availableDocs.length > 0) {
          const slotTitleLower = matchedSlot.title.toLowerCase();
          const matchedDoc = availableDocs.find(d => {
            const docTitleLower = (d.title || "").toLowerCase();
            if (slotTitleLower.includes('data structure') || slotTitleLower.includes('dsa') || slotTitleLower.includes('algorithm')) {
              return docTitleLower.includes('data structure') || docTitleLower.includes('dsa') || docTitleLower.includes('algorithm');
            }
            if (slotTitleLower.includes('operating') || slotTitleLower.includes('os')) {
              return docTitleLower.includes('operating') || docTitleLower.includes('os');
            }
            if (slotTitleLower.includes('math') || slotTitleLower.includes('calculus')) {
              return docTitleLower.includes('math') || docTitleLower.includes('calculus');
            }
            if (slotTitleLower.includes('network')) {
              return docTitleLower.includes('network');
            }
            return docTitleLower.includes(slotTitleLower) || slotTitleLower.includes(docTitleLower);
          });

          if (matchedDoc) {
            setSelectedDocId(matchedDoc.id || matchedDoc.document_id);
          }
          setHasAutoMatchedInitialDoc(true);
        }

      } else {
        const upcoming = nextStudySlot || slots.find(s => s.type === 'study') || slots[0];
        setActiveSlotInfo({
          isActive: false,
          title: upcoming?.title || "Upcoming Study Block",
          type: upcoming?.type || "study",
          start: upcoming?.start || "08:00",
          end: upcoming?.end || "08:45",
          duration_minutes: upcoming?.duration_minutes || 45
        });
      }
    };

    updateClockAndSlot();
    const interval = setInterval(updateClockAndSlot, 1000);
    return () => clearInterval(interval);
  }, [timetableData, availableDocs, hasAutoMatchedInitialDoc]);

  // Fetch existing notes & doubts on mount / doc change
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const docId = currentDoc?.document_id || currentDoc?.id || 1;
        const res = await fetch(`/api/reader/notes/${docId}`);
        if (res.ok) {
          const data = await res.json();
          setNotesList(data.notes || []);
          setDoubtsList(data.doubts || []);
        }
      } catch (e) {
        console.error("Notes fetch error:", e);
      }
    };
    fetchNotes();
  }, [selectedDocId, currentDoc]);

  // Update bookmark status on page change
  useEffect(() => {
    const hasBm = notesList.some(n => n.page_number === currentPageNum && n.is_bookmark);
    setIsBookmarked(hasBm);
  }, [currentPageNum, notesList]);

  // Handle Text Selection for Line-Level Tutor
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (text.length > 3) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setPopoverPosition({
        top: window.scrollY + rect.bottom + 10,
        left: rect.left
      });
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPageNum(newPage);
      setSelectedText("");
      setPopoverPosition(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSwitchDoc = (docId) => {
    setSelectedDocId(docId);
    setCurrentPageNum(1);
    setSelectedText("");
    setPopoverPosition(null);
  };

  const handleToggleBookmark = async () => {
    try {
      const docId = currentDoc?.document_id || currentDoc?.id || 1;
      const res = await fetch('/api/reader/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: docId,
          page_number: currentPageNum
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsBookmarked(data.is_bookmarked);
        const updatedRes = await fetch(`/api/reader/notes/${docId}`);
        if (updatedRes.ok) {
          const list = await updatedRes.json();
          setNotesList(list.notes || []);
        }
      }
    } catch (e) {
      console.error("Bookmark toggle error:", e);
    }
  };

  const formatRemainingSeconds = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.text,
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Top Floating Control Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: themeKey === 'dark' ? 'rgba(10, 13, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${theme.border}`,
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        
        {/* Left: Back & Document Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBackToIngestion}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
          >
            <ArrowLeft size={14} />
            Phase 3: Materials
          </button>
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: theme.text }}>
              {docTitle}
            </h4>
            <span style={{ fontSize: '0.72rem', color: theme.textMuted }}>
              PDF Page {currentPageNum} of {totalPages} &bull; Target Day {activeTarget?.day_number || 1} (Pages {activeTarget?.start_page}-{activeTarget?.end_page})
            </span>
          </div>
        </div>

        {/* Center: Live Real-Time Laptop Clock & Timetable Slot Tracker */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '6px 16px',
          borderRadius: '100px',
          border: `1px solid ${activeSlotInfo?.isActive ? 'rgba(16, 185, 129, 0.5)' : theme.border}`,
          boxShadow: activeSlotInfo?.isActive ? '0 0 18px rgba(16, 185, 129, 0.25)' : 'none'
        }}>
          {/* Local Laptop Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={14} color={activeSlotInfo?.isActive ? '#10b981' : 'var(--accent-cyan)'} />
            <span style={{ fontFamily: 'monospace', fontSize: '0.94rem', fontWeight: 800, color: '#ffffff' }}>
              {localTimeStr || "15:33:00"}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Local</span>
          </div>

          <div style={{ height: '14px', width: '1px', background: 'rgba(255,255,255,0.15)' }} />

          {/* Timetable Slot Status & Exact Real-Time Countdown */}
          <div style={{ fontSize: '0.76rem', color: activeSlotInfo?.isActive ? '#34d399' : 'var(--text-dim)' }}>
            {activeSlotInfo?.isActive ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🟢 Active Slot: <strong>{activeSlotInfo.start}&ndash;{activeSlotInfo.end}</strong></span>
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  color: remainingSlotSeconds < 300 ? '#f87171' : '#ffffff',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  ⏱️ {formatRemainingSeconds(remainingSlotSeconds)} left
                </span>
              </span>
            ) : (
              <span>
                Next Study Block: <strong>{activeSlotInfo?.start}&ndash;{activeSlotInfo?.end}</strong> ({activeSlotInfo?.title?.replace('📚', '').trim()})
              </span>
            )}
          </div>
        </div>

        {/* Right: Tools, Quiz, & Themes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Diagram Lens Scanner Button */}
          <button
            onClick={() => setShowLensModal(true)}
            className="btn btn-secondary"
            style={{
              padding: '6px 11px',
              fontSize: '0.76rem',
              gap: '6px',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              color: '#34d399'
            }}
            title="Scan & explain diagrams, formulas, or charts"
          >
            <Scan size={14} />
            Diagram Lens
          </button>

          {/* Outside References Drawer Button */}
          <button
            onClick={() => setShowReferencesDrawer(true)}
            className="btn btn-secondary"
            style={{
              padding: '6px 11px',
              fontSize: '0.76rem',
              gap: '6px',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: '#f87171'
            }}
            title="View curated YouTube lessons and web resources"
          >
            <Youtube size={14} />
            References
          </button>

          {/* Weak Topics Recommender Button */}
          {onNavigateToWeakTopics && (
            <button
              onClick={onNavigateToWeakTopics}
              className="btn btn-secondary"
              style={{
                padding: '6px 11px',
                fontSize: '0.76rem',
                gap: '6px',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#f87171'
              }}
              title="View Weak-Topic Recommender & Spaced Reviews"
            >
              <TrendingDown size={14} />
              Weak Spots
            </button>
          )}

          {/* Anti-Web Search Active Recall Quiz Button */}
          <button
            onClick={() => setShowQuizModal(true)}
            className="btn btn-primary"
            style={{
              padding: '6px 12px',
              fontSize: '0.76rem',
              gap: '6px',
              background: isTargetCompleted ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
              boxShadow: isTargetCompleted ? '0 0 15px rgba(245, 158, 11, 0.4)' : 'none'
            }}
          >
            <Award size={14} />
            {isTargetCompleted ? "🎯 Mastery Quiz!" : "Active Quiz"}
          </button>

          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            className="btn btn-secondary"
            style={{
              padding: '6px 10px',
              fontSize: '0.76rem',
              gap: '4px',
              color: isBookmarked ? '#fbbf24' : theme.textMuted,
              borderColor: isBookmarked ? '#fbbf24' : theme.border
            }}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark this page"}
          >
            <Bookmark size={13} fill={isBookmarked ? "#fbbf24" : "none"} />
            {isBookmarked ? "Saved" : "Mark"}
          </button>

          {/* Zoom Scaling */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
            <button
              onClick={() => setZoomScale(Math.max(85, zoomScale - 10))}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', padding: '3px 6px', cursor: 'pointer' }}
              title="Zoom out"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '0.68rem', color: theme.textMuted, padding: '0 4px', fontFamily: 'monospace' }}>
              {zoomScale}%
            </span>
            <button
              onClick={() => setZoomScale(Math.min(140, zoomScale + 10))}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', padding: '3px 6px', cursor: 'pointer' }}
              title="Zoom in"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Theme Selector */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
            <button
              onClick={() => setThemeKey('dark')}
              style={{ padding: '3px 7px', border: 'none', borderRadius: '5px', background: themeKey === 'dark' ? '#10b981' : 'transparent', color: themeKey === 'dark' ? '#030712' : '#94a3b8', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
              title="Cyber Dark"
            >
              Dark
            </button>
            <button
              onClick={() => setThemeKey('sepia')}
              style={{ padding: '3px 7px', border: 'none', borderRadius: '5px', background: themeKey === 'sepia' ? '#f59e0b' : 'transparent', color: themeKey === 'sepia' ? '#030712' : '#94a3b8', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
              title="Sepia Parchment"
            >
              Sepia
            </button>
            <button
              onClick={() => setThemeKey('light')}
              style={{ padding: '3px 7px', border: 'none', borderRadius: '5px', background: themeKey === 'light' ? '#0ea5e9' : 'transparent', color: themeKey === 'light' ? '#ffffff' : '#94a3b8', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
              title="Clean Light"
            >
              Light
            </button>
          </div>

          {/* Notes Sidebar Button */}
          <button
            onClick={() => setShowNotesSidebar(!showNotesSidebar)}
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.76rem', gap: '4px' }}
          >
            <FileText size={13} />
            Notes ({notesList.length})
          </button>
        </div>

      </header>

      {/* SUB-HEADER: TODAY'S SCHEDULED MATERIALS TABS (Multi-Document Switcher) */}
      {availableDocs.length > 1 && (
        <div style={{
          background: themeKey === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(241, 245, 249, 0.85)',
          borderBottom: `1px solid ${theme.border}`,
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          overflowX: 'auto'
        }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <FolderOpen size={13} color="var(--primary-light)" />
            Today's Materials:
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {availableDocs.map((doc, dIdx) => {
              const dId = doc.id || doc.document_id || `doc_${dIdx}`;
              const isSelected = (currentDoc?.id || currentDoc?.document_id) === dId;
              
              // Check if this document matches the active timetable slot
              const isScheduledNow = activeSlotInfo?.isActive && (
                (activeSlotInfo.title.toLowerCase().includes('data') && doc.title.toLowerCase().includes('data')) ||
                (activeSlotInfo.title.toLowerCase().includes('operating') && doc.title.toLowerCase().includes('operating')) ||
                (activeSlotInfo.title.toLowerCase().includes('math') && doc.title.toLowerCase().includes('math')) ||
                (activeSlotInfo.title.toLowerCase().includes('network') && doc.title.toLowerCase().includes('network'))
              );

              return (
                <button
                  key={dId}
                  onClick={() => handleSwitchDoc(dId)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '100px',
                    border: isSelected 
                      ? '1px solid var(--primary)' 
                      : (isScheduledNow ? '1px solid rgba(16, 185, 129, 0.4)' : `1px solid ${theme.border}`),
                    background: isSelected 
                      ? 'rgba(99, 102, 241, 0.2)' 
                      : (isScheduledNow ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)'),
                    color: isSelected ? '#ffffff' : (isScheduledNow ? '#34d399' : theme.textMuted),
                    fontSize: '0.76rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{doc.icon || '📄'}</span>
                  <span>{doc.title}</span>
                  {isScheduledNow && (
                    <span style={{ fontSize: '0.62rem', background: '#10b981', color: '#030712', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                      Scheduled Now
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Reader Canvas */}
      <main 
        onMouseUp={handleMouseUp}
        style={{
          flex: 1,
          maxWidth: '920px',
          width: '100%',
          margin: '0 auto',
          padding: '28px 24px 80px 24px',
          position: 'relative'
        }}
      >
        {/* Celebratory Mastery Toast Banner */}
        {masteryToast && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
            animation: 'fadeIn 0.3s ease',
            fontWeight: 700,
            fontSize: '0.88rem'
          }}>
            <span>{masteryToast}</span>
            <button
              onClick={() => setMasteryToast(null)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Daily Target Banner */}
        <div style={{
          background: theme.sheetBg,
          border: `1px solid ${activeTarget?.is_completed ? 'rgba(16, 185, 129, 0.4)' : theme.border}`,
          borderRadius: '14px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: activeTarget?.is_completed ? '0 0 20px rgba(16, 185, 129, 0.15)' : theme.sheetShadow
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: activeTarget?.is_completed ? '#34d399' : theme.accent, letterSpacing: '0.04em' }}>
                Day {activeTarget?.day_number || 1} Target: Pages {activeTarget?.start_page} to {activeTarget?.end_page}
              </span>
              {activeTarget?.is_completed && (
                <span style={{
                  fontSize: '0.68rem',
                  padding: '1px 7px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  fontWeight: 700
                }}>
                  ✓ Mastered
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: theme.textMuted }}>
              Paced for {Math.round(retentionScore * 100)}% retention profile &bull; {totalPages - currentPageNum} pages remaining in chapter
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowQuizModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isTargetCompleted 
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)' 
                  : (activeTarget?.is_completed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)'),
                border: activeTarget?.is_completed ? '1px solid #10b981' : 'none',
                color: '#ffffff',
                padding: '7px 15px',
                borderRadius: '100px',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: isTargetCompleted ? '0 0 18px rgba(245, 158, 11, 0.45)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Award size={14} color={activeTarget?.is_completed ? '#34d399' : '#ffffff'} />
              {isTargetCompleted ? "Target Reached • Take Active Recall Quiz" : (activeTarget?.is_completed ? "Review Active Recall" : "Active Recall & Feynman Studio")}
            </button>
          </div>
        </div>

        {/* Realistic PDF Page Sheet Layout (A4 Sheet Aspect Ratio) */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          perspective: '1000px'
        }}>
          <article
            ref={textContainerRef}
            style={{
              width: '100%',
              maxWidth: `${780 * (zoomScale / 100)}px`,
              background: theme.sheetBg,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '52px 64px 60px 64px',
              boxShadow: theme.sheetShadow,
              minHeight: `${960 * (zoomScale / 100)}px`,
              position: 'relative',
              userSelect: 'text',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Top Page Header / Document Title */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '28px',
                borderBottom: `1px solid ${theme.border}`,
                paddingBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.74rem',
                    color: theme.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 800
                  }}>
                    {currentPage.document_title || docTitle}
                  </span>
                  <span className="badge badge-primary" style={{ fontSize: '0.64rem', padding: '1px 6px' }}>
                    PDF Page Sheet
                  </span>
                </div>
                <span style={{
                  fontSize: '0.78rem',
                  color: theme.accent,
                  fontWeight: 800,
                  fontFamily: 'monospace'
                }}>
                  PAGE {currentPageNum} / {totalPages}
                </span>
              </div>

              {/* Formatted Page Content */}
              <div style={{
                fontSize: `${16.5 * (zoomScale / 100)}px`,
                lineHeight: 1.8,
                color: theme.text,
                textAlign: 'justify',
                fontFamily: themeKey === 'sepia' ? 'Georgia, serif' : 'var(--font-sans)',
                letterSpacing: '0.01em'
              }}>
                {(currentPage.text || "No text found on this page.").split('\n').map((paragraph, pIdx) => (
                  <p key={pIdx} style={{ marginBottom: '22px' }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Bottom Page Number Stamp & Watermark */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '40px',
              paddingTop: '16px',
              borderTop: `1px solid ${theme.border}`,
              fontSize: '0.75rem',
              color: theme.textMuted
            }}>
              <span>StudyPrep.AI Structured Curriculum</span>
              <strong style={{ fontFamily: 'monospace' }}>&bull; Page {currentPageNum} of {totalPages} &bull;</strong>
              <span>Confidential &bull; Academic Prep</span>
            </div>
          </article>
        </div>

        {/* Bottom Navigation & Page Slider Bar */}
        <div style={{
          marginTop: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={() => handlePageChange(currentPageNum - 1)}
            disabled={currentPageNum <= 1}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', gap: '6px', fontSize: '0.84rem' }}
          >
            <ChevronLeft size={16} />
            Previous Page
          </button>

          {/* Page Slider */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="range"
              min="1"
              max={totalPages}
              value={currentPageNum}
              onChange={(e) => handlePageChange(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: theme.accent }}
            />
          </div>

          <button
            onClick={() => handlePageChange(currentPageNum + 1)}
            disabled={currentPageNum >= totalPages}
            className="btn btn-primary"
            style={{ padding: '8px 16px', gap: '6px', fontSize: '0.84rem' }}
          >
            Next Page
            <ChevronRight size={16} />
          </button>
        </div>

      </main>

      {/* Floating Line-Level AI Popover Tutor */}
      {selectedText && popoverPosition && (
        <LineLevelPopover
          selectedText={selectedText}
          pageNumber={currentPageNum}
          documentId={currentPage.document_id || currentDoc?.document_id || 1}
          documentTitle={currentPage.document_title || docTitle}
          gradeLevel={gradeLevel}
          position={popoverPosition}
          onClose={() => {
            setSelectedText("");
            setPopoverPosition(null);
          }}
          onSaveNote={(newNote) => {
            setNotesList((prev) => [...prev, newNote]);
          }}
        />
      )}

      {/* Diagram Lens Scanner Modal */}
      <DiagramLensModal
        isOpen={showLensModal}
        onClose={() => setShowLensModal(false)}
        documentId={currentPage.document_id || currentDoc?.document_id || 1}
        pageNumber={currentPageNum}
        documentTitle={currentPage.document_title || docTitle}
        gradeLevel={gradeLevel}
      />

      {/* Page References Drawer */}
      <PageReferencesDrawer
        isOpen={showReferencesDrawer}
        onClose={() => setShowReferencesDrawer(false)}
        documentId={currentPage.document_id || currentDoc?.document_id || 1}
        pageNumber={currentPageNum}
        pageText={currentPage.text || ""}
        documentTitle={currentPage.document_title || docTitle}
      />

      {/* Anti-Web Search Active Recall Quiz Modal */}
      <AntiWebSearchQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        documentId={currentDoc?.document_id || 1}
        dayNumber={activeTarget?.day_number || 1}
        documentTitle={docTitle}
        pageStart={activeTarget?.start_page || 1}
        pageEnd={activeTarget?.end_page || Math.min(4, totalPages)}
        pagesText={pages.map(p => p.text)}
        gradeLevel={gradeLevel}
        onProceedNextDay={() => {
          setShowQuizModal(false);
          const currentDay = activeTarget?.day_number || 1;
          // Mark active target as completed
          setTargetsState(prev => prev.map(t => 
            t.day_number === currentDay ? { ...t, is_completed: true } : t
          ));
          const nextDayStart = (activeTarget?.end_page || 4) + 1;
          if (nextDayStart <= totalPages) {
            handlePageChange(nextDayStart);
          }
          setMasteryToast(`🎉 Day ${currentDay} Target Mastered! Automatically advanced to Day ${currentDay + 1} reading target.`);
          setTimeout(() => setMasteryToast(null), 6000);
        }}
      />

      {/* Notes & Doubts Sidebar Drawer */}
      <ReaderNotesSidebar
        isOpen={showNotesSidebar}
        onClose={() => setShowNotesSidebar(false)}
        documentTitle={docTitle}
        notes={notesList}
        doubts={doubtsList}
        onJumpToPage={(pNum) => {
          handlePageChange(pNum);
          setShowNotesSidebar(false);
        }}
      />

    </div>
  );
}
