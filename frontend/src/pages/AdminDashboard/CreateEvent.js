import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import "./AdminDashboard.css";

export default function CreateEvent({ db }) {
    const [step, setStep] = useState(1);
    const [eventType, setEventType] = useState(null);
    const [eventName, setEventName] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [eventTime, setEventTime] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" }); // type: success | error

    const handleTypeSelect = (type) => {
        setEventType(type);
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db) {
            setMessage({ text: "Database not connected.", type: "error" });
            return;
        }

        setLoading(true);
        setMessage({ text: "", type: "" });

        const eventDetails = {
            name: eventName,
            date: eventDate,
            time: eventTime,
            targetAudience: eventType,
            createdAt: Timestamp.now(),
        };

        console.log("Submitting event:", eventDetails);

        try {
            await addDoc(collection(db, "events"), eventDetails);

            setMessage({ text: `Event "${eventName}" created successfully!`, type: "success" });

            // Reset form
            setStep(1);
            setEventType(null);
            setEventName("");
            setEventDate("");
            setEventTime("");
        } catch (err) {
            console.error("Firestore error:", err);
            setMessage({ text: "Failed to create event. Please try again.", type: "error" });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ text: "", type: "" }), 4000);
        }
    };

    if (step === 1) {
        return (
            <div className="event-step">
                <h3>Step 1: Who is this event for?</h3>
                <div className="nav-buttons">
                    <button className="btn" onClick={() => handleTypeSelect("student")}>For Students</button>
                    <button className="btn" onClick={() => handleTypeSelect("teacher")}>For Teachers</button>
                    <button className="btn" onClick={() => handleTypeSelect("both")}>For Both</button>
                </div>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="event-step">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>
                    &larr; Back
                </button>
                <h3>Step 2: Event Details (For: {eventType})</h3>

                <form onSubmit={handleSubmit} className="event-form">
                    <div className="form-group">
                        <label htmlFor="name">Event Name:</label>
                        <input
                            type="text"
                            id="name"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="date">Date:</label>
                        <input
                            type="date"
                            id="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="time">Time:</label>
                        <input
                            type="time"
                            id="time"
                            value={eventTime}
                            onChange={(e) => setEventTime(e.target.value)}
                            required
                        />
                    </div>

                    <button className="btn" type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Event"}
                    </button>

                    {message.text && (
                        <p className={`submit-message ${message.type === "success" ? "success" : "error"}`}>
                            {message.text}
                        </p>
                    )}
                </form>
            </div>
        );
    }

    return null;
}
