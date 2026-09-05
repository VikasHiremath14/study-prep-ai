import React, { useState } from 'react';
import StepStudentInfo from './StepStudentInfo';
import StepSeriesHabit from './StepSeriesHabit';
import StepReelSimulation from './StepReelSimulation';
import StepYouTubeAttention from './StepYouTubeAttention';
import StepFocusAndDistraction from './StepFocusAndDistraction';
import StepSelfReport from './StepSelfReport';
import ProfileResults from './ProfileResults';
import { Brain, Sparkles, CheckCircle2, User, Tv, Video, Youtube, Eye, History } from 'lucide-react';

const INITIAL_DATA = {
  student_name: '',
  grade_level: 'engineering',
  series_habits: [
    { title: 'Breaking Bad', status: 'completed' },
    { title: 'Dark', status: 'completed' }
  ],
  reel_watches: [],
  youtube_watch: {
    video_id: 'brain_learning_mini',
    video_title: 'How The Brain Builds Deep Neural Pathways in 3 Minutes',
    duration_seconds: 180,
    watched_seconds: 140,
    tab_switches_during_video: 0,
    completed_ratio: 0.78,
    status: 'halfway'
  },
  focus_task: {
    passage_id: 'synaptic_pruning_article',
    total_time_seconds: 240,
    tab_switch_count: 0,
    unfocused_duration_seconds: 0,
    answered_correctly: 2,
    total_questions: 2
  },
  distraction_test: {
    distraction_type: 'urgent_peer_notification',
    reaction_delay_seconds: 3.5
  },
  self_report: {
    longest_session_minutes: 60,
    typical_break_frequency_minutes: 45,
    preferred_study_time: 'morning'
  }
};

const STEPS = [
  { id: 'info', title: 'Student Info', icon: User },
  { id: 'series', title: 'Series Habits', icon: Tv },
  { id: 'reel', title: 'Insta Reels', icon: Video },
  { id: 'youtube', title: 'YouTube Focus', icon: Youtube },
  { id: 'focus', title: 'Reading & Distraction', icon: Eye },
  { id: 'self_report', title: 'Study Baseline', icon: History }
];

export default function OnboardingWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_DATA);
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
        series_habits: formData.series_habits?.length > 0 ? formData.series_habits : [
          { title: "Breaking Bad", status: "completed" },
          { title: "Dark", status: "completed" }
        ],
        reel_watches: formData.reel_watches?.length > 0 ? formData.reel_watches : [
          { clip_id: "reel_1", title: "Transformer Attention", clip_type: "short", duration_seconds: 15, watched_seconds: 15, completion_status: "full", skipped: false },
          { clip_id: "reel_2", title: "Neuro Code", clip_type: "medium", duration_seconds: 30, watched_seconds: 18, completion_status: "halfway", skipped: false }
        ],
        youtube_watch: formData.youtube_watch || {
          video_id: "brain_learning_mini",
          video_title: "How The Brain Builds Deep Neural Pathways in 3 Minutes",
          duration_seconds: 180,
          watched_seconds: 140,
          tab_switches_during_video: 0,
          completed_ratio: 0.78,
          status: "halfway"
        },
        focus_task: formData.focus_task || {
          passage_id: "synaptic_pruning_article",
          total_time_seconds: 240,
          tab_switch_count: 0,
          unfocused_duration_seconds: 0,
          answered_correctly: 2,
          total_questions: 2
        },
        distraction_test: formData.distraction_test || {
          distraction_type: "urgent_peer_notification",
          reaction_delay_seconds: 3.5
        },
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
        // Fallback to direct localhost:8000
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
      setCurrentStep(6); // Show Results screen
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
    setFormData(INITIAL_DATA);
  };

  return (
    <div style={{ width: '100%', padding: '16px 0' }}>
      {/* Progress Steps Header */}
      {currentStep < 6 && (
        <div style={{ maxWidth: '820px', margin: '0 auto 36px auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            alignItems: 'center'
          }}>
            {/* Background connecting bar */}
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
                    fontSize: '0.75rem',
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
        <StepStudentInfo
          data={formData}
          onChange={setFormData}
          onNext={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 1 && (
        <StepSeriesHabit
          data={formData}
          onChange={setFormData}
          onNext={() => setCurrentStep(2)}
          onPrev={() => setCurrentStep(0)}
        />
      )}

      {currentStep === 2 && (
        <StepReelSimulation
          data={formData}
          onChange={setFormData}
          onNext={() => setCurrentStep(3)}
          onPrev={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <StepYouTubeAttention
          data={formData}
          onChange={setFormData}
          onNext={() => setCurrentStep(4)}
          onPrev={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && (
        <StepFocusAndDistraction
          data={formData}
          onChange={setFormData}
          onNext={() => setCurrentStep(5)}
          onPrev={() => setCurrentStep(3)}
        />
      )}

      {currentStep === 5 && (
        <StepSelfReport
          data={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          loading={loading}
          onPrev={() => setCurrentStep(4)}
        />
      )}

      {currentStep === 6 && (
        <ProfileResults
          profileData={resultProfile}
          onRetake={handleRetake}
          onProceedToScheduler={() => alert("Retention profile saved! Ready for Phase 2: Timetable Correction Agent.")}
        />
      )}
    </div>
  );
}
