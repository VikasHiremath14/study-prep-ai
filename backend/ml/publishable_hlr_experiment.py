import os
import sys
import math
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import KFold
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Ensure import works
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from backend.ml.half_life_regression import HalfLifeRegressionModel

def configure_plot_style():
    """Sets publication-quality matplotlib parameters."""
    plt.style.use('seaborn-v0_8-paper')
    plt.rcParams.update({
        'font.size': 12,
        'axes.labelsize': 14,
        'axes.titlesize': 16,
        'xtick.labelsize': 12,
        'ytick.labelsize': 12,
        'legend.fontsize': 12,
        'figure.dpi': 300,
        'lines.linewidth': 2.5
    })

def generate_academic_report(results_dir: str):
    """Runs a full K-Fold cross-validation and generates publication-ready plots."""
    print("="*80)
    print(" HLR COGNITIVE MODEL ACADEMIC EVALUATION (MTech / Journal Standard) ")
    print("="*80)
    
    os.makedirs(results_dir, exist_ok=True)
    configure_plot_style()

    # 1. Dataset Generation (Simulating 2000 real student interactions)
    print("[1/4] Generating synthetic empirical dataset (N=2000)...")
    base_model = HalfLifeRegressionModel(l2_reg=0.005)
    X, t_delta, p_actual = base_model.generate_synthetic_benchmark(n_samples=2000, random_seed=101)
    
    # 2. 5-Fold Cross Validation
    print("[2/4] Performing 5-Fold Cross Validation...")
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    
    fold_metrics = []
    trained_models = []
    
    for fold, (train_idx, val_idx) in enumerate(kf.split(X)):
        X_train, X_val = X[train_idx], X[val_idx]
        t_train, t_val = t_delta[train_idx], t_delta[val_idx]
        p_train, p_val = p_actual[train_idx], p_actual[val_idx]
        
        # Initialize fresh model for fold
        model = HalfLifeRegressionModel(l2_reg=0.005)
        # Train
        res = model.fit(X_train, t_train, p_train, epochs=150, lr=0.015, val_split=0.0)
        
        # Evaluate on test fold
        eval_metrics = model.evaluate(X_val, t_val, p_val)
        eval_metrics['fold'] = fold + 1
        fold_metrics.append(eval_metrics)
        trained_models.append(model)
        
        print(f"  Fold {fold+1}: MAE = {eval_metrics['mae']:.4f}, R2 = {eval_metrics['r2_score']:.4f}")
        
    metrics_df = pd.DataFrame(fold_metrics)
    metrics_df.to_csv(os.path.join(results_dir, 'cross_validation_results.csv'), index=False)
    
    print(f"\n=> Overall K-Fold CV Results:")
    print(f"   MAE: {metrics_df['mae'].mean():.4f} ± {metrics_df['mae'].std():.4f}")
    print(f"   R2:  {metrics_df['r2_score'].mean():.4f} ± {metrics_df['r2_score'].std():.4f}")

    # 3. Learning Curve Plotting (using the last model)
    print("\n[3/4] Generating Learning Curve Plots...")
    best_model = trained_models[-1] # pick one for plotting
    history_df = pd.DataFrame(best_model.training_history)
    
    plt.figure(figsize=(8, 6))
    plt.plot(history_df['epoch'], history_df['train_loss'], label='Training Loss (MSE + L2)', color='#1f77b4')
    plt.title('HLR Model Convergence over Epochs')
    plt.xlabel('Epoch')
    plt.ylabel('Regularized Loss')
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(results_dir, 'fig1_learning_curve.png'))
    plt.close()

    # 4. Comparative Retention Curves (HLR vs Ebbinghaus)
    print("[4/4] Generating Comparative Forgetting Curves (HLR vs. Ebbinghaus)...")
    
    # Let's compare 3 profiles: High Performer, Average, ADHD
    profiles = [
        ("High Performer", best_model.extract_features(0.9, 0.9, 0.8, 0.8, 2, 0.9)),
        ("Average Student", best_model.extract_features(0.6, 0.6, 0.6, 0.6, 1, 0.7)),
        ("ADHD Profile", best_model.extract_features(0.4, 0.5, 0.5, 0.3, 1, 0.5))
    ]
    
    time_points = np.linspace(0, 300, 100) # 0 to 300 hours
    
    plt.figure(figsize=(10, 6))
    colors = ['#2ca02c', '#1f77b4', '#d62728'] # Green, Blue, Red
    
    for i, (name, feats) in enumerate(profiles):
        hlr_probs = [best_model.predict_recall_probability(feats, t) for t in time_points]
        plt.plot(time_points / 24.0, hlr_probs, label=f"HLR: {name}", color=colors[i], linewidth=2.5)
        
    # Baseline Ebbinghaus (S=24h)
    ebbinghaus_probs = [math.exp(-t / 24.0) for t in time_points]
    plt.plot(time_points / 24.0, ebbinghaus_probs, label="Classic Ebbinghaus (S=24h)", color='k', linestyle='--', linewidth=2)
    
    # 80% Threshold Line
    plt.axhline(y=0.80, color='gray', linestyle=':', alpha=0.8, label="Optimal Review Threshold (80%)")
    
    plt.title('Dynamic Spaced Repetition Forgetting Curves')
    plt.xlabel('Time Elapsed Since Study (Days)')
    plt.ylabel('Probability of Recall $P(recall)$')
    plt.ylim(0, 1.05)
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.legend(loc='upper right')
    plt.tight_layout()
    plt.savefig(os.path.join(results_dir, 'fig2_retention_curves.png'))
    plt.close()

    # Save feature weights for analysis
    weights_df = pd.DataFrame([best_model.theta], columns=best_model.FEATURE_NAMES)
    weights_df.to_csv(os.path.join(results_dir, 'feature_weights.csv'), index=False)
    
    print(f"\n✅ All artifacts successfully saved to: {results_dir}")
    print("Files generated:")
    print("  - cross_validation_results.csv")
    print("  - feature_weights.csv")
    print("  - fig1_learning_curve.png")
    print("  - fig2_retention_curves.png")

if __name__ == "__main__":
    RESULTS_DIR = os.path.join(os.path.dirname(__file__), 'academic_results')
    generate_academic_report(RESULTS_DIR)
