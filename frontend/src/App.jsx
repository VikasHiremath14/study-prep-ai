import React, { useState } from 'react';
import BackendStatus from './components/BackendStatus';
import AgentMatrix from './components/AgentMatrix';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import { 
  Sparkles, 
  Layers, 
  Terminal, 
  BookOpen, 
  BrainCircuit, 
  Compass, 
  CheckCircle2,
  Users
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('wizard'); // 'wizard' or 'overview'
  const [activeStudent, setActiveStudent] = useState(null);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(10, 13, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '14px 24px'
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
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
            }}>
              🧠
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                StudyPrep<span style={{ color: 'var(--primary-light)' }}>.AI</span>
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
                Phase 1 Active &bull; Retention Profiler
              </span>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setActiveTab('wizard')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: activeTab === 'wizard' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'wizard' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              <BrainCircuit size={16} />
              Retention Profiling Wizard
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: activeTab === 'overview' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'overview' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              <Compass size={16} />
              System Architecture & Health
            </button>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a 
              href="http://localhost:8000/docs" 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ padding: '7px 12px', fontSize: '0.82rem' }}
            >
              <BookOpen size={14} />
              Docs
            </a>
            <a 
              href="http://localhost:8000/health" 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-primary"
              style={{ padding: '7px 12px', fontSize: '0.82rem' }}
            >
              <Terminal size={14} />
              Health API
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '36px 24px', width: '100%' }}>
        {activeTab === 'wizard' ? (
          <div>
            <OnboardingWizard onComplete={(studentData) => setActiveStudent(studentData)} />
          </div>
        ) : (
          <div>
            {/* Hero Section */}
            <div style={{ marginBottom: '36px', textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px auto' }}>
              <div className="badge" style={{ marginBottom: '16px' }}>
                <Sparkles size={14} />
                Full-Stack Multi-Agent Infrastructure
              </div>
              <h1 style={{ fontSize: '2.6rem', lineHeight: '1.2', marginBottom: '14px' }}>
                Agentic AI for <span className="gradient-text">Adaptive Study Preparation</span>
              </h1>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Measuring focus endurance, calibrating realistic timetables, delivering grounded RAG reader sessions, 
                synthesizing anti-Google recall quizzes, and motivation through persona companions.
              </p>
            </div>

            {/* Real-time Backend Health Telemetry */}
            <BackendStatus />

            {/* Agents Architecture Matrix */}
            <AgentMatrix />

            {/* Checklist */}
            <div className="glass-panel" style={{ marginTop: '36px', padding: '28px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="var(--primary-light)" />
                Phase 0 & 1 Verification Status
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {[
                  'Phase 0: FastAPI backend + PostgreSQL / pgvector ORM schema & Alembic migrations',
                  'Phase 0: Unified LLM provider settings (Gemini Flash default)',
                  'Phase 0: Pytest test suite with in-memory database fixture',
                  'Phase 1: Retention Profiler scoring engine with 5-signal behavioral proxies',
                  'Phase 1: Page Visibility API tab switch tracking & deliberate distraction recovery test',
                  'Phase 1: Calibrated break interval mapping (20 / 30 / 45 / 60 min focus blocks)',
                  'Phase 1: Database persistence in students & retention_profiles tables'
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '20px',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.85rem',
        background: 'rgba(10, 13, 20, 0.6)'
      }}>
        Study-Prep AI &bull; Agentic AI Project &bull; Phase 1 (Retention Profiler Agent) Complete
      </footer>
    </div>
  );
}
