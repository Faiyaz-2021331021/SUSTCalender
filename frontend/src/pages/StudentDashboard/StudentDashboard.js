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
    const [userName, setUserName] = useState("");
    const [roleLoaded, setRoleLoaded] = useState(false);
    const [events, setEvents] = useState([]);
    const [regCourseIds, setRegCourseIds] = useState(new Set());
    const [view, setView] = useState("calendar");

    useEffect(() => {
        if (!loading && currentUser) {
            const userRef = doc(db, "users", currentUser.uid);
            getDoc(userRef).then(docSnap => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log("User data fetched:", data);
                    setRole(data.role);
                    setUserName(data.name || currentUser.displayName || currentUser.email.split('@')[0]);
                } else {
                    console.log("No user doc found for uid:", currentUser.uid);
                    setRole(null);
                }
            })
                .catch(err => console.error("Error fetching user role:", err))
                .finally(() => setRoleLoaded(true));
        } else if (!loading && !currentUser) {
            setRoleLoaded(true);
        }
    }, [currentUser, loading]);

    useEffect(() => {
        console.log("Auth Check:", { loading, roleLoaded, currentUser: currentUser?.email, role });
        if (!loading && roleLoaded) {
            if (!currentUser) {
                console.log("Redirecting: No current user");
                navigate("/");
                return;
            }
            // Case-insensitive check
            if (role && role.toLowerCase() !== "student") {
                console.log("Redirecting: Role mismatch. Expected student, got:", role);
                navigate("/");
            }
        }
    }, [currentUser, role, roleLoaded, loading, navigate]);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "registrations"), where("studentId", "==", currentUser.uid));
        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => d.data().courseId).filter(Boolean);
            setRegCourseIds(new Set(list));
        });
        return () => unsub();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "events"));
        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const filtered = list.filter(ev =>
                ["student", "students", "both"].includes(ev.targetAudience) ||
                (ev.targetAudience === "course" && ev.courseId && regCourseIds.has(ev.courseId))
            );
            setEvents(filtered.sort((a, b) => (a.date || "").localeCompare(b.date || "")));
        });
        return () => unsub();
    }, [currentUser, regCourseIds]);

    if (loading || !roleLoaded || !currentUser) {
        return <div className="loading-state">Loading Dashboard...</div>;
    }

    return (
        <div className="teacher-dashboard">
            <div className="teacher-container">
                <div className="teacher-header">
                    <div>
                        <h2 className="teacher-title">Student Dashboard</h2>
                        <div className="teacher-meta-info">
                            Welcome, {userName}
                        </div>
                    </div>
                    <div className="teacher-actions">
                        <button className={`btn ${view === "calendar" ? "btn-active" : ""}`} onClick={() => setView("calendar")}>View Calendar</button>
                        <button className={`btn ${view === "available" ? "btn-active" : ""}`} onClick={() => setView("available")}>Available Courses</button>
                        <button className={`btn ${view === "mycourses" ? "btn-active" : ""}`} onClick={() => setView("mycourses")}>My Courses</button>
                        <button className={`btn ${view === "events" ? "btn-active" : ""}`} onClick={() => setView("events")}>Recent/Upcoming Events</button>
                        <button className={`btn ${view === "profile" ? "btn-active" : ""}`} onClick={() => setView("profile")}>My Profile</button>
                    </div>
                </div>
                <div className="dashboard-content">
                    <div style={{ display: view === "calendar" ? "block" : "none" }}>
                        <StudentCalendar events={events} />
                    </div>
                    <div style={{ display: view === "available" ? "block" : "none" }}>
                        <StudentCourses mode="available" onClose={() => setView("calendar")} />
                    </div>
                    <div style={{ display: view === "mycourses" ? "block" : "none" }}>
                        <StudentCourses mode="my" onClose={() => setView("calendar")} />
                    </div>
                    <div style={{ display: view === "events" ? "block" : "none" }}>
                        <StudentEvents events={events} onClose={() => setView("calendar")} />
                    </div>
                    <div style={{ display: view === "profile" ? "block" : "none" }}>
                        <StudentProfile onClose={() => setView("calendar")} />
                    </div>
                </div>
            </div>
        </div>
    );
}
