"""Timetable Correction Agent (Phase 2).

Applies cognitive science constraints, circadian rhythm pacing, and the student's
calibrated retention profile to transform raw, overambitious, or chaotic study intentions
into realistic, high-retention daily schedules.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, date
from pydantic import BaseModel, Field
from backend.agents.base import BaseAgent
from backend.app.llm import llm_service


class SubjectItem(BaseModel):
    name: str
    difficulty: str = "medium"  # "hard", "medium", "light"
    allocated_hours: float = 1.5


class BusySlotItem(BaseModel):
    title: str = "College / Classes"
    start_time: str = "10:00"
    end_time: str = "13:00"
    category: str = "college"  # "college", "work", "gym", "commute", "other"


class RawScheduleBlock(BaseModel):
    start_time: str  # "08:00"
    end_time: str    # "12:00"
    subject: str = "General Study"
    difficulty: str = "hard"


class TimetableCalibrationRequest(BaseModel):
    student_id: Optional[int] = None
    student_name: str = "Student"
    grade_level: str = "engineering"
    wake_time: str = "06:30"
    sleep_time: str = "23:30"
    target_study_hours: float = 5.0
    retention_score: float = 0.75
    break_interval_minutes: int = 45
    break_duration_minutes: int = 10
    preferred_study_time: str = "morning"
    busy_slots: List[BusySlotItem] = Field(default_factory=list)
    subjects: List[SubjectItem] = Field(default_factory=lambda: [
        SubjectItem(name="Advanced Mathematics & Calculus", difficulty="hard", allocated_hours=1.5),
        SubjectItem(name="Data Structures & Algorithms", difficulty="hard", allocated_hours=1.5),
        SubjectItem(name="Computer Systems & OS Concepts", difficulty="medium", allocated_hours=1.0),
        SubjectItem(name="Active Recall & Flashcard Revision", difficulty="light", allocated_hours=1.0)
    ])


class RawScheduleDiagnosisRequest(BaseModel):
    student_id: Optional[int] = None
    student_name: str = "Student"
    grade_level: str = "engineering"
    wake_time: str = "06:30"
    sleep_time: str = "23:30"
    retention_score: float = 0.70
    break_interval_minutes: int = 45
    break_duration_minutes: int = 10
    busy_slots: List[BusySlotItem] = Field(default_factory=list)
    raw_blocks: List[RawScheduleBlock] = Field(default_factory=lambda: [
        RawScheduleBlock(start_time="08:00", end_time="12:00", subject="Advanced Mathematics", difficulty="hard"),
        RawScheduleBlock(start_time="12:00", end_time="16:00", subject="Data Structures & Algorithms", difficulty="hard"),
        RawScheduleBlock(start_time="17:00", end_time="21:00", subject="Operating Systems", difficulty="medium"),
        RawScheduleBlock(start_time="22:00", end_time="01:00", subject="Late Night Cramming", difficulty="hard")
    ])


def parse_time(t_str: str) -> datetime:
    return datetime.strptime(t_str.strip(), "%H:%M")


def format_time(dt: datetime) -> str:
    return dt.strftime("%H:%M")


def calculate_minutes_between(start_str: str, end_str: str) -> int:
    """Calculates duration in minutes, handling overnight crossing."""
    s = parse_time(start_str)
    e = parse_time(end_str)
    if e <= s:
        e += timedelta(days=1)
    return int((e - s).total_seconds() / 60)


class SchedulerAgent(BaseAgent):
    """Calibrates human-centric study schedules against retention scores, work commitments, and circadian rhythms."""

    def __init__(self):
        super().__init__(
            name="Timetable Correction Agent",
            description="Applies non-uniform circadian bio-pacing, meal/snack buffers, and work-commitment scheduling."
        )

    def run(self, payload: TimetableCalibrationRequest) -> Dict[str, Any]:
        """Generates a realistic, non-uniform, circadian timetable tailored to retention scores and daily commitments."""
        corrections: List[Dict[str, Any]] = []

        wake_dt = parse_time(payload.wake_time)
        sleep_dt = parse_time(payload.sleep_time)
        if sleep_dt <= wake_dt:
            sleep_dt += timedelta(days=1)

        # 1. Enforce Post-Wake Sleep Inertia Buffer (30-45 mins)
        first_study_dt = wake_dt + timedelta(minutes=45)
        corrections.append({
            "rule": "Sleep Inertia & Morning Buffer",
            "action": "Enforced 45-min post-wake buffer",
            "rationale": "Cortisol awakening response requires 30-45 minutes before prefrontal cortex reaches optimal analytical focus."
        })

        # 2. Dynamic Pacing Templates based on Empirical Retention Score
        ret = payload.retention_score
        if ret >= 0.75:
            # High Retention: Long deep focus blocks (60-75m morning, 45-55m afternoon, 25-30m night)
            primary_morning_mins = 70
            secondary_morning_mins = 55
            afternoon_mins = 50
            evening_mins = 45
            night_recall_mins = 30
            short_break_mins = 15
            pacing_tier = "Deep Focus Master (60m–75m adaptive blocks / 15m resets)"
        elif ret >= 0.50:
            # Medium Retention: Balanced progressive blocks (45-50m morning, 35-40m afternoon, 20-25m night)
            primary_morning_mins = 50
            secondary_morning_mins = 40
            afternoon_mins = 40
            evening_mins = 35
            night_recall_mins = 25
            short_break_mins = 10
            pacing_tier = "Standard Collegiate Rhythm (40m–50m adaptive blocks / 10m resets)"
        else:
            # Low / Sprint Retention: Micro-sprints (30m morning, 25m afternoon, 15-20m night)
            primary_morning_mins = 30
            secondary_morning_mins = 25
            afternoon_mins = 25
            evening_mins = 25
            night_recall_mins = 20
            short_break_mins = 10
            pacing_tier = "Sprint Pacing Rhythm (25m–35m sprint blocks / 10m resets)"

        # 3. Maximum Recommended Volume Cap
        max_recommended_hours = {
            "10th": 5.0,
            "12th": 6.5,
            "engineering": 7.5,
            "mtech": 8.0
        }.get(payload.grade_level, 7.0)

        effective_target_hours = min(payload.target_study_hours, max_recommended_hours)
        if payload.target_study_hours > max_recommended_hours:
            corrections.append({
                "rule": "Cognitive Burnout Prevention Cap",
                "action": f"Adjusted target study hours from {payload.target_study_hours}h to {effective_target_hours}h",
                "rationale": f"Exceeding {max_recommended_hours}h daily leads to rapid working memory degradation."
            })

        # 4. Subject Categorization by Cognitive Load:
        hard_subjects = [s for s in payload.subjects if s.difficulty == "hard"]
        medium_subjects = [s for s in payload.subjects if s.difficulty == "medium"]
        light_subjects = [s for s in payload.subjects if s.difficulty == "light"]

        # Fallbacks if certain difficulties are missing
        if not hard_subjects:
            hard_subjects = payload.subjects if payload.subjects else [SubjectItem(name="Core Analytical Focus", difficulty="hard", allocated_hours=1.5)]
        if not medium_subjects:
            medium_subjects = hard_subjects
        if not light_subjects:
            light_subjects = [SubjectItem(name="Active Recall & Flashcard Revision", difficulty="light", allocated_hours=0.5)]

        # Parse Busy / Work Slots
        busy_windows = []
        for b in payload.busy_slots:
            try:
                b_start = parse_time(b.start_time)
                b_end = parse_time(b.end_time)
                if b_end <= b_start:
                    b_end += timedelta(days=1)
                busy_windows.append({"title": b.title, "start": b_start, "end": b_end, "category": b.category})
            except Exception:
                continue

        # Sort busy windows chronologically
        busy_windows.sort(key=lambda x: x["start"])

        slots: List[Dict[str, Any]] = []
        slot_counter = 0

        # Slot 0: Morning Routine
        slots.append({
            "id": f"slot-{slot_counter}",
            "start": format_time(wake_dt),
            "end": format_time(first_study_dt),
            "type": "routine",
            "title": "🌅 Morning Routine & Sunlight Exposure",
            "description": "Hydrate, light physical movement, and natural light exposure to synchronize circadian clock.",
            "duration_minutes": 45,
            "status": "pending"
        })
        slot_counter += 1

        current_time = first_study_dt
        accumulated_study_mins = 0
        target_study_mins = int(effective_target_hours * 60)

        # Build Stage Plan: A sequence of distinct circadian study sessions with adaptive durations
        stage_templates = [
            {"stage": "Morning Deep Focus 1", "duration": primary_morning_mins, "subject_pool": hard_subjects, "desc": "Peak prefrontal alertness window for maximum analytical focus."},
            {"stage": "Morning Deep Focus 2", "duration": secondary_morning_mins, "subject_pool": hard_subjects, "desc": "Secondary deep focus block with interleaved problem solving."},
            {"stage": "Afternoon Application", "duration": afternoon_mins, "subject_pool": medium_subjects, "desc": "Applied conceptual work, code labs, and problem implementation."},
            {"stage": "Afternoon Deep Dive", "duration": afternoon_mins, "subject_pool": medium_subjects, "desc": "Conceptual synthesis and theory reinforcement."},
            {"stage": "Evening Problem Solving", "duration": evening_mins, "subject_pool": hard_subjects if len(hard_subjects) > 1 else medium_subjects, "desc": "Targeted practice questions and formula application."},
            {"stage": "Night Active Recall", "duration": night_recall_mins, "subject_pool": light_subjects, "desc": "Spaced repetition flashcards and summary recall before sleep."}
        ]

        # Scale stage durations if needed so total study time aligns well with target_study_mins
        raw_template_total = sum(st["duration"] for st in stage_templates)
        scale_factor = target_study_mins / float(raw_template_total)
        planned_blocks = []
        for st in stage_templates:
            dur = int(round(st["duration"] * scale_factor))
            dur = max(15, min(80, dur))
            planned_blocks.append({**st, "duration": dur})

        # Meal & Break flags
        lunch_scheduled = False
        snack_scheduled = False
        dinner_scheduled = False
        sub_indices = {"hard": 0, "medium": 0, "light": 0}

        block_idx = 0
        while accumulated_study_mins < target_study_mins and current_time < (sleep_dt - timedelta(minutes=50)):
            # 1. Check if current time is inside a busy slot
            inside_busy = None
            for bw in busy_windows:
                if bw["start"] <= current_time < bw["end"]:
                    inside_busy = bw
                    break

            if inside_busy:
                dur = int((inside_busy["end"] - current_time).total_seconds() / 60)
                if dur > 0:
                    icon = "🏋️" if inside_busy.get("category") == "gym" else "🏢"
                    slots.append({
                        "id": f"slot-{slot_counter}",
                        "start": format_time(current_time),
                        "end": format_time(inside_busy["end"]),
                        "type": "work",
                        "title": f"{icon} {inside_busy['title']}",
                        "description": "Protected personal commitment / college window.",
                        "duration_minutes": dur,
                        "status": "pending"
                    })
                    slot_counter += 1
                current_time = inside_busy["end"]
                continue

            # 2. Check if next busy slot starts very soon (within 20 mins) -> insert buffer
            next_busy = None
            for bw in busy_windows:
                if bw["start"] > current_time:
                    if next_busy is None or bw["start"] < next_busy["start"]:
                        next_busy = bw

            if next_busy and (next_busy["start"] - current_time).total_seconds() / 60 < 20:
                gap_mins = int((next_busy["start"] - current_time).total_seconds() / 60)
                if gap_mins > 5:
                    slots.append({
                        "id": f"slot-{slot_counter}",
                        "start": format_time(current_time),
                        "end": format_time(next_busy["start"]),
                        "type": "break",
                        "title": "🚶 Transition & Prep Buffer",
                        "description": "Prepare for upcoming commitment / commute.",
                        "duration_minutes": gap_mins,
                        "status": "pending"
                    })
                    slot_counter += 1
                current_time = next_busy["start"]
                continue

            hour = current_time.hour
            minute = current_time.minute

            # 3. 🥗 Lunch & Rest Buffer (around 12:30 - 13:45)
            if (hour == 13 or (hour == 12 and minute >= 30) or hour == 14) and not lunch_scheduled:
                lunch_end = current_time + timedelta(minutes=60)
                slots.append({
                    "id": f"slot-{slot_counter}",
                    "start": format_time(current_time),
                    "end": format_time(lunch_end),
                    "type": "meal",
                    "title": "🥗 Lunch & Rest Buffer (Downtime)",
                    "description": "Nutritious meal and zero-screen downtime to overcome postprandial dip.",
                    "duration_minutes": 60,
                    "status": "pending"
                })
                slot_counter += 1
                lunch_scheduled = True
                current_time = lunch_end
                continue

            # 4. ☕ Evening Tea / Snack & Mental Reset (around 16:30 - 17:30)
            if (hour >= 17 or (hour == 16 and minute >= 30)) and not snack_scheduled and lunch_scheduled:
                snack_end = current_time + timedelta(minutes=25)
                slots.append({
                    "id": f"slot-{slot_counter}",
                    "start": format_time(current_time),
                    "end": format_time(snack_end),
                    "type": "meal",
                    "title": "☕ Evening Tea / Snack & Cognitive Reset",
                    "description": "Light snack, hydration, and short walk to restore executive vigilance.",
                    "duration_minutes": 25,
                    "status": "pending"
                })
                slot_counter += 1
                snack_scheduled = True
                current_time = snack_end
                continue

            # 5. 🍲 Dinner & Family / Social Relaxation (around 19:30 - 20:45)
            if (hour >= 20 or (hour == 19 and minute >= 30)) and not dinner_scheduled:
                dinner_end = current_time + timedelta(minutes=60)
                slots.append({
                    "id": f"slot-{slot_counter}",
                    "start": format_time(current_time),
                    "end": format_time(dinner_end),
                    "type": "meal",
                    "title": "🍲 Dinner & Leisure Downtime",
                    "description": "Evening meal and cognitive relaxation with family/friends.",
                    "duration_minutes": 60,
                    "status": "pending"
                })
                slot_counter += 1
                dinner_scheduled = True
                current_time = dinner_end
                continue

            # 6. Select current stage template
            stage_info = planned_blocks[block_idx % len(planned_blocks)]
            rem_study = target_study_mins - accumulated_study_mins
            this_duration = min(stage_info["duration"], rem_study)

            # Check if this study block would clash with upcoming busy slot
            if next_busy and current_time + timedelta(minutes=this_duration) > next_busy["start"]:
                avail_mins = int((next_busy["start"] - current_time).total_seconds() / 60)
                if avail_mins >= 20:
                    this_duration = avail_mins
                else:
                    slots.append({
                        "id": f"slot-{slot_counter}",
                        "start": format_time(current_time),
                        "end": format_time(next_busy["start"]),
                        "type": "break",
                        "title": "🚶 Buffer & Transition Break",
                        "description": "Short rest and prep before commitment.",
                        "duration_minutes": avail_mins,
                        "status": "pending"
                    })
                    slot_counter += 1
                    current_time = next_busy["start"]
                    continue

            # Pick subject dynamically
            pool = stage_info["subject_pool"]
            pool_diff = pool[0].difficulty if pool else "medium"
            idx_in_pool = sub_indices[pool_diff] % len(pool)
            chosen_sub = pool[idx_in_pool]
            sub_indices[pool_diff] += 1

            block_end = current_time + timedelta(minutes=this_duration)
            slots.append({
                "id": f"slot-{slot_counter}",
                "start": format_time(current_time),
                "end": format_time(block_end),
                "type": "study",
                "title": f"📚 {chosen_sub.name}",
                "difficulty": chosen_sub.difficulty,
                "duration_minutes": this_duration,
                "description": f"{stage_info['stage']} ({this_duration}m) — {stage_info['desc']}",
                "status": "pending"
            })
            slot_counter += 1
            accumulated_study_mins += this_duration
            current_time = block_end
            block_idx += 1

            # 7. Add adaptive recovery break after study block
            if accumulated_study_mins < target_study_mins and current_time < (sleep_dt - timedelta(minutes=50)):
                # After 2 morning sessions, insert a longer 25-30m restorative pause if not already at lunch
                if block_idx == 2 and not lunch_scheduled and current_time.hour < 12:
                    break_dur = 25
                    break_title = "🌿 Mid-Morning Synaptic Consolidation Break"
                    break_desc = "Step outside, natural eye relaxation, and let newly formed neural pathways stabilize."
                else:
                    break_dur = short_break_mins
                    break_title = f"⚡ {short_break_mins}m Cognitive Reset Break"
                    break_desc = "Step away from screens, stretch, hydrate, and allow synaptic consolidation."

                if next_busy and current_time + timedelta(minutes=break_dur) > next_busy["start"]:
                    break_dur = max(5, int((next_busy["start"] - current_time).total_seconds() / 60))

                break_end = current_time + timedelta(minutes=break_dur)
                slots.append({
                    "id": f"slot-{slot_counter}",
                    "start": format_time(current_time),
                    "end": format_time(break_end),
                    "type": "break",
                    "title": break_title,
                    "duration_minutes": break_dur,
                    "description": break_desc,
                    "status": "pending"
                })
                slot_counter += 1
                current_time = break_end

        # Free time / Personal Unwinding before sleep
        wind_down_start = sleep_dt - timedelta(minutes=45)
        if current_time < wind_down_start:
            free_mins = int((wind_down_start - current_time).total_seconds() / 60)
            if free_mins > 0:
                slots.append({
                    "id": f"slot-{slot_counter}",
                    "start": format_time(current_time),
                    "end": format_time(wind_down_start),
                    "type": "free_time",
                    "title": "🎮 Free Time & Personal Unwinding",
                    "description": "Unstructured leisure, reading, or hobby time.",
                    "duration_minutes": free_mins,
                    "status": "pending"
                })
                slot_counter += 1
                current_time = wind_down_start

        slots.append({
            "id": f"slot-{slot_counter}",
            "start": format_time(wind_down_start),
            "end": format_time(sleep_dt),
            "type": "routine",
            "title": "🌙 Sleep Hygiene & Zero-Blue-Light Wind-Down",
            "description": "No screens or intensive revision; prepare circadian melatonin onset.",
            "duration_minutes": 45,
            "status": "pending"
        })

        corrections.append({
            "rule": "Circadian Pacing & Nutrition Rhythm",
            "action": f"Allocated non-uniform schedule with lunch, evening snack, and {pacing_tier}",
            "rationale": "Balances cognitive glucose replenishment, ultradian recovery, and peak prefrontal alertness windows."
        })

        # LLM Rationale Generation
        llm_prompt = f"""
Review and explain the calibrated study timetable generated for student {payload.student_name}.
Academic Level: {payload.grade_level}
Retention Score: {payload.retention_score} ({pacing_tier})
Total Calibrated Study Hours: {round(accumulated_study_mins / 60.0, 1)} hours
Total Study Blocks: {len([s for s in slots if s['type'] == 'study'])}
Busy Windows Handled: {len(payload.busy_slots)}

Provide a concise, highly motivating 2-3 sentence strategic rationale explaining how this schedule respects meals, work commitments, and circadian memory consolidation.
"""
        llm_explanation = llm_service.generate_text_sync(
            llm_prompt,
            system_instruction="You are an expert AI Study Scheduling Agent. Provide a concise, highly motivating 2-3 sentence strategic rationale."
        ) or (
            f"This schedule paces your study around your {pacing_tier}, placing heavy analytical subjects during peak morning prefrontal windows, "
            f"protecting dedicated lunch and evening snack buffers, and scheduling lighter active recall before night wind-down to prevent cognitive fatigue."
        )

        return {
            "status": "success",
            "student_name": payload.student_name,
            "grade_level": payload.grade_level,
            "target_study_hours": payload.target_study_hours,
            "actual_scheduled_study_hours": round(accumulated_study_mins / 60.0, 1),
            "focus_block_minutes": primary_morning_mins,
            "break_duration_minutes": short_break_mins,
            "pacing_tier": pacing_tier,
            "total_slots": len(slots),
            "slots": slots,
            "corrections_made": corrections,
            "ai_rationale": llm_explanation
        }

    def diagnose_raw_schedule(self, payload: RawScheduleDiagnosisRequest) -> Dict[str, Any]:
        """Audits a raw student schedule, detects cognitive burnout violations, and calculates delusion risk."""
        violations: List[Dict[str, Any]] = []
        delusion_points = 0.0

        wake_dt = parse_time(payload.wake_time)
        sleep_dt = parse_time(payload.sleep_time)
        if sleep_dt <= wake_dt:
            sleep_dt += timedelta(days=1)

        # 1. Total sleep hours check
        sleep_duration_hours = (24 * 60 - calculate_minutes_between(payload.wake_time, payload.sleep_time)) / 60.0
        if sleep_duration_hours < 7.0:
            sleep_debt = 7.5 - sleep_duration_hours
            delusion_points += sleep_debt * 18.0
            violations.append({
                "category": "Circadian & Sleep Debt",
                "severity": "critical",
                "title": f"Chronic Sleep Restriction ({round(sleep_duration_hours, 1)} hrs sleep)",
                "description": "Sleeping less than 7 hours severely degrades REM and Slow-Wave Sleep, blocking hippocampal memory consolidation.",
                "citation": "Walker, M. (2017). Why We Sleep: Unlocking the Power of Sleep and Dreams. Scribner."
            })

        # 2. Audit raw blocks for continuous cognitive overload
        total_raw_study_mins = 0
        continuous_overload_count = 0
        has_night_cramming = False

        subject_map: Dict[str, SubjectItem] = {}

        for b in payload.raw_blocks:
            duration = calculate_minutes_between(b.start_time, b.end_time)
            total_raw_study_mins += duration

            diff = b.difficulty or ("hard" if "math" in b.subject.lower() or "algo" in b.subject.lower() else "medium")
            if b.subject not in subject_map:
                subject_map[b.subject] = SubjectItem(
                    name=b.subject,
                    difficulty=diff,
                    allocated_hours=round(duration / 60.0, 1)
                )

            if duration > payload.break_interval_minutes:
                continuous_overload_count += 1
                excess_mins = duration - payload.break_interval_minutes
                delusion_points += (excess_mins / 30.0) * 12.0
                violations.append({
                    "category": "Cognitive Overload",
                    "severity": "high",
                    "title": f"Unsegmented {duration}m Block in '{b.subject}'",
                    "description": f"Studying continuously for {duration}m exceeds your calibrated {payload.break_interval_minutes}m attention span, leading to cognitive fatigue and illusory learning.",
                    "citation": "Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. Cognitive Science."
                })

            start_h = parse_time(b.start_time).hour
            end_h = parse_time(b.end_time).hour
            if start_h >= 23 or start_h <= 5 or end_h >= 24 or (end_h <= 5 and end_h > 0):
                has_night_cramming = True
                delusion_points += 22.0
                violations.append({
                    "category": "Circadian Desynchrony",
                    "severity": "critical",
                    "title": f"Late-Night Analytical Cramming ({b.start_time} - {b.end_time})",
                    "description": "Prefrontal cortex executive function drops by ~40% after midnight. Complex analytical problem-solving is severely impaired.",
                    "citation": "Gazzaley, A., & Rosen, L. D. (2016). The Distracted Mind: Ancient Brains in a High-Tech World. MIT Press."
                })

        total_raw_study_hours = round(total_raw_study_mins / 60.0, 1)

        max_limit = 7.5
        if total_raw_study_hours > max_limit:
            delusion_points += (total_raw_study_hours - max_limit) * 15.0
            violations.append({
                "category": "Burnout Delusion",
                "severity": "high",
                "title": f"Unrealistic Daily Volume ({total_raw_study_hours}h total planned)",
                "description": f"Planning {total_raw_study_hours}h of raw study in 24 hours triggers acute cognitive depletion and high dropout rates within 3 days.",
                "citation": "Kruger, J., & Dunning, D. (1999). Unskilled and unaware of it: How difficulties in recognizing one's own incompetence lead to inflated self-assessments."
            })

        delusion_risk_score = round(min(98.0, max(12.0, delusion_points)), 1)

        if delusion_risk_score >= 70.0:
            risk_tier = "Critical Burnout Delusion"
            risk_color = "#ef4444"
        elif delusion_risk_score >= 40.0:
            risk_tier = "Moderate Delusion / High Fatigue Risk"
            risk_color = "#f59e0b"
        else:
            risk_tier = "Low Cognitive Risk"
            risk_color = "#10b981"

        subjects_list = list(subject_map.values()) if subject_map else [
            SubjectItem(name="Core Subject A", difficulty="hard", allocated_hours=1.5),
            SubjectItem(name="Core Subject B", difficulty="medium", allocated_hours=1.5)
        ]

        target_calibrated_hours = min(6.5, max(3.0, total_raw_study_hours * 0.75))
        calib_req = TimetableCalibrationRequest(
            student_id=payload.student_id,
            student_name=payload.student_name,
            grade_level=payload.grade_level,
            wake_time=payload.wake_time,
            sleep_time=payload.sleep_time,
            target_study_hours=target_calibrated_hours,
            retention_score=payload.retention_score,
            break_interval_minutes=payload.break_interval_minutes,
            break_duration_minutes=payload.break_duration_minutes,
            busy_slots=payload.busy_slots,
            subjects=subjects_list
        )

        calibrated_solution = self.run(calib_req)

        ai_diagnosis_prompt = f"""
You are the AI Timetable Correction Agent.
Student {payload.student_name} submitted a raw study schedule totaling {total_raw_study_hours} hours.
Calculated Delusion Risk Score: {delusion_risk_score}% ({risk_tier}).
Total Violations: {len(violations)}.
Continuous Overload Blocks: {continuous_overload_count}.
Night Cramming: {has_night_cramming}.

Write a sharp, empathetic, and scientifically constructive diagnostic feedback (2-3 sentences) explaining the main flaw in their raw schedule and how the auto-corrected timetable fixes it.
"""
        agent_feedback = llm_service.generate_text_sync(
            ai_diagnosis_prompt,
            system_instruction="You are an expert cognitive scheduling AI. Provide sharp, compassionate, scientifically backed feedback."
        ) or (
            f"Your raw schedule contains a {delusion_risk_score}% Burnout Risk due to unsegmented continuous study blocks and missing recovery buffers. "
            f"The Timetable Correction Agent has re-sliced your study goals into retention-calibrated focus intervals with dedicated synaptic consolidation breaks."
        )

        return {
            "status": "success",
            "student_name": payload.student_name,
            "raw_total_study_hours": total_raw_study_hours,
            "delusion_risk_score": delusion_risk_score,
            "risk_tier": risk_tier,
            "risk_color": risk_color,
            "violations_count": len(violations),
            "violations": violations,
            "agent_feedback": agent_feedback,
            "calibrated_schedule": calibrated_solution
        }

    def generate_ics_calendar(self, slots: List[Dict[str, Any]], student_name: str = "Student") -> str:
        """Generates standard iCalendar (.ics) RFC 5545 format for the schedule slots."""
        tomorrow = date.today() + timedelta(days=1)
        date_str = tomorrow.strftime("%Y%m%d")

        ics_lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//StudyPrepAI//TimetableCorrectionAgent v2.0//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            f"X-WR-CALNAME:StudyPrep AI - {student_name}'s Calibrated Plan",
            "X-WR-TIMEZONE:UTC"
        ]

        for idx, slot in enumerate(slots):
            try:
                start_h, start_m = slot["start"].split(":")
                end_h, end_m = slot["end"].split(":")
                dt_start = f"{date_str}T{start_h.zfill(2)}{start_m.zfill(2)}00"
                dt_end = f"{date_str}T{end_h.zfill(2)}{end_m.zfill(2)}00"
                uid = f"slot-{tomorrow.strftime('%Y%m%d')}-{idx}-{slot['start'].replace(':', '')}@studyprepai.internal"

                summary = slot.get("title", "Study Session").replace(",", "\\,")
                desc = slot.get("description", "").replace(",", "\\,").replace("\n", " ")

                event = [
                    "BEGIN:VEVENT",
                    f"UID:{uid}",
                    f"DTSTAMP:{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}",
                    f"DTSTART:{dt_start}",
                    f"DTEND:{dt_end}",
                    f"SUMMARY:{summary}",
                    f"DESCRIPTION:{desc}",
                    "STATUS:CONFIRMED"
                ]

                if slot.get("type") == "study":
                    event.extend([
                        "BEGIN:VALARM",
                        "TRIGGER:-PT5M",
                        "ACTION:DISPLAY",
                        f"DESCRIPTION:Upcoming Focus Block: {summary}",
                        "END:VALARM"
                    ])

                event.append("END:VEVENT")
                ics_lines.extend(event)
            except Exception:
                continue

        ics_lines.append("END:VCALENDAR")
        return "\r\n".join(ics_lines)


scheduler_agent = SchedulerAgent()
