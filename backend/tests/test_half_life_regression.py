"""Unit tests for Duolingo Half-Life Regression (HLR) Model and Diagnostics API."""
import pytest
import numpy as np
from backend.ml.half_life_regression import HalfLifeRegressionModel, hlr_model


def test_hlr_model_training_and_convergence():
    """Verifies that HalfLifeRegressionModel minimizes loss and achieves low MAE."""
    model = HalfLifeRegressionModel(l2_reg=0.001)
    # Start from scratch/perturbed weights to test optimization convergence
    model.theta = np.array([1.0, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2], dtype=np.float64)
    X, delta_t, p_actual = model.generate_synthetic_benchmark(n_samples=300, random_seed=123)

    train_res = model.fit(X, delta_t, p_actual, epochs=100, lr=0.03, val_split=0.2)

    assert train_res["status"] == "trained"
    assert len(model.training_history) == 100
    assert model.training_history[-1]["train_loss"] < model.training_history[0]["train_loss"]
    assert train_res["metrics"]["mae"] < 0.10
    assert train_res["metrics"]["r2_score"] > 0.40


def test_hlr_prediction_bounds():
    """Verifies that predicted half-life and recall probabilities obey mathematical bounds."""
    model = HalfLifeRegressionModel()
    features = model.extract_features(
        sart_vigilance=0.90,
        digit_span_wm=0.85,
        delayed_recall_base=0.80,
        dopamine_tolerance=0.75,
        repetition_count=3,
        prior_quiz_accuracy=0.85
    )

    # Half life must be positive and within plausible range (hours)
    half_life = model.predict_half_life(features)
    assert half_life > 0.5
    assert half_life < 1000.0

    # Recall prob at t=0 must be 1.0 (or very close to 1.0)
    p_0 = model.predict_recall_probability(features, delta_t_hours=0.0)
    assert pytest.approx(p_0, abs=0.01) == 1.0

    # Recall prob at t=half_life must be 0.5 (or very close)
    p_hl = model.predict_recall_probability(features, delta_t_hours=half_life)
    assert pytest.approx(p_hl, abs=0.05) == 0.50

    # Recall prob strictly monotonically decreases with time
    p_24 = model.predict_recall_probability(features, delta_t_hours=24.0)
    p_48 = model.predict_recall_probability(features, delta_t_hours=48.0)
    p_168 = model.predict_recall_probability(features, delta_t_hours=168.0)
    assert p_24 >= p_48 >= p_168


def test_hlr_decay_curve_generation():
    """Verifies decay curve coordinates formatting for frontend graphing."""
    model = HalfLifeRegressionModel()
    features = model.extract_features()
    curve = model.generate_decay_curve(features, max_hours=168.0, num_points=25)

    assert len(curve) == 25
    assert curve[0]["time_hours"] == 0.0
    assert curve[-1]["time_hours"] == 168.0
    for pt in curve:
        assert 0.0 <= pt["predicted_recall_prob"] <= 1.0
        assert 0.0 <= pt["ebbinghaus_baseline"] <= 1.0
        assert "time_days" in pt


def test_retention_profile_forgetting_curve_api(client):
    """Verifies GET /api/students/{id}/forgetting-curve and GET /api/students/ml/diagnostics endpoints."""
    # Register / Onboard student first
    onboard_res = client.post("/api/students/onboard", json={
        "student_name": "ML Test Student",
        "grade_level": "engineering",
        "wake_time": "07:00",
        "sleep_time": "23:00"
    })
    assert onboard_res.status_code == 200
    student_id = onboard_res.json()["student_id"]

    # Verify forgetting curve endpoint
    curve_res = client.get(f"/api/students/{student_id}/forgetting-curve")
    assert curve_res.status_code == 200
    curve_data = curve_res.json()
    assert "predicted_half_life_hours" in curve_data
    assert "decay_curve" in curve_data
    assert len(curve_data["decay_curve"]) > 0
    assert curve_data["ml_model_info"]["technique"].startswith("Duolingo")

    # Verify ML diagnostics endpoint
    diag_res = client.get("/api/students/ml/diagnostics")
    assert diag_res.status_code == 200
    diag_data = diag_res.json()
    assert "learned_weights" in diag_data
    assert "scientific_citation" in diag_data
    assert "metrics" in diag_data
