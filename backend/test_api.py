import sys
import os
import asyncio

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx
from backend.main import app

async def test_endpoints():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        print("Testing /api/health...")
        r = await client.get("/api/health")
        assert r.status_code == 200, f"Health check failed: {r.text}"
        print("Health response:", r.json())

        print("\nTesting /api/model-info...")
        r = await client.get("/api/model-info")
        assert r.status_code == 200, f"Model info failed: {r.text}"
        print("Model accuracy:", r.json()["accuracy"], "%")
        print("Top features:", [f["feature"] for f in r.json()["feature_importance"][:4]])

        print("\nTesting /api/predict with official test case (P0016 Highway)...")
        payload = {
            "project_type": "Highway",
            "land_area_acres": 300.8,
            "owners": 13,
            "disputes": 2,
            "objections": 1,
            "pending_documents": 3,
            "pending_approvals": 1,
            "compensation_pending": 9,
            "current_stage": "Approval",
            "days_in_current_stage": 44,
            "total_days": 47,
            "previous_delays": 0,
            "land_record_complexity": "Low"
        }
        r = await client.post("/api/predict", json=payload)
        assert r.status_code == 201, f"Prediction failed: {r.text}"
        res = r.json()
        print("Prediction response:")
        print("  Project ID:", res["project_id"])
        print("  Target Delayed:", res["target_delayed"], f"({res['predicted_outcome']})")
        print("  Risk Score:", res["risk_score"], "%")
        print("  Risk Level:", res["risk_level"])
        print("  Risk Factors Count:", len(res["risk_factors"]))
        print("  Top Risk Factors:", [(rf["display_name"], rf["impact"], rf["score"]) for rf in res["risk_factors"][:3]])
        print("  Recommendations Count:", len(res["recommendations"]))
        print("  Top Recommendations:", [(rec["title"], rec["priority"]) for rec in res["recommendations"][:2]])

        print("\nTesting /api/predictions history...")
        r = await client.get("/api/predictions")
        assert r.status_code == 200, f"History failed: {r.text}"
        hist = r.json()
        print("Total stored predictions:", hist["total"])

        print("\nTesting /api/analytics...")
        r = await client.get("/api/analytics")
        assert r.status_code == 200, f"Analytics failed: {r.text}"
        analytics = r.json()
        print("Analytics total cases:", analytics["total_cases"])
        print("Analytics high risk:", analytics["high_risk_cases"])
        print("Analytics medium risk:", analytics["medium_risk_cases"])
        print("Analytics low risk:", analytics["low_risk_cases"])

        print("\nAll Backend tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(test_endpoints())
