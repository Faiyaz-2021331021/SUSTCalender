import React from 'react';

export default function TeacherEvents({ events, onEditEvent }) {
    return (
        <div className="teacher-events-container">
            <div className="panel">
                <h4>Recent/Upcoming Events</h4>
                {events.length === 0 ? <p className="no-items">No events yet.</p> : (
                    <ul className="event-list">
                        {events.map(ev => (
                            <li key={ev.id} className="event-card event-card-detailed">
                                <div className="event-details-grid">
                                    <div className="event-field">
                                        <span className="field-label">Event Name:</span>
                                        <span className="field-value">{ev.name}</span>
                                    </div>
                                    <div className="event-field">
                                        <span className="field-label">Date:</span>
                                        <span className="field-value">{ev.date}</span>
                                    </div>
                                    <div className="event-field">
                                        <span className="field-label">Time:</span>
                                        <span className="field-value">{ev.time || "N/A"}</span>
                                    </div>
                                    <div className="event-field">
                                        <span className="field-label">Audience:</span>
                                        <span className="field-value capitalize">{ev.targetAudience}</span>
                                    </div>
                                    <div className="event-field">
                                        <span className="field-label">Created by:</span>
                                        <span className="field-value">
                                            {ev.courseTitle ? "Teacher" : (ev.createdBy === "admin" ? "Admin" : "Teacher")}
                                        </span>
                                    </div>
                                </div>
                                <div className="event-actions">
                                    <button
                                        className="btn btn-secondary btn-small"
                                        onClick={() => onEditEvent(ev)}
                                    >
                                        Manage
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
