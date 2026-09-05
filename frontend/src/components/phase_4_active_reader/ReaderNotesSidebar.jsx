import React, { useState } from 'react';
import { 
  Bookmark, 
  HelpCircle, 
  FileText, 
  Trash2, 
  X, 
  ExternalLink,
  Highlighter,
  Clock,
  Download,
  FileDown,
  Check
} from 'lucide-react';

export default function ReaderNotesSidebar({
  isOpen,
  onClose,
  documentTitle = "Academic Document",
  notes = [],
  doubts = [],
  onJumpToPage
}) {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'doubts' | 'bookmarks'
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const bookmarkNotes = notes.filter(n => n.is_bookmark);
  const textNotes = notes.filter(n => !n.is_bookmark);

  // Export Bookmarks, Notes, and Doubts into a structured Word (.doc) file
  const handleExportToWord = () => {
    setIsExporting(true);

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    let bookmarksHtml = bookmarkNotes.map(b => `
      <li style="margin-bottom: 6px;">
        <strong>Page ${b.page_number}</strong>: Bookmarked checkpoint
      </li>
    `).join('') || '<li>No bookmarks recorded.</li>';

    let notesHtml = textNotes.map((n, i) => `
      <div style="border-left: 3px solid #10b981; padding-left: 10px; margin-bottom: 14px; background: #f8fafc; padding: 8px 12px; border-radius: 4px;">
        <div style="font-size: 11pt; color: #64748b; font-weight: bold;">Note #${i + 1} &bull; Page ${n.page_number}</div>
        ${n.selected_text ? `<p style="font-style: italic; color: #334155; margin: 4px 0;">"${n.selected_text}"</p>` : ''}
        <p style="color: #0f172a; margin: 4px 0; font-weight: 500;">${n.note_text}</p>
      </div>
    `).join('') || '<p>No margin notes recorded.</p>';

    let doubtsHtml = doubts.map((d, i) => `
      <div style="border-left: 3px solid #8b5cf6; padding-left: 10px; margin-bottom: 16px; background: #faf5ff; padding: 10px 14px; border-radius: 4px;">
        <div style="font-size: 11pt; color: #7c3aed; font-weight: bold;">Doubt #${i + 1} &bull; Page ${d.page_number}</div>
        <p style="font-weight: bold; color: #1e1b4b; margin: 4px 0;">Q: ${d.question}</p>
        <p style="color: #334155; margin: 4px 0; line-height: 1.4;">${d.explanation}</p>
      </div>
    `).join('') || '<p>No doubts logged.</p>';

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${documentTitle} - Study Notes & Bookmarks</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 12pt; line-height: 1.5; color: #0f172a; margin: 40px; }
          h1 { color: #1e293b; font-size: 22pt; border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 4px; }
          h2 { color: #0369a1; font-size: 15pt; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .meta { color: #64748b; font-size: 10.5pt; margin-bottom: 20px; }
          .tag { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>StudyPrep.AI &bull; Study Revision Sheet</h1>
        <div class="meta">
          <strong>Document:</strong> ${documentTitle} &bull; <strong>Generated on:</strong> ${dateStr} &bull; <span class="tag">Active Recall Revision</span>
        </div>

        <h2>🔖 1. Bookmarked Key Pages (${bookmarkNotes.length})</h2>
        <ul>${bookmarksHtml}</ul>

        <h2>📝 2. Page Margin Notes &amp; Highlights (${textNotes.length})</h2>
        ${notesHtml}

        <h2>🧠 3. Grounded AI Tutor Resolved Doubts (${doubts.length})</h2>
        ${doubtsHtml}

        <hr style="margin-top: 30px; border: none; border-top: 1px solid #cbd5e1;" />
        <p style="font-size: 9pt; color: #94a3b8; text-align: center;">
          Exported automatically by StudyPrep.AI Autonomous Learning Platform
        </p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordContent], {
      type: 'application/msword;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanDocName = documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    link.href = url;
    link.download = `${cleanDocName}_Notes_and_Bookmarks.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setIsExporting(false);
    }, 1000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '400px',
      maxWidth: '88vw',
      background: 'rgba(10, 15, 29, 0.96)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid var(--border-subtle)',
      boxShadow: '-10px 0 35px rgba(0,0,0,0.6)',
      zIndex: 1050,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.25s ease'
    }}>
      
      {/* Sidebar Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--primary-light)" />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
            Notebook &amp; Bookmarks
          </h4>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Export to Word Button Banner */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(99, 102, 241, 0.1)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.74rem', color: '#a5b4fc', fontWeight: 600 }}>
          Save revision notes to Word document (.doc / .docx):
        </span>
        <button
          onClick={handleExportToWord}
          disabled={isExporting}
          className="btn btn-primary"
          style={{
            padding: '4px 10px',
            fontSize: '0.72rem',
            gap: '4px',
            background: 'linear-gradient(135deg, #0284c7, #0ea5e9)'
          }}
          title="Download all bookmarks and notes in Word format"
        >
          {isExporting ? <Check size={12} /> : <FileDown size={12} />}
          {isExporting ? "Downloaded" : "Export Word"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <button
          onClick={() => setActiveTab('notes')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            borderBottom: activeTab === 'notes' ? '2px solid var(--primary)' : 'none',
            background: 'transparent',
            color: activeTab === 'notes' ? '#ffffff' : 'var(--text-dim)',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          📝 Notes ({textNotes.length})
        </button>

        <button
          onClick={() => setActiveTab('doubts')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            borderBottom: activeTab === 'doubts' ? '2px solid #a855f7' : 'none',
            background: 'transparent',
            color: activeTab === 'doubts' ? '#ffffff' : 'var(--text-dim)',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          ❓ Doubts ({doubts.length})
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            borderBottom: activeTab === 'bookmarks' ? '2px solid #fbbf24' : 'none',
            background: 'transparent',
            color: activeTab === 'bookmarks' ? '#ffffff' : 'var(--text-dim)',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          🔖 Marks ({bookmarkNotes.length})
        </button>
      </div>

      {/* Content List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
        
        {/* Tab 1: Text Notes */}
        {activeTab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {textNotes.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.84rem', marginTop: '40px' }}>
                No margin notes yet.<br />
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Select text on any page and click "Note" to annotate.
                </span>
              </div>
            ) : (
              textNotes.map((n, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span 
                      onClick={() => onJumpToPage && onJumpToPage(n.page_number)}
                      style={{ fontSize: '0.72rem', color: 'var(--primary-light)', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Page {n.page_number} &rarr;
                    </span>
                  </div>

                  {n.selected_text && (
                    <div style={{
                      fontSize: '0.76rem',
                      color: 'var(--text-dim)',
                      fontStyle: 'italic',
                      borderLeft: '2px solid #10b981',
                      paddingLeft: '8px',
                      marginBottom: '6px'
                    }}>
                      "{n.selected_text}"
                    </div>
                  )}

                  <p style={{ fontSize: '0.82rem', color: '#ffffff', margin: 0 }}>
                    {n.note_text}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Doubts Log */}
        {activeTab === 'doubts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {doubts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.84rem', marginTop: '40px' }}>
                No logged doubts.<br />
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Highlight tricky lines to ask the AI Tutor questions.
                </span>
              </div>
            ) : (
              doubts.map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(168, 85, 247, 0.08)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    borderRadius: '10px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span 
                      onClick={() => onJumpToPage && onJumpToPage(d.page_number)}
                      style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Page {d.page_number} &rarr;
                    </span>
                  </div>

                  <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block', marginBottom: '4px' }}>
                    Q: {d.question}
                  </strong>

                  <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                    {d.explanation}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Bookmarks */}
        {activeTab === 'bookmarks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bookmarkNotes.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.84rem', marginTop: '40px' }}>
                No bookmarked pages.<br />
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Click the bookmark icon on any page to save it.
                </span>
              </div>
            ) : (
              bookmarkNotes.map((b, idx) => (
                <div
                  key={idx}
                  onClick={() => onJumpToPage && onJumpToPage(b.page_number)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bookmark size={14} color="#fbbf24" />
                    <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 600 }}>
                      Page {b.page_number}
                    </span>
                  </div>
                  <ExternalLink size={12} color="#fbbf24" />
                </div>
              ))
            )}
          </div>
        )}

      </div>

    </div>
  );
}
