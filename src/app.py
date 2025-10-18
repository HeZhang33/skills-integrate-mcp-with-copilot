"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path

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


@app.get("/statistics")
def get_statistics():
    """Get overall activity statistics"""
    total_activities = len(activities)
    total_participants = sum(len(activity["participants"]) for activity in activities.values())
    total_capacity = sum(activity["max_participants"] for activity in activities.values())
    
    # Calculate average participation rate
    if total_capacity > 0:
        average_participation_rate = round((total_participants / total_capacity) * 100, 1)
    else:
        average_participation_rate = 0.0
    
    return {
        "overview": {
            "total_activities": total_activities,
            "total_participants": total_participants,
            "total_capacity": total_capacity,
            "average_participation_rate": average_participation_rate
        }
    }


@app.get("/statistics/popular")
def get_popular_activities():
    """Get most popular activities ranked by participation"""
    activity_stats = []
    
    for name, details in activities.items():
        participants_count = len(details["participants"])
        max_participants = details["max_participants"]
        participation_rate = round((participants_count / max_participants) * 100, 1) if max_participants > 0 else 0
        
        activity_stats.append({
            "name": name,
            "participants": participants_count,
            "max_participants": max_participants,
            "participation_rate": participation_rate,
            "spots_available": max_participants - participants_count
        })
    
    # Sort by participation count (descending)
    activity_stats.sort(key=lambda x: x["participants"], reverse=True)
    
    # Add popularity rank
    for i, activity in enumerate(activity_stats, 1):
        activity["popularity_rank"] = i
    
    return {"popular_activities": activity_stats}


@app.get("/statistics/participation")
def get_participation_analysis():
    """Get detailed participation rate analysis"""
    participation_data = []
    
    for name, details in activities.items():
        participants_count = len(details["participants"])
        max_participants = details["max_participants"]
        participation_rate = round((participants_count / max_participants) * 100, 1) if max_participants > 0 else 0
        
        # Categorize participation level
        if participation_rate >= 80:
            level = "high"
        elif participation_rate >= 50:
            level = "medium"
        else:
            level = "low"
        
        participation_data.append({
            "activity": name,
            "participants": participants_count,
            "max_participants": max_participants,
            "participation_rate": participation_rate,
            "level": level,
            "description": details["description"],
            "schedule": details["schedule"]
        })
    
    # Sort by participation rate (descending)
    participation_data.sort(key=lambda x: x["participation_rate"], reverse=True)
    
    return {"participation_analysis": participation_data}


@app.get("/statistics/trends")
def get_trends_analysis():
    """Get trends analysis for activities"""
    # Since we don't have historical data, we'll provide current insights
    trends = {
        "capacity_utilization": {},
        "recommendations": [],
        "insights": []
    }
    
    total_capacity = sum(activity["max_participants"] for activity in activities.values())
    total_participants = sum(len(activity["participants"]) for activity in activities.values())
    
    # Calculate capacity utilization by activity type/category
    high_demand_activities = []
    low_demand_activities = []
    
    for name, details in activities.items():
        participants_count = len(details["participants"])
        max_participants = details["max_participants"]
        utilization = round((participants_count / max_participants) * 100, 1) if max_participants > 0 else 0
        
        trends["capacity_utilization"][name] = utilization
        
        if utilization >= 80:
            high_demand_activities.append(name)
        elif utilization < 30:
            low_demand_activities.append(name)
    
    # Generate recommendations
    if high_demand_activities:
        trends["recommendations"].append({
            "type": "increase_capacity",
            "message": f"Consider increasing capacity for high-demand activities: {', '.join(high_demand_activities)}",
            "activities": high_demand_activities
        })
    
    if low_demand_activities:
        trends["recommendations"].append({
            "type": "promote_activities",
            "message": f"Consider promoting low-demand activities: {', '.join(low_demand_activities)}",
            "activities": low_demand_activities
        })
    
    # Generate insights
    overall_utilization = round((total_participants / total_capacity) * 100, 1) if total_capacity > 0 else 0
    trends["insights"] = [
        f"Overall capacity utilization is {overall_utilization}%",
        f"{len(high_demand_activities)} activities are in high demand (≥80% capacity)",
        f"{len(low_demand_activities)} activities have low participation (<30% capacity)"
    ]
    
    return {"trends": trends}
