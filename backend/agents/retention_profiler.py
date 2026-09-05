"""Retention & Attention Profiling Agent (Phase 1).

Measures how long a student can focus and how often they need breaks using
multi-signal indirect behavioral proxies rather than solely self-report surveys.

Signal Breakdown & Weights:
1. Series / Show Completion Habit (15%):
   Behavioral proxy for long-term task follow-through and finishing what one starts.
2. Reel-Watch Simulation Test (25%):
   Measures patience and tolerance for medium/long video content vs fast-swiping dopamine seeking.
3. Sustained-Focus Mini-Task (30%):
   Direct measure of deep focus endurance and tab-switching resistance (Page Visibility API).
4. Distraction-Recovery Test (20%):
   Cognitive inhibition measure: how quickly attention refocuses after a simulated interruption.
5. Self-Reported Study History (10%):
   Self-reported baseline, intentionally weighted lowest to minimize optimism bias.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.agents.base import BaseAgent


# ---------------------------------------------------------
# Pydantic Input Schemas
# ---------------------------------------------------------

class SeriesItem(BaseModel):
    title: str
    status: str  # "completed" (1.0), "partially_completed" (0.5), "dropped" (0.1)


class ReelClipWatch(BaseModel):
    clip_id: str
    title: str = "Reel"
    clip_type: str = "short"  # "short" (15s), "medium" (30s), "long" (60s)
    duration_seconds: float
    watched_seconds: float
    completion_status: str = "skipped"  # "full" (>=90%), "halfway" (40-89%), "dropped" (<40%)
    skipped: bool = False


class YouTubeWatchData(BaseModel):
    video_id: str = "neural_networks_intro"
    video_title: str = "How Memory and Attention Work in Learning"
    duration_seconds: float = 180.0
    watched_seconds: float = 120.0
    tab_switches_during_video: int = 0
    completed_ratio: float = 0.67
    status: str = "halfway"  # "full", "halfway", "dropped"


class FocusTaskSubmission(BaseModel):
    passage_id: str = "quantum_computing_intro"
    total_time_seconds: float
    tab_switch_count: int = 0
    unfocused_duration_seconds: float = 0.0
    answered_correctly: int = 2
    total_questions: int = 2


class DistractionTestResult(BaseModel):
    distraction_type: str = "urgent_notification"
    reaction_delay_seconds: float  # Time taken to dismiss or refocus


class SelfReportData(BaseModel):
    longest_session_minutes: int = 45  # e.g., 20, 45, 60, 90, 120
    typical_break_frequency_minutes: int = 45
    preferred_study_time: str = "evening"  # morning, afternoon, evening, night


class RetentionProfilingPayload(BaseModel):
    student_name: str = "Student"
    grade_level: str = "engineering"  # 10th, 12th, engineering, mtech
    series_habits: List[SeriesItem] = Field(default_factory=list)
    reel_watches: List[ReelClipWatch] = Field(default_factory=list)
    youtube_watch: YouTubeWatchData = Field(default_factory=YouTubeWatchData)
    focus_task: FocusTaskSubmission = Field(default_factory=FocusTaskSubmission)
    distraction_test: DistractionTestResult = Field(
        default_factory=lambda: DistractionTestResult(reaction_delay_seconds=4.0)
    )
    self_report: SelfReportData = Field(default_factory=SelfReportData)


# ---------------------------------------------------------
# Scoring Functions
# ---------------------------------------------------------

def compute_series_score(series_items: List[SeriesItem]) -> float:
    """Calculates show/movie completion ratio (0.0 to 1.0)."""
    if not series_items:
        return 0.5  # Neutral default

    score_map = {
        "completed": 1.0,
        "partially_completed": 0.5,
        "dropped": 0.1
    }
    total = sum(score_map.get(item.status.lower(), 0.5) for item in series_items)
    return round(total / len(series_items), 3)


def compute_reel_score(reel_watches: List[ReelClipWatch]) -> float:
    """Calculates patience score based on whether reels were watched fully, halfway, or skipped."""
    if not reel_watches:
        return 0.5

    clip_scores = []
    for rw in reel_watches:
        if rw.duration_seconds <= 0:
            continue
        ratio = min(rw.watched_seconds / rw.duration_seconds, 1.0)
        
        # Explicit full vs halfway vs dropped scoring
        if rw.completion_status == "full" or ratio >= 0.90:
            score = 1.0
        elif rw.completion_status == "halfway" or ratio >= 0.40:
            score = 0.55
        else:
            score = 0.15
            
        clip_scores.append(score)

    if not clip_scores:
        return 0.5

    return round(sum(clip_scores) / len(clip_scores), 3)


def compute_youtube_score(yt_watch: YouTubeWatchData) -> float:
    """Measures long-form video endurance, completion ratio, and tab switches during playback."""
    if yt_watch.duration_seconds <= 0:
        return 0.5

    ratio = min(yt_watch.watched_seconds / yt_watch.duration_seconds, 1.0)
    
    # Base score on completion
    if ratio >= 0.85 or yt_watch.status == "full":
        base = 1.0
    elif ratio >= 0.45 or yt_watch.status == "halfway":
        base = 0.60
    elif ratio >= 0.20:
        base = 0.35
    else:
        base = 0.15

    # Penalize tab switching during the video
    tab_penalty = max(0.3, 1.0 - (yt_watch.tab_switches_during_video * 0.15))
    return round(base * tab_penalty, 3)


def compute_focus_score(focus_task: FocusTaskSubmission) -> float:
    """Calculates sustained focus score penalizing tab-switching and off-task blur."""
    accuracy = focus_task.answered_correctly / max(focus_task.total_questions, 1)
    base_score = 0.4 + (0.6 * accuracy)

    switch_penalty = max(0.2, 1.0 - (focus_task.tab_switch_count * 0.2))

    time_penalty = 1.0
    if focus_task.unfocused_duration_seconds > 10:
        time_penalty = max(0.3, 1.0 - (focus_task.unfocused_duration_seconds / 60.0))

    final_score = base_score * switch_penalty * time_penalty
    return round(max(0.05, min(final_score, 1.0)), 3)


def compute_distraction_recovery_score(distraction: DistractionTestResult) -> float:
    """Measures how quickly the student regained focus after interruption."""
    delay = max(0.0, distraction.reaction_delay_seconds)
    if delay <= 3.0:
        return 1.0
    elif delay <= 7.0:
        return round(1.0 - ((delay - 3.0) / 4.0) * 0.2, 3)
    elif delay <= 15.0:
        return round(0.8 - ((delay - 7.0) / 8.0) * 0.3, 3)
    elif delay <= 30.0:
        return round(0.5 - ((delay - 15.0) / 15.0) * 0.35, 3)
    else:
        return 0.10


def compute_self_report_score(self_report: SelfReportData) -> float:
    """Calculates normalized baseline study endurance score."""
    minutes = self_report.longest_session_minutes
    if minutes >= 90:
        return 1.0
    elif minutes >= 60:
        return 0.8
    elif minutes >= 45:
        return 0.65
    elif minutes >= 30:
        return 0.45
    else:
        return 0.25


# ---------------------------------------------------------
# Retention Profiler Agent Implementation
# ---------------------------------------------------------

class RetentionProfilerAgent(BaseAgent):
    """Behavioral Retention & Attention Profiling Agent with Instagram Reels & YouTube Video Testing."""

    # Explicit Weights
    WEIGHT_SERIES = 0.10       # 10% show completion
    WEIGHT_REEL = 0.25         # 25% Instagram reels (full vs halfway vs skipped)
    WEIGHT_YOUTUBE = 0.25      # 25% YouTube video attention & tab-switch resistance
    WEIGHT_FOCUS = 0.20        # 20% sustained reading & analytical focus
    WEIGHT_DISTRACTION = 0.10   # 10% distraction recovery latency
    WEIGHT_SELF_REPORT = 0.10  # 10% self-reported baseline

    def __init__(self):
        super().__init__(
            name="Retention Profiler",
            description="Evaluates student attention span and recommends calibrated study/break intervals using behavioral signals."
        )

    def run(self, payload: RetentionProfilingPayload) -> Dict[str, Any]:
        """Calculates comprehensive retention breakdown and recommendations."""
        series_score = compute_series_score(payload.series_habits)
        reel_score = compute_reel_score(payload.reel_watches)
        youtube_score = compute_youtube_score(payload.youtube_watch)
        focus_score = compute_focus_score(payload.focus_task)
        recovery_score = compute_distraction_recovery_score(payload.distraction_test)
        self_report_score = compute_self_report_score(payload.self_report)

        # Combined Weighted Retention Score (0.0 to 1.0)
        retention_score = round(
            (self.WEIGHT_SERIES * series_score) +
            (self.WEIGHT_REEL * reel_score) +
            (self.WEIGHT_YOUTUBE * youtube_score) +
            (self.WEIGHT_FOCUS * focus_score) +
            (self.WEIGHT_DISTRACTION * recovery_score) +
            (self.WEIGHT_SELF_REPORT * self_report_score),
            3
        )

        # Calibrated Break Interval Mapping
        if retention_score >= 0.80:
            break_interval = 60
            focus_tier = "Deep Focus Master"
            break_length = 15
            summary = "Exceptional sustained focus with high resistance to digital distraction. Well suited for 60-minute deep work blocks."
        elif retention_score >= 0.60:
            break_interval = 45
            focus_tier = "Standard Collegiate Rhythm"
            break_length = 10
            summary = "Solid attention endurance with occasional tab-switching susceptibility. Optimal performance with 45-minute focus blocks."
        elif retention_score >= 0.40:
            break_interval = 30
            focus_tier = "Pomodoro Sprint Rhythm"
            break_length = 5
            summary = "Moderate attention stamina prone to social/short-form media drift. Recommended 30-minute high-intensity sprints with prompt 5-minute breaks."
        else:
            break_interval = 20
            focus_tier = "Micro-Focus Recovery"
            break_length = 5
            summary = "High vulnerability to multi-tasking and fast switching. Optimized for 20-minute bite-sized study blocks to prevent cognitive fatigue."

        breakdown = {
            "retention_score": retention_score,
            "break_interval_minutes": break_interval,
            "recommended_break_duration_minutes": break_length,
            "focus_tier": focus_tier,
            "explanation": summary,
            "signals": {
                "series_completion": {
                    "score": series_score,
                    "weight": self.WEIGHT_SERIES,
                    "weighted_contribution": round(series_score * self.WEIGHT_SERIES, 3),
                    "items_count": len(payload.series_habits)
                },
                "instagram_reels": {
                    "score": reel_score,
                    "weight": self.WEIGHT_REEL,
                    "weighted_contribution": round(reel_score * self.WEIGHT_REEL, 3),
                    "clips_evaluated": len(payload.reel_watches)
                },
                "youtube_video_endurance": {
                    "score": youtube_score,
                    "weight": self.WEIGHT_YOUTUBE,
                    "weighted_contribution": round(youtube_score * self.WEIGHT_YOUTUBE, 3),
                    "watched_seconds": payload.youtube_watch.watched_seconds,
                    "status": payload.youtube_watch.status,
                    "tab_switches": payload.youtube_watch.tab_switches_during_video
                },
                "sustained_focus": {
                    "score": focus_score,
                    "weight": self.WEIGHT_FOCUS,
                    "weighted_contribution": round(focus_score * self.WEIGHT_FOCUS, 3),
                    "tab_switches": payload.focus_task.tab_switch_count,
                    "unfocused_seconds": payload.focus_task.unfocused_duration_seconds
                },
                "distraction_recovery": {
                    "score": recovery_score,
                    "weight": self.WEIGHT_DISTRACTION,
                    "weighted_contribution": round(recovery_score * self.WEIGHT_DISTRACTION, 3),
                    "recovery_delay_seconds": payload.distraction_test.reaction_delay_seconds
                },
                "self_reported_baseline": {
                    "score": self_report_score,
                    "weight": self.WEIGHT_SELF_REPORT,
                    "weighted_contribution": round(self_report_score * self.WEIGHT_SELF_REPORT, 3),
                    "reported_session": payload.self_report.longest_session_minutes
                }
            }
        }

        return breakdown


retention_profiler_agent = RetentionProfilerAgent()
