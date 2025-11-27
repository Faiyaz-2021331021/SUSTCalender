import React from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

export default function StudentDashboard() {
    const navigate = useNavigate();

    return (
        <div className="student-dash-container">
            <h1 className="dash-title">Student Dashboard</h1>

            <div className="dash-grid">
                <div className="dash-card" onClick={() => navigate("/student-calendar")}>
                    View Calendar
                </div>

                <div className="dash-card" onClick={() => navigate("/student-events")}>
                    See Events
                </div>

                <div className="dash-card" onClick={() => navigate("/student-courses")}>
                    My Courses
                </div>

                <div className="dash-card" onClick={() => navigate("/student-profile")}>
                    My Profile
                </div>

                <div className="dash-card" onClick={() => navigate("/student-profile-edit")}>
                    Edit Profile
                </div>
            </div>
        </div>
    );
}
