import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    collection,
    addDoc,
    Timestamp,
    onSnapshot
} from "firebase/firestore";
import backgroundImage from "../../sust-saheed-minar.jpg";

import "./AdminDashboard.css";


export default function AdminDashboard({ db }) {
    const [page, setPage] = useState("main");
    const navigate = useNavigate();
    const backgroundStyle = {
        backgroundImage: `linear-gradient(120deg, rgba(7, 17, 40, 0.85), rgba(3, 8, 20, 0.75)), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
    };

    return (
        <div className="dashboard-container" style={backgroundStyle}>
            <header className="dashboard-header">
                <h2>Admin Dashboard</h2>
                <button className="home-link" onClick={() => navigate("/")}>Home</button>
            </header>

            <nav className="dashboard-nav">
                <button className="btn" onClick={() => setPage("main")}>Home</button>
                <button className="btn" onClick={() => setPage("create")}>Create Event</button>
                <button className="btn" onClick={() => setPage("see")}>See All Events</button>
            </nav>

            <main className="dashboard-main">
                {page === "main" && <p>Welcome! Select an action above.</p>}
                {page === "create" && <CreateEvent db={db} />}
                {page === "see" && <SeeAllEvents db={db} />}
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
                <button className="btn" onClick={() => { setEventType("student"); setStep(2); }}>Student</button>
                <button className="btn" onClick={() => { setEventType("teacher"); setStep(2); }}>Teacher</button>
                <button className="btn" onClick={() => { setEventType("both"); setStep(2); }}>Both</button>
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
            <ul>
                {events.map(e => (
                    <li key={e.id}>
                        <b>{e.name}</b> — {e.date} @ {e.time} — For: {e.targetAudience}
                    </li>
                ))}
            </ul>
        </div>
    );
}
