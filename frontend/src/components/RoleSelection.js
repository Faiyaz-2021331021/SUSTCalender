import React from "react";
import { useNavigate } from "react-router-dom";
import "./RoleSelection.css";

export default function RoleSelection() {
    const navigate = useNavigate();

    const goToLogin = (role) => {
        navigate(`/login?role=${role}`);
    };

    return (
        <div className="role-container">
            <div className="overlay">
                <h1 className="title">🎓 University Calendar Portal</h1>
                <p className="subtitle">
                    Manage courses, events, and academic schedules - all in one place.
                </p>

                <div className="button-group">
                    <button className="role-btn student" onClick={() => goToLogin("student")}>
                        Join as Student
                    </button>
                    <button className="role-btn teacher" onClick={() => goToLogin("teacher")}>
                        Join as Teacher
                    </button>
                    <button className="role-btn admin" onClick={() => goToLogin("admin")}>
                        Join as Admin
                    </button>
                </div>
            </div>
        </div>
    );
}
