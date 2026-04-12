# File: backend/calendar_tool.py
import os.path
import datetime as dt
from datetime import timezone
from typing import Optional, Dict, Any

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar"]
TIMEZONE = "Asia/Kolkata"


def get_calendar_service():
    """Build and return an authenticated Google Calendar service."""
    creds = None
    token_path = os.path.join(os.path.dirname(__file__), "token.json")
    creds_path = os.path.join(os.path.dirname(__file__), "credentials.json")

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(creds_path):
                print("[Calendar] credentials.json not found — calendar features disabled")
                return None
            flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
            creds = flow.run_local_server(port=8080)
        with open(token_path, "w") as token:
            token.write(creds.to_json())

    return build("calendar", "v3", credentials=creds)


def get_upcoming_events(day: Optional[str] = None) -> Dict[str, Any]:
    """Fetch upcoming events from the primary Google Calendar for a given day."""
    service = get_calendar_service()
    if not service:
        return {"events": [], "error": "Google Calendar not configured"}

    try:
        if day:
            target_date = dt.datetime.fromisoformat(day).date()
        else:
            target_date = dt.date.today()

        local_tz = dt.datetime.now(timezone.utc).astimezone().tzinfo
        time_min = dt.datetime.combine(target_date, dt.time.min, tzinfo=local_tz).isoformat()
        time_max = dt.datetime.combine(target_date, dt.time.max, tzinfo=local_tz).isoformat()

        events_result = service.events().list(
            calendarId="primary",
            timeMin=time_min,
            timeMax=time_max,
            maxResults=20,
            singleEvents=True,
            orderBy="startTime",
        ).execute()

        events = events_result.get("items", [])
        if not events:
            return {"events": [], "message": f"No events found for {target_date.isoformat()}"}

        event_list = []
        for event in events:
            if "dateTime" in event["start"]:
                start_raw = event["start"].get("dateTime")
                start_dt_utc = dt.datetime.fromisoformat(start_raw.replace("Z", "+00:00"))
                local_start_dt = start_dt_utc.astimezone(local_tz)
                time_str = local_start_dt.strftime("%I:%M %p")
            else:
                time_str = "All Day"

            event_list.append({
                "id": event.get("id"),
                "summary": event.get("summary", "Untitled"),
                "time": time_str,
                "location": event.get("location"),
                "html_link": event.get("htmlLink"),
            })

        return {"events": event_list}

    except Exception as e:
        return {"events": [], "error": str(e)}


def create_calendar_event(
    summary: str,
    start_time_str: str,
    duration_minutes: int,
    timezone_str: str = TIMEZONE,
    description: str = "",
    attendees: Optional[list] = None,
) -> Dict[str, Any]:
    """Create a single calendar event and return the result."""
    service = get_calendar_service()
    if not service:
        return {"error": "Google Calendar not configured"}

    try:
        start_time = dt.datetime.fromisoformat(start_time_str)
        end_time = start_time + dt.timedelta(minutes=duration_minutes)

        event_body: Dict[str, Any] = {
            "summary": summary,
            "description": description,
            "start": {"dateTime": start_time.isoformat(), "timeZone": timezone_str},
            "end": {"dateTime": end_time.isoformat(), "timeZone": timezone_str},
        }

        if attendees:
            event_body["attendees"] = [{"email": e} for e in attendees if e]

        created = service.events().insert(calendarId="primary", body=event_body).execute()

        return {
            "status": "success",
            "event_id": created.get("id"),
            "event_link": created.get("htmlLink"),
        }
    except Exception as e:
        return {"error": str(e)}


def create_dual_calendar_event(
    service_name: str,
    date: str,
    time: str,
    duration_minutes: int,
    user_email: str,
    user_name: str,
    provider_email: str = "",
    booking_id: str = "",
) -> Dict[str, Any]:
    """
    Create calendar events for BOTH user and service provider.
    Returns event IDs and links for both parties.
    """
    # Parse datetime
    try:
        # time can be "14:00" or "2:00 PM"
        if ":" in time:
            parts = time.strip().split(":")
            hour = int(parts[0])
            rest = parts[1].strip()
            # handle AM/PM
            if "pm" in rest.lower() and hour != 12:
                hour += 12
            elif "am" in rest.lower() and hour == 12:
                hour = 0
            minute = int("".join(filter(str.isdigit, rest[:2])))
        else:
            hour, minute = 9, 0

        date_obj = dt.date.fromisoformat(date)
        start_dt = dt.datetime(date_obj.year, date_obj.month, date_obj.day, hour, minute)
        start_str = start_dt.isoformat()
    except Exception as e:
        return {"error": f"Invalid date/time format: {e}"}

    description = (
        f"Booking ID: {booking_id}\n"
        f"Service: {service_name}\n"
        f"Customer: {user_name} ({user_email})\n"
        f"Booked via ScheduleAI"
    )

    summary_user = f"📅 {service_name} — Booking Confirmed"
    summary_provider = f"📋 {service_name} — {user_name}"

    # User event (attendees: provider)
    user_attendees = [provider_email] if provider_email else []
    user_result = create_calendar_event(
        summary=summary_user,
        start_time_str=start_str,
        duration_minutes=duration_minutes,
        description=description,
        attendees=user_attendees,
    )

    # Provider event (attendees: user)
    provider_result = create_calendar_event(
        summary=summary_provider,
        start_time_str=start_str,
        duration_minutes=duration_minutes,
        description=description,
        attendees=[user_email],
    )

    result: Dict[str, Any] = {}

    if user_result.get("event_id"):
        result["user_event_id"] = user_result["event_id"]
        result["user_event_link"] = user_result.get("event_link")
    else:
        result["user_error"] = user_result.get("error")

    if provider_result.get("event_id"):
        result["provider_event_id"] = provider_result["event_id"]
        result["provider_event_link"] = provider_result.get("event_link")
    else:
        result["provider_error"] = provider_result.get("error")

    if not result.get("user_event_id") and not result.get("provider_event_id"):
        result["error"] = "Failed to create both calendar events"

    return result


if __name__ == "__main__":
    print("Testing Google Calendar connection...")
    service = get_calendar_service()
    if service:
        print("✅ Calendar connected successfully.")
    else:
        print("❌ Calendar connection failed — check credentials.json")