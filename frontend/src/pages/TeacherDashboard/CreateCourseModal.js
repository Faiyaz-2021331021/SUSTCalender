import React, { useState } from 'react';
import { db } from "../../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const modalStyle = {
    position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "60px",
    background: "rgba(2,6,23,0.45)", zIndex: 1200, overflowY: "auto"
};
const modalCardStyle = {
    width: 520, maxWidth: "94%", background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 20px 60px rgba(2,6,23,0.4)"
};

export default function CreateCourseModal({ teacher, onClose }) {
    const [title, setTitle] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title || !teacher) return alert("Missing required info.");
        setLoading(true);
        try {
            await addDoc(collection(db, "courses"), {
                title,
                code,
                createdBy: teacher.uid,
                createdAt: serverTimestamp()
            });
            onClose();
        } catch (err) {
            console.error(err);
            alert("Error creating course.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={modalStyle}>
            <div style={modalCardStyle}>
                <h3>Create New Course</h3>
                <form onSubmit={handleCreate}>
                    <div className="form-group">
                        <label>Course Title</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Course Code (optional)</label>
                        <input value={code} onChange={(e) => setCode(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn" type="submit" disabled={loading} style={{ flex: 1 }}>{loading ? "Creating..." : "Create Course"}</button>
                        <button className="btn btn-yellow" type="button" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}