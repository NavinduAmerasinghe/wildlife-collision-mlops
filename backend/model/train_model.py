"""
Trains a baseline logistic regression model for wildlife collision risk prediction.
"""
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import pickle
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from model.model_utils import find_latest_gold_csv

def train_model(batch_id):
    """
    Loads Gold dataset, trains a logistic regression model, evaluates, and saves outputs.
    Returns a dict with run info and metrics.
    """
    gold_file = find_latest_gold_csv()
    if not gold_file:
        print('[ERROR] No Gold dataset found. Training aborted.')
        return {'status': 'empty', 'row_count': 0, 'gold_file_used': None}
    try:
        df = pd.read_csv(gold_file)
        if 'high_risk_target' not in df.columns:
            print('[ERROR] Gold dataset missing high_risk_target column. Training aborted.')
            return {'status': 'error', 'row_count': len(df), 'gold_file_used': str(gold_file)}
        # Select numeric features
        feature_candidates = [
            'temperature', 'precipitation', 'wind_speed', 'visibility',
            'speed_limit', 'hour', 'month', 'is_night', 'is_weekend', 'high_precipitation'
        ]
        features_used = [f for f in feature_candidates if f in df.columns]
        if not features_used:
            print('[ERROR] No valid features found in Gold dataset. Training aborted.')
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
            print('[WARN] Not enough data to split. Training aborted.')
            return {'status': 'error', 'row_count': len(df), 'gold_file_used': str(gold_file)}
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        # Train model
        model = LogisticRegression(max_iter=200)
        model.fit(X_train, y_train)
        # Predict and evaluate
        y_pred = model.predict(X_test)
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, zero_division=0),
            'recall': recall_score(y_test, y_pred, zero_division=0),
            'f1_score': f1_score(y_test, y_pred, zero_division=0)
        }
        # Save model
        model_folder = Path('models')
        model_folder.mkdir(parents=True, exist_ok=True)
        model_path = model_folder / f'wildlife_risk_model_{batch_id}.pkl'
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        print(f'[OK] Model saved to {model_path}')
        return {
            'status': 'success',
            'batch_id': batch_id,
            'created_at': datetime.utcnow().replace(microsecond=0).isoformat(),
            'gold_file_used': str(gold_file),
            'features_used': features_used,
            'row_count': len(df),
            'train_row_count': len(X_train),
            'test_row_count': len(X_test),
            'metrics': metrics,
            'model_path': str(model_path)
        }
    except Exception as e:
        print(f'[ERROR] Model training failed: {e}')
        return {'status': 'error', 'row_count': 0, 'gold_file_used': str(gold_file)}
