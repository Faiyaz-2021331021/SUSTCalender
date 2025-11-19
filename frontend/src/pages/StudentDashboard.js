import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../sust-saheed-minar.jpg";
import "./StudentDashboard.css";

export default function StudentDashboard({ db }) {
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [popupEvents, setPopupEvents] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const navigate = useNavigate();

    const backgroundStyle = {
        backgroundImage: `linear-gradient(120deg, rgba(9, 20, 50, 0.85), rgba(4, 10, 25, 0.7)), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
    };

    useEffect(() => {
        if (!db) return;

        const unsubscribe = onSnapshot(collection(db, "events"), snapshot => {
            const allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const studentEvents = allEvents.filter(ev => ev.targetAudience === "student" || ev.targetAudience === "both");
            setEvents(studentEvents);
        });

        return () => unsubscribe();
    }, [db]);

    const tileClassName = ({ date, view }) => {
        if (view === "month") {
            const formattedDate = date.toISOString().split("T")[0];
            return events.some(ev => ev.date === formattedDate) ? "event-day" : null;
        }
        return null;
    };

    const tileContent = ({ date, view }) => {
        if (view === "month") {
            const formattedDate = date.toISOString().split("T")[0];
            const dayEvents = events.filter(ev => ev.date === formattedDate);
            if (dayEvents.length > 0) {
                return (
                    <ul className="calendar-event-names">
                        {dayEvents.map(ev => (
                            <li key={ev.id}>{ev.name}</li>
                        ))}
                    </ul>
                );
            }
        }
        return null;
    };

    const handleDayClick = (date) => {
        const formattedDate = date.toISOString().split("T")[0];
        const dayEvents = events.filter(ev => ev.date === formattedDate);
        setPopupEvents(dayEvents);
        setShowPopup(dayEvents.length > 0);
    };

    return (
        <div className="student-dashboard" style={backgroundStyle}>
            <div className="calendar-container">
                <button className="student-home-btn" onClick={() => navigate("/")}>🏠 Home</button>
                <h2>Student Calendar</h2>
                <Calendar
                    value={selectedDate}
                    onChange={setSelectedDate}
                    onClickDay={handleDayClick}
                    tileClassName={tileClassName}
                    tileContent={tileContent}
                />

                {showPopup && (
                    <div className="popup">
                        <button className="close-btn" onClick={() => setShowPopup(false)}>x</button>
                        <h3>Events on {popupEvents[0]?.date}</h3>
                        <ul>
                            {popupEvents.map(ev => (
                                <li key={ev.id}>
                                    <strong>{ev.name}</strong> at {ev.time} | For: {ev.targetAudience}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
