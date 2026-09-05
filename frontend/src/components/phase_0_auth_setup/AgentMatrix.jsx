import React from 'react';
import { 
  BrainCircuit, 
  CalendarClock, 
  FileStack, 
  BookOpenCheck, 
  HelpCircle, 
  Bookmark, 
  Lightbulb, 
  TrendingDown, 
  Bot, 
  Palette, 
  Compass, 
  BarChart3,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const AGENTS = [
  {
    phase: 'Phase 1',
    name: 'Retention Profiler',
    icon: BrainCircuit,
    color: '#6366f1',
    description: 'Measures sustained focus, reel-watch endurance, and distraction recovery to calculate calibrated study/break intervals.',
    status: 'Ready for Phase 1'
  },
  {
    phase: 'Phase 2',
    name: 'Timetable Correction Agent',
    icon: CalendarClock,
    color: '#06b6d4',
    description: 'Deterministic rule engine adjusting schedules for wake buffers, break intervals, and grade-level study caps.',
    status: 'Ready for Phase 2'
  },
  {
    phase: 'Phase 3',
    name: 'Content Ingestion & RAG',
    icon: FileStack,
    color: '#10b981',
    description: 'PDF text extraction, chunking, pgvector embedding storage, and retention-scaled daily page targets.',
    status: 'Ready for Phase 3'
  },
  {
    phase: 'Phase 4 - 5',
    name: 'Reader UI & Grounded QA',
    icon: BookOpenCheck,
    color: '#3b82f6',
    description: 'Distraction-free reading interface with line-level popover explanations calibrated to student grade level.',
    status: 'Ready for Phase 4-5'
  },
  {
    phase: 'Phase 7',
    name: 'Anti-Web Search Quiz Generator',
    icon: Lightbulb,
    color: '#f59e0b',
    description: 'Generates non-searchable active recall questions weighting pages with notes and high doubt frequencies.',
    status: 'Ready for Phase 7'
  },
  {
    phase: 'Phase 8',
    name: 'Weak-Topic Recommender',
    icon: TrendingDown,
    color: '#ec4899',
    description: 'Aggregates quiz mistakes, doubts, and note density into prioritized weak-topic reviews.',
    status: 'Ready for Phase 8'
  },
  {
    phase: 'Phase 9 - 10',
    name: 'Character Companion',
    icon: Bot,
    color: '#8b5cf6',
    description: 'Persona-driven original nudges, break activity suggestions, visual themes, and missed-session recovery.',
    status: 'Ready for Phase 9-10'
  },
  {
    phase: 'Phase 11 - 12',
    name: 'Orchestrator & Analytics',
    icon: Compass,
    color: '#14b8a6',
    description: 'Synthesizes all agents into unified daily session priorities and dashboard analytics.',
    status: 'Ready for Phase 11-12'
  }
];

export default function AgentMatrix() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Multi-Agent Architecture Matrix
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            8 Specialized AI & Deterministic Agents working collaboratively
          </p>
        </div>
        <div className="badge badge-success">
          <ShieldCheck size={14} />
          Phase 0 Core Skeleton Active
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {AGENTS.map((agent, idx) => {
          const IconComponent = agent.icon;
          return (
            <div key={idx} className="agent-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: `${agent.color}20`,
                  color: agent.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconComponent size={20} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                  {agent.phase}
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '6px' }}>
                  {agent.name}
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {agent.description}
                </p>
              </div>

              <div style={{ 
                marginTop: 'auto', 
                paddingTop: '12px', 
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '0.78rem'
              }}>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }}></span>
                  {agent.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
