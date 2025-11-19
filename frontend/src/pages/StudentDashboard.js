import React, { useState, useEffect, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../sust-saheed-minar.jpg";
import "./StudentDashboard.css";

export default function StudentDashboard({ db }) {
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedDayEvents, setSelectedDayEvents] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [holidayError, setHolidayError] = useState("");
    const [loadingHolidays, setLoadingHolidays] = useState(false);
    const navigate = useNavigate();

    const backgroundStyle = {
        backgroundImage: `linear-gradient(120deg, rgba(14, 32, 64, 0.55), rgba(5, 11, 26, 0.45)), url(${backgroundImage})`,
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

    const combinedEvents = useMemo(() => [...events, ...holidays], [events, holidays]);

    useEffect(() => {
        const formattedDate = selectedDate.toISOString().split("T")[0];
        const dayEvents = combinedEvents.filter(ev => ev.date === formattedDate);
        setSelectedDayEvents(dayEvents);
    }, [combinedEvents, selectedDate]);

    const currentYear = selectedDate.getFullYear();

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        async function loadHolidays() {
            setLoadingHolidays(true);
            setHolidayError("");
            try {
                const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/BD`, {
                    signal: controller.signal
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch public holidays");
                }
                const data = await response.json();
                if (!isMounted) return;
                setHolidays(
                    data.map(item => ({
                        id: `holiday-${item.date}`,
                        name: item.localName || item.name,
                        date: item.date,
                        time: "All day",
                        targetAudience: "holiday",
                        description: item.name,
                        isHoliday: true
                    }))
                );
            } catch (err) {
                if (err.name !== "AbortError" && isMounted) {
                    setHolidayError("Unable to load government holidays. Showing only campus events.");
                }
            } finally {
                if (isMounted) setLoadingHolidays(false);
            }
        }

        loadHolidays();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [currentYear]);

    const tileClassName = ({ date, view }) => {
        if (view === "month") {
            const formattedDate = date.toISOString().split("T")[0];
            return combinedEvents.some(ev => ev.date === formattedDate) ? "event-day" : null;
        }
        return null;
    };

    const formatDisplayDate = (date) =>
        date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });

    return (
        <div className="student-dashboard" style={backgroundStyle}>
            <div className="calendar-container">
                <div className="student-header">
                    <button className="student-home-btn" onClick={() => navigate("/")}>🏠 Home</button>
                    <h2 className="student-title">SUST Calendar</h2>
                </div>

                <Calendar
                    value={selectedDate}
                    onChange={setSelectedDate}
                    tileClassName={tileClassName}
                />

                <div className="event-panel">
                    <h3>Events on {formatDisplayDate(selectedDate)}</h3>
                    {loadingHolidays && <p className="no-events">Loading government holidays…</p>}
                    {holidayError && <p className="holiday-error">{holidayError}</p>}
                    {selectedDayEvents.length === 0 ? (
                        <p className="no-events">No events scheduled for this date.</p>
                    ) : (
                        <ul className="event-list">
                            {selectedDayEvents.map(ev => (
                                <li key={ev.id} className={`event-card ${ev.isHoliday ? "holiday" : ""}`}>
                                    <div className="event-card-header">
                                        <strong>{ev.name}</strong>
                                        {ev.isHoliday && <span className="event-tag">Govt Holiday</span>}
                                    </div>
                                    <span>{ev.time}</span>
                                    <p>{ev.isHoliday ? "National event" : `Audience: ${ev.targetAudience}`}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
