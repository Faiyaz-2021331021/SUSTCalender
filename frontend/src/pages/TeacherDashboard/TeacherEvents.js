import React from 'react';

export default function TeacherEvents({ events, onEditEvent }) {
    return (
        <div className="teacher-events-container">
            <div className="panel">
                <h4>Recent/Upcoming Events 🗓️</h4>
                {events.length === 0 ? <p className="no-items">No events yet.</p> : (
                    <ul className="event-list">
                        {events.map(ev => (
                            <li key={ev.id} className="event-card">
                                <div style={{ flexGrow: 1 }}>
                                    <strong>{ev.name}</strong>
                                    <div className="event-meta">
                                        {ev.courseTitle ? `Course: ${ev.courseTitle}` : `Admin • ${ev.targetAudience}`}
                                    </div>
                                    <div className="event-meta">
                                        {ev.description}
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
                                    <span className="event-meta" style={{ fontWeight: "bold" }}>{ev.date} {ev.time || ""}</span>
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
