import os
import json
import joblib
import pandas as pd
from typing import Dict, Any, Tuple
from .explainability import calculate_feature_contributions, generate_recommendations

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "models", "land_delay_rf_model.joblib")
METADATA_PATH = os.path.join(BASE_DIR, "ml", "models", "model_metadata.json")

class MLService:
    _instance = None

    def __init__(self):
        self.pipeline = None
        self.metadata = None
        self.load_model()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MLService()
        return cls._instance

    def load_model(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(METADATA_PATH):
            try:
                self.pipeline = joblib.load(MODEL_PATH)
                with open(METADATA_PATH, "r") as f:
                    self.metadata = json.load(f)
                print(f"[MLService] Successfully loaded trained model from {MODEL_PATH}")
            except Exception as e:
                print(f"[MLService] Error loading model: {e}")
                self.train_on_the_fly()
        else:
            print("[MLService] Model file not found. Running training script...")
            self.train_on_the_fly()

    def train_on_the_fly(self):
        import sys
        sys.path.append(os.path.join(BASE_DIR, "ml"))
        from ml.train_model import train_and_save_model
        self.pipeline, self.metadata = train_and_save_model()

    def get_metadata(self) -> Dict[str, Any]:
        if self.metadata is None:
            self.load_model()
        return self.metadata

    def predict(self, input_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes real prediction using the loaded Scikit-Learn Pipeline.
        """
        if self.pipeline is None:
            self.load_model()

        # Map input schema field names to exact DataFrame column names
        df_row = {
            "Project_Type": input_dict["project_type"],
            "Land_Area_Acres": float(input_dict["land_area_acres"]),
            "Owners": int(input_dict["owners"]),
            "Disputes": int(input_dict["disputes"]),
            "Objections": int(input_dict["objections"]),
            "Pending_Documents": int(input_dict["pending_documents"]),
            "Pending_Approvals": int(input_dict["pending_approvals"]),
            "Compensation_Pending": int(input_dict["compensation_pending"]),
            "Current_Stage": input_dict["current_stage"],
            "Days_in_Current_Stage": int(input_dict["days_in_current_stage"]),
            "Total_Days": int(input_dict["total_days"]),
            "Previous_Delays": int(input_dict["previous_delays"]),
            "Land_Record_Complexity": input_dict["land_record_complexity"]
        }

        input_df = pd.DataFrame([df_row])

        # Actual ML Model Inference
        pred_class = int(self.pipeline.predict(input_df)[0])
        probabilities = self.pipeline.predict_proba(input_df)[0]
        
        # Probability of class 1 (Delayed) as percentage
        prob_delay = float(probabilities[1]) * 100.0
        risk_score = round(prob_delay, 2)

        # Configurable Risk Thresholds
        thresholds = self.metadata.get("thresholds", {"low_max": 30.0, "medium_max": 70.0})
        low_max = thresholds.get("low_max", 30.0)
        medium_max = thresholds.get("medium_max", 70.0)

        if risk_score < low_max:
            risk_level = "LOW"
        elif risk_score < medium_max:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        predicted_outcome = "DELAYED" if pred_class == 1 else "ON SCHEDULE"

        # Model-Driven Explainability & Recommendations
        risk_factors = calculate_feature_contributions(self.pipeline, input_df, prob_delay)
        recommendations = generate_recommendations(input_df, risk_factors, risk_level)

        return {
            "target_delayed": pred_class,
            "predicted_outcome": predicted_outcome,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommendations": recommendations,
            "input_data": df_row
        }

ml_service = MLService.get_instance()
