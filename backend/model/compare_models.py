"""
Compares Logistic Regression and Random Forest models for wildlife collision risk prediction.
"""
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
from model.model_utils import find_latest_gold_csv

def compare_models(batch_id):
    """
    Loads Gold dataset, trains and compares two models, saves the best, and returns comparison info.
    """
    gold_file = find_latest_gold_csv()
    if not gold_file:
        print('[ERROR] No Gold dataset found. Comparison aborted.')
        return {'status': 'empty', 'row_count': 0, 'gold_file_used': None}
    try:
        df = pd.read_csv(gold_file)
        if 'high_risk_target' not in df.columns:
            print('[ERROR] Gold dataset missing high_risk_target column. Comparison aborted.')
            return {'status': 'error', 'row_count': len(df), 'gold_file_used': str(gold_file)}
        # Select numeric features
        feature_candidates = [
            'temperature', 'precipitation', 'wind_speed', 'visibility',
            'speed_limit', 'hour', 'month', 'is_night', 'is_weekend', 'high_precipitation'
        ]
        features_used = [f for f in feature_candidates if f in df.columns]
        if not features_used:
            print('[ERROR] No valid features found in Gold dataset. Comparison aborted.')
            return {'status': 'error', 'row_count': len(df), 'gold_file_used': str(gold_file)}
        # Drop rows with missing target
        df = df.dropna(subset=['high_risk_target'])
        # Fill missing feature values with median
        for f in features_used:
            if df[f].isnull().any():
                median = df[f].median()
                df[f] = df[f].fillna(median)
        X = df[features_used]
        y = df['high_risk_target']
        # Split train/test
        if len(df) < 5:
            print('[WARN] Not enough data to split. Comparison aborted.')
            return {'status': 'error', 'row_count': len(df), 'gold_file_used': str(gold_file)}
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        # Train Logistic Regression
        logreg = LogisticRegression(max_iter=200)
        logreg.fit(X_train, y_train)
        y_pred_logreg = logreg.predict(X_test)
        logreg_metrics = {
            'accuracy': accuracy_score(y_test, y_pred_logreg),
            'precision': precision_score(y_test, y_pred_logreg, zero_division=0),
            'recall': recall_score(y_test, y_pred_logreg, zero_division=0),
            'f1_score': f1_score(y_test, y_pred_logreg, zero_division=0)
        }
        # Train Random Forest
        rf = RandomForestClassifier(random_state=42)
        rf.fit(X_train, y_train)
        y_pred_rf = rf.predict(X_test)
        rf_metrics = {
            'accuracy': accuracy_score(y_test, y_pred_rf),
            'precision': precision_score(y_test, y_pred_rf, zero_division=0),
            'recall': recall_score(y_test, y_pred_rf, zero_division=0),
            'f1_score': f1_score(y_test, y_pred_rf, zero_division=0)
        }
        # Compare models
        best_model = None
        best_model_name = None
        if rf_metrics['f1_score'] > logreg_metrics['f1_score']:
            best_model = rf
            best_model_name = 'random_forest'
        elif rf_metrics['f1_score'] < logreg_metrics['f1_score']:
            best_model = logreg
            best_model_name = 'logistic_regression'
        else:  # Tie on f1_score, use accuracy
            if rf_metrics['accuracy'] >= logreg_metrics['accuracy']:
                best_model = rf
                best_model_name = 'random_forest'
            else:
                best_model = logreg
                best_model_name = 'logistic_regression'
        # Save best model
        model_folder = Path('models')
        model_folder.mkdir(parents=True, exist_ok=True)
        model_path = model_folder / f'best_wildlife_risk_model_{batch_id}.pkl'
        joblib.dump(best_model, model_path)
        print(f'[OK] Best model ({best_model_name}) saved to {model_path}')
        return {
            'status': 'success',
            'batch_id': batch_id,
            'created_at': datetime.utcnow().replace(microsecond=0).isoformat(),
            'gold_file_used': str(gold_file),
            'features_used': features_used,
            'row_count': len(df),
            'train_row_count': len(X_train),
            'test_row_count': len(X_test),
            'logistic_regression_metrics': logreg_metrics,
            'random_forest_metrics': rf_metrics,
            'selected_best_model': best_model_name,
            'saved_model_path': str(model_path)
        }
    except Exception as e:
        print(f'[ERROR] Model comparison failed: {e}')
        return {'status': 'error', 'row_count': 0, 'gold_file_used': str(gold_file)}
