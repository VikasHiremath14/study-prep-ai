import React, { useState, useEffect } from 'react';
import StepSART from './StepSART';
import StepDigitSpan from './StepDigitSpan';
import StepDelayedRecall from './StepDelayedRecall';
import StepReelSimulation from './StepReelSimulation';
import StepSelfReport from './StepSelfReport';
import ProfileResults from './ProfileResults';
import { Target, Brain, BookOpen, Video, History, CheckCircle2, ArrowLeft } from 'lucide-react';

const STEPS = [
  { id: 'sart', title: '1. SART Vigilance', icon: Target },
  { id: 'digit_span', title: '2. Working Memory', icon: Brain },
  { id: 'recall', title: '3. Delayed Recall', icon: BookOpen },
  { id: 'reel', title: '4. Reels Tolerance', icon: Video },
  { id: 'self_report', title: '5. Baseline Habits', icon: History }
];

export default function OnboardingWizard({ initialStudentData, onBackToProfile, onComplete, onProceedToScheduler }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    student_name: initialStudentData?.student_name || 'Student',
    grade_level: initialStudentData?.grade_level || 'engineering',
    wake_time: initialStudentData?.wake_time || '06:30',
    sleep_time: initialStudentData?.sleep_time || '23:30',
    sart_test: {
      total_trials: 18,
      commission_errors: 0,
      omission_errors: 0,
      no_go_count: 4,
      go_count: 14,
      average_reaction_time_ms: 450,
      sart_score: 0.90
    },
    digit_span_test: {
      max_span_capacity: 6,
      working_memory_score: 0.80,
      levels_attempted: 5,
      trials: []
    },
    delayed_recall_test: {
      total_target_words: 8,
      correct_recalled_count: 6,
      intrusions_count: 0,
      recall_score: 0.75,
      recalled_words: [],
      target_words: []
    },
    reel_watches: [],
    series_habits: [
      { title: 'Breaking Bad', status: 'completed' },
      { title: 'Dark', status: 'completed' }
    ],
    self_report: {
      longest_session_minutes: 60,
      typical_break_frequency_minutes: 45,
      preferred_study_time: 'morning'
    }
  });

  useEffect(() => {
    if (initialStudentData) {
      setFormData((prev) => ({
        ...prev,
        student_name: initialStudentData.student_name || prev.student_name,
        grade_level: initialStudentData.grade_level || prev.grade_level,
        wake_time: initialStudentData.wake_time || prev.wake_time,
        sleep_time: initialStudentData.sleep_time || prev.sleep_time
      }));
    }
  }, [initialStudentData]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultProfile, setResultProfile] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        student_name: formData.student_name?.trim() || "Student",
        grade_level: formData.grade_level || "engineering",
        sart_test: formData.sart_test || {
          total_trials: 18,
          commission_errors: 0,
          omission_errors: 0,
          no_go_count: 4,
          go_count: 14,
          average_reaction_time_ms: 450,
          sart_score: 0.90
        },
        digit_span_test: formData.digit_span_test || {
          max_span_capacity: 6,
          working_memory_score: 0.80,
          levels_attempted: 5,
          trials: []
        },
        delayed_recall_test: formData.delayed_recall_test || {
          total_target_words: 8,
          correct_recalled_count: 6,
          intrusions_count: 0,
          recall_score: 0.75,
          recalled_words: [],
          target_words: []
        },
        reel_watches: formData.reel_watches?.length > 0 ? formData.reel_watches : [
          { clip_id: "reel_1", title: "GPU Matrix Multiplications", clip_type: "short", duration_seconds: 15, watched_seconds: 15, completion_status: "full", skipped: false },
          { clip_id: "reel_2", title: "Dopamine Loops", clip_type: "medium", duration_seconds: 30, watched_seconds: 24, completion_status: "halfway", skipped: false },
          { clip_id: "reel_3", title: "80/20 Algorithmic Logic", clip_type: "long", duration_seconds: 45, watched_seconds: 42, completion_status: "full", skipped: false }
        ],
        series_habits: formData.series_habits?.length > 0 ? formData.series_habits : [
          { title: "Breaking Bad", status: "completed" },
          { title: "Dark", status: "completed" }
        ],
        self_report: formData.self_report || {
          longest_session_minutes: 60,
          typical_break_frequency_minutes: 45,
          preferred_study_time: "morning"
        }
      };

      let res;
      try {
        res = await fetch('/api/students/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (errProxy) {
        res = await fetch('http://127.0.0.1:8000/api/students/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned ${res.status}: ${res.statusText}`);
      }

      const responseData = await res.json();
      setResultProfile(responseData);
      setCurrentStep(5); // Show Results screen
      if (onComplete) onComplete(responseData);
    } catch (err) {
      console.error('Onboarding submission error:', err);
      setError(err.message || 'Failed to submit profiling test. Please check backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setResultProfile(null);
    setCurrentStep(0);
  };

  return (
    <div style={{ width: '100%', padding: '10px 0' }}>
      
      {/* Top Back to Profile Breadcrumb */}
      {currentStep < 5 && (
        <div style={{ maxWidth: '840px', margin: '0 auto 18px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onBackToProfile}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
          >
            <ArrowLeft size={14} />
            Back to Profile Setup
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Candidate: <strong style={{ color: '#ffffff' }}>{formData.student_name}</strong> ({formData.grade_level})
          </span>
        </div>
      )}

      {/* Progress Steps Header */}
      {currentStep < 5 && (
        <div style={{ maxWidth: '840px', margin: '0 auto 32px auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            alignItems: 'center'
          }}>
            {/* Connecting bar */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '30px',
              right: '30px',
              height: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              zIndex: 1
            }}>
              <div style={{
                height: '100%',
                backgroundColor: 'var(--primary)',
                width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>

            {STEPS.map((step, idx) => {
              const isPast = currentStep > idx;
              const isCurrent = currentStep === idx;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 2,
                    cursor: isPast ? 'pointer' : 'default'
                  }}
                  onClick={() => isPast && setCurrentStep(idx)}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? 'var(--primary)' : (isPast ? '#10b981' : 'var(--bg-surface)'),
                    border: `2px solid ${isCurrent ? 'var(--primary-light)' : (isPast ? '#10b981' : 'var(--border-subtle)')}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    marginBottom: '8px',
                    boxShadow: isCurrent ? '0 0 15px var(--primary-glow)' : 'none',
                    transition: 'all 0.25s ease'
                  }}>
                    {isPast ? <CheckCircle2 size={18} /> : <StepIcon size={18} />}
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? '#ffffff' : (isPast ? 'var(--text-main)' : 'var(--text-dim)')
                  }}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={{
          maxWidth: '640px',
          margin: '0 auto 24px auto',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          color: '#fca5a5',
          fontSize: '0.9rem'
        }}>
          <strong>Submission Failed:</strong> {error}
        </div>
      )}

      {/* Step Renderers */}
      {currentStep === 0 && (
        <StepSART
          data={formData}
          onChange={setFormData}
          onNext={() => setCurrentStep(1)}
          onPrev={onBackToProfile}
        />
      )}

      {currentStep === 1 && (
        <StepDigitSpan
          data={formData}
          onChange={setFormData}
          onNext={() => setCurrentStep(2)}
          onPrev={() => setCurrentStep(0)}
        />
      )}

      {currentStep === 2 && (
        <StepDelayedRecall
          data={formData}
          onChange={setFormData}
          onNext={() => setCurrentStep(3)}
          onPrev={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <StepReelSimulation
          data={formData}
          onChange={setFormData}
          onNext={() => setCurrentStep(4)}
          onPrev={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && (
        <StepSelfReport
          data={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          loading={loading}
          onPrev={() => setCurrentStep(3)}
        />
      )}

      {currentStep === 5 && (
        <ProfileResults
          profileData={resultProfile}
          onRetake={handleRetake}
          onBackToProfiler={() => setCurrentStep(0)}
          onProceedToScheduler={() => {
            if (onProceedToScheduler) onProceedToScheduler(resultProfile);
          }}
        />
      )}
    </div>
  );
}
