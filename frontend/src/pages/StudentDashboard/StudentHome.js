import React from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

export default function StudentHome() {
    const navigate = useNavigate();

    return (
        <div className="dashboard-container">
            <h1 className="welcome-title">Welcome Student</h1>

            <div className="dashboard-buttons">

                <button onClick={() => alert("Courses Page Coming Soon!")}>
                    See Courses
                </button>

                <button onClick={() => alert("Register Course Coming Soon!")}>
                    Register Course
                </button>

                <button onClick={() => navigate("/student-events")}>
                    See Events
                </button>

                <button onClick={() => navigate("/student-calendar")}>
                    View Calendar
                </button>

                <button onClick={() => alert("Personal Info soon")}>
                    Personal Info
                </button>

                <button onClick={() => navigate("/")}>
                    Logout
                </button>

            </div>
        </div>
    );
}
