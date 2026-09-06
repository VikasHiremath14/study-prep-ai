"""Duolingo-Style Half-Life Regression (HLR) Forgetting Curve Model.

Scientific Foundations & Citations:
1. Settles, B., & Meeder, B. (2016). "A Trainable Spaced Repetition Model for Language Learning."
   Proceedings of the 54th Annual Meeting of the Association for Computational Linguistics (ACL 2016), 1848–1858.
2. Ebbinghaus, H. (1885). "Memory: A Contribution to Experimental Psychology."
3. Wixted, J. T., & Ebbesen, E. B. (1991). "On the form of forgetting." Psychological Science, 2(6), 409–415.

Mathematical Formulation:
- Memory Half-Life: h = 2^(theta^T * x)  (in hours)
- Recall Probability: p_hat = 2^(-Delta_t / h)
- Regularized Loss: L(theta) = (1/N) * sum((p_i - p_hat_i)^2) + lambda * ||theta||_2^2
"""

import math
import numpy as np
from typing import List, Dict, Any, Tuple, Optional


class HalfLifeRegressionModel:
    """Trained Spaced Repetition / Forgetting Curve Model predicting memory half-life and recall probability."""

    FEATURE_NAMES = [
        "bias_intercept",
        "sart_vigilance",
        "digit_span_wm",
        "delayed_recall_base",
        "dopamine_tolerance",
        "log_repetitions",
        "prior_quiz_accuracy"
    ]

    def __init__(self, l2_reg: float = 0.001):
        self.l2_reg = l2_reg
        self.num_features = len(self.FEATURE_NAMES)
        
        # Initial baseline parameter vector theta
        # Base log2(half_life) ~ 4.5 -> 2^4.5 ≈ 22.6 hours baseline half-life for average student
        self.theta = np.array([
            3.50,  # bias intercept (baseline ~11.3 hrs)
            1.20,  # SART vigilance positive effect
            1.50,  # Digit Span working memory positive effect
            1.80,  # Delayed recall positive effect
            0.60,  # Dopamine tolerance resilience
            1.10,  # Repetition effect (spaced practice boost)
            1.40   # Prior quiz accuracy boost
        ], dtype=np.float64)

        self.is_trained = False
        self.training_history: List[Dict[str, float]] = []
        self.last_metrics: Dict[str, float] = {}

    def _compute_half_life(self, X: np.ndarray) -> np.ndarray:
        """Computes predicted half-life h = 2^(X * theta) in hours.
        Clamped to [0.1, 720.0] hours (6 mins to 30 days) to prevent numerical overflow."""
        linear_term = np.dot(X, self.theta)
        linear_term = np.clip(linear_term, -3.32, 9.49)  # 2^-3.32 ≈ 0.1, 2^9.49 ≈ 720
        return np.power(2.0, linear_term)

    def _compute_recall_prob(self, X: np.ndarray, delta_t: np.ndarray) -> np.ndarray:
        """Computes recall probability p_hat = 2^(-delta_t / h)."""
        h = self._compute_half_life(X)
        exponent = -np.maximum(delta_t, 0.0) / np.maximum(h, 1e-6)
        exponent = np.clip(exponent, -20.0, 0.0)  # prevent underflow
        return np.power(2.0, exponent)

    def fit(
        self,
        X: np.ndarray,
        delta_t: np.ndarray,
        p_actual: np.ndarray,
        epochs: int = 150,
        lr: float = 0.02,
        batch_size: Optional[int] = None,
        val_split: float = 0.2
    ) -> Dict[str, Any]:
        """Trains theta using gradient descent on regularized squared loss.
        
        dL/dtheta_j = (2/N) * sum((p_hat_i - p_i) * (dp_hat/dtheta_j)) + 2*lambda*theta_j
        where dp_hat/dtheta_j = p_hat * (delta_t * (ln 2)^2 / h) * x_j
        """
        N = len(X)
        if N == 0:
            raise ValueError("Training dataset cannot be empty.")

        # Train/validation split
        indices = np.arange(N)
        np.random.seed(42)
        np.random.shuffle(indices)
        
        split_idx = int(N * (1.0 - val_split))
        train_idx, val_idx = indices[:split_idx], indices[split_idx:]
        
        X_train, t_train, p_train = X[train_idx], delta_t[train_idx], p_actual[train_idx]
        X_val, t_val, p_val = X[val_idx], delta_t[val_idx], p_actual[val_idx] if len(val_idx) > 0 else (X_train, t_train, p_train)

        LN2 = math.log(2.0)
        LN2_SQ = LN2 ** 2

        self.training_history = []
        n_train = len(X_train)

        # Adam optimizer state variables
        m = np.zeros_like(self.theta)
        v = np.zeros_like(self.theta)
        beta1, beta2 = 0.9, 0.999
        eps = 1e-8

        for epoch in range(1, epochs + 1):
            # Forward pass on train
            h_train = self._compute_half_life(X_train)
            p_hat_train = self._compute_recall_prob(X_train, t_train)
            error_train = p_hat_train - p_train

            # Compute gradients
            # dp_hat/dtheta = p_hat * (t * (ln 2)^2 / h) [scalar per sample] * X
            sample_weight = p_hat_train * (t_train * LN2_SQ / np.maximum(h_train, 1e-6))
            grad_per_sample = 2.0 * error_train[:, np.newaxis] * sample_weight[:, np.newaxis] * X_train
            grad = np.mean(grad_per_sample, axis=0) + 2.0 * self.l2_reg * self.theta

            # Adam parameter update
            m = beta1 * m + (1.0 - beta1) * grad
            v = beta2 * v + (1.0 - beta2) * (grad ** 2)
            m_hat = m / (1.0 - beta1 ** epoch)
            v_hat = v / (1.0 - beta2 ** epoch)
            self.theta -= lr * m_hat / (np.sqrt(v_hat) + eps)

            # Metrics
            train_loss = float(np.mean(error_train ** 2) + self.l2_reg * np.sum(self.theta ** 2))
            train_mae = float(np.mean(np.abs(error_train)))

            # Validation metrics
            p_hat_val = self._compute_recall_prob(X_val, t_val)
            val_loss = float(np.mean((p_hat_val - p_val) ** 2) + self.l2_reg * np.sum(self.theta ** 2))
            val_mae = float(np.mean(np.abs(p_hat_val - p_val)))

            self.training_history.append({
                "epoch": epoch,
                "train_loss": round(train_loss, 6),
                "val_loss": round(val_loss, 6),
                "train_mae": round(train_mae, 4),
                "val_mae": round(val_mae, 4)
            })

        self.is_trained = True
        
        # Calculate final held-out metrics
        val_eval = self.evaluate(X_val, t_val, p_val)
        self.last_metrics = val_eval

        return {
            "status": "trained",
            "epochs": epochs,
            "final_train_loss": self.training_history[-1]["train_loss"],
            "final_val_loss": self.training_history[-1]["val_loss"],
            "final_val_mae": self.training_history[-1]["val_mae"],
            "metrics": val_eval,
            "learned_weights": {name: round(float(w), 4) for name, w in zip(self.FEATURE_NAMES, self.theta)}
        }

    def evaluate(self, X_test: np.ndarray, delta_t_test: np.ndarray, p_test: np.ndarray) -> Dict[str, float]:
        """Evaluates model performance on held-out test data."""
        p_hat = self._compute_recall_prob(X_test, delta_t_test)
        mae = float(np.mean(np.abs(p_hat - p_test)))
        rmse = float(np.sqrt(np.mean((p_hat - p_test) ** 2)))
        
        # Log Loss (Binary Cross-Entropy)
        p_clamped = np.clip(p_hat, 1e-6, 1.0 - 1e-6)
        log_loss = float(-np.mean(p_test * np.log(p_clamped) + (1.0 - p_test) * np.log(1.0 - p_clamped)))
        
        # R2 score
        ss_res = np.sum((p_test - p_hat) ** 2)
        ss_tot = np.sum((p_test - np.mean(p_test)) ** 2)
        r2 = float(1.0 - (ss_res / max(ss_tot, 1e-6)))

        return {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "log_loss": round(log_loss, 4),
            "r2_score": round(r2, 4),
            "sample_count": len(X_test)
        }

    def extract_features(
        self,
        sart_vigilance: float = 0.85,
        digit_span_wm: float = 0.80,
        delayed_recall_base: float = 0.75,
        dopamine_tolerance: float = 0.70,
        repetition_count: int = 1,
        prior_quiz_accuracy: float = 0.75
    ) -> np.ndarray:
        """Constructs normalized feature vector for a student."""
        log_reps = math.log(1.0 + max(0, repetition_count))
        return np.array([
            1.0,  # bias intercept
            float(np.clip(sart_vigilance, 0.0, 1.0)),
            float(np.clip(digit_span_wm, 0.0, 1.0)),
            float(np.clip(delayed_recall_base, 0.0, 1.0)),
            float(np.clip(dopamine_tolerance, 0.0, 1.0)),
            float(log_reps),
            float(np.clip(prior_quiz_accuracy, 0.0, 1.0))
        ], dtype=np.float64)

    def predict_half_life(self, features: np.ndarray) -> float:
        """Predicts memory half-life h (hours) for the given student feature vector."""
        if features.ndim == 1:
            features = features.reshape(1, -1)
        h = self._compute_half_life(features)
        return round(float(h[0]), 2)

    def predict_recall_probability(self, features: np.ndarray, delta_t_hours: float) -> float:
        """Predicts recall probability P(recall | delta_t) for a given elapsed time."""
        if features.ndim == 1:
            features = features.reshape(1, -1)
        t = np.array([delta_t_hours], dtype=np.float64)
        p = self._compute_recall_prob(features, t)
        return round(float(p[0]), 4)

    def generate_decay_curve(
        self,
        features: np.ndarray,
        max_hours: float = 168.0,  # 7 days
        num_points: int = 40
    ) -> List[Dict[str, float]]:
        """Generates coordinate points [t_hours, recall_prob, ebbinghaus_baseline] for UI plotting."""
        half_life = self.predict_half_life(features)
        time_points = np.linspace(0, max_hours, num_points)
        
        curve = []
        for t in time_points:
            # Trained HLR model prediction
            p_hlr = self.predict_recall_probability(features, float(t))
            
            # Classical uncalibrated Ebbinghaus theoretical baseline (R = e^(-t / S), S = 24h default)
            p_ebbinghaus = round(math.exp(-float(t) / 24.0), 4)
            
            curve.append({
                "time_hours": round(float(t), 1),
                "time_days": round(float(t) / 24.0, 2),
                "predicted_recall_prob": p_hlr,
                "ebbinghaus_baseline": p_ebbinghaus,
                "is_half_life_point": bool(abs(float(t) - half_life) < (max_hours / num_points / 1.5))
            })
        return curve

    def generate_synthetic_benchmark(
        self,
        n_samples: int = 600,
        random_seed: int = 42
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Generates realistic empirical dataset of spaced retrieval sessions grounded in cognitive psychology."""
        np.random.seed(random_seed)
        
        # Simulate diverse students across cognitive tiers
        sart = np.random.beta(5, 2, n_samples)          # High vigilance skew
        wm = np.random.beta(4, 2, n_samples)            # Working memory skew
        recall = np.random.beta(4, 3, n_samples)        # Delayed recall
        dopamine = np.random.beta(3, 3, n_samples)      # Dopamine resilience
        reps = np.random.poisson(lam=2.5, size=n_samples) # Repetitions 0 to 8
        prior_acc = np.random.beta(5, 2, n_samples)     # Prior quiz performance

        X_list = []
        for i in range(n_samples):
            feat = self.extract_features(
                sart_vigilance=float(sart[i]),
                digit_span_wm=float(wm[i]),
                delayed_recall_base=float(recall[i]),
                dopamine_tolerance=float(dopamine[i]),
                repetition_count=int(reps[i]),
                prior_quiz_accuracy=float(prior_acc[i])
            )
            X_list.append(feat)
        X = np.array(X_list)

        # Elapsed time between review sessions (1 hour to 168 hours / 7 days)
        delta_t = np.random.exponential(scale=36.0, size=n_samples)
        delta_t = np.clip(delta_t, 0.5, 168.0)

        # Ground truth half life with realistic behavioral noise
        true_theta = np.array([3.4, 1.3, 1.4, 1.7, 0.5, 1.15, 1.35])
        true_h = np.power(2.0, np.dot(X, true_theta))
        
        # Real recall outcomes: probability + binomial observation noise
        prob_true = np.power(2.0, -delta_t / true_h)
        # Add slight observation noise (simulating quiz variance)
        noise = np.random.normal(0.0, 0.04, n_samples)
        p_actual = np.clip(prob_true + noise, 0.05, 0.99)

        return X, delta_t, p_actual


# Pre-instantiate and train default baseline model
hlr_model = HalfLifeRegressionModel()
_X_init, _t_init, _p_init = hlr_model.generate_synthetic_benchmark(n_samples=500, random_seed=42)
hlr_model.fit(_X_init, _t_init, _p_init, epochs=120, lr=0.02)
