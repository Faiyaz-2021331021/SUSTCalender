import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    collection,
    addDoc,
    Timestamp,
    onSnapshot
} from "firebase/firestore";

import "./AdminDashboard.css";


export default function AdminDashboard({ db }) {
    const [page, setPage] = useState("main");
    const navigate = useNavigate();

    return (
        <div className="dashboard-container">
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <h2>Admin Portal</h2>
                </div>
                <nav className="sidebar-nav">
                    <button
                        className={`nav-btn ${page === "main" ? "active" : ""}`}
                        onClick={() => setPage("main")}
                    >
                        Dashboard Home
                    </button>
                    <button
                        className={`nav-btn ${page === "create" ? "active" : ""}`}
                        onClick={() => setPage("create")}
                    >
                        Create Event
                    </button>
                    <button
                        className={`nav-btn ${page === "see" ? "active" : ""}`}
                        onClick={() => setPage("see")}
                    >
                        All Events
                    </button>
                    <button className="nav-btn logout" onClick={() => navigate("/")}>
                        Logout
                    </button>
                </nav>
            </aside>

            <main className="dashboard-content">
                <div className="content-glass">
                    {page === "main" && (
                        <div className="dashboard-welcome">
                            <h1>Welcome Back, Admin</h1>
                            <p>Manage your university events and schedules efficiently.</p>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <h3>Events Created</h3>
                                    <p>Check "All Events"</p>
                                </div>
                                <div className="stat-card">
                                    <h3>System Status</h3>
                                    <p className="status-active">Active</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {page === "create" && <CreateEvent db={db} />}
                    {page === "see" && <SeeAllEvents db={db} />}
                </div>
            </main>
        </div>
    );
}

function CreateEvent({ db }) {
    const [step, setStep] = useState(1);
    const [eventType, setEventType] = useState(null);
    const [eventName, setEventName] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [eventTime, setEventTime] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db) return;

        setLoading(true);

        try {
            await addDoc(collection(db, "events"), {
                name: eventName,
                date: eventDate,
                time: eventTime,
                targetAudience: eventType,
                createdAt: Timestamp.now(),
            });

            setMessage({ text: "Event created successfully!", type: "success" });

            setEventName("");
            setEventDate("");
            setEventTime("");
            setStep(1);
            setEventType(null);
        } catch (err) {
            setMessage({ text: "Error creating event.", type: "error" });
        }

        setLoading(false);
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    };

    if (step === 1) {
        return (
            <div className="event-step">
                <h3>Select Audience</h3>
                <div className="audience-selection-grid">
                    <div className="audience-option-card student" onClick={() => { setEventType("student"); setStep(2); }}>
                        <div className="option-icon">🎓</div>
                        <h4>Students</h4>
                        <p>For student-only events</p>
                    </div>
                    <div className="audience-option-card teacher" onClick={() => { setEventType("teacher"); setStep(2); }}>
                        <div className="option-icon">👨‍🏫</div>
                        <h4>Teachers</h4>
                        <p>For faculty meetings</p>
                    </div>
                    <div className="audience-option-card both" onClick={() => { setEventType("both"); setStep(2); }}>
                        <div className="option-icon">🏫</div>
                        <h4>Both</h4>
                        <p>For general campus events</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="event-step">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>&lt; Back</button>
            <h3>Create Event (For: {eventType})</h3>

            <form onSubmit={handleSubmit} className="event-form">
                <input type="text" placeholder="Event Name" value={eventName}
                    onChange={(e) => setEventName(e.target.value)} required />

                <input type="date" value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)} required />

                <input type="time" value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)} required />

                <button className="btn" disabled={loading}>
                    {loading ? "Creating..." : "Create Event"}
                </button>

                {message.text && <p className={`submit-message ${message.type}`}>{message.text}</p>}
            </form>
        </div>
    );
}

function SeeAllEvents({ db }) {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (!db) return;

        return onSnapshot(collection(db, "events"), (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(list.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate()));
        });
    }, [db]);

    return (
        <div>
            <h3>All Events</h3>
            {events.length === 0 ? (
                <div className="no-events">
                    <p>No events found. Create one to get started!</p>
                </div>
            ) : (
                <div className="events-grid">
                    {events.map(e => (
                        <div key={e.id} className="event-card-modern">
                            <div className={`event-badge ${e.targetAudience}`}>
                                {e.targetAudience === 'student' && '🎓 Student'}
                                {e.targetAudience === 'teacher' && '👨‍🏫 Teacher'}
                                {e.targetAudience === 'both' && '🏫 Campus Wide'}
                            </div>
                            <h4>{e.name}</h4>
                            <div className="event-meta">
                                <span>📅 {e.date}</span>
                                <span>⏰ {e.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
