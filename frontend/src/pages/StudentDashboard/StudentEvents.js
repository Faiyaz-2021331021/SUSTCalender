import React from "react";
import { useNavigate } from "react-router-dom";
import "../StudentDashboard/StudentDashboard.css";

const sampleEvents = [
    { title: "Freshers' Orientation", date: "2025-01-12", time: "10:00 AM", location: "Auditorium", audience: "All" },
    { title: "Midterm Exam Week", date: "2025-02-04", time: "All day", location: "Campus", audience: "Students" },
    { title: "Science Fair", date: "2025-03-10", time: "9:00 AM", location: "Main Hall", audience: "All" },
    { title: "Career Workshop", date: "2025-03-18", time: "2:00 PM", location: "Room 302", audience: "Students" }
];

function StudentEvents() {
    const navigate = useNavigate();

    return (
        <div className="student-section">
            <div className="section-header">
                <div style={{ flex: 1 }}>
                    <h1>See Events</h1>
                    <p>Upcoming happenings across campus.</p>
                </div>
                <button className="close-btn" onClick={() => navigate("/student-dashboard")}>✕</button>
            </div>
            <div className="section-grid">
                {sampleEvents.map((ev) => (
                    <div key={`${ev.title}-${ev.date}`} className="section-card">
                        <div className="pill">{ev.date}</div>
                        <h3>{ev.title}</h3>
                        <small>{ev.time} • {ev.location}</small>
                        <small>Audience: {ev.audience}</small>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default StudentEvents;
