import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

import StudentEvents from "./StudentEvents";
import StudentProfile from "./StudentProfile";
import StudentCourses from "./StudentCourses";
import StudentCalendar from "./StudentCalendar";

import "../StudentDashboard/StudentDashboard.css";

export default function StudentDashboard() {
    const navigate = useNavigate();
    const { currentUser, loading } = useAuth();

    const [role, setRole] = useState(null);
    const [roleLoaded, setRoleLoaded] = useState(false);
    const [courses, setCourses] = useState([]);
    const [events, setEvents] = useState([]);
    const [view, setView] = useState("calendar");

    useEffect(() => {
        if (!loading && currentUser) {
            const userRef = doc(db, "users", currentUser.uid);
            getDoc(userRef).then(docSnap => {
                setRole(docSnap.exists() ? docSnap.data().role : null);
            }).finally(() => setRoleLoaded(true));
        } else if (!loading && !currentUser) {
            setRoleLoaded(true);
        }
    }, [currentUser, loading]);

    useEffect(() => {
        if (!loading && roleLoaded && (!currentUser || role !== "student")) {
            if (roleLoaded) navigate("/");
        }
    }, [currentUser, role, roleLoaded, loading, navigate]);

    // placeholder for courses
    useEffect(() => {
        setCourses([]);
    }, [currentUser]);

    // fetching Events
    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "events"));
        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const filtered = list.filter(ev => ["student", "both"].includes(ev.targetAudience));
            setEvents(filtered.sort((a, b) => (a.date || "").localeCompare(b.date || "")));
        });
        return () => unsub();
    }, [currentUser]);

    if (loading || !roleLoaded || !currentUser) {
        return <div className="loading-state">Loading Dashboard...</div>;
    }

    let ComponentToRender;
    switch (view) {
        case "calendar":
            ComponentToRender = <StudentCalendar events={events} />;
            break;
        case "courses":
            ComponentToRender = <StudentCourses courses={courses} onClose={() => setView("calendar")} />;
            break;
        case "events":
            ComponentToRender = <StudentEvents events={events} onClose={() => setView("calendar")} />;
            break;
        case "profile":
            ComponentToRender = <StudentProfile onClose={() => setView("calendar")} />;
            break;
        default:
            ComponentToRender = <StudentCalendar events={events} />;
            setView("calendar");
    }

    return (
        <div className="teacher-dashboard">
            <div className="teacher-container">
                <div className="teacher-header">
                    <div>
                        <h2 className="teacher-title">Student Dashboard</h2>
                        <div className="teacher-meta-info">
                            Welcome, {currentUser.email.split('@')[0]} ({role})
                        </div>
                    </div>
                    <div className="teacher-actions">
                        <button className={`btn ${view === "calendar" ? "btn-active" : ""}`} onClick={() => setView("calendar")}>View Calendar</button>
                        <button className={`btn ${view === "courses" ? "btn-active" : ""}`} onClick={() => setView("courses")}>My Courses</button>
                        <button className={`btn ${view === "events" ? "btn-active" : ""}`} onClick={() => setView("events")}>Recent/Upcoming Events</button>
                        <button className={`btn ${view === "profile" ? "btn-active" : ""}`} onClick={() => setView("profile")}>My Profile</button>
                    </div>
                </div>
                <div className="dashboard-content">
                    {ComponentToRender}
                </div>
            </div>
        </div>
    );
}