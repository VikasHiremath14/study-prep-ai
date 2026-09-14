"""Anti-Web Search Active Recall Quiz Generation Agent — LangChain Structured Output Edition.

Course reference:
  - "Structured Output with LangChain Agents Using Pydantic"
  - "[THEORY] Predictable Agent Responses with LangChain Structured Output"
  - "Building a LangChain Chain to Summarize Text"

Replaces raw llm_service.generate_json_sync() calls with the proper LangChain
structured output pattern:

    prompt_template | llm.with_structured_output(PydanticSchema)

This guarantees type-safe, schema-validated output directly from the LLM — no
manual JSON parsing, no code-fence stripping, no try/except around json.loads().
"""

import re
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from backend.agents.base import BaseAgent
from backend.app.llm import llm_service  # For fallback compatibility

logger = logging.getLogger(__name__)


# ── Pydantic Input Schemas (unchanged from original) ─────────────────────────

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


# ── LangChain Structured Output Schemas ───────────────────────────────────────
# Course: "Structured Output with LangChain Agents Using Pydantic"
# These Pydantic models define the EXACT shape the LLM must return.

class QuizQuestion(BaseModel):
    """A single MCQ question with 4 options."""
    id: int = Field(description="Zero-based question index")
    question: str = Field(description="The scenario-based question text")
    options: List[str] = Field(description="Exactly 4 answer options")
    correct_index: int = Field(description="Zero-based index of the correct option (0-3)")
    explanation: str = Field(description="Detailed pedagogical rationale for the correct answer")
    concept_tested: str = Field(description="The core concept this question tests")


class QuizOutput(BaseModel):
    """Full quiz output schema — enforces LLM to return exactly this structure."""
    quiz_title: str = Field(description="Title of the quiz")
    questions: List[QuizQuestion] = Field(description="List of MCQ questions")


class FeynmanOutput(BaseModel):
    """Feynman evaluation output schema."""
    overall_mastery_score: int = Field(description="Overall mastery score 0-100")
    simplicity_score: int = Field(description="Simplicity & intuition score 0-100")
    accuracy_score: int = Field(description="Conceptual accuracy score 0-100")
    is_passed: bool = Field(description="Whether the student passed the Feynman evaluation")
    feedback_title: str = Field(description="Short title summarizing feedback quality")
    ai_critique: str = Field(description="Detailed 2-3 sentence analysis of their explanation")
    jargon_crutches_flagged: List[str] = Field(description="List of jargon terms used without explanation")
    recommended_mental_model: str = Field(description="Best analogy to solidify their grasp")
    key_takeaway: str = Field(description="Main takeaway from the evaluation")


# ── Quiz Generator Agent ──────────────────────────────────────────────────────

class QuizGeneratorAgent(BaseAgent):
    """
    LangChain Structured Output Quiz Generator.

    Uses llm.with_structured_output(QuizOutput) to guarantee type-safe,
    schema-validated quiz questions directly from the LLM.

    Course: "Structured Output with LangChain Agents Using Pydantic" — this is
    the exact pattern: define a Pydantic schema, call with_structured_output(),
    pipe it after a ChatPromptTemplate.
    """

    def __init__(self):
        super().__init__(
            name="Anti-Web Search Quiz Generator",
            description="Generates passage-specific active-recall scenario questions with LangChain structured output."
        )
        # Build structured output chains at init time
        self._quiz_chain = self._build_quiz_chain()
        self._feynman_chain = self._build_feynman_chain()

    def _build_quiz_chain(self):
        """
        Builds the quiz generation chain with Pydantic structured output.
        Course: "Structured Output with LangChain Agents Using Pydantic"
        Pattern: ChatPromptTemplate | llm.with_structured_output(QuizOutput)
        """
        return self.build_structured_chain(
            system_message=(
                "You are an elite academic professor creating Anti-Web Search scenario quizzes. "
                "Return ONLY a structured quiz matching the required schema exactly. "
                "Questions must test deep reasoning, not trivia or verbatim definitions."
            ),
            human_template="""Create exactly {num_questions} Anti-Web Search scenario MCQs for a {student_grade} student who just read Pages {page_start}–{page_end} of "{document_title}".

TEXTBOOK PASSAGES:
{combined_text}

STUDENT DOUBTS LOGGED:
{doubts_str}

REQUIREMENTS:
1. Exactly {num_questions} questions, each with EXACTLY 4 options (index 0-3).
2. 'Anti-Web Search' Principle: Present concrete scenarios, invariant challenges, edge cases, or trade-off analysis — NOT simple trivia.
3. Provide a clear educational explanation for the correct option.
4. Set correct_index as a 0-based integer (0, 1, 2, or 3).""",
            schema=QuizOutput,
        )

    def _build_feynman_chain(self):
        """Builds the Feynman evaluation chain with Pydantic structured output."""
        return self.build_structured_chain(
            system_message=(
                "You are Richard Feynman evaluating a student's explanation. "
                "Be pedagogically brilliant and constructively critical. "
                "Return ONLY the structured evaluation matching the required schema exactly."
            ),
            human_template="""Evaluate this {student_grade} student's Feynman Technique explanation of "{concept_topic}" from "{document_title}".

CONTEXT PASSAGE:
{pages_context}

STUDENT'S EXPLANATION:
"{student_explanation}"

FEYNMAN CRITERIA:
1. Simplicity & Intuition: Did the student explain it so clearly that a beginner could grasp it? (Score 0-100)
2. Conceptual Accuracy: Is the technical understanding correct without dangerous misconceptions? (Score 0-100)
3. Jargon Crutches: Did the student hide behind buzzwords without explaining the underlying mechanics?
4. Constructive Mental Model Feedback: What is the single best analogy to solidify their grasp?""",
            schema=FeynmanOutput,
        )

    # ── Public Methods ────────────────────────────────────────────────────────

    def generate_quiz(self, payload: GenerateQuizRequest) -> Dict[str, Any]:
        """
        Generates scenario MCQs using LangChain structured output.
        Falls back to the deterministic quiz generator if LLM is unavailable.
        """
        combined_text = "\n\n".join(payload.pages_text[:6])[:3000]
        doubts_str = "\n".join(payload.doubts_context) if payload.doubts_context else "None"

        generated_data = None
        if self._quiz_chain:
            try:
                result: QuizOutput = self._quiz_chain.invoke({
                    "num_questions": payload.num_questions,
                    "student_grade": payload.student_grade,
                    "page_start": payload.page_start,
                    "page_end": payload.page_end,
                    "document_title": payload.document_title,
                    "combined_text": combined_text,
                    "doubts_str": doubts_str,
                })
                if result and result.questions:
                    generated_data = {
                        "quiz_title": result.quiz_title,
                        "questions": [q.model_dump() for q in result.questions],
                    }
            except Exception as e:
                logger.error(f"[QuizGenerator] structured quiz chain failed: {e}")

        if not generated_data or not generated_data.get("questions"):
            generated_data = self._generate_dynamic_page_fallback_quiz(payload)

        return {
            "status": "success",
            "document_title": payload.document_title,
            "page_start": payload.page_start,
            "page_end": payload.page_end,
            "quiz_data": generated_data,
        }

    def evaluate_submission(self, payload: SubmitQuizRequest) -> Dict[str, Any]:
        """Evaluates student quiz answers and calculates concept mastery (pure Python, unchanged)."""
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
                    "explanation": q.get("explanation"),
                })

            detailed_results.append({
                "question_id": q.get("id", idx),
                "question": q.get("question"),
                "student_choice": student_choice,
                "correct_index": q.get("correct_index"),
                "is_correct": is_correct,
                "explanation": q.get("explanation"),
                "concept_tested": concept,
            })

        score_percent = round((correct_count / max(1, total_questions)) * 100, 1)
        is_mastered = score_percent >= 70.0
        mastery_tier = (
            "Mastery Level (Day Complete 🎉)" if score_percent >= 80 else
            ("Proficient (Target Met)" if score_percent >= 70 else "Needs Targeted Revision")
        )

        return {
            "status": "success",
            "score": correct_count,
            "total_questions": total_questions,
            "score_percent": score_percent,
            "is_mastered": is_mastered,
            "mastery_tier": mastery_tier,
            "strengths": strengths,
            "weak_spots": weak_spots,
            "detailed_results": detailed_results,
        }

    def evaluate_feynman_explanation(self, payload: FeynmanEvaluationRequest) -> Dict[str, Any]:
        """
        Evaluates an open-ended Feynman explanation using LangChain structured output.
        Returns a type-safe FeynmanOutput Pydantic object — no JSON parsing needed.
        """
        result_obj = None
        if self._feynman_chain:
            try:
                result_obj: FeynmanOutput = self._feynman_chain.invoke({
                    "student_grade": payload.student_grade,
                    "concept_topic": payload.concept_topic,
                    "document_title": payload.document_title,
                    "pages_context": (payload.pages_context or "Core academic curriculum.")[:1500],
                    "student_explanation": payload.student_explanation,
                })
            except Exception as e:
                logger.error(f"[QuizGenerator] feynman chain failed: {e}")

        if result_obj and hasattr(result_obj, "overall_mastery_score"):
            return {
                "status": "success",
                "evaluation": result_obj.model_dump(),
            }

        # ── Deterministic fallback (unchanged from original) ─────────────────
        words = payload.student_explanation.split()
        word_count = len(words)
        score = min(95, max(60, int(word_count * 1.5) + 40)) if word_count >= 10 else 45

        return {
            "status": "success",
            "evaluation": {
                "overall_mastery_score": score,
                "simplicity_score": min(90, score + 5),
                "accuracy_score": score,
                "is_passed": score >= 70,
                "feedback_title": "Solid Conceptual Breakdown" if score >= 70 else "Needs More Plain-Language Clarity",
                "ai_critique": f"Your explanation demonstrates active mental engagement with {payload.concept_topic}. Focus on explaining the 'why' behind the mechanism rather than reciting technical definitions.",
                "jargon_crutches_flagged": ["asymptotic", "reallocation"] if "asymptotic" in payload.student_explanation.lower() else [],
                "recommended_mental_model": f"Relate {payload.concept_topic} to a real-world physical analogy to test if your intuitive mental model holds.",
                "key_takeaway": f"Mastery of {payload.concept_topic} comes from explaining edge cases simply.",
            },
        }

    # ── Deterministic Fallback Quiz (unchanged from original) ─────────────────

    def _generate_dynamic_page_fallback_quiz(self, payload: GenerateQuizRequest) -> Dict[str, Any]:
        """Generates dynamic, page-grounded scenario questions from page text (unchanged)."""
        combined_text = " ".join(payload.pages_text) if payload.pages_text else ""
        title = payload.document_title or "Academic Material"
        page_num = payload.page_start or 1
        sentences = [s.strip() for s in re.split(r'[.!?]\s+', combined_text) if len(s.strip()) > 25]
        text_lower = (combined_text + " " + title).lower()
        questions = []

        if any(w in text_lower for w in ["shift register", "sipo", "piso", "siso", "pipo", "flip-flop", "d flip-flop"]):
            questions.extend([
                {"id": 0, "question": f"In a SIPO shift register on Page {page_num}, how many clock cycles are required to load an N-bit word?", "options": ["1 clock cycle", "Exactly N clock cycles", "N - 1 clock cycles", "2^N clock cycles"], "correct_index": 1, "explanation": "In a SIPO register, each bit shifts in serially on consecutive clock pulses, requiring exactly N clock cycles.", "concept_tested": "SIPO Shift Register Timing"},
                {"id": 1, "question": "What is the primary function of cascading flip-flops in sequential hardware circuits?", "options": ["To invert analog voltages into pulse-width signals", "To transfer and synchronize binary data across discrete clock intervals", "To bypass combinatorial propagation delays completely", "To convert static RAM cells into dynamic refresh registers"], "correct_index": 1, "explanation": "Cascaded flip-flops form sequential memory elements that shift and synchronize data on shared clock signals.", "concept_tested": "Sequential Circuit Synchronization"},
            ])
        elif any(w in text_lower for w in ["process control block", "pcb", "context switch", "kernel", "operating system"]):
            questions.extend([
                {"id": 0, "question": f"During an OS context switch on Page {page_num}, which structure preserves CPU register states?", "options": ["Translation Lookaside Buffer (TLB)", "Process Control Block (PCB)", "Direct Memory Access (DMA) Controller", "Interrupt Vector Mask"], "correct_index": 1, "explanation": "The PCB stores the program counter, CPU registers, stack pointers, and scheduling state when transitioning between processes.", "concept_tested": "Process Context Switching"},
                {"id": 1, "question": "Why does switching from User Mode to Kernel Mode incur a performance overhead?", "options": ["Hardware timers must re-calibrate the CPU bus frequency", "The system must execute a trap instruction, save state registers, and potentially flush caches", "All heap memory allocations are instantly cleared", "Kernel mode operates at half the CPU clock multiplier"], "correct_index": 1, "explanation": "Kernel traps require state preservation, privilege elevation, and often invalidate cache lines or TLB entries.", "concept_tested": "Kernel Privilege Transitions"},
            ])
        elif any(w in text_lower for w in ["asymptotic", "big-o", "theta", "omega", "complexity"]):
            questions.extend([
                {"id": 0, "question": f"On Page {page_num}, what distinguishes Theta Θ(g(n)) notation from Big-O O(g(n))?", "options": ["Theta defines only the loose upper bound", "Theta defines a tight asymptotic bound (both upper and lower), while Big-O provides only the asymptotic upper bound", "Theta is strictly applicable to recursive algorithms", "Big-O accounts for hardware cache locality while Theta ignores it"], "correct_index": 1, "explanation": "Theta bounds the function within positive constants c1*g(n) and c2*g(n) for sufficiently large n.", "concept_tested": "Asymptotic Bounds Definition"},
                {"id": 1, "question": "If an algorithm's worst-case complexity is O(N log N), what is guaranteed?", "options": ["It will execute in exactly N steps", "Its execution time will grow no faster than c * N log N for large N", "Its execution time will never fall below N^2", "It cannot be executed in parallel threads"], "correct_index": 1, "explanation": "Big-O specifies the asymptotic upper ceiling on execution time for all inputs of size N.", "concept_tested": "Upper Bound Invariants"},
            ])

        if len(questions) < payload.num_questions and sentences:
            for sent in sentences[:payload.num_questions - len(questions) + 1]:
                if len(sent) < 30:
                    continue
                q_id = len(questions)
                correct_opt = sent if len(sent) < 100 else sent[:95] + "..."
                questions.append({
                    "id": q_id,
                    "question": f"Based on Page {page_num} of {title}: What is the core principle governing '{sent[:60]}...'?",
                    "options": [f"It operates independently of the constraints defined in {title}", correct_opt, "It requires continuous manual re-calibration across every execution cycle", "It represents an outdated legacy approach that violates structural invariants"],
                    "correct_index": 1,
                    "explanation": f"As detailed on Page {page_num}: '{sent}'. This principle maintains consistency across the curriculum.",
                    "concept_tested": f"Page {page_num} Core Mechanism",
                })
                if len(questions) >= payload.num_questions:
                    break

        if not questions:
            questions.append({
                "id": 0,
                "question": f"What is the foundational invariant established in '{title}' on Page {page_num}?",
                "options": ["Arbitrary uncoordinated execution without structural constraints", f"Systematic conceptual formulation grounded in the principles of Page {page_num}", "Hardware-dependent hardcoding that fails across alternate platforms", "Unverified heuristics that bypass mathematical guarantees"],
                "correct_index": 1,
                "explanation": f"Page {page_num} of {title} establishes rigorous foundations that ensure systematic understanding.",
                "concept_tested": "Foundational Invariant",
            })

        return {
            "quiz_title": f"Active Recall Mastery: Page {page_num} ({title})",
            "questions": questions[:payload.num_questions],
        }

    def run(self, *args, **kwargs) -> Dict[str, Any]:
        """Base runner."""
        return {"status": "ready", "agent": self.name}


quiz_generator_agent = QuizGeneratorAgent()
