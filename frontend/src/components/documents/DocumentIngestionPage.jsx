import React, { useState, useEffect, useRef } from 'react';
import { 
  FileStack, 
  Upload, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  BrainCircuit, 
  Cpu, 
  Check, 
  Download, 
  RotateCcw,
  Zap,
  FileType,
  FileCode,
  Trash2,
  Plus,
  FilePlus,
  FolderOpen,
  Calendar,
  Layers as LayersIcon
} from 'lucide-react';

const PRESET_CATALOG = {
  dsa: {
    id: "dsa",
    title: "Data Structures & Algorithmic Analysis",
    keywords: ["data structure", "dsa", "algorithm", "trees", "graphs"],
    author: "Core CS Curriculum",
    pages: 20,
    topics: "Big-O, AVL Trees, Graphs, Dijkstra, DP Formulations",
    icon: "💻"
  },
  os: {
    id: "os",
    title: "Operating Systems: Three Easy Pieces",
    keywords: ["operating system", "os", "kernel", "virtualization", "concurrency"],
    author: "Arpaci-Dusseau",
    pages: 15,
    topics: "CPU Virtualization, Paging, TLBs, Concurrency, Semaphores, Inodes",
    icon: "⚡"
  },
  math: {
    id: "math",
    title: "Advanced Mathematics & Calculus",
    keywords: ["math", "calculus", "linear algebra", "multivariable"],
    author: "Engineering Mathematics Core",
    pages: 15,
    topics: "Multivariable, Optimization, Vector Calculus, Linear Algebra, SVD",
    icon: "📐"
  },
  networks: {
    id: "networks",
    title: "Computer Networks: Top-Down Architecture",
    keywords: ["network", "tcp", "ip", "routing", "distributed"],
    author: "Kurose & Ross",
    pages: 12,
    topics: "HTTP/3, TCP Congestion Control, DNS, BGP Routing, TLS 1.3",
    icon: "🌐"
  }
};

// Helper to find matching preset key from subject title
function findMatchingPresetKey(subjectName = "") {
  const nameLower = subjectName.toLowerCase();
  for (const [key, preset] of Object.entries(PRESET_CATALOG)) {
    if (preset.keywords.some(k => nameLower.includes(k))) {
      return key;
    }
  }
  return null;
}

export default function DocumentIngestionPage({ 
  activeProfile, 
  timetableData, 
  selectedSubjects: initialSelectedSubjects, 
  onBackToTimetable, 
  onProceedToReader 
}) {
  const studentName = activeProfile?.name || activeProfile?.student_name || "Student";
  const gradeLevel = activeProfile?.grade_level || "engineering";
  const retentionScore = activeProfile?.profile?.retention_score != null ? activeProfile.profile.retention_score : 0.78;

  // Resolve today's subjects from Phase 2
  const [subjectsToday, setSubjectsToday] = useState(() => {
    if (initialSelectedSubjects && initialSelectedSubjects.length > 0) return initialSelectedSubjects;
    try {
      const saved = localStorage.getItem('study_prep_subjects');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    if (timetableData?.slots) {
      const studySlots = timetableData.slots.filter(s => s.type === 'study');
      if (studySlots.length > 0) {
        return studySlots.map(s => ({
          name: s.title.replace('📚', '').trim(),
          difficulty: s.difficulty || 'medium',
          icon: s.title.includes('Data') || s.title.includes('DSA') ? '💻' : (s.title.includes('OS') || s.title.includes('Operating') ? '⚡' : (s.title.includes('Math') ? '📐' : '📚'))
        }));
      }
    }
    return [
      { name: 'Data Structures & Algorithmic Analysis', difficulty: 'hard', icon: '💻' },
      { name: 'Operating Systems: Three Easy Pieces', difficulty: 'hard', icon: '⚡' }
    ];
  });

  // Multi-Material State
  const [materialsList, setMaterialsList] = useState([]);
  const [customTitle, setCustomTitle] = useState("");
  const [customText, setCustomText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [completedDays, setCompletedDays] = useState({});
  const [error, setError] = useState(null);
  
  // Subject upload target pointer
  const [targetSubjectForUpload, setTargetSubjectForUpload] = useState(null);
  const fileInputRef = useRef(null);
  const subjectFileInputRef = useRef(null);

  // Compute aggregated reading roadmap across all ingested materials
  const calculateAggregatedCurriculum = () => {
    if (materialsList.length === 0) return null;

    let combinedPages = [];
    let pageCounter = 1;
    let totalWords = 0;
    let totalChunks = 0;

    materialsList.forEach((mat) => {
      totalWords += mat.total_words || 0;
      totalChunks += mat.total_chunks || (mat.chunks ? mat.chunks.length : 0);
      
      const docPages = mat.pages || [];
      docPages.forEach((p) => {
        combinedPages.push({
          page_number: pageCounter,
          original_page_number: p.page_number,
          document_id: mat.document_id || mat.id,
          document_title: mat.title,
          text: p.text
        });
        pageCounter++;
      });
    });

    const totalPages = combinedPages.length;

    // Retention Multiplier Calculation (Cognitive Load Theory)
    let retentionMultiplier = 1.0;
    let pacingLabel = "Balanced Analytical Pacing";

    if (retentionScore >= 0.75) {
      retentionMultiplier = 1.15 + (retentionScore - 0.75) * 0.4;
      pacingLabel = "Deep Synthesis Pacing (High Velocity)";
    } else if (retentionScore >= 0.50) {
      retentionMultiplier = 0.85 + (retentionScore - 0.50) * 0.6;
      pacingLabel = "Balanced Analytical Pacing";
    } else {
      retentionMultiplier = 0.55 + Math.max(0.0, retentionScore) * 0.5;
      pacingLabel = "Micro-Comprehension Pacing";
    }

    const basePagesPerHour = {
      "10th": 14.0,
      "12th": 11.0,
      "engineering": 8.5,
      "mtech": 6.5
    }[gradeLevel.toLowerCase()] || 8.5;

    const dailyPagesRaw = basePagesPerHour * 1.5 * retentionMultiplier;
    const recommendedDailyPages = Math.max(4, Math.round(dailyPagesRaw));
    const totalDaysRequired = Math.max(1, Math.ceil(totalPages / recommendedDailyPages));

    const dailyTargets = [];
    let startP = 1;
    for (let day = 1; day <= totalDaysRequired; day++) {
      const endP = Math.min(totalPages, startP + recommendedDailyPages - 1);
      dailyTargets.push({
        day_number: day,
        start_page: startP,
        end_page: endP,
        pages_count: (endP - startP + 1),
        estimated_focus_minutes: 90,
        is_completed: false
      });
      startP = endP + 1;
      if (startP > totalPages) break;
    }

    const primaryTitle = materialsList.length === 1 
      ? materialsList[0].title 
      : `${materialsList[0].title} + ${materialsList.length - 1} more material${materialsList.length > 2 ? 's' : ''}`;

    return {
      title: primaryTitle,
      total_pages: totalPages,
      total_words: totalWords,
      total_chunks: totalChunks || Math.ceil(totalPages * 2),
      vector_dimension: 128,
      pages: combinedPages,
      target_plan: {
        total_pages: totalPages,
        recommended_daily_pages: recommendedDailyPages,
        pacing_label: pacingLabel,
        total_days_required: dailyTargets.length,
        daily_targets: dailyTargets
      }
    };
  };

  const aggregatedCurriculum = calculateAggregatedCurriculum();

  // Load a preset textbook for a subject
  const handleLoadPreset = async (presetId, subjectName = null) => {
    setIsUploading(true);
    setUploadStatusText(`Extracting ${presetId.toUpperCase()} textbook chapters & calculating dense 128-dim vectors...`);
    setError(null);
    try {
      const res = await fetch(`/api/documents/sample/${presetId}?retention_score=${retentionScore}&grade_level=${gradeLevel}&allocated_hours=1.5`);
      if (!res.ok) throw new Error("Preset loading failed");
      const data = await res.json();
      
      const pInfo = PRESET_CATALOG[presetId] || { title: data.title, icon: "📄" };

      const newMaterial = {
        id: `preset_${presetId}_${Date.now()}`,
        presetKey: presetId,
        subjectName: subjectName || pInfo.title,
        document_id: data.document_id,
        title: data.title || pInfo.title,
        filename: data.filename || `${presetId}.pdf`,
        type: "preset",
        icon: pInfo.icon,
        total_pages: data.total_pages,
        total_words: data.total_words || data.total_pages * 350,
        total_chunks: data.total_chunks || data.total_pages * 2,
        pages: data.pages || [],
        chunks: data.chunks || []
      };

      // Prevent duplicate preset of same key
      setMaterialsList((prev) => {
        const filtered = prev.filter(m => m.presetKey !== presetId && m.subjectName !== (subjectName || pInfo.title));
        return [...filtered, newMaterial];
      });
    } catch (err) {
      console.error("Preset ingestion error:", err);
      setError("Failed to ingest sample document. Please verify backend.");
    } finally {
      setIsUploading(false);
      setUploadStatusText("");
    }
  };

  // Upload a file (PDF, Word, Docx, Text) for a specific subject or generic
  const handleFileUpload = async (file, subjectContext = null) => {
    if (!file) return;

    setIsUploading(true);
    const subTitle = subjectContext?.name || customTitle.trim() || file.name;
    setUploadStatusText(`Parsing "${file.name}" for "${subTitle}" & extracting pages...`);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", subTitle);
    formData.append("student_id", activeProfile?.student_id || 1);
    formData.append("retention_score", retentionScore);
    formData.append("grade_level", gradeLevel);
    formData.append("daily_allocated_hours", 1.5);

    try {
      const res = await fetch("/api/documents/upload-file", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("File upload failed");
      }

      const data = await res.json();
      const ext = file.name.split('.').pop().toLowerCase();
      
      const newMaterial = {
        id: `file_${Date.now()}`,
        subjectName: subjectContext?.name || subTitle,
        document_id: data.document_id,
        title: data.title || subTitle,
        filename: file.name,
        type: ext === "pdf" ? "pdf" : (ext.includes("doc") ? "docx" : "txt"),
        icon: ext === "pdf" ? "📄" : (ext.includes("doc") ? "📝" : "📑"),
        total_pages: data.total_pages,
        total_words: data.total_words,
        total_chunks: data.total_chunks,
        pages: data.pages || [],
        chunks: data.chunks || []
      };

      setMaterialsList((prev) => {
        // If subjectContext provided, replace any existing material for that subject
        if (subjectContext) {
          const filtered = prev.filter(m => m.subjectName !== subjectContext.name);
          return [...filtered, newMaterial];
        }
        return [...prev, newMaterial];
      });
      setCustomTitle("");
    } catch (err) {
      console.error("File upload error:", err);
      setError("Failed to process uploaded file. Please make sure it is a valid PDF, Word (.docx), or Text document.");
    } finally {
      setIsUploading(false);
      setUploadStatusText("");
      setTargetSubjectForUpload(null);
    }
  };

  // Trigger file upload for a specific subject card
  const handleTriggerSubjectUpload = (sub) => {
    setTargetSubjectForUpload(sub);
    subjectFileInputRef.current?.click();
  };

  // Ingest custom pasted text
  const handleCustomIngest = async () => {
    if (!customTitle.trim()) {
      setError("Please provide a title for your document/notes.");
      return;
    }
    if (!customText.trim()) {
      setError("Please paste your lecture notes, textbook text, or syllabus content.");
      return;
    }

    setIsUploading(true);
    setUploadStatusText("Chunking text & computing retention-scaled reading roadmap...");
    setError(null);
    try {
      const payload = {
        title: customTitle.trim(),
        text_content: customText.trim(),
        student_id: activeProfile?.student_id || null,
        retention_score: retentionScore,
        grade_level: gradeLevel,
        daily_allocated_hours: 1.5
      };

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      const newMaterial = {
        id: `custom_${Date.now()}`,
        subjectName: customTitle.trim(),
        document_id: data.document_id,
        title: customTitle.trim(),
        filename: `${customTitle.toLowerCase().replace(/\s+/g, '_')}.txt`,
        type: "notes",
        icon: "📝",
        total_pages: data.total_pages,
        total_words: data.total_words,
        total_chunks: data.total_chunks,
        pages: data.pages || [],
        chunks: data.chunks || []
      };

      setMaterialsList((prev) => [...prev, newMaterial]);
      setCustomTitle("");
      setCustomText("");
    } catch (err) {
      console.error("Custom ingestion error:", err);
      setError("Failed to process custom document.");
    } finally {
      setIsUploading(false);
      setUploadStatusText("");
    }
  };

  // Remove a material from list
  const handleRemoveMaterial = (matId) => {
    setMaterialsList((prev) => prev.filter((m) => m.id !== matId));
  };

  const handleToggleDayComplete = (dayNum) => {
    setCompletedDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum]
    }));
  };

  const handleProceedClick = () => {
    if (materialsList.length === 0) {
      setError("Please upload or attach at least one study material before entering the Active Reader.");
      return;
    }

    const bundle = {
      activeDocument: aggregatedCurriculum,
      allDocuments: materialsList,
      timetableData: timetableData,
      selectedSubjects: subjectsToday
    };

    if (onProceedToReader) {
      onProceedToReader(bundle);
    }
  };

  const targets = aggregatedCurriculum?.target_plan?.daily_targets || [];
  const completedTargetCount = targets.filter(t => completedDays[t.day_number]).length;
  const progressPercent = targets.length > 0 ? Math.round((completedTargetCount / targets.length) * 100) : 0;

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '50px' }}>
      
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        style={{ display: 'none' }}
      />

      <input
        ref={subjectFileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && targetSubjectForUpload) {
            handleFileUpload(file, targetSubjectForUpload);
          }
        }}
        style={{ display: 'none' }}
      />

      {/* Top Back Breadcrumb */}
      <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <button
          onClick={onBackToTimetable}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
        >
          <ArrowLeft size={14} />
          Back to Phase 2: Timetable Formation
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Target Student: <strong style={{ color: '#ffffff' }}>{studentName}</strong> ({gradeLevel})
        </span>
      </div>

      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div className="badge badge-success" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} />
          Phase 3 &bull; Study Material Ingestion Linked to Timetable
        </div>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Upload Materials for Today's Scheduled Subjects
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '740px', margin: '0 auto' }}>
          Attach textbook chapters or upload custom PDF/Word documents for your <strong>{subjectsToday.length} subjects</strong> planned in Phase 2. Our vector agent parses page boundaries, builds 128-dim dense semantic embeddings, and paces your daily targets for your <strong>{Math.round(retentionScore * 100)}% retention profile</strong>.
        </p>
      </div>

      {/* SECTION 1: TODAY'S SCHEDULED SUBJECTS (EXACT SUBJECTS TYPED/SELECTED IN PHASE 2) */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} color="#34d399" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Today's Scheduled Subject Requirements ({subjectsToday.length})
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Upload your PDF/Word document or attach curated textbook notes for each subject scheduled today
              </span>
            </div>
          </div>
          <span className="badge badge-primary" style={{ fontSize: '0.74rem' }}>
            {materialsList.length} of {subjectsToday.length} Subjects Ready
          </span>
        </div>

        {/* Dynamic Subject Cards matching whatever user entered in Phase 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {subjectsToday.map((sub, idx) => {
            // Check if material is already attached for this subject
            const attachedMaterial = materialsList.find(m => {
              if (m.subjectName && m.subjectName.toLowerCase() === sub.name.toLowerCase()) return true;
              const subNameLower = sub.name.toLowerCase();
              const matTitleLower = m.title.toLowerCase();
              if (subNameLower.includes('data') || subNameLower.includes('dsa')) return matTitleLower.includes('data') || matTitleLower.includes('dsa');
              if (subNameLower.includes('operating') || subNameLower.includes('os')) return matTitleLower.includes('operating') || matTitleLower.includes('os');
              if (subNameLower.includes('math') || subNameLower.includes('calculus')) return matTitleLower.includes('math') || matTitleLower.includes('calculus');
              if (subNameLower.includes('network')) return matTitleLower.includes('network');
              return matTitleLower.includes(subNameLower) || subNameLower.includes(matTitleLower);
            });

            // Check if a curated preset matches this subject
            const matchingPresetKey = findMatchingPresetKey(sub.name);
            const presetInfo = matchingPresetKey ? PRESET_CATALOG[matchingPresetKey] : null;

            return (
              <div
                key={idx}
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: `1px solid ${attachedMaterial ? 'rgba(16, 185, 129, 0.45)' : 'var(--border-subtle)'}`,
                  background: attachedMaterial ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                  transition: 'all 0.2s ease',
                  boxShadow: attachedMaterial ? '0 0 15px rgba(16, 185, 129, 0.12)' : 'none'
                }}
              >
                {/* Subject Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: attachedMaterial ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem'
                  }}>
                    {sub.icon || (presetInfo ? presetInfo.icon : '📚')}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <strong style={{ fontSize: '0.96rem', color: '#ffffff' }}>
                        {sub.name}
                      </strong>
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: sub.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.2)' : (sub.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'),
                        color: sub.difficulty === 'hard' ? '#f87171' : (sub.difficulty === 'medium' ? '#fbbf24' : '#34d399')
                      }}>
                        {sub.difficulty}
                      </span>
                    </div>

                    {attachedMaterial ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#34d399' }}>
                        <Check size={14} color="#34d399" />
                        <span><strong>{attachedMaterial.title}</strong> ({attachedMaterial.total_pages} Pages &bull; {attachedMaterial.total_chunks} Chunks)</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                        {presetInfo ? `Curated ${presetInfo.pages} Pages textbook available, or upload custom PDF/Word` : 'No material attached yet • Upload PDF/Word document'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions per Subject */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {attachedMaterial ? (
                    <button
                      onClick={() => handleRemoveMaterial(attachedMaterial.id)}
                      className="btn btn-secondary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.76rem',
                        gap: '4px',
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        color: '#f87171'
                      }}
                      title="Remove attached document"
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  ) : (
                    <>
                      {presetInfo && (
                        <button
                          onClick={() => handleLoadPreset(matchingPresetKey, sub.name)}
                          className="btn btn-primary"
                          style={{
                            padding: '7px 13px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            gap: '5px',
                            background: 'linear-gradient(135deg, #10b981, #06b6d4)'
                          }}
                          title="Add curated textbook"
                        >
                          <Plus size={13} />
                          + Add {presetInfo.icon} Preset
                        </button>
                      )}

                      <button
                        onClick={() => handleTriggerSubjectUpload(sub)}
                        className="btn btn-secondary"
                        style={{
                          padding: '7px 13px',
                          fontSize: '0.78rem',
                          gap: '5px',
                          borderColor: 'rgba(99, 102, 241, 0.4)',
                          color: 'var(--primary-light)'
                        }}
                        title="Upload PDF or Word Doc for this subject"
                      >
                        <Upload size={13} />
                        Upload PDF / Word
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* SECTION 2: ACTIVE INGESTED MATERIALS TRAY */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FolderOpen size={18} color="var(--primary-light)" />
              Active Ingested Materials for Today ({materialsList.length})
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              These documents are vector indexed &amp; synchronized with your timetable reader
            </span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary"
            style={{
              padding: '7px 14px',
              fontSize: '0.78rem',
              gap: '6px',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Plus size={14} />
            + Upload Custom PDF / Word File
          </button>
        </div>

        {/* Ingested Materials Cards List */}
        {materialsList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            {materialsList.map((mat, idx) => (
              <div
                key={mat.id || idx}
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '14px',
                  flexWrap: 'wrap',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    color: '#34d399'
                  }}>
                    {mat.icon || "📄"}
                  </div>

                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#ffffff', display: 'block', marginBottom: '2px' }}>
                      {mat.title}
                    </strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                      <span>📄 <strong>{mat.total_pages} Pages</strong> ({mat.total_words?.toLocaleString()} words)</span>
                      <span>&bull;</span>
                      <span>🧠 {mat.total_chunks} Dense Chunks</span>
                      <span>&bull;</span>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>✓ 128-dim Vector Indexed</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                    Active In Reader
                  </span>
                  <button
                    onClick={() => handleRemoveMaterial(mat.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem'
                    }}
                    title="Remove this document"
                  >
                    <Trash2 size={12} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '0.86rem' }}>
            No study materials attached yet. Click "+ Add Preset" or "Upload PDF / Word" on the subjects above.
          </div>
        )}

        {/* Custom Text / Markdown Notes Drawer */}
        <details style={{ marginTop: '8px' }}>
          <summary style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 600 }}>
            + Or Paste Custom Lecture Notes / Syllabus Markdown Text Directly
          </summary>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Document Title (e.g. Distributed Systems Notes)"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                fontSize: '0.84rem',
                outline: 'none'
              }}
            />
            <textarea
              rows={4}
              placeholder="Paste lecture text or markdown content here..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontFamily: 'monospace',
                outline: 'none',
                resize: 'vertical'
              }}
            />
            <button
              onClick={handleCustomIngest}
              disabled={isUploading}
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start', padding: '7px 16px', fontSize: '0.8rem', gap: '6px' }}
            >
              <Upload size={13} />
              {isUploading ? "Chunking & Embedding..." : "Ingest Text as New Document"}
            </button>
          </div>
        </details>

      </div>

      {/* Live Upload & Vector Progress Notification */}
      {isUploading && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#a5b4fc',
          fontSize: '0.88rem',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Sparkles size={16} className="spin" />
          <span>{uploadStatusText || "Processing study material & generating dense vector chunks..."}</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#fca5a5', fontSize: '0.88rem', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* SECTION 3: INGESTION METRICS & RETENTION ROADMAP */}
      {aggregatedCurriculum && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px'
          }}>
            <div className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Extracted Academic Content
              </span>
              <strong style={{ fontSize: '1.3rem', color: 'var(--primary-light)' }}>
                {aggregatedCurriculum.total_pages} Pages ({aggregatedCurriculum.total_words?.toLocaleString()} words)
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                From {materialsList.length} Study Material{materialsList.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Dense Vector Embeddings
              </span>
              <strong style={{ fontSize: '1.3rem', color: 'var(--accent-cyan)' }}>
                {aggregatedCurriculum.total_chunks} Semantic Chunks
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                {aggregatedCurriculum.vector_dimension}-dim vector indexed
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Calibrated Daily Velocity
              </span>
              <strong style={{ fontSize: '1.3rem', color: '#34d399' }}>
                {aggregatedCurriculum.target_plan?.recommended_daily_pages} Pages / Day
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                {aggregatedCurriculum.target_plan?.pacing_label?.split('(')[0]}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Curriculum Duration
              </span>
              <strong style={{ fontSize: '1.3rem', color: '#fbbf24' }}>
                {aggregatedCurriculum.target_plan?.total_days_required} Study Days
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                1.5 hrs focus per day
              </span>
            </div>
          </div>

          {/* Retention-Scaled Target Roadmap Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileStack size={18} color="var(--primary-light)" />
                  Retention-Scaled Day-by-Day Reading Roadmap
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Paced for {Math.round(retentionScore * 100)}% retention &bull; {completedTargetCount} of {targets.length} targets completed ({progressPercent}%)
                </span>
              </div>

              {/* Mini Progress bar */}
              <div style={{ width: '180px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #34d399)', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Target Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {targets.map((t) => {
                const isDone = !!completedDays[t.day_number];
                return (
                  <div
                    key={t.day_number}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: isDone ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '100px',
                          background: isDone ? '#10b981' : 'rgba(99, 102, 241, 0.2)',
                          color: '#ffffff'
                        }}>
                          Day {t.day_number}
                        </span>
                        <strong style={{ fontSize: '0.9rem', color: isDone ? '#34d399' : '#ffffff', textDecoration: isDone ? 'line-through' : 'none' }}>
                          Pages {t.start_page} &ndash; {t.end_page}
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {t.pages_count} pages &bull; ~{t.estimated_focus_minutes} mins focus block
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleDayComplete(t.day_number)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: isDone ? '#10b981' : 'rgba(255,255,255,0.06)',
                        border: isDone ? 'none' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#ffffff'
                      }}
                      title={isDone ? "Mark incomplete" : "Mark completed"}
                    >
                      {isDone && <Check size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Proceed to Phase 4 CTA */}
          <div className="glass-panel" style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.2)'
          }}>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '3px' }}>
                Ready to study {aggregatedCurriculum.total_pages} extracted pages with AI Line-Level QA?
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
                Proceed to <strong>Active Reader &amp; Grounded QA (Phase 4)</strong> with live local clock sync, timetable-scheduled document auto-selection, and exact real-time slot countdown timer.
              </p>
            </div>

            <button
              onClick={handleProceedClick}
              className="btn btn-primary"
              style={{
                padding: '12px 24px',
                fontSize: '0.92rem',
                fontWeight: 800,
                gap: '8px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
              }}
            >
              Start Reading in Reader UI
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
