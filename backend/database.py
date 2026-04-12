"""
backend/database.py
Async MongoDB connection and CRUD helpers using motor
"""

import os
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB_NAME", "scheduleai")

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def get_db() -> AsyncIOMotorDatabase:
    global _client, _db
    if _db is None:
        _client = AsyncIOMotorClient(MONGODB_URI)
        _db = _client[DB_NAME]
    return _db


async def close_db():
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None


# ─── Service Queries ──────────────────────────────────────────────────────────

async def find_services(query: Dict[str, Any], limit: int = 20) -> List[Dict]:
    db = await get_db()
    cursor = db["services"].find(query).limit(limit)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "provider_id" in doc:
            doc["provider_id"] = str(doc["provider_id"])
        results.append(doc)
    return results


async def find_providers(query: Dict[str, Any], limit: int = 20) -> List[Dict]:
    db = await get_db()
    cursor = db["service_providers"].find(query).limit(limit)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results


async def get_provider_by_id(provider_id: str) -> Optional[Dict]:
    db = await get_db()
    try:
        doc = await db["service_providers"].find_one({"_id": ObjectId(provider_id)})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc
    except Exception:
        return None


async def get_service_by_id(service_id: str) -> Optional[Dict]:
    db = await get_db()
    try:
        doc = await db["services"].find_one({"_id": ObjectId(service_id)})
        if doc:
            doc["_id"] = str(doc["_id"])
            if "provider_id" in doc:
                doc["provider_id"] = str(doc["provider_id"])
        return doc
    except Exception:
        return None


async def create_booking(booking_data: Dict) -> str:
    db = await get_db()
    result = await db["bookings"].insert_one(booking_data)
    return str(result.inserted_id)


async def update_booking(booking_id: str, update_data: Dict) -> bool:
    db = await get_db()
    try:
        result = await db["bookings"].update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    except Exception:
        return False


async def find_bookings(query: Dict, limit: int = 50) -> List[Dict]:
    db = await get_db()
    cursor = db["bookings"].find(query).sort("created_at", -1).limit(limit)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        for key in ["user_id", "service_id", "provider_id"]:
            if key in doc and hasattr(doc[key], "__str__"):
                doc[key] = str(doc[key])
        results.append(doc)
    return results
