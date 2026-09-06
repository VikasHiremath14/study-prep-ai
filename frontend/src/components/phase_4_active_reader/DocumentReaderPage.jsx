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
  TrendingDown,
  LogOut
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
  currentUser,
  onOpenRecords,
  onLogout,
  onBackToIngestion,
  onProceedToQuiz,
  onNavigateToWeakTopics
}) {
  const studentName = activeProfile?.name || activeProfile?.student_name || currentUser?.name || currentUser?.email?.split('@')[0] || "Student";
  const gradeLevel = activeProfile?.grade_level || "engineering";
  const studentId = activeProfile?.id || activeProfile?.student_id || currentUser?.id || 1;
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
  const [nextSlotInfo, setNextSlotInfo] = useState(null);
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
      let nextSlot = null;

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
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
          nextSlot = slots[(i + 1) % slots.length];
          break;
        } else if (startSecs > currentSecsInDay && !nextSlot) {
          nextSlot = slot;
        }
      }

      if (!nextSlot && slots.length > 0) {
        nextSlot = slots[0];
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
          const slotTitleLower = (matchedSlot?.title || matchedSlot?.subject || "").toLowerCase();
          const matchedDoc = availableDocs.find(d => {
            const docTitleLower = (d?.title || "").toLowerCase();
            if (!docTitleLower) return false;
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
            return (docTitleLower && slotTitleLower && (docTitleLower.includes(slotTitleLower) || slotTitleLower.includes(docTitleLower)));
          });

          if (matchedDoc) {
            setSelectedDocId(matchedDoc.id || matchedDoc.document_id);
          }
          setHasAutoMatchedInitialDoc(true);
        }

      } else {
        const upcoming = nextSlot || slots.find(s => s.type === 'study') || slots[0];
        setActiveSlotInfo({
          isActive: false,
          title: upcoming?.title || "Upcoming Study Block",
          type: upcoming?.type || "study",
          start: upcoming?.start || "08:00",
          end: upcoming?.end || "08:45",
          duration_minutes: upcoming?.duration_minutes || 45
        });
      }

      if (nextSlot) {
        setNextSlotInfo({
          title: nextSlot.title || nextSlot.subject || "Study Block",
          type: nextSlot.type || "study",
          start: nextSlot.start,
          end: nextSlot.end,
          duration_minutes: nextSlot.duration_minutes || 45
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
          student_id: studentId || 1,
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

        // Sync bookmark to local storage for records modal (both user-scoped and global)
        try {
          const userKey = studentId || 'default';
          const prevScoped = JSON.parse(localStorage.getItem(`study_prep_notes_${userKey}`) || '[]');
          const prevGlobal = JSON.parse(localStorage.getItem('study_prep_notes') || '[]');
          if (data.is_bookmarked) {
            const bmEntry = {
              id: Date.now(),
              document_id: docId,
              document_title: docTitle,
              page_number: currentPageNum,
              selected_text: `Bookmarked Page ${currentPageNum} in ${docTitle}`,
              note_text: `Quick revision bookmark for Day ${activeTarget?.day_number || 1}`,
              is_bookmark: true,
              created_at: new Date().toISOString()
            };
            localStorage.setItem(`study_prep_notes_${userKey}`, JSON.stringify([bmEntry, ...prevScoped.filter(p => !(p.document_id === docId && p.page_number === currentPageNum && p.is_bookmark))]));
            localStorage.setItem('study_prep_notes', JSON.stringify([bmEntry, ...prevGlobal.filter(p => !(p.document_id === docId && p.page_number === currentPageNum && p.is_bookmark))]));
          } else {
            localStorage.setItem(`study_prep_notes_${userKey}`, JSON.stringify(prevScoped.filter(p => !(p.document_id === docId && p.page_number === currentPageNum && p.is_bookmark))));
            localStorage.setItem('study_prep_notes', JSON.stringify(prevGlobal.filter(p => !(p.document_id === docId && p.page_number === currentPageNum && p.is_bookmark))));
          }
        } catch (e) {}
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
      
      {/* TOP FLOATING NAVIGATION & CONTROL BAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: themeKey === 'dark' ? 'rgba(10, 13, 20, 0.96)' : 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${theme.border}`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        
        {/* TOP HEADER: COURSE MATERIALS (LEFT) + DOCUMENT CONTEXT + USER RECORDS & LOGOUT (RIGHT) */}
        <div style={{
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          width: '100%'
        }}>
          {/* Left: Back Button */}
          <button
            onClick={onBackToIngestion}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '6px', whiteSpace: 'nowrap' }}
          >
            <ArrowLeft size={14} />
            Course Materials
          </button>

          {/* Right: Active Document Breadcrumb + User Profile Records & Logout Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)'
            }}>
              <BookOpen size={14} color="var(--primary-light)" />
              <span style={{ fontWeight: 700, color: '#ffffff' }}>{docTitle}</span>
              <span>&bull;</span>
              <span style={{ color: '#38bdf8' }}>Page {currentPageNum} of {totalPages}</span>
            </div>

            {/* User Account Button (Opens Records Dashboard Modal) */}
            {currentUser && onOpenRecords && (
              <button
                type="button"
                onClick={onOpenRecords}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 14px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                title="Click to view all study records, retention reports, timetable & clear data"
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{studentName}</span>
                <span style={{ color: '#a5b4fc', fontSize: '0.74rem' }}>({gradeLevel})</span>
                <span style={{ 
                  fontSize: '0.72rem', 
                  background: 'rgba(255, 255, 255, 0.08)', 
                  padding: '1px 6px', 
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  Records 📋
                </span>
              </button>
            )}

            {/* Logout Button */}
            {currentUser && onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="btn btn-secondary"
                style={{
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
                title="Sign out of student workspace"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
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
          justifyContent: 'center',
          gap: '12px',
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
              const activeTitle = (activeSlotInfo?.title || "").toLowerCase();
              const docTitle = (doc?.title || "").toLowerCase();
              const isScheduledNow = activeSlotInfo?.isActive && activeTitle && docTitle && (
                (activeTitle.includes('data') && docTitle.includes('data')) ||
                (activeTitle.includes('operating') && docTitle.includes('operating')) ||
                (activeTitle.includes('math') && docTitle.includes('math')) ||
                (activeTitle.includes('network') && docTitle.includes('network')) ||
                (activeTitle.includes(docTitle) || docTitle.includes(activeTitle))
              );

              return (
                <button
                  key={dId}
                  onClick={() => handleSwitchDoc(dId)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '100px',
                    border: isSelected 
                      ? '1.5px solid var(--primary)' 
                      : (isScheduledNow ? '1.5px solid rgba(16, 185, 129, 0.5)' : `1px solid ${theme.border}`),
                    background: isSelected 
                      ? 'rgba(99, 102, 241, 0.25)' 
                      : (isScheduledNow ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)'),
                    color: isSelected ? '#ffffff' : (isScheduledNow ? '#34d399' : theme.textMuted),
                    fontSize: '0.76rem',
                    fontWeight: isSelected ? 800 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.3)' : 'none',
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

      {/* MAIN THREE-COLUMN CONTAINER: LEFT TOOLS + CENTER CANVAS + RIGHT TIMETABLE CLOCK CUBE */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '24px',
        width: '100%',
        padding: '20px 24px 80px 24px'
      }}>
        
        {/* LEFT SIDEBAR: 1st SS (TOOLS) + 2nd SS (DOC INFO BELOW IT) */}
        <aside style={{
          position: 'sticky',
          top: '76px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          width: '184px',
          flexShrink: 0,
          zIndex: 40
        }}>
          
          {/* 1st SS: VERTICAL TOOLS SNAKE DOCK */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.92)',
            padding: '16px 12px',
            borderRadius: '24px',
            border: '1.5px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.1)',
            backdropFilter: 'blur(16px)'
          }}>
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>⚡</span> Tools
            </div>

            {/* 1. Diagram Lens */}
            <button
              onClick={() => setShowLensModal(true)}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '0.76rem',
                gap: '6px',
                borderColor: 'rgba(16, 185, 129, 0.5)',
                color: '#34d399',
                borderRadius: '12px',
                justifyContent: 'center',
                background: 'rgba(16, 185, 129, 0.08)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
              title="Scan & explain diagrams, formulas, or charts"
            >
              <Scan size={14} />
              Diagram Lens
            </button>

            {/* Snake Connector Line */}
            <div style={{ width: '2px', height: '12px', background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.8), rgba(239, 68, 68, 0.8))', margin: '2px 0' }} />

            {/* 2. References */}
            <button
              onClick={() => setShowReferencesDrawer(true)}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '0.76rem',
                gap: '6px',
                borderColor: 'rgba(239, 68, 68, 0.5)',
                color: '#f87171',
                borderRadius: '12px',
                justifyContent: 'center',
                background: 'rgba(239, 68, 68, 0.08)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
              title="View curated YouTube lessons and web resources"
            >
              <Youtube size={14} />
              References
            </button>

            {/* Snake Connector Line */}
            <div style={{ width: '2px', height: '12px', background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.8), rgba(168, 85, 247, 0.8))', margin: '2px 0' }} />

            {/* 3. Active Quiz */}
            <button
              onClick={() => setShowQuizModal(true)}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '0.76rem',
                gap: '6px',
                borderRadius: '12px',
                justifyContent: 'center',
                background: isTargetCompleted ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                boxShadow: isTargetCompleted ? '0 0 15px rgba(245, 158, 11, 0.5)' : 'none'
              }}
            >
              <Award size={14} />
              {isTargetCompleted ? "🎯 Quiz!" : "Active Quiz"}
            </button>

            {/* Snake Connector Line */}
            <div style={{ width: '2px', height: '12px', background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.8), rgba(251, 191, 36, 0.8))', margin: '2px 0' }} />

            {/* 4. Bookmark */}
            <button
              onClick={handleToggleBookmark}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '0.76rem',
                gap: '6px',
                borderRadius: '12px',
                justifyContent: 'center',
                color: isBookmarked ? '#fbbf24' : theme.textMuted,
                borderColor: isBookmarked ? '#fbbf24' : theme.border,
                background: isBookmarked ? 'rgba(251, 191, 36, 0.12)' : 'rgba(255, 255, 255, 0.03)'
              }}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark this page"}
            >
              <Bookmark size={13} fill={isBookmarked ? "#fbbf24" : "none"} />
              {isBookmarked ? "Saved" : "Mark"}
            </button>

            {/* Snake Connector Line */}
            <div style={{ width: '2px', height: '12px', background: 'rgba(255, 255, 255, 0.2)', margin: '2px 0' }} />

            {/* 5. Zoom Scaling */}
            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.35)',
              padding: '4px 6px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`
            }}>
              <button
                onClick={() => setZoomScale(Math.max(85, zoomScale - 10))}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', padding: '2px 4px', cursor: 'pointer' }}
                title="Zoom out"
              >
                <ZoomOut size={13} />
              </button>
              <span style={{ fontSize: '0.68rem', color: theme.textMuted, fontFamily: 'monospace', fontWeight: 700 }}>
                {zoomScale}%
              </span>
              <button
                onClick={() => setZoomScale(Math.min(140, zoomScale + 10))}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', padding: '2px 4px', cursor: 'pointer' }}
                title="Zoom in"
              >
                <ZoomIn size={13} />
              </button>
            </div>

            {/* Snake Connector Line */}
            <div style={{ width: '2px', height: '12px', background: 'rgba(255, 255, 255, 0.2)', margin: '2px 0' }} />

            {/* 6. Theme Selector */}
            <div style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2px',
              background: 'rgba(0,0,0,0.35)',
              padding: '2px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`
            }}>
              <button
                onClick={() => setThemeKey('dark')}
                style={{ padding: '3px 0', border: 'none', borderRadius: '8px', background: themeKey === 'dark' ? '#10b981' : 'transparent', color: themeKey === 'dark' ? '#030712' : '#94a3b8', cursor: 'pointer', fontSize: '0.64rem', fontWeight: 800, textAlign: 'center' }}
                title="Cyber Dark"
              >
                Dark
              </button>
              <button
                onClick={() => setThemeKey('sepia')}
                style={{ padding: '3px 0', border: 'none', borderRadius: '8px', background: themeKey === 'sepia' ? '#f59e0b' : 'transparent', color: themeKey === 'sepia' ? '#030712' : '#94a3b8', cursor: 'pointer', fontSize: '0.64rem', fontWeight: 800, textAlign: 'center' }}
                title="Sepia Parchment"
              >
                Sepia
              </button>
              <button
                onClick={() => setThemeKey('light')}
                style={{ padding: '3px 0', border: 'none', borderRadius: '8px', background: themeKey === 'light' ? '#0ea5e9' : 'transparent', color: themeKey === 'light' ? '#ffffff' : '#94a3b8', cursor: 'pointer', fontSize: '0.64rem', fontWeight: 800, textAlign: 'center' }}
                title="Clean Light"
              >
                Light
              </button>
            </div>

            {/* Snake Connector Line */}
            <div style={{ width: '2px', height: '12px', background: 'rgba(255, 255, 255, 0.2)', margin: '2px 0' }} />

            {/* 7. Notes Sidebar Button */}
            <button
              onClick={() => setShowNotesSidebar(!showNotesSidebar)}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '0.76rem',
                gap: '5px',
                borderRadius: '12px',
                justifyContent: 'center',
                borderColor: showNotesSidebar ? '#38bdf8' : theme.border,
                color: showNotesSidebar ? '#38bdf8' : theme.text
              }}
            >
              <FileText size={13} />
              Notes ({notesList.length})
            </button>
          </div>

          {/* Snake Connector between 1st SS (Tools) and 2nd SS (Doc Info) */}
          <div style={{ width: '2px', height: '14px', background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.8), rgba(99, 102, 241, 0.8))' }} />

          {/* 2nd SS: DOCUMENT TITLE & PAGE INFO (POSITIONED DIRECTLY BELOW TOOLS) */}
          <div style={{
            width: '100%',
            padding: '12px 10px',
            background: 'rgba(15, 23, 42, 0.92)',
            borderRadius: '18px',
            border: '1.5px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(99, 102, 241, 0.1)',
            backdropFilter: 'blur(16px)',
            textAlign: 'center'
          }}>
            <h4 style={{
              fontSize: '0.84rem',
              fontWeight: 800,
              margin: '0 0 6px 0',
              color: '#ffffff',
              lineHeight: 1.3,
              wordBreak: 'break-word'
            }}>
              {docTitle}
            </h4>
            <div style={{
              fontSize: '0.72rem',
              color: theme.textMuted,
              lineHeight: 1.4
            }}>
              <span>PDF Page {currentPageNum} of {totalPages}</span>
              <div style={{ marginTop: '4px', color: '#38bdf8', fontWeight: 700 }}>
                Target Day {activeTarget?.day_number || 1} (pp. {activeTarget?.start_page}&ndash;{activeTarget?.end_page})
              </div>
            </div>
          </div>

        </aside>

        {/* MAIN READER CANVAS */}
        <main 
          onMouseUp={handleMouseUp}
          style={{
            flex: 1,
            maxWidth: '860px',
            minWidth: 0,
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

        {/* SNAKE / ZIGZAG CONNECTED PATHWAY ROADMAP (DAY TARGETS) */}
        <div style={{
          background: theme.sheetBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '16px',
          padding: '14px 20px',
          marginBottom: '22px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: theme.accent, letterSpacing: '0.04em' }}>
                🗺️ Retention Pathway &bull; Day {activeTarget?.day_number || 1} of {targetsState.length}
              </span>
              <span style={{ fontSize: '0.74rem', color: theme.textMuted }}>
                (Pages {activeTarget?.start_page}&ndash;{activeTarget?.end_page} &bull; {totalPages - currentPageNum} pages remaining in chapter)
              </span>
            </div>

            <button
              onClick={() => setShowQuizModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: isTargetCompleted 
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)' 
                  : (activeTarget?.is_completed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)'),
                border: activeTarget?.is_completed ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '5px 14px',
                borderRadius: '100px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: isTargetCompleted ? '0 0 18px rgba(245, 158, 11, 0.45)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Award size={13} color={activeTarget?.is_completed ? '#34d399' : '#ffffff'} />
              {isTargetCompleted ? "Target Reached • Take Active Recall Quiz" : (activeTarget?.is_completed ? "Review Active Recall" : "Active Recall & Feynman Studio")}
            </button>
          </div>

          {/* Connected Snake / Zig-zag Stepper Line */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0px',
            overflowX: 'auto',
            padding: '4px 0'
          }}>
            {targetsState.map((target, tIdx) => {
              const isCurrent = currentPageNum >= target.start_page && currentPageNum <= target.end_page;
              const isPassed = currentPageNum > target.end_page || target.is_completed;
              const isLast = tIdx === targetsState.length - 1;

              return (
                <React.Fragment key={tIdx}>
                  {/* Target Node Step */}
                  <button
                    onClick={() => handlePageChange(target.start_page)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '100px',
                      border: isCurrent 
                        ? '1.5px solid #38bdf8' 
                        : (isPassed ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)'),
                      background: isCurrent 
                        ? 'rgba(56, 189, 248, 0.18)' 
                        : (isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)'),
                      color: isCurrent ? '#ffffff' : (isPassed ? '#34d399' : 'var(--text-dim)'),
                      fontSize: '0.74rem',
                      fontWeight: isCurrent ? 800 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: isCurrent ? '0 0 14px rgba(56, 189, 248, 0.35)' : 'none',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    <span style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.66rem',
                      fontWeight: 900,
                      background: isPassed ? '#10b981' : (isCurrent ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'),
                      color: isPassed || isCurrent ? '#0f172a' : '#94a3b8'
                    }}>
                      {isPassed ? "✓" : target.day_number}
                    </span>
                    <span>
                      Day {target.day_number}: pp. {target.start_page}&ndash;{target.end_page}
                    </span>
                    {isCurrent && (
                      <span style={{ fontSize: '0.62rem', background: '#38bdf8', color: '#030712', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                        Active
                      </span>
                    )}
                  </button>

                  {/* Snake Connector Line bridge (---) */}
                  {!isLast && (
                    <div style={{
                      flex: 1,
                      minWidth: '24px',
                      height: '3px',
                      background: isPassed 
                        ? 'linear-gradient(90deg, #10b981, #10b981)' 
                        : (isCurrent ? 'linear-gradient(90deg, #38bdf8, rgba(255,255,255,0.15))' : 'rgba(255, 255, 255, 0.1)'),
                      borderRadius: '2px',
                      margin: '0 4px',
                      boxShadow: isPassed ? '0 0 8px rgba(16, 185, 129, 0.5)' : (isCurrent ? '0 0 8px rgba(56, 189, 248, 0.5)' : 'none'),
                      transition: 'all 0.3s ease'
                    }} />
                  )}
                </React.Fragment>
              );
            })}
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

        {/* RIGHT SIDEBAR: TIMETABLE & LIVE CLOCK CUBE (MATCHES LEFT CUBE SIZE) */}
        <aside style={{
          position: 'sticky',
          top: '76px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          width: '184px',
          flexShrink: 0,
          zIndex: 40
        }}>
          
          {/* CUBE CONTAINER */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.92)',
            padding: '16px 12px',
            borderRadius: '24px',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.15)',
            backdropFilter: 'blur(16px)',
            textAlign: 'center'
          }}>
            
            {/* Cube Header Badge */}
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#f59e0b',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Radio size={12} color="#38bdf8" />
              <span>Timetable Live</span>
            </div>

            {/* 1. TOP: LOCAL TIME */}
            <div style={{
              width: '100%',
              padding: '10px 8px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '14px',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em', marginBottom: '2px' }}>
                Local Time
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '1.05rem',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '0.04em',
                textShadow: '0 0 10px rgba(56, 189, 248, 0.4)'
              }}>
                {localTimeStr || "15:33:00"}
              </div>
            </div>

            {/* Snake Connector Line */}
            <div style={{ width: '2px', height: '14px', background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.8), rgba(245, 158, 11, 0.8))', margin: '4px 0' }} />

            {/* 2. MIDDLE (BELOW LOCAL TIME): CURRENT TIMETABLE BLOCK */}
            <div style={{
              width: '100%',
              padding: '10px 8px',
              background: activeSlotInfo?.isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 0, 0, 0.35)',
              borderRadius: '14px',
              border: activeSlotInfo?.isActive ? '1.5px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img 
                  src="/luffy_sitting.png" 
                  alt="Luffy Sitting" 
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid #f59e0b',
                    boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)',
                    flexShrink: 0
                  }} 
                />
                <span style={{
                  fontSize: '0.64rem',
                  fontWeight: 900,
                  color: activeSlotInfo?.isActive ? '#34d399' : '#fcd34d',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {activeSlotInfo?.isActive ? "🟢 Active Now" : "Current Slot"}
                </span>
              </div>

              <div style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.2
              }}>
                {activeSlotInfo?.start}&ndash;{activeSlotInfo?.end}
              </div>

              <div style={{
                fontSize: '0.70rem',
                color: '#cbd5e1',
                lineHeight: 1.25,
                wordBreak: 'break-word'
              }}>
                {activeSlotInfo?.title?.replace(/[📚⚔️🍖🌊⚓🌅]/g, '').trim() || "Study Block"}
              </div>

              {activeSlotInfo?.isActive && remainingSlotSeconds > 0 && (
                <div style={{
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  color: remainingSlotSeconds < 300 ? '#f87171' : '#34d399',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  marginTop: '2px'
                }}>
                  ⏱️ {formatRemainingSeconds(remainingSlotSeconds)}
                </div>
              )}
            </div>

            {/* Snake Connector Line */}
            <div style={{ width: '2px', height: '14px', background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.8), rgba(239, 68, 68, 0.8))', margin: '4px 0' }} />

            {/* 3. BOTTOM (BELOW CURRENT): NEXT TIMETABLE BLOCK */}
            <div style={{
              width: '100%',
              padding: '10px 8px',
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: '14px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img 
                  src="/luffy_smiling.png" 
                  alt="Luffy Smiling" 
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid #ef4444',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
                    flexShrink: 0
                  }} 
                />
                <span style={{
                  fontSize: '0.64rem',
                  fontWeight: 900,
                  color: '#38bdf8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Next Block
                </span>
              </div>

              <div style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.2
              }}>
                {nextSlotInfo?.start}&ndash;{nextSlotInfo?.end}
              </div>

              <div style={{
                fontSize: '0.70rem',
                color: '#cbd5e1',
                lineHeight: 1.25,
                wordBreak: 'break-word'
              }}>
                {nextSlotInfo?.title?.replace(/[📚⚔️🍖🌊⚓🌅]/g, '').trim() || "Study Block"}
              </div>

              <div style={{
                fontSize: '0.66rem',
                color: '#94a3b8',
                fontWeight: 700
              }}>
                • {nextSlotInfo?.duration_minutes || 45} mins
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* Floating Line-Level AI Popover Tutor */}
      {selectedText && popoverPosition && (
        <LineLevelPopover
          selectedText={selectedText}
          surroundingContext={currentPage?.text || ""}
          pageNumber={currentPageNum}
          studentId={studentId}
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
        studentId={studentId}
        documentId={currentPage.document_id || currentDoc?.document_id || currentDoc?.id || 1}
        dayNumber={activeTarget?.day_number || 1}
        documentTitle={currentPage.document_title || docTitle}
        currentPageNum={currentPageNum}
        currentPageText={currentPage.text || ""}
        pageStart={currentPageNum}
        pageEnd={currentPageNum}
        pagesText={currentPage.text ? [currentPage.text] : pages.map(p => p.text)}
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
