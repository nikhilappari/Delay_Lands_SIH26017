import os
import time
from datetime import datetime
import pandas as pd
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

from backend.database.db import get_db
from backend.database.models import PredictionRecord, AuditLog
from backend.services.ml_service import ml_service

router = APIRouter(prefix="/api/model", tags=["Model Governance & Continuous Learning"])

# Persistent in-memory training history
retraining_history = [
    {
        "version": "v1.0",
        "timestamp": datetime.utcnow().isoformat(),
        "train_samples": 40,
        "test_samples": 10,
        "total_samples": 50,
        "accuracy": 83.0,
        "precision": 87.5,
        "recall": 87.5,
        "f1_score": 87.5,
        "notes": "Initial base model trained on historical land acquisition dataset."
    }
]

@router.post("/retrain")
def retrain_model(db: Session = Depends(get_db)):
    """
    Continuous Learning Engine:
    Ingests all accumulated case evaluations from SQLite, merges with base dataset,
    retrains the Random Forest Classifier, updates live model weights, and benchmarks
    performance metrics (Before vs. After).
    """
    start_time = time.time()
    try:
        # Load base dataset
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        dataset_path = os.path.join(base_dir, "ml", "data", "land_acquisition_dataset.csv")
        base_df = pd.read_csv(dataset_path)
        
        # Load newly logged predictions from DB
        db_records = db.query(PredictionRecord).all()
        
        if db_records:
            new_rows = []
            for r in db_records:
                new_rows.append({
                    "Project_ID": r.project_id,
                    "Project_Type": r.project_type,
                    "Land_Area_Acres": r.land_area_acres,
                    "Owners": r.owners,
                    "Disputes": r.disputes,
                    "Objections": r.objections,
                    "Pending_Documents": r.pending_documents,
                    "Pending_Approvals": r.pending_approvals,
                    "Compensation_Pending": r.compensation_pending,
                    "Current_Stage": r.current_stage,
                    "Days_in_Current_Stage": r.days_in_current_stage,
                    "Total_Days": r.total_days,
                    "Previous_Delays": r.previous_delays,
                    "Land_Record_Complexity": r.land_record_complexity,
                    "Target_Delayed": r.target_delayed
                })
            new_df = pd.DataFrame(new_rows)
            combined_df = pd.concat([base_df, new_df], ignore_index=True).drop_duplicates(subset=["Project_ID"], keep="last")
        else:
            combined_df = base_df

        # Feature lists
        features = [
            "Project_Type",
            "Land_Area_Acres",
            "Owners",
            "Disputes",
            "Objections",
            "Pending_Documents",
            "Pending_Approvals",
            "Compensation_Pending",
            "Current_Stage",
            "Days_in_Current_Stage",
            "Total_Days",
            "Previous_Delays",
            "Land_Record_Complexity"
        ]
        categorical_features = ["Project_Type", "Current_Stage", "Land_Record_Complexity"]

        X = combined_df[features]
        y = combined_df["Target_Delayed"]

        # Train/Test Split
        test_size = max(0.2, min(0.3, 10 / len(combined_df))) if len(combined_df) >= 20 else 0.2
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y if len(y.unique()) > 1 else None
        )

        from sklearn.compose import ColumnTransformer
        from sklearn.preprocessing import OneHotEncoder
        from sklearn.pipeline import Pipeline

        preprocessor = ColumnTransformer(
            transformers=[
                ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features)
            ],
            remainder="passthrough"
        )

        new_pipeline = Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("model", RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced"))
            ]
        )

        new_pipeline.fit(X_train, y_train)

        # Evaluate performance
        y_pred = new_pipeline.predict(X_test)
        acc = round(accuracy_score(y_test, y_pred) * 100, 2)
        prec = round(precision_score(y_test, y_pred, zero_division=0) * 100, 2)
        rec = round(recall_score(y_test, y_pred, zero_division=0) * 100, 2)
        f1 = round(f1_score(y_test, y_pred, zero_division=0) * 100, 2)
        cm = confusion_matrix(y_test, y_pred).tolist()

        # Update Live Service
        old_acc = ml_service.metadata.get("accuracy", 83.0) if ml_service.metadata else 83.0
        ml_service.pipeline = new_pipeline
        
        # Update metadata
        if ml_service.metadata:
            ml_service.metadata.update({
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "f1_score": f1,
                "train_samples": len(X_train),
                "test_samples": len(X_test),
                "confusion_matrix": cm,
                "version": f"v1.{len(retraining_history)}"
            })

        version_num = f"v1.{len(retraining_history)}"
        elapsed_sec = round(time.time() - start_time, 2)

        record = {
            "version": version_num,
            "timestamp": datetime.utcnow().isoformat(),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "total_samples": len(combined_df),
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "training_time_seconds": elapsed_sec,
            "notes": f"Online continuous learning iteration with {len(combined_df)} cumulative cases."
        }
        retraining_history.append(record)

        # Audit Log
        audit = AuditLog(
            action="MODEL_RETRAINED",
            actor_role="ML Governance System",
            details={
                "version": version_num,
                "old_accuracy": old_acc,
                "new_accuracy": acc,
                "samples": len(combined_df),
                "duration_s": elapsed_sec
            },
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.commit()

        return {
            "status": "SUCCESS",
            "message": f"Random Forest successfully retrained on {len(combined_df)} cases.",
            "version": version_num,
            "training_time_seconds": elapsed_sec,
            "metrics": {
                "before": {"accuracy": old_acc},
                "after": {"accuracy": acc, "precision": prec, "recall": rec, "f1_score": f1},
                "samples_trained": len(X_train),
                "samples_tested": len(X_test),
                "total_records": len(combined_df)
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Continuous retraining failed: {str(e)}"
        )

@router.get("/retrain/history")
def get_retraining_history():
    """
    Returns model training lineage and version history.
    """
    return list(reversed(retraining_history))
