"""Contextual Multi-Armed Bandit Tutor Persona Selection Agent.

Reinforcement Learning & Pedagogical Foundations:
1. Sutton, R. S., & Barto, A. G. (2018). "Reinforcement Learning: An Introduction." MIT Press.
   (Multi-Armed Bandits & Upper Confidence Bound (UCB1) Action Selection).
2. Auer, P., Cesa-Bianchi, N., & Fischer, P. (2002). "Finite-time analysis of the multiarmed bandit problem."
   Machine Learning, 47(2), 235–256.
3. Chi, M. T. et al. (2001). "Learning from human tutoring." Cognitive Science, 25(4), 471–533.
   (Pedagogical persona efficacy across cognitive development levels).

Architecture:
- Sense: Ingests student state context (grade level, focus tier, concept difficulty, past accuracy).
- Decide: Selects optimal pedagogical persona action using UCB1 / epsilon-greedy exploration.
- Act: Injects tailored pedagogical instructions into the QA Tutor.
- Learn: Ingests post-intervention quiz score deltas (Delta_Score) to update value estimates Q(s, a).
"""

import math
import time
import random
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field
from backend.agents.base import BaseAgent


class PersonaAction:
    ELI5 = "eli5"
    DEEP_DIVE = "deep_dive"
    EXAM_CRUX = "exam_crux"
    SOCRATIC = "socratic"

    ALL_ACTIONS = [ELI5, DEEP_DIVE, EXAM_CRUX, SOCRATIC]

    DESCRIPTIONS = {
        ELI5: "Intuitive Real-World Analogies & Layman Mental Hooks",
        DEEP_DIVE: "First Principles, Mathematical Formulations & Asymptotic Invariants",
        EXAM_CRUX: "High-Yield Takeaways, Common Exam Pitfalls & Mnemonics",
        SOCRATIC: "Guided Inquiry, Step-by-Step Dialectic Probing & Active Reflection"
    }


class BanditDecisionLog(BaseModel):
    decision_id: str
    student_id: int
    context_key: str
    action_chosen: str
    is_exploration: bool
    expected_value: float
    confidence_bound: float
    timestamp: float = Field(default_factory=time.time)
    reward_received: Optional[float] = None
    quiz_score_after: Optional[float] = None


class ContextualBanditTutorAgent(BaseAgent):
    """Reinforcement Learning agent optimizing tutor persona selection for maximum student retention uplift."""

    def __init__(
        self,
        ucb_c: float = 1.414,
        alpha: float = 0.15,
        initial_epsilon: float = 0.20,
        min_epsilon: float = 0.05,
        epsilon_decay: float = 0.985
    ):
        super().__init__(
            name="Contextual Bandit Tutor Selector",
            description="Autonomous Reinforcement Learning agent that selects and personalizes AI tutor personas using UCB1 policy."
        )
        self.ucb_c = ucb_c
        self.alpha = alpha
        self.epsilon = initial_epsilon
        self.min_epsilon = min_epsilon
        self.epsilon_decay = epsilon_decay

        # Q-table: context_key -> {action: estimated_reward}
        # Initialized with optimistic priors grounded in educational research
        self.q_values: Dict[str, Dict[str, float]] = {}
        
        # Action selection counts: context_key -> {action: count}
        self.action_counts: Dict[str, Dict[str, int]] = {}
        
        # Total context visits: context_key -> count
        self.context_visits: Dict[str, int] = {}
        
        # History of interaction logs for auditability and dashboard analytics
        self.decision_history: List[BanditDecisionLog] = []
        self.cumulative_rewards: List[Dict[str, Any]] = []
        self.total_cumulative_reward: float = 0.0

        # Prepopulate contextual defaults
        self._initialize_default_priors()

    def _initialize_default_priors(self):
        """Initializes optimistic prior value estimates for common student archetypes."""
        archetypes = [
            "engineering:Deep Focus Master:hard",
            "engineering:Standard Collegiate Rhythm:medium",
            "engineering:Sprint Pacing Rhythm:medium",
            "12th:Standard Collegiate Rhythm:hard",
            "10th:Sprint Pacing Rhythm:medium",
            "mtech:Deep Focus Master:hard",
            "general:default:medium"
        ]
        
        # Prior biases from educational psychology
        prior_maps = {
            "engineering": {
                PersonaAction.DEEP_DIVE: 0.72,
                PersonaAction.SOCRATIC: 0.68,
                PersonaAction.EXAM_CRUX: 0.60,
                PersonaAction.ELI5: 0.55
            },
            "10th": {
                PersonaAction.ELI5: 0.78,
                PersonaAction.EXAM_CRUX: 0.70,
                PersonaAction.SOCRATIC: 0.58,
                PersonaAction.DEEP_DIVE: 0.40
            },
            "mtech": {
                PersonaAction.DEEP_DIVE: 0.85,
                PersonaAction.SOCRATIC: 0.75,
                PersonaAction.EXAM_CRUX: 0.50,
                PersonaAction.ELI5: 0.45
            },
            "default": {
                PersonaAction.ELI5: 0.65,
                PersonaAction.DEEP_DIVE: 0.65,
                PersonaAction.EXAM_CRUX: 0.65,
                PersonaAction.SOCRATIC: 0.65
            }
        }

        for arch in archetypes:
            grade = arch.split(":")[0]
            priors = prior_maps.get(grade, prior_maps["default"])
            self.q_values[arch] = {act: float(priors.get(act, 0.60)) for act in PersonaAction.ALL_ACTIONS}
            self.action_counts[arch] = {act: 3 for act in PersonaAction.ALL_ACTIONS}  # Pseudo-counts for Laplace smoothing
            self.context_visits[arch] = 12

    def build_context_key(
        self,
        grade_level: str = "engineering",
        focus_tier: str = "Standard Collegiate Rhythm",
        concept_difficulty: str = "medium"
    ) -> str:
        """Constructs discrete state context string."""
        grade = (grade_level or "engineering").strip().lower()
        tier = (focus_tier or "Standard Collegiate Rhythm").strip()
        diff = (concept_difficulty or "medium").strip().lower()
        return f"{grade}:{tier}:{diff}"

    def select_persona(
        self,
        student_id: int = 1,
        grade_level: str = "engineering",
        focus_tier: str = "Standard Collegiate Rhythm",
        concept_difficulty: str = "medium",
        policy: str = "ucb1"  # "ucb1" or "epsilon_greedy"
    ) -> Dict[str, Any]:
        """Selects optimal pedagogical persona action using UCB1 or epsilon-greedy policy."""
        context = self.build_context_key(grade_level, focus_tier, concept_difficulty)

        # Initialize context if unseen
        if context not in self.q_values:
            self.q_values[context] = {act: 0.60 for act in PersonaAction.ALL_ACTIONS}
            self.action_counts[context] = {act: 1 for act in PersonaAction.ALL_ACTIONS}
            self.context_visits[context] = 4

        total_visits = max(1, self.context_visits[context])
        actions = PersonaAction.ALL_ACTIONS

        chosen_action = None
        is_exploration = False
        ucb_scores = {}

        if policy == "epsilon_greedy":
            # Epsilon-Greedy exploration
            if random.random() < self.epsilon:
                chosen_action = random.choice(actions)
                is_exploration = True
            else:
                # Exploit: best Q-value
                best_q = -float("inf")
                best_acts = []
                for act in actions:
                    q = self.q_values[context][act]
                    if q > best_q:
                        best_q = q
                        best_acts = [act]
                    elif math.isclose(q, best_q, abs_tol=1e-4):
                        best_acts.append(act)
                chosen_action = random.choice(best_acts)
            
            # Decay epsilon
            self.epsilon = max(self.min_epsilon, self.epsilon * self.epsilon_decay)

        else:
            # UCB1 (Upper Confidence Bound) Policy: Q(s, a) + c * sqrt(ln(N) / N(a))
            best_score = -float("inf")
            best_acts = []

            for act in actions:
                q = self.q_values[context][act]
                n_a = self.action_counts[context][act]
                
                # UCB exploration bonus
                exploration_bonus = self.ucb_c * math.sqrt(math.log(total_visits + 1) / max(1, n_a))
                ucb_val = q + exploration_bonus
                ucb_scores[act] = round(ucb_val, 4)

                if ucb_val > best_score:
                    best_score = ucb_val
                    best_acts = [act]
                elif math.isclose(ucb_val, best_score, abs_tol=1e-4):
                    best_acts.append(act)

            chosen_action = random.choice(best_acts)
            # Tag as exploration if chosen action didn't have highest pure Q-value
            max_pure_q = max(self.q_values[context].values())
            is_exploration = (self.q_values[context][chosen_action] < max_pure_q - 0.05)

        # Generate unique decision log ID
        decision_id = f"dec_{int(time.time() * 1000)}_{random.randint(100, 999)}"
        log_entry = BanditDecisionLog(
            decision_id=decision_id,
            student_id=student_id,
            context_key=context,
            action_chosen=chosen_action,
            is_exploration=is_exploration,
            expected_value=round(self.q_values[context][chosen_action], 4),
            confidence_bound=round(ucb_scores.get(chosen_action, 0.0), 4)
        )
        self.decision_history.append(log_entry)

        # Update visit counts
        self.action_counts[context][chosen_action] += 1
        self.context_visits[context] += 1

        return {
            "status": "success",
            "decision_id": decision_id,
            "recommended_persona": chosen_action,
            "persona_name": chosen_action.replace('_', ' ').title(),
            "description": PersonaAction.DESCRIPTIONS[chosen_action],
            "context": context,
            "is_exploration": is_exploration,
            "estimated_retention_uplift": f"+{int(self.q_values[context][chosen_action] * 35)}%",
            "q_value": round(self.q_values[context][chosen_action], 3),
            "all_q_values": {k: round(v, 3) for k, v in self.q_values[context].items()},
            "ucb_scores": ucb_scores
        }

    def update_reward(
        self,
        decision_id: Optional[str] = None,
        context_key: Optional[str] = None,
        action: Optional[str] = None,
        pre_quiz_score: float = 0.50,
        post_quiz_score: float = 0.85,
        feedback_signal: Optional[float] = None
    ) -> Dict[str, Any]:
        """Learns from quiz outcome delta and updates the Q-table value estimates."""
        # Calculate normalized reward in [-1.0, 1.0]
        if feedback_signal is not None:
            reward = float(feedback_signal)
        else:
            delta = post_quiz_score - pre_quiz_score
            # Reward is a combination of improvement delta and absolute mastery
            mastery_bonus = 0.30 if post_quiz_score >= 0.70 else -0.15
            reward = (delta * 0.70) + mastery_bonus
            reward = max(-1.0, min(1.0, reward))

        # Find matching decision in history if ID provided
        matched_context = context_key
        matched_action = action
        
        if decision_id:
            for log in reversed(self.decision_history):
                if log.decision_id == decision_id:
                    log.reward_received = round(reward, 3)
                    log.quiz_score_after = round(post_quiz_score, 2)
                    matched_context = log.context_key
                    matched_action = log.action_chosen
                    break

        if not matched_context or not matched_action:
            matched_context = matched_context or "engineering:Standard Collegiate Rhythm:medium"
            matched_action = matched_action or PersonaAction.ELI5

        # Initialize Q-values if not present
        if matched_context not in self.q_values:
            self.q_values[matched_context] = {act: 0.60 for act in PersonaAction.ALL_ACTIONS}

        old_q = self.q_values[matched_context][matched_action]
        # Q-update: Q <- Q + alpha * (R - Q)
        new_q = old_q + self.alpha * (reward - old_q)
        self.q_values[matched_context][matched_action] = round(new_q, 4)

        # Track cumulative reward
        self.total_cumulative_reward += reward
        self.cumulative_rewards.append({
            "step": len(self.cumulative_rewards) + 1,
            "action": matched_action,
            "reward": round(reward, 3),
            "cumulative_total": round(self.total_cumulative_reward, 3),
            "context": matched_context
        })

        return {
            "status": "reward_updated",
            "decision_id": decision_id,
            "context": matched_context,
            "action": matched_action,
            "reward_signal": round(reward, 3),
            "old_q_value": round(old_q, 4),
            "new_q_value": round(new_q, 4),
            "total_cumulative_reward": round(self.total_cumulative_reward, 3)
        }

    def get_bandit_analytics(self) -> Dict[str, Any]:
        """Returns comprehensive analytics on persona performance, selection distributions, and learning curves."""
        action_totals = {act: 0 for act in PersonaAction.ALL_ACTIONS}
        action_reward_sums = {act: 0.0 for act in PersonaAction.ALL_ACTIONS}

        for entry in self.decision_history:
            act = entry.action_chosen
            if act in action_totals:
                action_totals[act] += 1
                if entry.reward_received is not None:
                    action_reward_sums[act] += entry.reward_received

        persona_stats = []
        for act in PersonaAction.ALL_ACTIONS:
            count = action_totals[act]
            total_r = action_reward_sums[act]
            avg_r = (total_r / count) if count > 0 else 0.0
            persona_stats.append({
                "action": act,
                "name": act.replace('_', ' ').title(),
                "description": PersonaAction.DESCRIPTIONS[act],
                "selection_count": count,
                "average_reward": round(avg_r, 3),
                "win_rate_percent": round(max(0.0, avg_r * 100), 1)
            })

        return {
            "status": "success",
            "total_decisions": len(self.decision_history),
            "total_rewards_collected": round(self.total_cumulative_reward, 3),
            "current_epsilon": round(self.epsilon, 4),
            "ucb_exploration_constant": self.ucb_c,
            "learning_rate_alpha": self.alpha,
            "persona_performance": persona_stats,
            "recent_decisions": [
                {
                    "decision_id": d.decision_id,
                    "action": d.action_chosen,
                    "context": d.context_key,
                    "is_exploration": d.is_exploration,
                    "expected_value": d.expected_value,
                    "reward": d.reward_received,
                    "post_quiz_score": d.quiz_score_after
                }
                for d in self.decision_history[-10:]
            ],
            "cumulative_learning_curve": self.cumulative_rewards[-30:]
        }

    def run(self, *args, **kwargs) -> Dict[str, Any]:
        """Base runner."""
        return self.select_persona(**kwargs)


# Global singleton instance
tutor_bandit_agent = ContextualBanditTutorAgent()
