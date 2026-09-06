import React, { useState, useEffect } from 'react';
import { 
  AuthPage, 
  ProfileSetupPage, 
  BreakingBadLoader, 
  DevShortcutsBar,
  StudentRecordsModal 
} from './components/phase_0_auth_setup';
import { OnboardingWizard, ExistingProfilePrompt } from './components/phase_1_retention_profiler';
import TimetableCorrector from './components/phase_2_circadian_scheduler/TimetableCorrector';
import DocumentIngestionPage from './components/phase_3_content_ingestion/DocumentIngestionPage';
import DocumentReaderPage from './components/phase_4_active_reader/DocumentReaderPage';
import { 
  Sparkles, 
  BrainCircuit, 
  Compass, 
  Calendar,
  LogOut,
  User,
  ArrowLeft
} from 'lucide-react';

export default function App() {
  // App Flow State: 'auth' | 'profile_setup' | 'retention_wizard' | 'scheduler' | 'ingestion' | 'reader'
  const [currentView, setCurrentView] = useState('auth');
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [forceRetakeExam, setForceRetakeExam] = useState(false);
  const [showStudentRecordsModal, setShowStudentRecordsModal] = useState(false);
  
  // Phase 2 & Phase 3 Shared State
  const [timetableData, setTimetableData] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [allDocuments, setAllDocuments] = useState([]);

  // Breaking Bad Loader Overlay State
  const [showBreakingBadLoader, setShowBreakingBadLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("Synthesizing Circadian Bio-Rhythm Formulas...");
  const [postLoaderAction, setPostLoaderAction] = useState(null);

  // Start cleanly at Auth (Login/Signup) on every initial load
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('study_prep_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        setCurrentUser(parsed);
      }
      const savedProfile = localStorage.getItem('study_prep_student');
      if (savedProfile) {
        setStudentProfile(JSON.parse(savedProfile));
      }
      const savedTimetable = localStorage.getItem('study_prep_timetable');
      if (savedTimetable) {
        setTimetableData(JSON.parse(savedTimetable));
      }
      const savedSubjects = localStorage.getItem('study_prep_subjects');
      if (savedSubjects) {
        setSelectedSubjects(JSON.parse(savedSubjects));
      }
    } catch (e) {
      console.log('Session load error:', e);
    }
    // Always start from Login / Signup on refresh
    setCurrentView('auth');
  }, []);

  // Trigger Breaking Bad chemical intro loading animation
  const triggerBreakingBadTransition = (msg, targetView, callback = null) => {
    setLoaderMessage(msg);
    setShowBreakingBadLoader(true);
    setPostLoaderAction(() => {
      return () => {
        setShowBreakingBadLoader(false);
        setCurrentView(targetView);
        if (callback) callback();
      };
    });
  };

  // Auth Completed -> Jump directly to Phase 2 Timetable for old users with records, or Profile Setup for new users
  const handleAuthComplete = (authData, studentData = null, records = null) => {
    const fullAuth = {
      ...authData,
      id: authData?.user_id || authData?.id || 1,
      user_id: authData?.user_id || authData?.id || 1
    };
    setCurrentUser(fullAuth);
    setForceRetakeExam(false);

    let mergedProfile = {
      ...(studentData || {}),
      id: studentData?.id || studentData?.student_id || fullAuth.id,
      student_id: studentData?.id || studentData?.student_id || fullAuth.id,
      user_id: fullAuth.user_id,
      name: studentData?.name || studentData?.student_name || fullAuth.email?.split('@')[0] || "Student",
      student_name: studentData?.name || studentData?.student_name || fullAuth.email?.split('@')[0] || "Student",
      email: fullAuth.email,
      phone_number: studentData?.phone_number || fullAuth.phone_number || null,
      grade_level: studentData?.grade_level || "engineering",
      wake_time: studentData?.wake_time || "06:30",
      sleep_time: studentData?.sleep_time || "23:30"
    };

    if (records?.retention_profile) {
      mergedProfile = {
        ...mergedProfile,
        retention_score: records.retention_profile.retention_score,
        profile: records.retention_profile.details || records.retention_profile
      };
    }
    setStudentProfile(mergedProfile);
    try {
      localStorage.setItem('study_prep_student', JSON.stringify(mergedProfile));
      localStorage.setItem('study_prep_auth', JSON.stringify(fullAuth));
    } catch (e) {}

    if (records?.latest_schedule) {
      setTimetableData(records.latest_schedule);
      try {
        localStorage.setItem('study_prep_timetable', JSON.stringify(records.latest_schedule));
      } catch (e) {}
    }

    const hasExistingRecords = Boolean(
      records?.retention_profile || 
      records?.latest_schedule || 
      studentData?.retention_score || 
      mergedProfile?.retention_score
    );

    if (hasExistingRecords && !authData.isNewUser) {
      // Old user with existing records: skip Tell us about yourself & jump directly to Phase 2 Timetable!
      triggerBreakingBadTransition(
        `Welcome Back, ${mergedProfile.name}! Loading Phase 2 Circadian Timetable...`,
        "scheduler"
      );
    } else {
      // New user: proceed to Tell us about yourself (profile setup)
      triggerBreakingBadTransition(
        "Initializing Student Cognitive Workspace...",
        "profile_setup"
      );
    }
  };

  // Profile Setup Completed (Name & Education) -> Transition to Retention Profiler
  const handleProfileSetupComplete = (profileData) => {
    const merged = { 
      ...(studentProfile || {}), 
      ...profileData,
      id: studentProfile?.id || studentProfile?.student_id || currentUser?.id || 1,
      student_id: studentProfile?.id || studentProfile?.student_id || currentUser?.id || 1,
      user_id: currentUser?.id || currentUser?.user_id || 1
    };
    setStudentProfile(merged);
    try {
      localStorage.setItem('study_prep_student', JSON.stringify(merged));
    } catch (e) {}

    triggerBreakingBadTransition(
      "Synthesizing Neurocognitive Battery & SART Matrices...",
      "retention_wizard"
    );
  };

  // Retention Profiling Completed -> Result Saved -> Transition to Circadian Scheduler
  const handleProceedToScheduler = (fullResultData) => {
    const merged = {
      ...(studentProfile || {}),
      ...fullResultData,
      id: fullResultData?.student_id || studentProfile?.id || studentProfile?.student_id || currentUser?.id || 1,
      student_id: fullResultData?.student_id || studentProfile?.id || studentProfile?.student_id || currentUser?.id || 1,
      user_id: currentUser?.id || currentUser?.user_id || 1
    };
    setStudentProfile(merged);
    try {
      localStorage.setItem('study_prep_student', JSON.stringify(merged));
    } catch (e) {}

    triggerBreakingBadTransition(
      "Calibrating Circadian Timetable & Synaptic Pacing Formulas...",
      "scheduler"
    );
  };


  // Timetable Completed -> Transition to Phase 3 Document Ingestion
  const handleProceedToIngestion = (scheduleResult) => {
    if (scheduleResult) {
      if (scheduleResult.schedule) setTimetableData(scheduleResult.schedule);
      if (scheduleResult.subjects) setSelectedSubjects(scheduleResult.subjects);
    }
    triggerBreakingBadTransition(
      "Initializing Semantic Vector Indexing & Ingestion Engine for Scheduled Subjects...",
      "ingestion"
    );
  };

  // Ingestion Completed -> Ready for Phase 4 Reader
  const handleProceedToReader = (docBundle) => {
    if (docBundle?.activeDocument) {
      setActiveDocument(docBundle.activeDocument);
      setAllDocuments(docBundle.allDocuments || [docBundle.activeDocument]);
    } else {
      setActiveDocument(docBundle);
      setAllDocuments(docBundle ? [docBundle] : []);
    }
    
    triggerBreakingBadTransition(
      "Synchronizing Real-Time Laptop Clock & Active Reader...",
      "reader"
    );
  };

  // Developer Fast-Forward Shortcuts Handlers
  const handleDevSkipToPhase2 = () => {
    const devUser = { email: "vikash@dev.io", isNewUser: false };
    const devProfile = {
      student_id: 1,
      name: "Vikas Hiremath",
      student_name: "Vikas Hiremath",

      grade_level: "engineering",
      wake_time: "06:30",
      sleep_time: "23:30",
      profile: {
        retention_score: 0.78,
        focus_tier: "Deep Focus Master",
        break_interval_minutes: 45,
        recommended_break_duration_minutes: 15
      }
    };
    setCurrentUser(devUser);
    setStudentProfile(devProfile);
    triggerBreakingBadTransition(
      "Developer Fast-Forward: Calibrating Phase 2 Circadian Timetable...",
      "scheduler"
    );
  };

  const handleDevSkipToPhase3 = () => {
    const devUser = { email: "vikash@dev.io", isNewUser: false };
    const devProfile = {
      student_id: 1,
      name: "Vikas Hiremath",
      student_name: "Vikas Hiremath",

      grade_level: "engineering",
      wake_time: "06:30",
      sleep_time: "23:30",
      profile: {
        retention_score: 0.78,
        focus_tier: "Deep Focus Master",
        break_interval_minutes: 45,
        recommended_break_duration_minutes: 15
      }
    };
    const devSchedule = {
      wake_time: "06:30",
      total_study_hours: 4.5,
      slots: [
        { start: "07:30", end: "08:15", type: "focus_slot", subject: "Data Structures & Algorithms", subject_index: 0 },
        { start: "08:15", end: "08:30", type: "break_slot", label: "Synaptic Reset" },
        { start: "08:30", end: "09:15", type: "focus_slot", subject: "Operating Systems", subject_index: 1 },
        { start: "14:00", end: "14:45", type: "focus_slot", subject: "Computer Networks", subject_index: 2 }
      ]
    };
    setCurrentUser(devUser);
    setStudentProfile(devProfile);
    setTimetableData(devSchedule);
    setSelectedSubjects(["Data Structures & Algorithms", "Operating Systems", "Computer Networks"]);
    triggerBreakingBadTransition(
      "Developer Fast-Forward: Launching Phase 3 Content Ingestion...",
      "ingestion"
    );
  };

  const handleDevSkipToPhase4 = () => {
    const devUser = { email: "vikash@dev.io", isNewUser: false };
    const devProfile = {
      student_id: 1,
      name: "Vikas Hiremath",
      student_name: "Vikas Hiremath",

      grade_level: "engineering",
      wake_time: "06:30",
      sleep_time: "23:30",
      profile: {
        retention_score: 0.78,
        focus_tier: "Deep Focus Master",
        break_interval_minutes: 45,
        recommended_break_duration_minutes: 15
      }
    };
    const devDocDSA = {
      document_id: 1,
      title: "Data Structures & Algorithmic Analysis",
      filename: "dsa_core_curriculum.pdf",
      total_pages: 20,
      icon: "💻",
      target_plan: {
        daily_targets: [
          { day_number: 1, start_page: 1, end_page: 4, is_completed: false },
          { day_number: 2, start_page: 5, end_page: 8, is_completed: false },
          { day_number: 3, start_page: 9, end_page: 12, is_completed: false },
          { day_number: 4, start_page: 13, end_page: 16, is_completed: false },
          { day_number: 5, start_page: 17, end_page: 20, is_completed: false }
        ]
      },
      pages: [
        { page_number: 1, text: "Chapter 1: Asymptotic Analysis & Big-O Notation. The running time of an algorithm depends upon the input size and growth rate. Big-O defines the upper bound, Omega defines the lower bound, and Theta defines the tight asymptotic bound. Understanding cache locality and memory hierarchy is essential." },
        { page_number: 2, text: "Chapter 1.2: Amortized Complexity. Dynamic arrays double in size when capacity is reached. While a single reallocation takes O(N) time, the amortized cost across N insertions is strictly O(1)." },
        { page_number: 3, text: "Chapter 2: Linear Data Structures. Singly linked lists provide O(1) head insertion but O(N) arbitrary access. Doubly linked lists maintain pointers to both next and previous nodes, enabling O(1) removal given a node reference." },
        { page_number: 4, text: "Chapter 2.2: Stacks and Queues. Stacks operate on LIFO (Last In First Out) semantics, crucial for call stacks and DFS. Queues operate on FIFO (First In First Out), powering BFS and task scheduling pipelines." },
        { page_number: 5, text: "Chapter 3: Binary Search Trees & Self-Balancing AVL Trees. An unbalanced BST degrades to O(N) worst-case height. AVL trees maintain balance factors between -1 and +1 through LL, RR, LR, and RL rotations, guaranteeing O(log N) lookup." }
      ]
    };
    const devDocOS = {
      document_id: 2,
      title: "Operating Systems: Three Easy Pieces",
      filename: "operating_systems_three_easy_pieces.pdf",
      total_pages: 15,
      icon: "⚡",
      pages: [
        { page_number: 1, text: "Chapter 1: The Abstraction of the Process. The OS virtualizes the CPU by creating the illusion of infinite private processors. Process Control Blocks (PCBs) store register state, program counters, and memory pointers during context switches." },
        { page_number: 2, text: "Chapter 2: CPU Scheduling Mechanisms. Limited Direct Execution (LDE) allows code to run natively on hardware while maintaining control via kernel traps, timer interrupts, and privileged CPU modes." },
        { page_number: 3, text: "Chapter 3: Scheduling Policies. Multi-Level Feedback Queues (MLFQ) prioritize interactive I/O-bound jobs while preventing starvation for long-running CPU-bound background compute jobs." }
      ]
    };
    setCurrentUser(devUser);
    setStudentProfile(devProfile);
    setActiveDocument(devDocDSA);
    setAllDocuments([devDocDSA, devDocOS]);
    triggerBreakingBadTransition(
      "Developer Fast-Forward: Launching Phase 4 Active Reader...",
      "reader"
    );
  };

  // Clear All Student Records (Keeps User Account Signed In & Allows Retaking Retention Profiler)
  const handleClearAllRecords = async () => {
    const studentId = studentProfile?.id || studentProfile?.student_id || 1;
    try {
      await fetch(`/api/auth/student/${studentId}/clear-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});
    } catch (e) {}

    // Preserve user identity (Name, Phone, Email, Grade, Student ID) while clearing study history
    const preservedName = studentProfile?.name || studentProfile?.student_name || currentUser?.name || currentUser?.email?.split('@')[0] || "Student";
    const preservedGrade = studentProfile?.grade_level || "engineering";
    const preservedPhone = studentProfile?.phone_number || currentUser?.phone_number || null;
    const preservedWake = studentProfile?.wake_time || "06:30";
    const preservedSleep = studentProfile?.sleep_time || "23:30";

    const cleanStudentProfile = {
      id: studentId,
      student_id: studentId,
      user_id: currentUser?.user_id || currentUser?.id,
      name: preservedName,
      student_name: preservedName,
      phone_number: preservedPhone,
      email: currentUser?.email,
      grade_level: preservedGrade,
      wake_time: preservedWake,
      sleep_time: preservedSleep,
      retention_score: null,
      profile: null
    };

    try {
      localStorage.setItem('study_prep_student', JSON.stringify(cleanStudentProfile));
      localStorage.removeItem('study_prep_timetable');
      localStorage.removeItem('study_prep_subjects');
    } catch (e) {}

    setStudentProfile(cleanStudentProfile);
    setTimetableData(null);
    setSelectedSubjects([]);
    setActiveDocument(null);
    setAllDocuments([]);
    setForceRetakeExam(true);

    triggerBreakingBadTransition(
      `All Study Records Cleared! Launching Fresh Retention Assessment for ${preservedName}...`,
      "retention_wizard"
    );
  };

  // Logout / Switch Account
  const handleLogout = () => {
    try {
      localStorage.removeItem('study_prep_auth');
      localStorage.removeItem('study_prep_student');
      localStorage.removeItem('study_prep_timetable');
      localStorage.removeItem('study_prep_subjects');
    } catch (e) {}
    setCurrentUser(null);
    setStudentProfile(null);
    setTimetableData(null);
    setSelectedSubjects([]);
    setActiveDocument(null);
    setAllDocuments([]);
    setForceRetakeExam(false);
    setShowStudentRecordsModal(false);
    setCurrentView('auth');
  };

  const studentDisplayName = studentProfile?.name || studentProfile?.student_name || currentUser?.email?.split('@')[0] || "Student";
  const studentGrade = studentProfile?.grade_level || "engineering";

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Student Records Dashboard Modal */}
      <StudentRecordsModal
        isOpen={showStudentRecordsModal}
        onClose={() => setShowStudentRecordsModal(false)}
        currentUser={currentUser}
        studentProfile={studentProfile}
        timetableData={timetableData}
        onClearRecords={handleClearAllRecords}
        onLogout={handleLogout}
        onRetakeAssessment={() => {
          setShowStudentRecordsModal(false);
          setForceRetakeExam(true);
          triggerBreakingBadTransition(
            "Launching Neurocognitive Retention Assessment Battery...",
            "retention_wizard"
          );
        }}
      />

      {/* Breaking Bad Iconic Chemical Intro Loader Overlay */}
      {showBreakingBadLoader && (
        <BreakingBadLoader
          message={loaderMessage}
          durationMs={1500}
          onComplete={() => {
            setShowBreakingBadLoader(false);
            if (typeof postLoaderAction === 'function') {
              postLoaderAction();
            }
          }}
        />
      )}

      {/* Developer Fast-Forward Shortcuts (Only visible when logged in) */}
      {currentView !== 'auth' && (
        <DevShortcutsBar
          onSkipToPhase2={handleDevSkipToPhase2}
          onSkipToPhase3={handleDevSkipToPhase3}
          onSkipToPhase4={handleDevSkipToPhase4}
          onReset={handleLogout}
        />
      )}

      {/* Navigation Header (Only when logged in and not in full-screen reader view) */}
      {currentView !== 'auth' && currentView !== 'reader' && (
        <header style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(10, 13, 20, 0.9)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '12px 24px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
              }}>
                🧠
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                  StudyPrep<span style={{ color: '#34d399' }}>.AI</span>
                </span>
                <span style={{ 
                  marginLeft: '8px', 
                  fontSize: '0.72rem', 
                  backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: 600
                }}>
                  Phase 1 &bull; 2 &bull; 3 &bull; 4 &bull; 5 &bull; 6 Active
                </span>
              </div>
            </div>

            {/* Step Indicator in Header */}
            {currentUser && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                color: 'var(--text-muted)'
              }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '100px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontWeight: 600
                }}>
                  {currentView === 'profile_setup' && "Step 1 of 5: Profile Setup"}
                  {currentView === 'retention_wizard' && "Step 2 of 5: Retention Profiling (Phase 1)"}
                  {currentView === 'scheduler' && "Step 3 of 5: Circadian Timetable (Phase 2)"}
                  {currentView === 'ingestion' && "Step 4 of 5: Content Ingestion (Phase 3)"}
                  {currentView === 'reader' && "Step 5 of 5: Active Reader & Active Recall (Phase 4, 5 & 6)"}
                </span>
              </div>
            )}

            {/* User Account Button (Opens Records Dashboard Modal) & Logout */}
            {currentUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowStudentRecordsModal(true)}
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
                    transition: 'all 0.2s ease'
                  }}
                  title="Click to view all study records, retention reports, timetable & clear data"
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>{studentDisplayName}</span>
                  <span style={{ color: '#a5b4fc', fontSize: '0.72rem', textTransform: 'capitalize' }}>({studentGrade})</span>
                  <span style={{ fontSize: '0.68rem', background: 'rgba(255, 255, 255, 0.1)', padding: '1px 5px', borderRadius: '4px', color: '#cbd5e1' }}>
                    Records 📋
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '5px' }}
                  title="Sign out and return to login"
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            )}

          </div>
        </header>
      )}

      {/* Main Container Rendering Current Step */}
      <main style={{ 
        flex: 1, 
        width: '100%', 
        display: currentView === 'auth' ? 'flex' : 'block',
        alignItems: currentView === 'auth' ? 'center' : 'stretch',
        justifyContent: currentView === 'auth' ? 'center' : 'flex-start',
        position: 'relative',
        minHeight: currentView === 'auth' ? '100vh' : 'auto',
        overflow: 'hidden'
      }}>
        
        {/* Step 0: Auth Page with Cinematic Breaking Bad Desert Background */}
        {currentView === 'auth' && (
          <div style={{
            position: 'relative',
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            overflow: 'hidden'
          }}>
            {/* 8K Ultra-HD Cinematic Background Layer */}
            <div style={{
              position: 'fixed',
              top: '-4%',
              left: '-4%',
              width: '108%',
              height: '108%',
              backgroundImage: 'url(/breaking_bad_bg.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 45%',
              zIndex: 0,
              filter: 'brightness(0.85) contrast(1.08) saturate(1.12)',
              imageRendering: 'high-quality',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translate3d(0, 0, 0)'
            }} className="bb-bg-cinematic" />

            {/* Dark Atmospheric HDR Vignette & Depth Overlay */}
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(10, 13, 20, 0.35) 0%, rgba(10, 13, 20, 0.72) 65%, rgba(6, 9, 15, 0.92) 100%)',
              zIndex: 1,
              pointerEvents: 'none'
            }} />

            {/* Drifting Chemical Smoke Particles */}
            <div className="bb-smoke-particle" style={{
              bottom: '-10%',
              left: '10%',
              width: '450px',
              height: '450px',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
              animationDelay: '0s',
              zIndex: 2
            }} />
            <div className="bb-smoke-particle" style={{
              bottom: '-15%',
              right: '15%',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, transparent 70%)',
              animationDelay: '6s',
              zIndex: 2
            }} />
            <div className="bb-smoke-particle" style={{
              bottom: '-5%',
              left: '45%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
              animationDelay: '11s',
              zIndex: 2
            }} />

            {/* Centered Auth Card */}
            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '460px' }}>
              <AuthPage onAuthenticate={handleAuthComplete} />
            </div>
          </div>
        )}

        {/* Fallback if view not matched */}
        {!['auth', 'profile_setup', 'retention_wizard', 'scheduler', 'ingestion', 'reader'].includes(currentView) && (
          <div style={{ maxWidth: '540px', margin: '60px auto', textAlign: 'center', padding: '32px' }} className="glass-panel">
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🧠</div>
            <h3 style={{ marginBottom: '8px', color: '#38bdf8' }}>Study-Prep AI Workspace Ready</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
              Welcome back. Choose a step or jump straight into your active study session.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setCurrentView('auth')} className="btn btn-primary" style={{ fontSize: '0.84rem' }}>
                Go to Sign In
              </button>
              <button onClick={handleDevSkipToPhase2} className="btn btn-secondary" style={{ fontSize: '0.84rem' }}>
                Open Timetable (Phase 2)
              </button>
              <button onClick={handleDevSkipToPhase4} className="btn btn-secondary" style={{ fontSize: '0.84rem' }}>
                Open Reader (Phase 4)
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Profile Setup (Name & Education) */}
        {currentView === 'profile_setup' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
            <ProfileSetupPage
              initialData={studentProfile || {}}
              onBack={() => setCurrentView('auth')}
              onProceedToRetention={handleProfileSetupComplete}
            />
          </div>
        )}

        {/* Step 2: Neurocognitive Retention Assessment (Phase 1) */}
        {currentView === 'retention_wizard' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
            {(studentProfile?.profile?.retention_score || studentProfile?.retention_score) && !forceRetakeExam ? (
              <ExistingProfilePrompt
                profileData={studentProfile}
                timetableData={timetableData}
                onSkipToTimetable={() => handleProceedToScheduler(studentProfile)}
                onRetakeExam={() => setForceRetakeExam(true)}
                onBackToProfile={() => setCurrentView('profile_setup')}
              />
            ) : (
              <OnboardingWizard
                initialStudentData={studentProfile}
                onBackToProfile={() => {
                  if (studentProfile?.profile?.retention_score || studentProfile?.retention_score) {
                    setForceRetakeExam(false);
                  } else {
                    setCurrentView('profile_setup');
                  }
                }}
                onComplete={(profileData) => {
                  setStudentProfile(profileData);
                  setForceRetakeExam(false);
                }}
                onProceedToScheduler={handleProceedToScheduler}
              />
            )}
          </div>
        )}

        {/* Step 3: Circadian Timetable & Delusion Scanner (Phase 2) */}
        {currentView === 'scheduler' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
            <div style={{ marginBottom: '14px' }}>
              <button
                onClick={() => setCurrentView('retention_wizard')}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
              >
                <ArrowLeft size={14} />
                Back to Retention Profiler
              </button>
            </div>
            <TimetableCorrector
              activeProfile={studentProfile}
              existingSchedule={timetableData || studentProfile?.latest_schedule}
              onTimetableUpdated={(newSchedule, newSubjects) => {
                if (newSchedule) {
                  setTimetableData(newSchedule);
                  try {
                    localStorage.setItem('study_prep_timetable', JSON.stringify(newSchedule));
                  } catch (e) {}
                }
                if (newSubjects) {
                  setSelectedSubjects(newSubjects);
                  try {
                    localStorage.setItem('study_prep_subjects', JSON.stringify(newSubjects));
                  } catch (e) {}
                }
              }}
              onNavigateToReader={handleProceedToIngestion}
            />

          </div>
        )}

        {/* Step 4: Academic Ingestion & Daily Targets (Phase 3) */}
        {currentView === 'ingestion' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
            <DocumentIngestionPage
              activeProfile={studentProfile}
              timetableData={timetableData}
              selectedSubjects={selectedSubjects}
              onBackToTimetable={() => setCurrentView('scheduler')}
              onProceedToReader={handleProceedToReader}
            />
          </div>
        )}

        {/* Step 5: Distraction-Free Active Document Reader & Line-Level Tutor (Phase 4, 5 & 6) */}
        {currentView === 'reader' && (
          <DocumentReaderPage
            documentData={activeDocument}
            allDocuments={allDocuments}
            timetableData={timetableData}
            selectedSubjects={selectedSubjects}
            activeProfile={studentProfile}
            onBackToIngestion={() => setCurrentView('ingestion')}
            onProceedToQuiz={() => alert("Ready for Anti-Web Search Quiz Generator!")}
          />
        )}

      </main>

      {/* Footer (Only in non-auth and non-reader views) */}
      {currentView !== 'auth' && currentView !== 'reader' && (
        <footer style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '20px',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.82rem'
        }}>
          StudyPrep.AI &bull; Autonomous Multi-Agent Academic Preparation System &bull; Phase 1 through 6 Active
        </footer>
      )}

    </div>
  );
}
