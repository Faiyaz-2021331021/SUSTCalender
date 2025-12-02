import React, { useState, useEffect } from 'react';
import Calendar from "react-calendar";

export default function TeacherCalendar({ events, onEditEvent }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedDayEvents, setSelectedDayEvents] = useState([]);

    // Update selected day events
    useEffect(() => {
        const formatted = selectedDate.toISOString().split("T")[0];
        setSelectedDayEvents(events.filter(ev => ev.date === formatted));
    }, [selectedDate, events]);

    // Calendar tile styling for events
    const tileClassName = ({ date, view }) => {
        if (view === "month") {
            const formatted = date.toISOString().split("T")[0];
            return events.some(ev => ev.date === formatted) ? "event-day" : null;
        }
        return null;
    };

    return (
        <div className="main-grid-single">
            {/* --- Calendar / Daily Events --- */}
            <div className="calendar-box">
                <div className="panel-header">
                    <strong>Course & General Events Calendar</strong>
                </div>

                <Calendar value={selectedDate} onChange={setSelectedDate} tileClassName={tileClassName} />

                <div style={{ marginTop: 18 }} className="panel">
                    <h4 style={{ margin: 0 }}>Events on {selectedDate.toDateString()}</h4>
                    <div className="panel-body">
                        {selectedDayEvents.length === 0 ? (
                            <p className="no-items">No events scheduled for this date.</p>
                        ) : (
                            <ul className="event-list">
                                {selectedDayEvents.map(ev => (
                                    <li key={ev.id} className="event-card event-card-compact">
                                        <div style={{ flexGrow: 1 }}>
                                            <strong>{ev.name}</strong>
                                            <small className="event-meta">
                                                {ev.courseTitle ? `Course: ${ev.courseTitle}` : `Admin event`}
                                            </small>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                            <span className="event-meta">{ev.time || "All day"}</span>
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
            </div>
        </div>
    );
}