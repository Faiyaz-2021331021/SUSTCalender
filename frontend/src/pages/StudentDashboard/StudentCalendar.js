import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import "./StudentCalendar.css";

export default function StudentCalendar() {
    const [events, setEvents] = useState([]);
    const [selectedDateEvents, setSelectedDateEvents] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(collection(db, "events"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setEvents(data);
            console.log("Events loaded:", data);
        });

        return () => unsubscribe();
    }, []);

    const tileClassName = ({ date }) => {
        const d = date.toISOString().split("T")[0];
        const eventOnDate = events.find(event => event.date === d);

        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        if (eventOnDate) {
            return d < todayStr ? "event-past" : "event-upcoming";
        }
        return "";
    };

    const handleDateClick = (date) => {
        const d = date.toISOString().split("T")[0];
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
