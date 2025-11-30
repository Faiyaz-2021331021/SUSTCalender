import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { addDoc, updateDoc, deleteDoc, collection, doc, serverTimestamp } from "firebase/firestore";

// Basic Modal Styles (reused for consistency)
const modalStyle = {
    position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "center",
    background: "rgba(2,6,23,0.45)", zIndex: 1200
};
const modalCardStyle = {
    width: 520, maxWidth: "94%", background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 20px 60px rgba(20,40,70,0.4)"
};

export default function CreateCourseEventModal({ teacher, courses, preselectedCourse, eventData, onClose }) {
    const isEditing = !!eventData;
    const [name, setName] = useState(eventData?.name || "");
    const [date, setDate] = useState(eventData?.date || "");
    const [time, setTime] = useState(eventData?.time || "");
    const [courseId, setCourseId] = useState(eventData?.courseId || preselectedCourse?.id || "");
    const [targetAudience, setTargetAudience] = useState(eventData?.targetAudience || "students");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (preselectedCourse && !isEditing) setCourseId(preselectedCourse.id);
        if (isEditing) {
            setName(eventData.name);
            setDate(eventData.date);
            setTime(eventData.time);
            setCourseId(eventData.courseId);
            setTargetAudience(eventData.targetAudience);
        }
    }, [preselectedCourse, eventData, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !date) return alert("Please fill name and date.");
        setLoading(true);

        try {
            const commonData = {
                name,
                date,
                time,
                courseId,
                courseTitle: courses.find(c => c.id === courseId)?.title || "",
                targetAudience,
            };

            if (isEditing) {
                // Update
                const ref = doc(db, "events", eventData.id);
                await updateDoc(ref, commonData);
            } else {
                // Create
                await addDoc(collection(db, "events"), {
                    ...commonData,
                    createdBy: teacher.uid,
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
                <h3>{isEditing ? "Edit Event" : "Create New Event"}</h3>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Event Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label>Associated Course (Optional)</label>
                        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                            <option value="">-- General / System Event --</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title} {c.code ? `(${c.code})` : ""}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label>Time (Optional)</label>
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>Target Audience</label>
                        <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
                            <option value="students">Students</option>
                            <option value="both">Both (Students & Teachers)</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                        <button className="btn" type="submit" disabled={loading}>
                            {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
                        {isEditing && (
                            <button className="btn btn-danger" type="button" onClick={handleDelete}>Delete</button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}