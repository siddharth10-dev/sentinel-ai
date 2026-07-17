import datetime
import logging
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
import uvicorn

from app.schemas.incident import Incident
from graph.workflow import kyro_graph
from app.database import (
    init_db,
    save_incident,
    get_all_incidents,
    get_incident_by_id,
    update_incident_status,
    update_incident_state
)
from app.agents.communication_agent import CommunicationAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from fastapi.middleware.cors import CORSMiddleware

class KyroAI(FastAPI):
    def __init__(self):
        super().__init__()
        self.title = "Kyro AI"
        self.version = "1.0.0"

app = KyroAI()

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

communication_agent = CommunicationAgent()

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health")
def read_root():
    return {"status": "UP"}

@app.get("/test-db")
def test_db():
    import os
    import sqlalchemy
    db_url = os.getenv("DATABASE_URL", "")
    masked_url = db_url
    try:
        if "@" in db_url:
            parts = db_url.split("@")
            prefix = parts[0]
            if ":" in prefix:
                subparts = prefix.rsplit(":", 1)
                masked_url = f"{subparts[0]}:***@{parts[1]}"
    except Exception:
        masked_url = "error masking url"
        
    try:
        engine = sqlalchemy.create_engine(db_url)
        with engine.connect() as conn:
            result = conn.execute(sqlalchemy.text("SELECT 1")).fetchall()
        return {"status": "success", "url": masked_url, "result": str(result)}
    except Exception as e:
        return {"status": "error", "url": masked_url, "error": str(e)}

def run_investigation(incident_id: int, initial_state: dict):
    logger.info(f"Starting async investigation for incident {incident_id}")
    try:
        # Stream the LangGraph workflow
        for event in kyro_graph.stream(initial_state):
            # For each event emitted by a node, extract the state
            # The event is usually a dict mapping node_name -> state
            for node_name, state in event.items():
                logger.info(f"Node {node_name} completed for incident {incident_id}")
                update_incident_state(incident_id, state)
        
        # After loop finishes, update status to pending_approval
        final_state = initial_state # Initial state dict is updated by reference in LangGraph? Actually stream returns states.
        incident_dict = get_incident_by_id(incident_id)
        timeline = list(incident_dict.get("timeline", [])) if incident_dict else []
        time_str = datetime.datetime.now().strftime("%H:%M")
        timeline.append(f"{time_str} Waiting for human approval")
        
        update_incident_status(
            incident_id=incident_id, 
            status="pending_approval", 
            timeline=timeline
        )
    except Exception as e:
        logger.error(f"Error in investigation task for incident {incident_id}: {e}")

@app.post("/incident")
async def log_incident(request: Request, background_tasks: BackgroundTasks):
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Parse Alertmanager payload
    if "alerts" in payload and len(payload["alerts"]) > 0:
        alert = payload["alerts"][0] # Take the first firing alert
        status = alert.get("status", "firing")
        if status != "firing":
            return {"status": "ignored", "reason": "Alert is not firing"}
            
        labels = alert.get("labels", {})
        annotations = alert.get("annotations", {})
        
        incident_obj = Incident(
            service=labels.get("service", "unknown-service"),
            message=annotations.get("summary", "Automated alert received"),
            severity=labels.get("severity", "critical")
        )
    else:
        # Fallback to direct Incident payload for testing if needed
        try:
            incident_obj = Incident(**payload)
        except Exception:
            raise HTTPException(status_code=400, detail="Payload format not supported")

    time_str = datetime.datetime.now().strftime("%H:%M")
    initial_state = {
        "incident": incident_obj,
        "classification": {},
        "investigation": {},
        "root_cause": {},
        "runbook": {},
        "recommendation": {},
        "timeline": [f"{time_str} Alert Received from Alertmanager"],
        "status": "investigating"
    }
    
    # Save the incident with the investigating status
    db_id = save_incident(initial_state)
    
    # Run the graph workflow in background
    background_tasks.add_task(run_investigation, db_id, initial_state)
    
    return {
        "status": "accepted",
        "message": "Incident created and investigation started.",
        "incident_id": db_id
    }

@app.get("/incidents")
def list_incidents():
    return get_all_incidents()

@app.get("/incidents/{incident_id}")
def get_incident(incident_id: int):
    incident = get_incident_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@app.post("/incidents/{incident_id}/approve")
def approve_incident(incident_id: int):
    # Fetch incident
    incident_dict = get_incident_by_id(incident_id)
    if not incident_dict:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    if incident_dict["status"] != "pending_approval":
        raise HTTPException(
            status_code=400,
            detail=f"Incident is in status '{incident_dict['status']}', expected 'pending_approval'."
        )
        
    # Generate communication reports
    try:
        communication_reports = communication_agent.generate_reports(incident_dict)
    except Exception as e:
        logger.error(f"Error generating communication reports: {e}")
        communication_reports = {
            "incident_report": f"# Incident Report\n\nFailed to generate report automatically.",
            "executive_summary": "Failed to generate executive summary.",
            "slack_message": "🚨 *Incident resolution approved*."
        }
        
    # Update timeline
    timeline = list(incident_dict.get("timeline", []))
    time_str = datetime.datetime.now().strftime("%H:%M")
    timeline.append(f"{time_str} Recommendation approved by human")
    timeline.append(f"{time_str} Communication reports generated")
    
    # Update status to resolved
    updated = update_incident_status(
        incident_id=incident_id,
        status="resolved",
        communication_data=communication_reports,
        timeline=timeline
    )
    
    return {
        "status": "resolved",
        "message": "Incident approved and resolved successfully.",
        "incident_id": incident_id,
        "communication": communication_reports,
        "timeline": timeline
    }

@app.post("/incidents/{incident_id}/reject")
def reject_incident(incident_id: int):
    # Fetch incident
    incident_dict = get_incident_by_id(incident_id)
    if not incident_dict:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    if incident_dict["status"] != "pending_approval":
        raise HTTPException(
            status_code=400,
            detail=f"Incident is in status '{incident_dict['status']}', expected 'pending_approval'."
        )
        
    # Update timeline
    timeline = list(incident_dict.get("timeline", []))
    time_str = datetime.datetime.now().strftime("%H:%M")
    timeline.append(f"{time_str} Recommendation rejected by human")
    
    # Update status to rejected
    updated = update_incident_status(
        incident_id=incident_id,
        status="rejected",
        timeline=timeline
    )
    
    return {
        "status": "rejected",
        "message": "Incident recommendation rejected.",
        "incident_id": incident_id,
        "timeline": timeline
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)