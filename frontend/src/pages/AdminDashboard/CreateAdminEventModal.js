import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { addDoc, updateDoc, deleteDoc, collection, doc, serverTimestamp } from "firebase/firestore";


const modalStyle = {
    position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "60px",
    background: "rgba(2,6,23,0.45)", zIndex: 1200, overflowY: "auto"
};
const modalCardStyle = {
    width: 600, maxWidth: "94%", background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 20px 60px rgba(20,40,70,0.4)"
};

export default function CreateAdminEventModal({ admin, eventData, onClose }) {
    const isEditing = !!eventData;
    const [name, setName] = useState(eventData?.name || "");

    const [startDate, setStartDate] = useState(eventData?.startDate || "");
    const [startTime, setStartTime] = useState(eventData?.startTime || "");

    const [endDate, setEndDate] = useState(eventData?.endDate || "");
    const [endTime, setEndTime] = useState(eventData?.endTime || "");

    const [targetAudience, setTargetAudience] = useState(eventData?.targetAudience || "students");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditing) {
            setName(eventData.name);
            setStartDate(eventData.startDate);
            setStartTime(eventData.startTime);
            setEndDate(eventData.endDate);
            setEndTime(eventData.endTime);
            setTargetAudience(eventData.targetAudience);
        }
    }, [eventData, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !startDate || !endDate) return alert("Please fill name, start date, and end date.");

        if (endDate < startDate) {
            return alert("End date cannot be before start date.");
        }

        setLoading(true);

        try {
            const commonData = {
                name,
                startDate,
                startTime,
                endDate,
                endTime,
                date: startDate,
                targetAudience,
                createdByRole: 'admin'
            };

            if (isEditing) {
                const ref = doc(db, "events", eventData.id);
                await updateDoc(ref, commonData);
            } else {
                await addDoc(collection(db, "events"), {
                    ...commonData,
                    createdBy: admin.uid,
                    createdAt: serverTimestamp()
                });
            }
            onClose();
        } catch (err) {
            console.error(err);
            alert(`Failed to ${isEditing ? 'update' : 'create'} event.`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await deleteDoc(doc(db, "events", eventData.id));
            onClose();
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete event.");
        }
    };

    return (
        <div style={modalStyle}>
            <div style={modalCardStyle}>
                <h3 style={{ marginBottom: 20 }}>{isEditing ? "Edit Event" : "Create New Event"}</h3>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Event Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Summer Vacation" />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 15 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Start Time (Optional)</label>
                            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                        <div className="form-group">
                            <label>End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>End Time (Optional)</label>
                            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Target Audience</label>
                        <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
                            <option value="students">Students</option>
                            <option value="teacher">Teachers</option>
                            <option value="both">All (Students & Teachers)</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 25 }}>
                        <button className="btn" type="submit" disabled={loading} style={{ flex: 1, padding: "10px" }}>
                            {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
                        </button>
                        <button className="btn btn-yellow" type="button" onClick={onClose} style={{ flex: 1, padding: "10px" }}>Cancel</button>
                        {isEditing && (
                            <button className="btn btn-danger" type="button" onClick={handleDelete} style={{ flex: 1, padding: "10px" }}>Delete</button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
