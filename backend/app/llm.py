"""Unified LLM Service Layer for Google Gemini and Agentic Synthesis.

Provides robust access to Gemini models with fallback resilience, structured output parsing,
and prompt engineering tailored for cognitive profiling and timetable calibration.
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List
import httpx
from backend.app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Manages Gemini LLM invocations and cognitive prompt generation."""

    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.api_key = (
            settings.LLM_API_KEY or 
            os.environ.get("GEMINI_API_KEY") or 
            os.environ.get("LLM_API_KEY") or 
            ""
        ).strip()

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate_text_async(self, prompt: str, system_instruction: str = "") -> Optional[str]:
        """Asynchronously calls Gemini API via REST endpoint."""
        if not self.api_key:
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        
        contents = []
        if system_instruction:
            contents.append({"role": "user", "parts": [{"text": f"System Instruction: {system_instruction}\n\nTask: {prompt}"}]})
        else:
            contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 1024,
                "topP": 0.8
            }
        }

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        content_parts = candidates[0].get("content", {}).get("parts", [])
                        if content_parts:
                            return content_parts[0].get("text", "")
                else:
                    logger.warning(f"Gemini API returned {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Error calling Gemini LLM: {e}")
        return None

    def generate_text_sync(self, prompt: str, system_instruction: str = "") -> Optional[str]:
        """Synchronously calls Gemini API via REST endpoint."""
        if not self.api_key:
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        
        contents = []
        if system_instruction:
            contents.append({"role": "user", "parts": [{"text": f"System Instruction: {system_instruction}\n\nTask: {prompt}"}]})
        else:
            contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 1024,
                "topP": 0.8
            }
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        content_parts = candidates[0].get("content", {}).get("parts", [])
                        if content_parts:
                            return content_parts[0].get("text", "")
                else:
                    logger.warning(f"Gemini API returned {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Error calling Gemini LLM: {e}")
        return None

    def generate_json_sync(self, prompt: str, system_instruction: str = "") -> Optional[Dict[str, Any]]:
        """Synchronously calls Gemini API and returns parsed JSON object or None."""
        text = self.generate_text_sync(prompt, system_instruction)
        if not text:
            return None
        try:
            clean_json = text.strip()
            if clean_json.startswith("```"):
                clean_json = clean_json.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            return json.loads(clean_json)
        except Exception as e:
            logger.warning(f"Failed to parse LLM response into JSON: {e}")
            return None

    def synthesize_retention_diagnosis(
        self,
        student_name: str,
        grade_level: str,
        retention_score: float,
        break_interval: int,
        focus_tier: str,
        signals_data: Dict[str, Any],
        meta_data: Dict[str, Any],
        dvi_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generates an agentic LLM synthesis of the student's cognitive profile."""
        prompt = f"""
Analyze the cognitive attention profile for this student based on empirical behavioral signals.

Student Name: {student_name}
Academic Level: {grade_level}
Retention Score: {retention_score} (0.0 to 1.0)
Calibrated Focus Block: {break_interval} minutes
Focus Tier: {focus_tier}

Behavioral Telemetry Signals:
- Long-Term Series Habit Score: {signals_data.get('series_completion', {}).get('score')}
- Short-Form Reel Dopamine Resistance: {signals_data.get('instagram_reels', {}).get('score')}
- Video Lecture Focus & Tab Resistance: {signals_data.get('youtube_video_endurance', {}).get('score')}
- Analytical Reading Focus: {signals_data.get('sustained_focus', {}).get('score')}
- Distraction Recovery Latency: {signals_data.get('distraction_recovery', {}).get('score')}
- Metacognitive Gap (Self-Assessment vs Behavioral): {meta_data.get('bias_delta')} ({meta_data.get('calibration_diagnosis')})
- Distraction Vulnerability Index: {dvi_data.get('dvi_score')} (Tab Switches: {dvi_data.get('total_tab_switches')})

Please provide a concise JSON object with the following structure:
{{
  "ai_summary": "1-2 sentence executive assessment of their cognitive stamina",
  "primary_cognitive_strength": "Specific strength based on data",
  "attention_vulnerability": "Specific vulnerability based on data",
  "circadian_recommendation": "Optimal study timing advice",
  "actionable_protocols": ["Protocol 1", "Protocol 2", "Protocol 3"]
}}
"""
        system_instruction = "You are an expert Cognitive Neuroscientist and Adaptive Learning AI Agent. Return strictly valid JSON."

        llm_response = self.generate_text_sync(prompt, system_instruction)
        
        if llm_response:
            try:
                # Clean code fences if present
                clean_json = llm_response.strip()
                if clean_json.startswith("```"):
                    clean_json = clean_json.split("\n", 1)[1].rsplit("```", 1)[0].strip()
                parsed = json.loads(clean_json)
                parsed["generated_by"] = "Gemini 1.5 Flash (Live LLM)"
                return parsed
            except Exception as e:
                logger.warning(f"Failed to parse LLM JSON: {e}, falling back to adaptive engine.")

        # Fallback intelligent cognitive synthesis engine
        if retention_score >= 0.75:
            summary = f"{student_name} exhibits superior executive working memory and high resistance to dopamine-seeking distraction loops."
            strength = "High sustained attention endurance and strong tab-switching inhibition during deep reading."
            vuln = "Risk of cognitive fatigue if deep sessions exceed 60 minutes without dedicated mental resets."
            timing = "Schedule heavy analytical mathematics and core engineering modules in the morning peak (8:00 AM - 11:30 AM)."
            protocols = [
                f"Enforce {break_interval}-minute uninterrupted deep focus blocks paired with 15-minute active recovery.",
                "Utilize dual-coding visualization (diagramming) to maximize long-term synaptic retention.",
                "Keep phone in another room to prevent low-level attentional residue."
            ]
        elif retention_score >= 0.50:
            summary = f"{student_name} demonstrates solid baseline focus with moderate susceptibility to short-form media and desktop notifications."
            strength = "Strong visual lecture comprehension when content is directly aligned with personal interest."
            vuln = f"Tab-switching tendency ({dvi_data.get('total_tab_switches', 1)} observed switches) interrupts working memory flow."
            timing = "Distribute study into two high-intensity blocks: Mid-morning (9:00 AM - 12:00 PM) and Early Evening (5:00 PM - 7:30 PM)."
            protocols = [
                f"Adopt {break_interval}-minute Pomodoro sprint rhythms with strictly timed 10-minute breaks.",
                "Close all auxiliary browser tabs before starting analytical reading modules.",
                "Use active recall self-quizzing at the 30-minute mark to reinforce synaptic pathways."
            ]
        else:
            summary = f"{student_name} has high sensitivity to rapid task-switching and short-form dopamine stimulation."
            strength = "Fast multi-tasking adaptability and quick visual scanning."
            vuln = "Elevated distraction vulnerability and working memory overload during continuous reading (>25 mins)."
            timing = "Leverage shorter 20-minute morning focus sprints followed by physical movement resets."
            protocols = [
                "Cap initial study sprints at 20 minutes to prevent prefrontal cognitive exhaustion.",
                "Implement full-screen reader mode with notification muting active during study hours.",
                "Incorporate 5-minute hydration and non-screen physical resets between every sprint."
            ]

        return {
            "ai_summary": summary,
            "primary_cognitive_strength": strength,
            "attention_vulnerability": vuln,
            "circadian_recommendation": timing,
            "actionable_protocols": protocols,
            "generated_by": "Adaptive Cognitive Synthesis Engine"
        }


llm_service = LLMService()
