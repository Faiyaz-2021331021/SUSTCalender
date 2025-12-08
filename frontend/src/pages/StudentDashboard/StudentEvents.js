import React from "react";
import { useNavigate } from "react-router-dom";
import "../StudentDashboard/StudentDashboard.css";
import { formatDateLocal } from "../../utils/dateUtils";

function StudentEvents({ events, onClose }) {
    const navigate = useNavigate();

    // Filter for upcoming events (today or future)
    const today = formatDateLocal(new Date());
    const upcomingEvents = events.filter(ev => {
        const date = ev.date || ev.startDate;
        return date >= today;
    });

    return (
        <div className="student-section">
            <div className="section-header">
                <div style={{ flex: 1 }}>
                    <h1>Recent/Upcoming Events</h1>
                    <p>Happenings across campus.</p>
                </div>
                <button className="btn btn-secondary" onClick={onClose}>Back to Calendar</button>
            </div>
            <div className="section-grid">
                {upcomingEvents.length === 0 ? (
                    <p>No upcoming events found.</p>
                ) : (
                    upcomingEvents.map((ev) => (
                        <div key={ev.id} className="section-card">
                            <div className="pill">{ev.date || ev.startDate}</div>
                            <h3>{ev.name}</h3>
                            <small>
                                {ev.startTime ? `${ev.startTime} - ` : ""}
                                {ev.endTime ? ev.endTime : "All day"}
                            </small>
                            <small style={{ display: "block", marginTop: 4 }}>
                                Target: {ev.targetAudience}
                            </small>
                            {ev.description && <p style={{ marginTop: 8 }}>{ev.description}</p>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default StudentEvents;
