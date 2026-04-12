"""
backend/main.py
FastAPI backend for Universal Service Booking AI System
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from models import ChatRequest, ChatResponse, BookingEventRequest, BookingEventResponse
from agent import run_booking_agent
from calendar_tool import create_dual_calendar_event, get_upcoming_events
from database import get_db, close_db

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 ScheduleAI backend starting up...")
    db = await get_db()
    print(f"✅ MongoDB connected: {db.name}")
    yield
    # Shutdown
    await close_db()
    print("👋 ScheduleAI backend shutting down.")


app = FastAPI(
    title="ScheduleAI — Universal Service Booking API",
    description="AI-powered service booking backend with LangGraph agent",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "service": "ScheduleAI Universal Booking API",
        "version": "2.0.0",
    }


# ─── Chat / Agent ─────────────────────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse, tags=["Agent"])
async def chat(request: ChatRequest):
    """
    Main chat endpoint — runs the 6-node LangGraph booking agent.
    Returns a natural language reply + structured service results list.
    """
    print(f"[/chat] user={request.user_id} | msg={request.message!r}")
    try:
        result = await run_booking_agent(
            message=request.message,
            user_id=request.user_id,
            conversation_id=request.conversation_id or f"{request.user_id}-default",
        )
        return ChatResponse(
            reply=result["reply"],
            services=result.get("services") or [],
            needs_clarification=result.get("needs_clarification", False),
            clarification_question=result.get("clarification_question"),
            intent=result.get("intent"),
        )
    except Exception as e:
        print(f"[/chat] ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Booking Calendar Event ───────────────────────────────────────────────────

@app.post("/create-booking-event", response_model=BookingEventResponse, tags=["Calendar"])
async def create_booking_event(request: BookingEventRequest):
    """
    Create Google Calendar events for both the user and service provider
    when a booking is confirmed.
    """
    print(f"[/create-booking-event] booking_id={request.booking_id}")
    try:
        result = create_dual_calendar_event(
            service_name=request.service_name,
            date=request.date,
            time=request.time,
            duration_minutes=request.duration_minutes,
            user_email=request.user_email,
            user_name=request.user_name,
            provider_email=request.provider_email,
            booking_id=request.booking_id,
        )

        if result.get("error"):
            return BookingEventResponse(
                success=False,
                error=result["error"],
            )

        return BookingEventResponse(
            success=True,
            user_event_id=result.get("user_event_id"),
            user_event_link=result.get("user_event_link"),
            provider_event_id=result.get("provider_event_id"),
            provider_event_link=result.get("provider_event_link"),
        )
    except Exception as e:
        print(f"[/create-booking-event] ERROR: {e}")
        return BookingEventResponse(success=False, error=str(e))


# ─── Calendar Events (Dashboard Sync) ────────────────────────────────────────

@app.get("/calendar/events", tags=["Calendar"])
async def get_calendar_events(day: str = None):
    """
    Fetch upcoming events from Google Calendar for dashboard sync.
    """
    try:
        result = get_upcoming_events(day)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Services / Providers (for frontend browsing) ────────────────────────────

@app.get("/services", tags=["Services"])
async def list_services(category: str = None, limit: int = 20):
    """List all services, optionally filtered by category."""
    from database import find_services
    query = {}
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    services = await find_services(query, limit=limit)
    return {"services": services}


@app.get("/providers", tags=["Providers"])
async def list_providers(category: str = None, limit: int = 20):
    """List all service providers, optionally filtered by category."""
    from database import find_providers
    query = {}
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    providers = await find_providers(query, limit=limit)
    return {"providers": providers}