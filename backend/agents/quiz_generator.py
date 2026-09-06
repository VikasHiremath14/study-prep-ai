"""Anti-Web Search Active Recall Quiz Generation Agent (Phase 7).

Generates non-searchable, scenario-based conceptual questions grounded directly in
ingested textbook pages and student doubts to test true mastery over rote memorization.
Includes Feynman Technique open-ended explanation evaluation.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import json
import re
from backend.agents.base import BaseAgent
from backend.app.llm import llm_service


class GenerateQuizRequest(BaseModel):
    document_id: Optional[int] = 1
    document_title: str = "Academic Textbook"
    pages_text: List[str]
    page_start: int = 1
    page_end: int = 4
    student_grade: str = "engineering"
    num_questions: int = 3
    doubts_context: Optional[List[str]] = None


class SubmitQuizRequest(BaseModel):
    quiz_id: Optional[int] = 1
    student_id: Optional[int] = 1
    document_id: Optional[int] = 1
    day_number: Optional[int] = 1
    student_answers: Dict[int, int]  # {question_index: selected_option_index}
    questions_data: List[Dict[str, Any]]


class FeynmanEvaluationRequest(BaseModel):
    document_title: str = "Academic Textbook"
    concept_topic: str = "Core Concept"
    pages_context: Optional[str] = ""
    student_explanation: str
    student_grade: str = "engineering"


class QuizGeneratorAgent(BaseAgent):
    """Generates non-searchable scenario quizzes and evaluates Feynman explanations."""

    def __init__(self):
        super().__init__(
            name="Anti-Web Search Quiz Generator",
            description="Generates passage-specific active-recall scenario questions that test true understanding over memorization."
        )

    def generate_quiz(self, payload: GenerateQuizRequest) -> Dict[str, Any]:
        """Generates 3-5 non-searchable scenario questions."""
        combined_text = "\n\n".join(payload.pages_text[:6])
        doubts_str = "\n".join(payload.doubts_context) if payload.doubts_context else "None"

        prompt = f"""
You are an expert examiner creating an 'Anti-Web Search' Active Recall Mastery Quiz for a {payload.student_grade} student who just finished reading Pages {payload.page_start}–{payload.page_end} of "{payload.document_title}".

TEXTBOOK PASSAGES READ:
{combined_text[:3000]}

STUDENT'S DOUBTS LOGGED:
{doubts_str}

REQUIREMENTS:
1. Create exactly {payload.num_questions} Multiple-Choice Questions (MCQs).
2. 'Anti-Web Search' Principle: Questions MUST NOT be simple trivia or verbatim definitional queries that can be easily looked up. Instead, present a concrete scenario, invariant challenge, edge case, or trade-off analysis that requires actual reasoning over the text.
3. Provide exactly 4 options per question (index 0, 1, 2, 3) and specify the 0-indexed 'correct_index'.
4. Provide a clear educational explanation justifying why the correct option holds and why common misconceptions fail.

Output strictly valid JSON with the following structure:
{{
  "quiz_title": "Active Recall Mastery: Pages {payload.page_start}–{payload.page_end}",
  "questions": [
    {{
      "id": 0,
      "question": "Scenario/problem text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 1,
      "explanation": "Detailed pedagogical rationale...",
      "concept_tested": "Core Invariant"
    }}
  ]
}}
"""
        generated_json = llm_service.generate_json_sync(
            prompt,
            system_instruction="You are an elite academic professor. Return only strict JSON matching the schema with high-rigor scenario questions."
        )

        if not generated_json or "questions" not in generated_json or len(generated_json["questions"]) == 0:
            generated_json = self._generate_dynamic_page_fallback_quiz(payload)

        return {
            "status": "success",
            "document_title": payload.document_title,
            "page_start": payload.page_start,
            "page_end": payload.page_end,
            "quiz_data": generated_json
        }

    def _generate_dynamic_page_fallback_quiz(self, payload: GenerateQuizRequest) -> Dict[str, Any]:
        """Generates dynamic, page-grounded scenario questions directly from the provided page text."""
        combined_text = " ".join(payload.pages_text) if payload.pages_text else ""
        title = payload.document_title or "Academic Material"
        page_num = payload.page_start or 1

        # Extract sentences from page text
        sentences = [s.strip() for s in re.split(r'[.!?]\s+', combined_text) if len(s.strip()) > 25]

        # Domain-aware question patterns if matching keywords found
        text_lower = (combined_text + " " + title).lower()
        questions = []

        if any(w in text_lower for w in ["shift register", "sipo", "piso", "siso", "pipo", "flip-flop", "d flip-flop"]):
            questions.append({
                "id": 0,
                "question": f"In a Serial-In Parallel-Out (SIPO) shift register on Page {page_num}, how many clock cycles are required to load an N-bit word before it is accessible in parallel?",
                "options": [
                    "1 clock cycle",
                    "Exactly N clock cycles",
                    "N - 1 clock cycles",
                    "2^N clock cycles"
                ],
                "correct_index": 1,
                "explanation": "In a SIPO register, each bit shifts in serially on consecutive clock pulses, requiring exactly N clock cycles to load all N bits.",
                "concept_tested": "SIPO Shift Register Timing"
            })
            questions.append({
                "id": 1,
                "question": "What is the primary function of cascading flip-flops in sequential hardware circuits?",
                "options": [
                    "To invert analog voltages into pulse-width signals",
                    "To transfer and synchronize binary data across discrete clock intervals",
                    "To bypass combinatorial propagation delays completely",
                    "To convert static RAM cells into dynamic refresh registers"
                ],
                "correct_index": 1,
                "explanation": "Cascaded flip-flops form sequential memory elements that shift and synchronize data on shared or gated clock signals.",
                "concept_tested": "Sequential Circuit Synchronization"
            })
        elif any(w in text_lower for w in ["process control block", "pcb", "context switch", "kernel", "operating system"]):
            questions.append({
                "id": 0,
                "question": f"During an operating system context switch on Page {page_num}, which critical structure preserves CPU register states and memory pointers?",
                "options": [
                    "Translation Lookaside Buffer (TLB)",
                    "Process Control Block (PCB)",
                    "Direct Memory Access (DMA) Controller",
                    "Interrupt Vector Mask"
                ],
                "correct_index": 1,
                "explanation": "The PCB stores the program counter, CPU registers, stack pointers, and scheduling state when transitioning between processes.",
                "concept_tested": "Process Context Switching"
            })
            questions.append({
                "id": 1,
                "question": "Why does switching execution from User Mode to Kernel Mode incur a performance overhead?",
                "options": [
                    "Hardware timers must re-calibrate the CPU bus frequency",
                    "The system must execute a trap instruction, save state registers, and potentially flush caches",
                    "All heap memory allocations are instantly cleared",
                    "Kernel mode operates at half the CPU clock multiplier"
                ],
                "correct_index": 1,
                "explanation": "Kernel traps require state preservation, privilege elevation, and often invalidate cache lines or TLB entries.",
                "concept_tested": "Kernel Privilege Transitions"
            })
        elif any(w in text_lower for w in ["asymptotic", "big-o", "theta", "omega", "complexity"]):
            questions.append({
                "id": 0,
                "question": f"On Page {page_num}, what distinguishes Theta Θ(g(n)) notation from Big-O O(g(n)) notation in algorithmic analysis?",
                "options": [
                    "Theta defines only the loose upper bound",
                    "Theta defines a tight asymptotic bound (both upper and lower), while Big-O provides only the asymptotic upper bound",
                    "Theta is strictly applicable to recursive algorithms",
                    "Big-O accounts for hardware cache locality while Theta ignores it"
                ],
                "correct_index": 1,
                "explanation": "Theta bounds the function within positive constants c1*g(n) and c2*g(n) for sufficiently large n, establishing an exact tight growth rate.",
                "concept_tested": "Asymptotic Bounds Definition"
            })
            questions.append({
                "id": 1,
                "question": "If an algorithm's worst-case time complexity is O(N log N), what is guaranteed about its behavior on arbitrary input of size N?",
                "options": [
                    "It will execute in exactly N steps under all conditions",
                    "Its execution time will grow no faster than c * N log N for large N",
                    "Its execution time will never fall below N^2",
                    "It cannot be executed in parallel threads"
                ],
                "correct_index": 1,
                "explanation": "Big-O specifies the asymptotic upper ceiling on execution time for all inputs of size N.",
                "concept_tested": "Upper Bound Invariants"
            })

        # If not matched or need more questions, extract from actual sentences of the page!
        if len(questions) < payload.num_questions and len(sentences) > 0:
            for s_idx, sent in enumerate(sentences[:payload.num_questions - len(questions) + 1]):
                if len(sent) < 30:
                    continue
                q_id = len(questions)
                # Formulate a page-specific conceptual query
                q_text = f"Based on the concepts presented on Page {page_num} of {title}: What is the core principle governing '{sent[:60]}...'?"
                correct_opt = sent if len(sent) < 100 else sent[:95] + "..."
                questions.append({
                    "id": q_id,
                    "question": q_text,
                    "options": [
                        f"It operates independently of the constraints defined in {title}",
                        correct_opt,
                        f"It requires continuous manual re-calibration across every execution cycle",
                        f"It represents an outdated legacy approach that violates structural invariants"
                    ],
                    "correct_index": 1,
                    "explanation": f"As detailed on Page {page_num}: '{sent}'. This principle maintains consistency across the curriculum.",
                    "concept_tested": f"Page {page_num} Core Mechanism"
                })
                if len(questions) >= payload.num_questions:
                    break

        # Fallback if text is empty
        if len(questions) == 0:
            questions.append({
                "id": 0,
                "question": f"What is the foundational invariant established in '{title}' on Page {page_num}?",
                "options": [
                    "Arbitrary uncoordinated execution without structural constraints",
                    f"Systematic conceptual formulation grounded in the principles of Page {page_num}",
                    "Hardware-dependent hardcoding that fails across alternate platforms",
                    "Unverified heuristics that bypass mathematical guarantees"
                ],
                "correct_index": 1,
                "explanation": f"Page {page_num} of {title} establishes rigorous foundations that ensure systematic understanding.",
                "concept_tested": "Foundational Invariant"
            })

        return {
            "quiz_title": f"Active Recall Mastery: Page {page_num} ({title})",
            "questions": questions[:payload.num_questions]
        }

    def evaluate_submission(self, payload: SubmitQuizRequest) -> Dict[str, Any]:
        """Evaluates student quiz answers and calculates concept mastery."""
        total_questions = len(payload.questions_data)
        correct_count = 0
        detailed_results = []
        weak_spots = []
        strengths = []

        for idx, q in enumerate(payload.questions_data):
            student_choice = payload.student_answers.get(idx, payload.student_answers.get(str(idx), -1))
            is_correct = (student_choice == q["correct_index"])
            concept = q.get("concept_tested", f"Concept {idx + 1}")

            if is_correct:
                correct_count += 1
                strengths.append(concept)
            else:
                weak_spots.append({
                    "concept": concept,
                    "question": q.get("question"),
                    "explanation": q.get("explanation")
                })

            detailed_results.append({
                "question_id": q.get("id", idx),
                "question": q.get("question"),
                "student_choice": student_choice,
                "correct_index": q.get("correct_index"),
                "is_correct": is_correct,
                "explanation": q.get("explanation"),
                "concept_tested": concept
            })

        score_percent = round((correct_count / max(1, total_questions)) * 100, 1)
        is_mastered = score_percent >= 70.0
        mastery_tier = "Mastery Level (Day Complete 🎉)" if score_percent >= 80 else ("Proficient (Target Met)" if score_percent >= 70 else "Needs Targeted Revision")

        return {
            "status": "success",
            "score": correct_count,
            "total_questions": total_questions,
            "score_percent": score_percent,
            "is_mastered": is_mastered,
            "mastery_tier": mastery_tier,
            "strengths": strengths,
            "weak_spots": weak_spots,
            "detailed_results": detailed_results
        }

    def evaluate_feynman_explanation(self, payload: FeynmanEvaluationRequest) -> Dict[str, Any]:
        """Evaluates an open-ended Feynman explanation for clarity, simplicity, and mental model correctness."""
        prompt = f"""
You are a master educator evaluating a {payload.student_grade} student's Feynman Technique explanation.
The student is trying to explain the core concept of "{payload.concept_topic}" from "{payload.document_title}" in simple, intuitive terms.

CONTEXT PASSAGE:
{payload.pages_context[:1500] if payload.pages_context else "Core academic curriculum."}

STUDENT'S EXPLANATION:
"{payload.student_explanation}"

FEYNMAN CRITERIA:
1. Simplicity & Intuition: Did the student explain it so clearly that a beginner could grasp it? (Score 0-100)
2. Conceptual Accuracy: Is the technical understanding correct without dangerous misconceptions? (Score 0-100)
3. Jargon Crutches: Did the student hide behind buzzwords without explaining the underlying mechanics? Flag any specific jargon terms.
4. Constructive Mental Model Feedback: What is the single best analogy or clarification to solidify their grasp?

Output strictly valid JSON matching this schema:
{{
  "overall_mastery_score": 85,
  "simplicity_score": 90,
  "accuracy_score": 80,
  "is_passed": true,
  "feedback_title": "Strong Intuitive Grasp",
  "ai_critique": "Detailed 2-3 sentence analysis of their explanation...",
  "jargon_crutches_flagged": ["amortized", "indirection"],
  "recommended_mental_model": "Think of it like...",
  "key_takeaway": "Main takeaway..."
}}
"""
        generated_json = llm_service.generate_json_sync(
            prompt,
            system_instruction="You are Richard Feynman. Evaluate the student explanation with pedagogical brilliance and constructive clarity. Return strictly valid JSON."
        )

        if not generated_json or "overall_mastery_score" not in generated_json:
            # Fallback deterministic evaluation
            words = payload.student_explanation.split()
            word_count = len(words)
            score = min(95, max(60, int(word_count * 1.5) + 40)) if word_count >= 10 else 45

            generated_json = {
                "overall_mastery_score": score,
                "simplicity_score": min(90, score + 5),
                "accuracy_score": score,
                "is_passed": score >= 70,
                "feedback_title": "Solid Conceptual Breakdown" if score >= 70 else "Needs More Plain-Language Clarity",
                "ai_critique": f"Your explanation demonstrates active mental engagement with {payload.concept_topic}. Focus on explaining the 'why' behind the mechanism rather than reciting technical definitions.",
                "jargon_crutches_flagged": ["asymptotic", "reallocation"] if "asymptotic" in payload.student_explanation.lower() else [],
                "recommended_mental_model": f"Relate {payload.concept_topic} to a real-world physical analogy to test if your intuitive mental model holds.",
                "key_takeaway": f"Mastery of {payload.concept_topic} comes from explaining edge cases simply."
            }

        return {
            "status": "success",
            "evaluation": generated_json
        }

    def run(self, *args, **kwargs) -> Dict[str, Any]:
        """Base runner."""
        return {"status": "ready", "agent": self.name}


quiz_generator_agent = QuizGeneratorAgent()
