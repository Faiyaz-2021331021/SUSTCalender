import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { useNavigate } from "react-router-dom";
import "./StudentCalendar.css";

import { formatDateLocal } from "../../utils/dateUtils";

export default function StudentCalendar({ events }) {
    const [selectedDateEvents, setSelectedDateEvents] = useState([]);
    const navigate = useNavigate();

    // No internal fetching - use props

    const tileClassName = ({ date }) => {
        const d = formatDateLocal(date);
        const eventOnDate = events.find(event => event.date === d);

        const today = new Date();
        const todayStr = formatDateLocal(today);

        if (eventOnDate) {
            return d < todayStr ? "event-past" : "event-upcoming";
        }
        return "";
    };

    const handleDateClick = (date) => {
        const d = formatDateLocal(date);
        const todaysEvents = events.filter(event => event.date === d);
        setSelectedDateEvents(todaysEvents);
    };

    return (
        <div className="main-grid-single">
            <div className="calendar-box">
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <strong>Student Calendar</strong>
                </div>

                <Calendar
                    onClickDay={handleDateClick}
                    tileClassName={tileClassName}
                />

                <div style={{ marginTop: 18 }} className="panel">
                    <h4 style={{ margin: 0 }}>Events on {selectedDateEvents.length > 0 && selectedDateEvents[0].date ? selectedDateEvents[0].date : "Selected Date"}</h4>
                    <div className="panel-body">
                        {selectedDateEvents.length === 0 ? (
                            <p className="no-items">No events on this date.</p>
                        ) : (
                            <ul className="event-list">
                                {selectedDateEvents.map(ev => (
                                    <li key={ev.id} className="event-card event-card-compact">
                                        <div style={{ flexGrow: 1 }}>
                                            <strong>{ev.name}</strong>
                                            <small className="event-meta">
                                                Target: {ev.targetAudience}
                                            </small>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                            <span className="event-meta">{ev.time || "All day"}</span>
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
