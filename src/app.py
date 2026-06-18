"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path
from typing import Optional

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"]
    },
    "Basketball Team": {
        "description": "Practice and play basketball with the school team",
        "schedule": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"]
    },
    "Art Club": {
        "description": "Explore your creativity through painting and drawing",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"]
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"]
    },
    "Math Club": {
        "description": "Solve challenging problems and participate in math competitions",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"]
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 12,
        "participants": ["charlotte@mergington.edu", "henry@mergington.edu"]
    }
}

# In-memory leaderboard database
# Structure: {activity_name: [{email, score, rank}, ...]}
leaderboard = {
    "Chess Club": [
        {"email": "michael@mergington.edu", "score": 850, "rank": 1},
        {"email": "daniel@mergington.edu", "score": 720, "rank": 2}
    ],
    "Programming Class": [
        {"email": "emma@mergington.edu", "score": 920, "rank": 1},
        {"email": "sophia@mergington.edu", "score": 880, "rank": 2}
    ],
    "Soccer Team": [
        {"email": "liam@mergington.edu", "score": 750, "rank": 1},
        {"email": "noah@mergington.edu", "score": 700, "rank": 2}
    ]
}

# Organizer credentials (email -> password_hash)
# In a real app, use proper auth. For this demo, we use simple email validation
organizers = {
    "admin@mergington.edu",
    "coach@mergington.edu"
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is not already signed up
    if email in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up"
        )

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is signed up
    if email not in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is not signed up for this activity"
        )

    # Remove student
    activity["participants"].remove(email)
    return {"message": f"Unregistered {email} from {activity_name}"}


@app.get("/leaderboard")
def get_all_leaderboards():
    """Get leaderboards for all activities"""
    return leaderboard


@app.get("/leaderboard/{activity_name}")
def get_activity_leaderboard(activity_name: str):
    """Get leaderboard for a specific activity"""
    if activity_name not in leaderboard:
        raise HTTPException(status_code=404, detail="Activity not found or has no leaderboard")
    
    # Return sorted by rank
    ranked = sorted(leaderboard[activity_name], key=lambda x: x["rank"])
    return {"activity": activity_name, "rankings": ranked}


@app.post("/leaderboard/{activity_name}/rank")
def submit_score(activity_name: str, email: str, score: int, organizer_email: str):
    """Submit a score for a student in an activity (organizer only)"""
    # Check if organizer is authorized
    if organizer_email not in organizers:
        raise HTTPException(
            status_code=403,
            detail="Only organizers can submit scores"
        )
    
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Initialize leaderboard for this activity if it doesn't exist
    if activity_name not in leaderboard:
        leaderboard[activity_name] = []
    
    # Check if student is registered for the activity
    if email not in activities[activity_name]["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is not registered for this activity"
        )
    
    # Find or create entry for this student
    entry = next((e for e in leaderboard[activity_name] if e["email"] == email), None)
    
    if entry:
        entry["score"] = score
    else:
        leaderboard[activity_name].append({"email": email, "score": score, "rank": 1})
    
    # Recalculate ranks
    sorted_entries = sorted(leaderboard[activity_name], key=lambda x: x["score"], reverse=True)
    for idx, entry in enumerate(sorted_entries, 1):
        entry["rank"] = idx
    
    return {"message": f"Score {score} recorded for {email} in {activity_name}"}
