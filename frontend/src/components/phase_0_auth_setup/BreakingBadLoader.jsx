import React, { useEffect, useState } from 'react';

export default function BreakingBadLoader({ message = "Synthesizing Circadian Bio-Rhythm Formulas...", durationMs = 1800, onComplete }) {
  const [dots, setDots] = useState("");
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 350);

    const timer = setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, durationMs);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(timer);
    };
  }, [durationMs]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'radial-gradient(circle at center, #0b1d14 0%, #030805 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(16px)',
      overflow: 'hidden'
    }}>
      {/* Chemical Smoke & Vapor Ambient Glow */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.05) 50%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'pulseGlow 2.5s infinite ease-in-out'
      }} />

      {/* Floating chemical molecules / formulas in background */}
      <div style={{
        position: 'absolute',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        color: 'rgba(52, 211, 153, 0.15)',
        letterSpacing: '0.2em',
        pointerEvents: 'none',
        userSelect: 'none',
        top: '18%',
        textAlign: 'center'
      }}>
        C₁₀H₁₅N &bull; 149.24 g/mol &bull; [Kr] 4d¹⁰ 5s² &bull; SYNAPSE.CALIB.v2
      </div>

      {/* Breaking Bad Style Periodic Table Elements Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '32px',
        zIndex: 10
      }}>
        {/* Element 1: [St] Study / Strontium */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            width: '74px',
            height: '74px',
            background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
            border: '2.5px solid #10b981',
            borderRadius: '4px',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.5), inset 0 0 12px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '4px 6px',
            position: 'relative'
          }}>
            <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: '#6ee7b7', fontWeight: 800 }}>
              38
            </span>
            <span style={{ fontSize: '1.9rem', fontWeight: 900, fontFamily: 'serif', color: '#ffffff', textAlign: 'center', lineHeight: 1, letterSpacing: '-0.05em' }}>
              St
            </span>
            <span style={{ fontSize: '0.52rem', fontFamily: 'sans-serif', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
              87.62
            </span>
          </div>
          <span style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'serif', color: '#f0fdf4', letterSpacing: '0.05em', textShadow: '0 0 15px rgba(16,185,129,0.4)' }}>
            udy
          </span>
        </div>

        {/* Element 2: [Pr] Prep / Praseodymium */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            width: '74px',
            height: '74px',
            background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
            border: '2.5px solid #10b981',
            borderRadius: '4px',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.5), inset 0 0 12px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '4px 6px',
            position: 'relative'
          }}>
            <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: '#6ee7b7', fontWeight: 800 }}>
              59
            </span>
            <span style={{ fontSize: '1.9rem', fontWeight: 900, fontFamily: 'serif', color: '#ffffff', textAlign: 'center', lineHeight: 1, letterSpacing: '-0.05em' }}>
              Pr
            </span>
            <span style={{ fontSize: '0.52rem', fontFamily: 'sans-serif', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
              140.91
            </span>
          </div>
          <span style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'serif', color: '#f0fdf4', letterSpacing: '0.05em', textShadow: '0 0 15px rgba(16,185,129,0.4)' }}>
            ep
          </span>
        </div>

        {/* Element 3: [Ai] Artificial Intelligence */}
        <div style={{
          width: '74px',
          height: '74px',
          background: 'linear-gradient(135deg, #065f46 0%, #022c22 100%)',
          border: '2.5px solid #34d399',
          borderRadius: '4px',
          boxShadow: '0 0 25px rgba(52, 211, 153, 0.6), inset 0 0 12px rgba(52, 211, 153, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '4px 6px',
          marginLeft: '6px'
        }}>
          <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: '#a7f3d0', fontWeight: 800 }}>
            13
          </span>
          <span style={{ fontSize: '1.9rem', fontWeight: 900, fontFamily: 'serif', color: '#ffffff', textAlign: 'center', lineHeight: 1, letterSpacing: '-0.05em' }}>
            Ai
          </span>
          <span style={{ fontSize: '0.52rem', fontFamily: 'sans-serif', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
            26.98
          </span>
        </div>
      </div>

      {/* Chemical Smoke Progress Bar */}
      <div style={{
        width: '320px',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '100px',
        overflow: 'hidden',
        marginBottom: '18px',
        zIndex: 10,
        boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
      }}>
        <div style={{
          height: '100%',
          width: '100%',
          background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7, #10b981)',
          backgroundSize: '200% 100%',
          animation: 'shimmerGrad 1.2s infinite linear'
        }} />
      </div>

      {/* Status Message */}
      <p style={{
        fontFamily: 'monospace',
        fontSize: '0.92rem',
        color: '#a7f3d0',
        letterSpacing: '0.06em',
        textAlign: 'center',
        zIndex: 10,
        margin: 0
      }}>
        {message}{dots}
      </p>

      {/* Inline styles for custom keyframes */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes shimmerGrad {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </div>
  );
}
