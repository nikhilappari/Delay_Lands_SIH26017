import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.database.db import engine, Base, SessionLocal
from backend.database.models import PredictionRecord, AlertRecord, AuditLog, User
from backend.routes import predict, history, analytics, model_info, alerts, retrain, integrations, auth, admin
from backend.services.auth_service import hash_password

# Initialize Database Tables
Base.metadata.create_all(bind=engine)

def seed_initial_users():
    """
    Ensures an initial Administrator and a sample Government Officer exist.
    Credentials can be configured via environment variables.
    """
    db = SessionLocal()
    try:
        # 1. Initial Administrator
        admin_email = os.environ.get("ADMIN_EMAIL", "admin@delaylands.gov.in").strip().lower()
        admin_emp_id = os.environ.get("ADMIN_EMPLOYEE_ID", "ADMIN-001").strip()
        admin_pwd = os.environ.get("ADMIN_PASSWORD", "Admin@DelayLands2026")

        existing_admin = db.query(User).filter(
            (User.email == admin_email) | (User.role == "ADMIN")
        ).first()

        if not existing_admin:
            admin_user = User(
                fullName="System Administrator",
                employeeId=admin_emp_id,
                email=admin_email,
                department="Ministry of Land Resources",
                designation="Chief System Administrator",
                passwordHash=hash_password(admin_pwd),
                role="ADMIN",
                status="ACTIVE",
                createdAt=datetime.utcnow(),
                updatedAt=datetime.utcnow()
            )
            db.add(admin_user)
            db.commit()
            print(f"[Security] Initial Administrator account initialized ({admin_email} / ID: {admin_emp_id})")

        # 2. Sample Active Government Officer (SLAO)
        officer_email = os.environ.get("OFFICER_EMAIL", "officer@delaylands.gov.in").strip().lower()
        officer_emp_id = os.environ.get("OFFICER_EMPLOYEE_ID", "OFF-4091").strip()
        officer_pwd = os.environ.get("OFFICER_PASSWORD", "Officer@DelayLands2026")

        existing_officer = db.query(User).filter(
            (User.email == officer_email) | (User.employeeId == officer_emp_id)
        ).first()

        if not existing_officer:
            officer_user = User(
                fullName="Dr. Rajesh Sharma",
                employeeId=officer_emp_id,
                email=officer_email,
                department="National Highways Authority of India (NHAI)",
                designation="Special Land Acquisition Officer (SLAO)",
                passwordHash=hash_password(officer_pwd),
                role="OFFICER",
                status="ACTIVE",
                createdAt=datetime.utcnow(),
                updatedAt=datetime.utcnow()
            )
            db.add(officer_user)
            db.commit()
            print(f"[Security] Sample Officer account initialized ({officer_email} / ID: {officer_emp_id})")
    except Exception as e:
        print(f"[Security] User initialization notice: {e}")
    finally:
        db.close()

from datetime import datetime
seed_initial_users()

app = FastAPI(
    title="Delay Lands - Predictive Analytics API",
    description="Enterprise Machine Learning API with Role-Based Authentication & Authorization for land acquisition delay risk governance.",
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(predict.router)
app.include_router(history.router)
app.include_router(analytics.router)
app.include_router(model_info.router)
app.include_router(alerts.router)
app.include_router(retrain.router)
app.include_router(integrations.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Land Acquisition Delay Prediction System",
        "version": "1.0.0"
    }

# Production Static Files & SPA Routing
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Ignore API routes
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
import logging

logger = logging.getLogger("land_acquisition")

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

from fastapi.encoders import jsonable_encoder

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": jsonable_encoder(exc.errors())}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.url.path}: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)
