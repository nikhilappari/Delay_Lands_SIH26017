import os
import json
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

def train_and_save_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "data", "land_acquisition_dataset.csv")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    model_save_path = os.path.join(models_dir, "land_delay_rf_model.joblib")
    metadata_save_path = os.path.join(models_dir, "model_metadata.json")

    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    print(f"Dataset shape: {df.shape}")

    # Features and Target
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

    categorical_features = [
        "Project_Type",
        "Current_Stage",
        "Land_Record_Complexity"
    ]

    numerical_features = [f for f in features if f not in categorical_features]

    X = df[features]
    y = df["Target_Delayed"]

    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                categorical_features
            )
        ],
        remainder="passthrough"
    )

    # Random Forest Classifier
    rf_model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced"
    )

    # Pipeline
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", rf_model)
    ])

    # Stratified Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    print(f"Training set size: {len(X_train)}, Test set size: {len(X_test)}")
    pipeline.fit(X_train, y_train)

    # Predictions & Metrics
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred).tolist()

    print(f"Model Accuracy: {round(accuracy * 100, 2)}%")
    print(f"Model Precision: {round(precision * 100, 2)}%")
    print(f"Model Recall: {round(recall * 100, 2)}%")
    print(f"Model F1-Score: {round(f1 * 100, 2)}%")

    # Extract feature names after one-hot encoding
    fitted_preprocessor = pipeline.named_steps["preprocessor"]
    cat_encoder = fitted_preprocessor.named_transformers_["cat"]
    encoded_cat_names = list(cat_encoder.get_feature_names_out(categorical_features))
    all_feature_names = encoded_cat_names + numerical_features

    # Feature Importances
    fitted_rf = pipeline.named_steps["model"]
    importances = fitted_rf.feature_importances_.tolist()
    feature_importance_map = [
        {"feature": name, "importance": round(imp * 100, 2)}
        for name, imp in sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)
    ]

    # Unique categorical values in dataset
    cat_options = {
        col: sorted(df[col].dropna().unique().tolist())
        for col in categorical_features
    }

    metadata = {
        "model_name": "Random Forest Delay Classifier",
        "algorithm": "RandomForestClassifier",
        "n_estimators": 200,
        "class_weight": "balanced",
        "random_state": 42,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": round(accuracy * 100, 2),
        "precision": round(precision * 100, 2),
        "recall": round(recall * 100, 2),
        "f1_score": round(f1 * 100, 2),
        "confusion_matrix": cm,
        "features": features,
        "categorical_features": categorical_features,
        "numerical_features": numerical_features,
        "encoded_feature_names": all_feature_names,
        "feature_importance": feature_importance_map,
        "categorical_options": cat_options,
        "thresholds": {
            "low_max": 30.0,
            "medium_max": 70.0
        }
    }

    # Save Pipeline
    joblib.dump(pipeline, model_save_path)
    print(f"Model pipeline saved to: {model_save_path}")

    # Save Metadata
    with open(metadata_save_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to: {metadata_save_path}")

    # Test with provided case
    print("\n====================================")
    print(" VERIFYING WITH TEST CASE (P0016 Highway)")
    print("====================================")
    new_case = pd.DataFrame([{
        "Project_Type": "Highway",
        "Land_Area_Acres": 300.8,
        "Owners": 13,
        "Disputes": 2,
        "Objections": 1,
        "Pending_Documents": 3,
        "Pending_Approvals": 1,
        "Compensation_Pending": 9,
        "Current_Stage": "Approval",
        "Days_in_Current_Stage": 44,
        "Total_Days": 47,
        "Previous_Delays": 0,
        "Land_Record_Complexity": "Low"
    }])

    pred = pipeline.predict(new_case)[0]
    prob = pipeline.predict_proba(new_case)[0][1] * 100
    risk_lvl = "LOW" if prob < 30 else ("MEDIUM" if prob < 70 else "HIGH")

    print(f"Target Delayed : {pred} ({'DELAYED' if pred == 1 else 'NO DELAY'})")
    print(f"Risk Score     : {round(prob, 2)}%")
    print(f"Risk Level     : {risk_lvl}")
    print("====================================\n")

    return pipeline, metadata

if __name__ == "__main__":
    train_and_save_model()
