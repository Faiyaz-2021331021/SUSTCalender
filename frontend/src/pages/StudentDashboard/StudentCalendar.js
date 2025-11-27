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

    // Load all events from Firestore
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

    // Highlight event dates
    const tileClassName = ({ date }) => {
        const d = date.toISOString().split("T")[0]; // format YYYY-MM-DD

        const hasEvent = events.some(event => event.date === d);
        return hasEvent ? "event-highlight" : "";
    };

    // Show events on clicking a date
    const handleDateClick = (date) => {
        const d = date.toISOString().split("T")[0];
        const todaysEvents = events.filter(event => event.date === d);
        setSelectedDateEvents(todaysEvents);
    };

    return (
        <div className="calendar-wrapper">
            <div className="section-header">
                <div style={{ flex: 1, textAlign: "center" }}>
                    <h2>Student Calendar</h2>
                </div>
                <button className="close-btn" onClick={() => navigate("/student-dashboard")}>✕</button>
            </div>

            <Calendar
                onClickDay={handleDateClick}
                tileClassName={tileClassName}
            />

            <div className="event-details">
                <h3>Events on Selected Date</h3>

                {selectedDateEvents.length === 0 ? (
                    <p>No events on this date.</p>
                ) : (
                    <ul>
                        {selectedDateEvents.map(ev => (
                            <li key={ev.id} className="event-card">
                                <h4>{ev.name}</h4>
                                <p><strong>Time:</strong> {ev.time}</p>
                                <p><strong>For:</strong> {ev.targetAudience}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
