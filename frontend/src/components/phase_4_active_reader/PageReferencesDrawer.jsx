import React, { useState, useEffect } from 'react';
import { 
  X, 
  Youtube, 
  ExternalLink, 
  BookOpen, 
  Sparkles, 
  Play, 
  Video, 
  Globe, 
  CheckCircle2,
  Search,
  Layers,
  GraduationCap
} from 'lucide-react';

export default function PageReferencesDrawer({
  isOpen,
  onClose,
  documentId = 1,
  pageNumber = 1,
  pageText = "",
  documentTitle = ""
}) {
  const [references, setReferences] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchReferences = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/reader/references', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: documentId,
            page_number: pageNumber,
            page_text: pageText,
            document_title: documentTitle
          })
        });

        if (res.ok) {
          const data = await res.json();
          setReferences(data);
          // Set first video as active player for this page
          if (data.youtube_videos?.length > 0) {
            setActiveVideo(data.youtube_videos[0]);
          } else {
            setActiveVideo(null);
          }
        }
      } catch (err) {
        console.error("Error fetching page references:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferences();
  }, [isOpen, documentId, pageNumber, pageText, documentTitle]);

  if (!isOpen) return null;

  const youtubeVideos = references?.youtube_videos || [];
  const websites = references?.websites || [];
  const topicTitle = references?.topic || "Page Academic Concepts";
  const domainTitle = references?.domain || "Academic Curriculum";
  const pageAnalysis = references?.page_analysis || "";
  const searchQuery = references?.youtube_search_query || `${topicTitle} lecture tutorial`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

  // Determine direct watch URL on YouTube
  const getWatchUrl = (vid) => {
    if (!vid) return youtubeSearchUrl;
    if (vid.youtube_id && vid.youtube_id.length > 5 && !vid.is_search) {
      return `https://www.youtube.com/watch?v=${vid.youtube_id}`;
    }
    const query = vid.search_query || vid.title || searchQuery;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  };

  const hasDirectEmbed = activeVideo?.youtube_id && activeVideo.youtube_id.length >= 8 && !activeVideo.is_search;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease'
    }}>
      
      <div style={{
        width: '100%',
        maxWidth: '600px',
        height: '100%',
        background: '#090d16',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.8)',
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
          alignItems: 'flex-start',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                Page {pageNumber} Analysis
              </span>
              <span style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <GraduationCap size={12} />
                {domainTitle}
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: '4px 0 0 0', lineHeight: 1.3 }}>
              {topicTitle}
            </h3>
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
              alignItems: 'center',
              marginTop: '2px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
              <Sparkles size={24} className="spin" style={{ margin: '0 auto 12px auto', color: '#38bdf8' }} />
              <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                Analyzing Page {pageNumber} Content...
              </div>
              <div style={{ fontSize: '0.78rem' }}>
                Extracting concepts &amp; curating tailored YouTube video lessons...
              </div>
            </div>
          ) : (
            <>
              {/* Contextual AI Page Analysis Briefing */}
              {pageAnalysis && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.06)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  color: '#e0f2fe'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#38bdf8', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <Sparkles size={13} />
                    Page-Level Concept Diagnosis
                  </div>
                  <div>{pageAnalysis}</div>
                </div>
              )}

              {/* YouTube Video Player / Direct Watch Card */}
              {activeVideo && (
                <div style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  boxShadow: '0 8px 25px rgba(239, 68, 68, 0.15)',
                  background: '#000000'
                }}>
                  {hasDirectEmbed ? (
                    <iframe
                      width="100%"
                      height="235"
                      src={`https://www.youtube.com/embed/${activeVideo.youtube_id}?rel=0&autoplay=0`}
                      title={activeVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    /* High-Impact Video Watch Card for Search-Based Topics */
                    <div style={{
                      height: '180px',
                      background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.2) 0%, #080c14 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px',
                      textAlign: 'center',
                      position: 'relative'
                    }}>
                      <a
                        href={getWatchUrl(activeVideo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          boxShadow: '0 0 25px rgba(239, 68, 68, 0.6)',
                          marginBottom: '12px',
                          transition: 'transform 0.2s ease',
                          textDecoration: 'none'
                        }}
                      >
                        <Play size={24} fill="#ffffff" style={{ marginLeft: '3px' }} />
                      </a>
                      <strong style={{ fontSize: '0.92rem', color: '#ffffff', maxWidth: '90%' }}>
                        {activeVideo.title}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                        Curated for {domainTitle} &bull; Click to watch on YouTube
                      </span>
                    </div>
                  )}

                  {/* Player Footer & Direct Launch */}
                  <div style={{
                    padding: '12px 16px',
                    background: '#0b0f19',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: '#ffffff', display: 'block' }}>
                        {activeVideo.title}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {activeVideo.channel} &bull; {activeVideo.duration} &bull; <span style={{ color: 'var(--accent-cyan)' }}>{activeVideo.level}</span>
                      </span>
                    </div>
                    <a
                      href={getWatchUrl(activeVideo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.74rem',
                        gap: '6px',
                        background: '#ef4444',
                        borderColor: '#ef4444',
                        color: '#ffffff',
                        fontWeight: 700
                      }}
                    >
                      <Youtube size={14} />
                      Watch on YT ↗
                    </a>
                  </div>
                </div>
              )}

              {/* YouTube Video Lessons List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Youtube size={16} color="#ef4444" />
                    <strong style={{ fontSize: '0.88rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Tailored Video Lessons ({youtubeVideos.length})
                    </strong>
                  </div>

                  <a
                    href={youtubeSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.74rem',
                      color: '#f87171',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.1)'
                    }}
                  >
                    <Search size={12} />
                    Search more on YT
                  </a>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {youtubeVideos.map((vid, vIdx) => {
                    const isPlaying = activeVideo?.title === vid.title || (activeVideo?.youtube_id && activeVideo.youtube_id === vid.youtube_id);
                    return (
                      <div
                        key={vIdx}
                        onClick={() => setActiveVideo(vid)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: isPlaying ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${isPlaying ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                          <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            background: isPlaying ? '#ef4444' : 'rgba(239, 68, 68, 0.2)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Play size={13} fill="#ffffff" />
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.84rem', color: '#ffffff', display: 'block', lineHeight: 1.3 }}>
                              {vid.title}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              {vid.channel} &bull; {vid.duration} &bull; <span style={{ color: 'var(--accent-cyan)' }}>{vid.level}</span>
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <a
                            href={getWatchUrl(vid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: '0.7rem',
                              color: '#f87171',
                              textDecoration: 'none',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 700
                            }}
                          >
                            <ExternalLink size={11} />
                            Play
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Authoritative Academic Websites */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Globe size={16} color="var(--accent-cyan)" />
                  <strong style={{ fontSize: '0.88rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Authoritative Academic Websites
                  </strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {websites.map((site, sIdx) => (
                    <a
                      key={sIdx}
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block', marginBottom: '2px' }}>
                          {site.title}
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                          {site.source} &bull; {site.type}
                        </span>
                      </div>
                      <ExternalLink size={14} color="var(--text-dim)" />
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
}
