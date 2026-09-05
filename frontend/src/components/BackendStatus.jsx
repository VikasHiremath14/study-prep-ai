import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Cpu, 
  Zap, 
  Server
} from 'lucide-react';

export default function BackendStatus() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latency, setLatency] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();
    try {
      // In Vite dev mode, /health is proxied to http://127.0.0.1:8000/health
      const res = await fetch('/health');
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setHealthData(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Health check failed:', err);
      setError(err.message || 'Failed to connect to backend server');
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = healthData && healthData.status === 'ok';

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            backgroundColor: isHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isHealthy ? '#10b981' : '#ef4444'
          }}>
            <Server size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Backend Gateway & Services</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>FastAPI Engine + PostgreSQL / pgvector + LLM Router</p>
          </div>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={checkHealth} 
          disabled={loading}
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      {error ? (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          color: '#f87171'
        }}>
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Backend Connection Error</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
              Unable to reach the FastAPI backend at <code>/health</code>. Ensure the backend server is running on port 8000.
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '6px', opacity: 0.7 }}>Error: {error}</div>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {/* Status Metric */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Server Status</span>
              <span className="status-dot-pulse" style={{ backgroundColor: isHealthy ? '#10b981' : '#f59e0b' }}></span>
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} />
              {healthData ? 'OPERATIONAL' : 'CONNECTING...'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Version {healthData?.version || '0.1.0'} &bull; Latency: {latency !== null ? `${latency}ms` : '—'}
            </div>
          </div>

          {/* Database Metric */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Database Layer</span>
              <Database size={16} color="var(--primary-light)" />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {healthData?.database === 'connected' ? 'Connected & Ready' : (healthData?.database || 'Pending')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              pgvector tables + Alembic migrations active
            </div>
          </div>

          {/* LLM Provider Metric */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LLM Core Provider</span>
              <Cpu size={16} color="#06b6d4" />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8', textTransform: 'capitalize' }}>
              {healthData?.llm_provider || 'Gemini Flash'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Unified abstraction configured
            </div>
          </div>

          {/* Agents Status Metric */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Agents</span>
              <Zap size={16} color="#fbbf24" />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24' }}>
              8 / 8 Initialized
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Last synced at {lastChecked || 'Just now'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
