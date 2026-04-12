"""
backend/seed_db.py
Seeds MongoDB with sample service providers, services, and demo users.
Run: python seed_db.py
"""

import asyncio
import os
from datetime import datetime
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB_NAME", "scheduleai")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


SERVICE_PROVIDERS = [
    {
        "_id": ObjectId(),
        "name": "The Style Studio",
        "ownerName": "Priya Sharma",
        "email": "thestylestudio@demo.com",
        "passwordHash": hash_password("demo1234"),
        "category": "Beauty & Hair",
        "location": "Koramangala, Bangalore",
        "services": ["haircut", "coloring", "styling"],
        "availability": {
            "monday": ["09:00", "10:30", "12:00", "14:00", "16:00"],
            "tuesday": ["09:00", "11:00", "13:00", "15:00"],
            "wednesday": ["10:00", "12:00", "14:00", "17:00"],
            "thursday": ["09:00", "11:00", "13:30", "15:30"],
            "friday": ["09:00", "10:30", "14:00", "16:00"],
            "saturday": ["10:00", "12:00", "14:00"],
        },
        "rating": 4.9,
        "role": "provider",
        "createdAt": datetime.utcnow(),
    },
    {
        "_id": ObjectId(),
        "name": "City Dental Clinic",
        "ownerName": "Dr. Arun Mehta",
        "email": "citydentalclinic@demo.com",
        "passwordHash": hash_password("demo1234"),
        "category": "Dental",
        "location": "Indiranagar, Bangalore",
        "services": ["dental checkup", "cleaning", "whitening", "root canal"],
        "availability": {
            "monday": ["09:30", "11:00", "14:00", "16:00"],
            "tuesday": ["10:00", "12:00", "15:00"],
            "wednesday": ["09:30", "11:00", "14:30", "16:30"],
            "thursday": ["10:00", "13:00", "15:30"],
            "friday": ["09:30", "11:30", "14:00"],
            "saturday": ["10:00", "12:00"],
        },
        "rating": 4.8,
        "role": "provider",
        "createdAt": datetime.utcnow(),
    },
    {
        "_id": ObjectId(),
        "name": "Serenity Spa & Wellness",
        "ownerName": "Kavya Nair",
        "email": "serenityspa@demo.com",
        "passwordHash": hash_password("demo1234"),
        "category": "Wellness & Spa",
        "location": "HSR Layout, Bangalore",
        "services": ["massage", "deep tissue", "aromatherapy", "facial"],
        "availability": {
            "tuesday": ["11:00", "13:00", "15:00", "17:00"],
            "wednesday": ["10:00", "12:00", "14:00", "16:00"],
            "thursday": ["11:00", "13:00", "15:30"],
            "friday": ["10:00", "12:00", "14:00", "16:30"],
            "saturday": ["09:00", "11:00", "13:00", "15:00"],
            "sunday": ["10:00", "12:00", "14:00"],
        },
        "rating": 4.7,
        "role": "provider",
        "createdAt": datetime.utcnow(),
    },
    {
        "_id": ObjectId(),
        "name": "FitZone Personal Training",
        "ownerName": "Rahul Verma",
        "email": "fitzonetraining@demo.com",
        "passwordHash": hash_password("demo1234"),
        "category": "Fitness",
        "location": "Whitefield, Bangalore",
        "services": ["personal training", "weight loss", "strength", "yoga"],
        "availability": {
            "monday": ["06:00", "07:00", "08:00", "17:00", "18:00", "19:00"],
            "tuesday": ["06:00", "07:30", "17:00", "18:30"],
            "wednesday": ["06:00", "07:00", "08:00", "18:00", "19:00"],
            "thursday": ["06:30", "08:00", "17:00", "18:30"],
            "friday": ["06:00", "07:30", "17:30", "19:00"],
            "saturday": ["07:00", "08:30", "10:00"],
        },
        "rating": 4.6,
        "role": "provider",
        "createdAt": datetime.utcnow(),
    },
    {
        "_id": ObjectId(),
        "name": "Apollo Health Clinic",
        "ownerName": "Dr. Sneha Krishnan",
        "email": "apollohealth@demo.com",
        "passwordHash": hash_password("demo1234"),
        "category": "Healthcare",
        "location": "MG Road, Bangalore",
        "services": ["general checkup", "consultation", "health screening"],
        "availability": {
            "monday": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
            "tuesday": ["09:30", "10:30", "14:00", "15:30"],
            "wednesday": ["09:00", "11:00", "14:00", "16:00"],
            "thursday": ["10:00", "11:00", "14:30", "16:00"],
            "friday": ["09:00", "10:30", "14:00", "15:00"],
        },
        "rating": 4.8,
        "role": "provider",
        "createdAt": datetime.utcnow(),
    },
    {
        "_id": ObjectId(),
        "name": "Glow Beauty Studio",
        "ownerName": "Meera Pillai",
        "email": "glowbeautystudio@demo.com",
        "passwordHash": hash_password("demo1234"),
        "category": "Beauty & Hair",
        "location": "JP Nagar, Bangalore",
        "services": ["facial", "manicure", "pedicure", "threading", "waxing"],
        "availability": {
            "monday": ["10:00", "12:00", "14:00", "16:00"],
            "wednesday": ["10:00", "11:30", "14:00", "16:00"],
            "thursday": ["10:30", "12:00", "15:00"],
            "friday": ["10:00", "12:00", "14:30", "16:00"],
            "saturday": ["09:00", "10:30", "12:00", "14:00", "16:00"],
            "sunday": ["10:00", "12:00"],
        },
        "rating": 4.5,
        "role": "provider",
        "createdAt": datetime.utcnow(),
    },
]


def make_services(providers: list) -> list:
    """Create service documents linked to providers."""
    services = []

    sp = providers[0]  # Style Studio
    services.extend([
        {
            "name": "Hair Cut & Style",
            "category": "Beauty & Hair",
            "provider_id": sp["_id"],
            "duration_minutes": 60,
            "price": 800,
            "description": "Professional haircut and styling tailored to your face shape.",
            "tags": ["haircut", "styling", "hair", "beauty", "salon"],
        },
        {
            "name": "Hair Color & Highlights",
            "category": "Beauty & Hair",
            "provider_id": sp["_id"],
            "duration_minutes": 120,
            "price": 2500,
            "description": "Full hair coloring or highlights using premium products.",
            "tags": ["hair color", "highlights", "salon", "beauty", "hair"],
        },
    ])

    sp = providers[1]  # City Dental
    services.extend([
        {
            "name": "Dental Checkup & Cleaning",
            "category": "Dental",
            "provider_id": sp["_id"],
            "duration_minutes": 60,
            "price": 600,
            "description": "Full dental examination and professional teeth cleaning.",
            "tags": ["dental", "checkup", "cleaning", "teeth", "dentist"],
        },
        {
            "name": "Teeth Whitening",
            "category": "Dental",
            "provider_id": sp["_id"],
            "duration_minutes": 90,
            "price": 3500,
            "description": "Professional in-office teeth whitening treatment.",
            "tags": ["whitening", "teeth", "dental", "beauty", "smile"],
        },
    ])

    sp = providers[2]  # Serenity Spa
    services.extend([
        {
            "name": "Swedish Massage",
            "category": "Wellness & Spa",
            "provider_id": sp["_id"],
            "duration_minutes": 60,
            "price": 1200,
            "description": "Relaxing full-body Swedish massage for stress relief.",
            "tags": ["massage", "swedish", "relaxation", "spa", "wellness"],
        },
        {
            "name": "Deep Tissue Massage",
            "category": "Wellness & Spa",
            "provider_id": sp["_id"],
            "duration_minutes": 90,
            "price": 1800,
            "description": "Targeted deep tissue massage for muscle tension and recovery.",
            "tags": ["massage", "deep tissue", "therapy", "wellness", "pain relief"],
        },
        {
            "name": "Aromatherapy Facial",
            "category": "Wellness & Spa",
            "provider_id": sp["_id"],
            "duration_minutes": 75,
            "price": 1500,
            "description": "Rejuvenating facial with essential oils and natural extracts.",
            "tags": ["facial", "aromatherapy", "skincare", "spa", "beauty"],
        },
    ])

    sp = providers[3]  # FitZone
    services.extend([
        {
            "name": "Personal Training Session",
            "category": "Fitness",
            "provider_id": sp["_id"],
            "duration_minutes": 60,
            "price": 1000,
            "description": "One-on-one personal training session tailored to your fitness goals.",
            "tags": ["personal training", "fitness", "gym", "workout", "strength"],
        },
        {
            "name": "Yoga Class",
            "category": "Fitness",
            "provider_id": sp["_id"],
            "duration_minutes": 60,
            "price": 600,
            "description": "Guided yoga session for flexibility, balance and mindfulness.",
            "tags": ["yoga", "fitness", "flexibility", "mindfulness", "wellness"],
        },
    ])

    sp = providers[4]  # Apollo Health
    services.extend([
        {
            "name": "General Health Checkup",
            "category": "Healthcare",
            "provider_id": sp["_id"],
            "duration_minutes": 45,
            "price": 800,
            "description": "Comprehensive general health examination with basic tests.",
            "tags": ["checkup", "health", "doctor", "medical", "consultation"],
        },
        {
            "name": "Doctor Consultation",
            "category": "Healthcare",
            "provider_id": sp["_id"],
            "duration_minutes": 30,
            "price": 500,
            "description": "General physician consultation for any medical concern.",
            "tags": ["doctor", "consultation", "medical", "health", "gp", "physician"],
        },
    ])

    sp = providers[5]  # Glow Beauty
    services.extend([
        {
            "name": "Express Facial",
            "category": "Beauty & Hair",
            "provider_id": sp["_id"],
            "duration_minutes": 45,
            "price": 900,
            "description": "Quick revitalizing facial for glowing skin.",
            "tags": ["facial", "skincare", "beauty", "glow", "skin"],
        },
        {
            "name": "Manicure & Pedicure",
            "category": "Beauty & Hair",
            "provider_id": sp["_id"],
            "duration_minutes": 90,
            "price": 1200,
            "description": "Complete nail care — shaping, cuticle care, and polish.",
            "tags": ["manicure", "pedicure", "nails", "beauty", "salon"],
        },
    ])

    return services


async def seed():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]

    print(f"🌱 Seeding database: {DB_NAME} at {MONGODB_URI}")

    # Drop existing collections
    for col in ["service_providers", "services", "users", "bookings"]:
        await db[col].drop()
        print(f"  🗑  Dropped '{col}' collection")

    # Insert providers
    await db["service_providers"].insert_many(SERVICE_PROVIDERS)
    print(f"  ✅ Inserted {len(SERVICE_PROVIDERS)} service providers")

    # Insert services
    services = make_services(SERVICE_PROVIDERS)
    await db["services"].insert_many(services)
    print(f"  ✅ Inserted {len(services)} services")

    # Insert demo user
    demo_user = {
        "name": "Demo User",
        "email": "demo@scheduleai.com",
        "passwordHash": hash_password("demo1234"),
        "role": "user",
        "createdAt": datetime.utcnow(),
    }
    await db["users"].insert_one(demo_user)
    print("  ✅ Inserted demo user (email: demo@scheduleai.com, password: demo1234)")

    # Create indexes
    await db["services"].create_index([("category", 1)])
    await db["services"].create_index([("tags", 1)])
    await db["service_providers"].create_index([("category", 1)])
    await db["service_providers"].create_index([("email", 1)], unique=True)
    await db["users"].create_index([("email", 1)], unique=True)
    await db["bookings"].create_index([("user_id", 1)])
    await db["bookings"].create_index([("provider_id", 1)])
    print("  ✅ Created indexes")

    client.close()
    print("\n🎉 Database seeded successfully!")
    print("\nDemo accounts:")
    print("  Customer: demo@scheduleai.com / demo1234")
    print("  Provider: thestylestudio@demo.com / demo1234")
    print("  Provider: citydentalclinic@demo.com / demo1234")


if __name__ == "__main__":
    asyncio.run(seed())
