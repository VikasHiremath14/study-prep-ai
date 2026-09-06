"""Retention & Attention Profiling Agent (Phase 1).

Measures student attention endurance, cognitive load resistance, and break intervals
using rigorous neurocognitive and behavioral assessments grounded in published cognitive science.

Scientific Foundations & Research Citations:
1. Sustained Attention to Response Task (SART) (25% weight):
   - Theoretical Grounding: Executive Inhibitory Control & Sustained Vigilance
   - Citation: Robertson, I. H., Manly, T., Andrade, J., Baddeley, B. T., & Yiend, J. (1997).
     "'Oops!': Performance correlates of everyday cognitive slips on sustained attention to response task (SART)."
     Neuropsychologia, 35(6), 747–758.
   - Cognitive Measure: Inhibitory control (commission errors on '3') and sustained vigilance (omission errors).

2. Working Memory Digit Span Task (25% weight):
   - Theoretical Grounding: Working Memory Buffer & Central Executive Capacity
   - Citation: Baddeley, A. D. (1986). "Working Memory." Oxford University Press.
   - Citation: Miller, G. A. (1956). "The magical number seven, plus or minus two." Psychological Review, 63(2), 81–97.
   - Cognitive Measure: Active working memory capacity ($7 \pm 2$) essential for analytical problem-solving.

3. Delayed Free Recall & Memory Decay (20% weight):
   - Theoretical Grounding: Testing Effect & Hippocampal Memory Consolidation
   - Citation: Roediger, H. L., & Karpicke, J. D. (2006). "Test-enhanced learning: Taking memory tests improves long-term retention."
     Psychological Science, 17(3), 249–255.
   - Citation: Ebbinghaus, H. (1885). "Memory: A Contribution to Experimental Psychology."
   - Cognitive Measure: Free recall accuracy after working memory buffer flush, measuring memory decay curve.

4. Short-Form Video Dopamine Tolerance (15% weight):
   - Theoretical Grounding: Media Multitasking & Bottom-Up Dopamine Foraging
   - Citation: Gazzaley, A., & Rosen, L. D. (2016). "The Distracted Mind: Ancient Brains in a High-Tech World." MIT Press.
   - Citation: Ophir, E., Nass, C., & Wagner, A. D. (2009). "Cognitive control in media multitaskers." PNAS, 106(37), 15583–15587.
   - Cognitive Measure: Dopamine decay threshold when exposed to low-friction micro-rewards (15s, 30s, 45s).

5. Series / Show Completion Ratio (5% weight):
   - Theoretical Grounding: Long-term Goal Perseverance & Zeigarnik Effect
   - Citation: Duckworth, A. L. et al. (2007). "Grit: Perseverance and passion for long-term goals." JPSP, 92(6), 1087–1101.
   - Cognitive Measure: Habitual follow-through across multi-stage intellectual arcs vs novelty abandonment.

6. Metacognitive Calibration & Optimism Bias Discount (10% weight):
   - Theoretical Grounding: Dunning-Kruger Effect & Metacognitive Monitoring
   - Citation: Kruger, J., & Dunning, D. (1999). "Unskilled and unaware of it: Inflated self-assessments." JPSP, 77(6), 1121–1134.
   - Cognitive Measure: Discrepancy between perceived self-reported study endurance vs empirical cognitive battery.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.agents.base import BaseAgent
from backend.app.llm import llm_service
from backend.ml.half_life_regression import hlr_model


# ---------------------------------------------------------
# Pydantic Input Schemas
# ---------------------------------------------------------

class SARTTestResult(BaseModel):
    total_trials: int = 18
    commission_errors: int = 0  # Pressed on '3' (No-Go error)
    omission_errors: int = 0    # Missed non-3 Go target
    no_go_count: int = 4
    go_count: int = 14
    average_reaction_time_ms: float = 450.0
    sart_score: float = 0.85


class DigitSpanTestResult(BaseModel):
    max_span_capacity: int = 6  # 4 to 8
    working_memory_score: float = 0.80
    levels_attempted: int = 5
    trials: List[Dict[str, Any]] = Field(default_factory=list)


class DelayedRecallTestResult(BaseModel):
    total_target_words: int = 8
    correct_recalled_count: int = 6
    intrusions_count: int = 0
    recall_score: float = 0.75
    recalled_words: List[str] = Field(default_factory=list)
    target_words: List[str] = Field(default_factory=list)


class ReelClipWatch(BaseModel):
    clip_id: str
    title: str = "Reel"
    clip_type: str = "short"  # "short" (15s), "medium" (30s), "long" (45s)
    duration_seconds: float
    watched_seconds: float
    completion_status: str = "full"  # "full", "halfway", "dropped"
    skipped: bool = False


class SeriesItem(BaseModel):
    title: str
    status: str = "completed"  # "completed", "partially_completed", "dropped"


class SelfReportData(BaseModel):
    longest_session_minutes: int = 60
    typical_break_frequency_minutes: int = 45
    preferred_study_time: str = "morning"


class RetentionProfilingPayload(BaseModel):
    student_id: Optional[int] = None
    user_id: Optional[int] = None
    student_name: str = "Student"
    grade_level: str = "engineering"  # 10th, 12th, engineering, mtech
    wake_time: Optional[str] = "06:30"
    sleep_time: Optional[str] = "23:30"
    sart_test: SARTTestResult = Field(default_factory=SARTTestResult)
    digit_span_test: DigitSpanTestResult = Field(default_factory=DigitSpanTestResult)
    delayed_recall_test: DelayedRecallTestResult = Field(default_factory=DelayedRecallTestResult)
    reel_watches: List[ReelClipWatch] = Field(default_factory=list)
    series_habits: List[SeriesItem] = Field(default_factory=list)
    self_report: SelfReportData = Field(default_factory=SelfReportData)



# ---------------------------------------------------------
# Behavioral Scoring Functions Grounded in Literature
# ---------------------------------------------------------

def compute_sart_score(sart: SARTTestResult) -> float:
    """Calculates executive inhibitory control and sustained vigilance (Robertson et al. 1997)."""
    no_go = max(sart.no_go_count, 1)
    go = max(sart.go_count, 1)

    comm_rate = min(sart.commission_errors / no_go, 1.0)
    omiss_rate = min(sart.omission_errors / go, 1.0)

    # Commission errors (mind wandering / impulsivity) penalized more heavily than omission
    score = 1.0 - (0.55 * comm_rate) - (0.35 * omiss_rate)
    return round(max(0.10, min(1.0, score)), 3)


def compute_digit_span_score(digit_span: DigitSpanTestResult) -> float:
    """Calculates working memory capacity score (Baddeley 1986; Miller 1956)."""
    span = max(3, min(8, digit_span.max_span_capacity))
    # Normalized between Span 3 (0.2) and Span 8 (1.0)
    score = (span - 3) / 5.0
    return round(max(0.20, min(1.0, score)), 3)


def compute_delayed_recall_score(recall: DelayedRecallTestResult) -> float:
    """Calculates free recall retention score after buffer flush (Roediger & Karpicke 2006)."""
    total = max(recall.total_target_words, 1)
    acc = min(recall.correct_recalled_count / total, 1.0)
    return round(max(0.10, min(1.0, acc)), 3)


def compute_reel_score(reel_watches: List[ReelClipWatch]) -> float:
    """Calculates short-form dopamine tolerance curve (Gazzaley & Rosen 2016)."""
    if not reel_watches:
        return 0.70  # Neutral default

    clip_scores = []
    for rw in reel_watches:
        if rw.duration_seconds <= 0:
            continue
        ratio = min(rw.watched_seconds / rw.duration_seconds, 1.0)
        if rw.completion_status == "full" or ratio >= 0.90:
            score = 1.0
        elif rw.completion_status == "halfway" or ratio >= 0.40:
            score = 0.55
        else:
            score = 0.15
        clip_scores.append(score)

    if not clip_scores:
        return 0.70

    return round(sum(clip_scores) / len(clip_scores), 3)


def compute_series_score(series_items: List[SeriesItem]) -> float:
    """Calculates long-term follow-through habit (Duckworth Grit 2007)."""
    if not series_items:
        return 0.70

    score_map = {
        "completed": 1.0,
        "partially_completed": 0.55,
        "dropped": 0.20
    }
    total = sum(score_map.get(item.status.lower(), 0.6) for item in series_items)
    return round(total / len(series_items), 3)


def compute_self_report_score(self_report: SelfReportData) -> float:
    """Calculates self-reported baseline focus endurance (Kruger & Dunning 1999)."""
    minutes = self_report.longest_session_minutes
    if minutes >= 90:
        return 1.0
    elif minutes >= 60:
        return 0.80
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
    """Behavioral Retention & Attention Profiling Agent backed by SART, Digit Span, and Delayed Recall."""

    # Weights summing to 1.0
    WEIGHT_SART = 0.25         # 25% Sustained Attention to Response Task (Robertson et al. 1997)
    WEIGHT_DIGIT_SPAN = 0.25   # 25% Working Memory Digit Span (Baddeley 1986 / Miller 1956)
    WEIGHT_RECALL = 0.20       # 20% Delayed Free Recall & Retention Decay (Roediger & Karpicke 2006)
    WEIGHT_REEL = 0.15         # 15% Short-form Dopamine Tolerance (Gazzaley & Rosen 2016)
    WEIGHT_SERIES = 0.05       # 5% Long-term Grit / Series Habit (Duckworth 2007)
    WEIGHT_SELF_REPORT = 0.10  # 10% Metacognitive baseline (Dunning-Kruger 1999)

    def __init__(self):
        super().__init__(
            name="Retention Profiler",
            description="Evaluates student attention span using SART, Digit Span, Delayed Recall, and Reels simulation."
        )

    def run(self, payload: RetentionProfilingPayload) -> Dict[str, Any]:
        """Calculates comprehensive retention breakdown, cognitive indices, and academic references."""
        sart_score = compute_sart_score(payload.sart_test)
        digit_span_score = compute_digit_span_score(payload.digit_span_test)
        recall_score = compute_delayed_recall_score(payload.delayed_recall_test)
        reel_score = compute_reel_score(payload.reel_watches)
        series_score = compute_series_score(payload.series_habits)
        self_report_score = compute_self_report_score(payload.self_report)

        # Empirical behavioral score (excluding self-report)
        behavioral_raw = (
            (self.WEIGHT_SART * sart_score) +
            (self.WEIGHT_DIGIT_SPAN * digit_span_score) +
            (self.WEIGHT_RECALL * recall_score) +
            (self.WEIGHT_REEL * reel_score) +
            (self.WEIGHT_SERIES * series_score)
        ) / 0.90  # normalized to 1.0

        # Combined Weighted Retention Score (0.0 to 1.0)
        retention_score = round(
            (self.WEIGHT_SART * sart_score) +
            (self.WEIGHT_DIGIT_SPAN * digit_span_score) +
            (self.WEIGHT_RECALL * recall_score) +
            (self.WEIGHT_REEL * reel_score) +
            (self.WEIGHT_SERIES * series_score) +
            (self.WEIGHT_SELF_REPORT * self_report_score),
            3
        )

        # Metacognitive Calibration Gap
        meta_bias_delta = round(self_report_score - behavioral_raw, 3)
        if meta_bias_delta > 0.22:
            meta_bias_label = "Significant Optimism Bias (Perceived stamina exceeds cognitive tests)"
            meta_bias_risk = "high"
        elif meta_bias_delta < -0.15:
            meta_bias_label = "Underestimation (Higher actual cognitive endurance than self-reported)"
            meta_bias_risk = "low"
        else:
            meta_bias_label = "Accurate Metacognitive Calibration (Realistic self-awareness)"
            meta_bias_risk = "calibrated"

        # Distraction Vulnerability Index (DVI)
        # Based on SART commission errors and reel skips
        comm_errors = payload.sart_test.commission_errors
        dvi_score = round(min(1.0, max(0.05, (comm_errors * 0.20) + (1.0 - reel_score) * 0.40)), 3)

        # Calibrated Break Interval Mapping
        if retention_score >= 0.80:
            break_interval = 60
            focus_tier = "Deep Focus Master"
            break_length = 15
            summary = "Exceptional working memory and sustained vigilance. Highly resilient to distraction, optimal for 60-minute deep study blocks."
        elif retention_score >= 0.60:
            break_interval = 45
            focus_tier = "Standard Collegiate Rhythm"
            break_length = 10
            summary = "Solid attention endurance with occasional inhibitory slips. Optimal performance with 45-minute focus blocks and 10-minute active resets."
        elif retention_score >= 0.40:
            break_interval = 30
            focus_tier = "Sprint Pacing Rhythm"
            break_length = 5
            summary = "Moderate attention stamina prone to mind-wandering under fatigue. Recommended 30-minute high-intensity focus intervals with 5-minute resets."
        else:
            break_interval = 20
            focus_tier = "Micro-Focus Recovery"
            break_length = 5
            summary = "High vulnerability to executive fatigue and cognitive overload. Calibrated for 20-minute micro-focus sessions to preserve memory consolidation."

        # AI Cognitive Synthesis via LLM Service
        signals_dict = {
            "sart_vigilance": {"score": sart_score, "commission_errors": comm_errors},
            "digit_span_working_memory": {"score": digit_span_score, "max_span": payload.digit_span_test.max_span_capacity},
            "delayed_recall_retention": {"score": recall_score, "correct_words": payload.delayed_recall_test.correct_recalled_count},
            "instagram_reels_tolerance": {"score": reel_score},
            "series_completion_habit": {"score": series_score},
            "self_reported_baseline": {"score": self_report_score}
        }
        meta_dict = {
            "bias_delta": meta_bias_delta,
            "calibration_diagnosis": meta_bias_label,
            "risk_level": meta_bias_risk
        }
        dvi_dict = {
            "dvi_score": dvi_score,
            "sart_commission_errors": comm_errors
        }

        ai_synthesis = llm_service.synthesize_retention_diagnosis(
            student_name=payload.student_name,
            grade_level=payload.grade_level,
            retention_score=retention_score,
            break_interval=break_interval,
            focus_tier=focus_tier,
            signals_data=signals_dict,
            meta_data=meta_dict,
            dvi_data=dvi_dict
        )

        breakdown = {
            "retention_score": retention_score,
            "break_interval_minutes": break_interval,
            "recommended_break_duration_minutes": break_length,
            "focus_tier": focus_tier,
            "explanation": summary,
            "ai_synthesis": ai_synthesis,
            "metacognitive_analysis": {
                "self_report_score": self_report_score,
                "behavioral_empirical_score": round(behavioral_raw, 3),
                "bias_delta": meta_bias_delta,
                "calibration_diagnosis": meta_bias_label,
                "risk_level": meta_bias_risk
            },
            "distraction_vulnerability": {
                "dvi_score": dvi_score,
                "sart_commission_errors": comm_errors
            },
            "signals": {
                "sart_vigilance": {
                    "score": sart_score,
                    "weight": self.WEIGHT_SART,
                    "weighted_contribution": round(sart_score * self.WEIGHT_SART, 3),
                    "commission_errors": comm_errors,
                    "omission_errors": payload.sart_test.omission_errors,
                    "reaction_time_ms": payload.sart_test.average_reaction_time_ms,
                    "citation": "Robertson et al. (1997) - Sustained Attention to Response Task (SART)"
                },
                "digit_span_working_memory": {
                    "score": digit_span_score,
                    "weight": self.WEIGHT_DIGIT_SPAN,
                    "weighted_contribution": round(digit_span_score * self.WEIGHT_DIGIT_SPAN, 3),
                    "max_span_capacity": payload.digit_span_test.max_span_capacity,
                    "citation": "Baddeley (1986) / Miller (1956) - Working Memory Capacity"
                },
                "delayed_recall_retention": {
                    "score": recall_score,
                    "weight": self.WEIGHT_RECALL,
                    "weighted_contribution": round(recall_score * self.WEIGHT_RECALL, 3),
                    "recalled_count": payload.delayed_recall_test.correct_recalled_count,
                    "target_count": payload.delayed_recall_test.total_target_words,
                    "citation": "Roediger & Karpicke (2006) / Ebbinghaus (1885) - Delayed Free Recall & Testing Effect"
                },
                "instagram_reels_tolerance": {
                    "score": reel_score,
                    "weight": self.WEIGHT_REEL,
                    "weighted_contribution": round(reel_score * self.WEIGHT_REEL, 3),
                    "clips_evaluated": len(payload.reel_watches),
                    "citation": "Gazzaley & Rosen (2016 MIT Press) - Media Multitasking & Dopamine Loops"
                },
                "series_completion_habit": {
                    "score": series_score,
                    "weight": self.WEIGHT_SERIES,
                    "weighted_contribution": round(series_score * self.WEIGHT_SERIES, 3),
                    "items_count": len(payload.series_habits),
                    "citation": "Duckworth et al. (2007) - Grit & Zeigarnik Effect"
                },
                "self_reported_baseline": {
                    "score": self_report_score,
                    "weight": self.WEIGHT_SELF_REPORT,
                    "weighted_contribution": round(self_report_score * self.WEIGHT_SELF_REPORT, 3),
                    "reported_session": payload.self_report.longest_session_minutes,
                    "citation": "Kruger & Dunning (1999) - Metacognitive Optimism Bias"
                }
            },
            "scholarly_references": [
                {
                    "scholar": "Dr. Ian H. Robertson (Trinity College Dublin)",
                    "publication": "'Oops!': Sustained Attention to Response Task (SART) (Neuropsychologia 1997)",
                    "application": "Measures executive inhibitory failure (commission errors on '3') and sustained vigilance."
                },
                {
                    "scholar": "Dr. Alan Baddeley & Dr. George Miller",
                    "publication": "Working Memory (Oxford 1986) & The Magical Number Seven (Psychological Review 1956)",
                    "application": "Evaluates working memory span buffer capacity for complex analytical problem-solving."
                },
                {
                    "scholar": "Dr. Henry L. Roediger III & Dr. Jeffrey D. Karpicke",
                    "publication": "Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention (Psychological Science 2006)",
                    "application": "Quantifies free recall retrieval without cues after cognitive buffer flush."
                },
                {
                    "scholar": "Dr. Adam Gazzaley (UCSF) & Dr. Larry Rosen (CSUDH)",
                    "publication": "The Distracted Mind: Ancient Brains in a High-Tech World (MIT Press 2016)",
                    "application": "Models short-form video dopamine foraging and bottom-up interference vulnerability."
                },
                {
                    "scholar": "Dr. Angela Duckworth (University of Pennsylvania)",
                    "publication": "Grit: Perseverance and Passion for Long-Term Goals (JPSP 2007)",
                    "application": "Uses multi-episode series completion as a proxy for long-term module follow-through."
                },
                {
                    "scholar": "Dr. Justin Kruger & Dr. David Dunning (Cornell University)",
                    "publication": "Unskilled and Unaware of It: Metacognitive Deficits (JPSP 1999)",
                    "application": "Calculates Metacognitive Optimism Gap to discount self-reported overconfidence."
                }
            ]
        }

        # -----------------------------------------------------
        # Machine Learning: Duolingo Half-Life Regression (HLR)
        # -----------------------------------------------------
        student_features = hlr_model.extract_features(
            sart_vigilance=sart_score,
            digit_span_wm=digit_span_score,
            delayed_recall_base=recall_score,
            dopamine_tolerance=reel_score,
            repetition_count=1,
            prior_quiz_accuracy=round((recall_score + sart_score) / 2.0, 3)
        )
        predicted_half_life = hlr_model.predict_half_life(student_features)
        decay_curve_points = hlr_model.generate_decay_curve(student_features, max_hours=168.0, num_points=35)
        ml_model_summary = {
            "model_name": "Duolingo Half-Life Regression (Settles & Meeder, ACL 2016)",
            "predicted_half_life_hours": predicted_half_life,
            "predicted_half_life_days": round(predicted_half_life / 24.0, 2),
            "recall_prob_24h": hlr_model.predict_recall_probability(student_features, 24.0),
            "recall_prob_48h": hlr_model.predict_recall_probability(student_features, 48.0),
            "recall_prob_7d": hlr_model.predict_recall_probability(student_features, 168.0),
            "model_metrics": hlr_model.last_metrics,
            "learned_parameters": {name: round(float(w), 4) for name, w in zip(hlr_model.FEATURE_NAMES, hlr_model.theta)},
            "decay_curve": decay_curve_points
        }

        breakdown["forgetting_curve_ml"] = ml_model_summary

        return breakdown


retention_profiler_agent = RetentionProfilerAgent()
