"""
Trains an XGBoost model for wildlife collision risk prediction.
Logs model, metrics, params, and artifacts to MLflow.
"""

from datetime import datetime, timezone
from pathlib import Path
import pickle
import json

import mlflow
import mlflow.sklearn
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

from model.model_utils import GOLD_DIR, find_latest_gold_csv, load_latest_gold_batch


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = PROJECT_ROOT / "models"
MLFLOW_DB = f"sqlite:///{PROJECT_ROOT / 'mlflow.db'}"
EXPERIMENT_NAME = "wildlife_collision_model_training"


def setup_mlflow():
    mlflow.set_tracking_uri(MLFLOW_DB)
    mlflow.set_experiment(EXPERIMENT_NAME)


def train_model(batch_id):
    setup_mlflow()

    print(f"[INFO] Gold directory: {GOLD_DIR}")

    df, gold_source = load_latest_gold_batch()
    artifact_gold_file = find_latest_gold_csv()

    if df is None:
        if artifact_gold_file:
            print(f"[WARN] Falling back to local Gold CSV mirror: {artifact_gold_file}")
            df = pd.read_csv(artifact_gold_file)
            gold_source = str(artifact_gold_file)
        else:
            print(f"[ERROR] No Gold dataset found in Delta or {GOLD_DIR}.")
            return {
                "status": "empty",
                "row_count": 0,
                "gold_file_used": None,
            }

    try:
        print(f"[DEBUG] Gold dataset rows loaded for training: {len(df)}")

        if "high_risk_target" not in df.columns:
            print("[ERROR] Missing high_risk_target column.")
            return {
                "status": "error",
                "row_count": len(df),
                "gold_file_used": str(gold_source),
            }

        feature_candidates = [
            "temperature",
            "precipitation",
            "wind_speed",
            "visibility",
            "speed_limit",
            "hour",
            "month",
            "is_night",
            "is_weekend",
            "high_precipitation",
        ]

        features_used = [col for col in feature_candidates if col in df.columns]

        if not features_used:
            print("[ERROR] No valid features found.")
            return {
                "status": "error",
                "row_count": len(df),
                "gold_file_used": str(gold_source),
            }

        df = df.dropna(subset=["high_risk_target"])

        # Print missing values before imputation
        print(f"[DEBUG] Missing values before imputation:")
        missing_counts = df[features_used].isna().sum()
        print(missing_counts)

        if len(df) < 5:
            print("[ERROR] Not enough rows to train.")
            return {
                "status": "error",
                "row_count": len(df),
                "gold_file_used": str(gold_source),
            }

        X = df[features_used]
        y = df["high_risk_target"]

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
        )

        # Create a pipeline with imputer and XGBoost classifier
        model_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            (
                "xgboost",
                XGBClassifier(
                    n_estimators=200,
                    max_depth=6,
                    learning_rate=0.05,
                    subsample=0.9,
                    colsample_bytree=0.9,
                    objective="binary:logistic",
                    eval_metric="logloss",
                    random_state=42,
                ),
            ),
        ])

        # Fit the pipeline on training data (imputer is fitted on X_train)
        model_pipeline.fit(X_train, y_train)

        # Predict on test data (uses the fitted imputer)
        y_pred = model_pipeline.predict(X_test)

        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred, zero_division=0),
            "recall": recall_score(y_test, y_pred, zero_division=0),
            "f1_score": f1_score(y_test, y_pred, zero_division=0),
        }
        xgb_model = model_pipeline.named_steps["xgboost"]
        feature_importances = {
            feature: float(importance)
            for feature, importance in zip(features_used, xgb_model.feature_importances_)
        }

        model_folder = MODELS_DIR
        model_folder.mkdir(parents=True, exist_ok=True)

        model_path = model_folder / f"wildlife_risk_model_{batch_id}.pkl"
        feature_importance_path = model_folder / f"wildlife_risk_feature_importance_{batch_id}.json"

        with open(model_path, "wb") as f:
            pickle.dump(model_pipeline, f)
        with open(feature_importance_path, "w", encoding="utf-8") as f:
            json.dump(feature_importances, f, indent=2)

        print(f"[OK] Model pipeline saved to {model_path}")
        print(f"[INFO] Model absolute path: {model_path.resolve()}")
        print(f"[INFO] Feature importance saved to {feature_importance_path.resolve()}")

        with mlflow.start_run(run_name=f"train_{batch_id}"):
            mlflow.log_param("batch_id", batch_id)
            mlflow.log_param("model_type", "xgboost_with_imputer")
            mlflow.log_param("gold_file_used", str(gold_source))
            mlflow.log_param("features_used", ",".join(features_used))
            mlflow.log_param("feature_count", len(features_used))
            mlflow.log_param("imputer_strategy", "median")
            mlflow.log_param("model_path", str(model_path))
            mlflow.log_param("xgb_n_estimators", 200)
            mlflow.log_param("xgb_max_depth", 6)
            mlflow.log_param("xgb_learning_rate", 0.05)
            mlflow.log_param("xgb_subsample", 0.9)
            mlflow.log_param("xgb_colsample_bytree", 0.9)

            mlflow.log_metric("row_count", len(df))
            mlflow.log_metric("train_row_count", len(X_train))
            mlflow.log_metric("test_row_count", len(X_test))

            for metric_name, metric_value in metrics.items():
                mlflow.log_metric(metric_name, float(metric_value))
            for feature_name, importance_value in feature_importances.items():
                mlflow.log_metric(f"feature_importance_{feature_name}", float(importance_value))

            mlflow.sklearn.log_model(
                sk_model=model_pipeline,
                name="model",
                input_example=X_train.head(1),
            )

            if artifact_gold_file and Path(artifact_gold_file).exists():
                mlflow.log_artifact(str(artifact_gold_file), artifact_path="data")
            mlflow.log_artifact(str(model_path), artifact_path="model_file")
            mlflow.log_artifact(str(feature_importance_path), artifact_path="model_file")

            print("[INFO] Logged model, metrics, params, and artifacts to MLflow")

        return {
            "status": "success",
            "batch_id": batch_id,
            "created_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            "gold_file_used": str(gold_source),
            "features_used": features_used,
            "row_count": len(df),
            "train_row_count": len(X_train),
            "test_row_count": len(X_test),
            "metrics": metrics,
            "feature_importances": feature_importances,
            "model_path": str(model_path),
        }

    except Exception as e:
        print(f"[ERROR] Model training failed: {e}")
        return {
            "status": "error",
            "row_count": 0,
            "gold_file_used": str(gold_source),
        }
