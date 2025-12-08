import React, { useState, useEffect } from 'react';
import Calendar from "react-calendar";

import { formatDateLocal } from "../../utils/dateUtils";

export default function AdminCalendar({ events, onEditEvent }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedDayEvents, setSelectedDayEvents] = useState([]);

    useEffect(() => {
        const formatted = formatDateLocal(selectedDate);
        setSelectedDayEvents(events.filter(ev => {
            const start = ev.startDate || ev.date;
            const end = ev.endDate || ev.date;
            return formatted >= start && formatted <= end;
        }));
    }, [selectedDate, events]);

    const tileClassName = ({ date, view }) => {
        if (view === "month") {
            const d = formatDateLocal(date);
            const today = new Date();
            const todayStr = formatDateLocal(today);

            const eventOnDate = events.find(event => {
                const start = event.startDate || event.date;
                const end = event.endDate || event.date;
                return d >= start && d <= end;
            });

            if (eventOnDate) {
                const end = eventOnDate.endDate || eventOnDate.date;
                return end < todayStr ? "event-past" : "event-upcoming";
            }
        }
        return null;
    };

    return (
        <div className="main-grid-single">
            <div className="calendar-box">
                <div className="panel-header">
                    <strong>Admin Events Calendar</strong>
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
                                            <div className="event-meta" style={{ marginTop: 4 }}>
                                                {ev.startDate && ev.endDate && ev.startDate !== ev.endDate ? (
                                                    <small>
                                                        {ev.startDate} to {ev.endDate}
                                                    </small>
                                                ) : (
                                                    <small>{ev.startDate || ev.date}</small>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                            <span className="event-meta">
                                                {ev.startTime ? ev.startTime : ""}
                                                {ev.startTime && ev.endTime ? " - " : ""}
                                                {ev.endTime ? ev.endTime : ""}
                                                {(!ev.startTime && !ev.endTime) && "All day"}
                                            </span>
                                            <button
                                                className="btn btn-secondary btn-small"
                                                onClick={() => onEditEvent(ev)}
                                                style={{ marginTop: 5 }}
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
