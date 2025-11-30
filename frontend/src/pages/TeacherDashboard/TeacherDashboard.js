import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

// Import Modular Components
import TeacherProfile from "./TeacherProfile";
import TeacherCourses from "./TeacherCourses";
import TeacherCalendar from "./TeacherCalendar";
import ManageCourses from "./ManageCourses";
import CreateCourseModal from "./CreateCourseModal";
import CreateCourseEventModal from "./CreateCourseEventModal"; 
// Note: CreateCourseEventModal also handles editing/deleting events if passed eventData

import "./TeacherDashboard.css"; // Styles are still here

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const { currentUser, loading } = useAuth();
    
    // Core State
    const [role, setRole] = useState(null);
    const [roleLoaded, setRoleLoaded] = useState(false);
    const [courses, setCourses] = useState([]);
    const [events, setEvents] = useState([]);
    
    // UI State
    const [view, setView] = useState("calendar"); // Default view: Calendar
    const [showCreateCourse, setShowCreateCourse] = useState(false);
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [eventToEdit, setEventToEdit] = useState(null); // For editing events globally
    const [selectedCourseForEvent, setSelectedCourseForEvent] = useState(null);

    // Course Management State
    const [selectedCourse, setSelectedCourse] = useState(null);

    // --- Data Fetching Hooks ---

    // 1. Fetch Teacher Role & Auth Check
    useEffect(() => {
        if (!loading && currentUser) {
            const userRef = doc(db, "users", currentUser.uid);
            getDoc(userRef)
                .then(docSnap => {
                    setRole(docSnap.exists() ? docSnap.data().role : null);
                })
                .finally(() => setRoleLoaded(true));
        } else if (!loading && !currentUser) {
            setRoleLoaded(true);
        }
    }, [currentUser, loading]);

    // 2. Redirect if not teacher
    useEffect(() => {
        if (!loading && roleLoaded && (!currentUser || role !== "teacher")) {
            if (roleLoaded) navigate("/");
        }
    }, [currentUser, role, roleLoaded, loading, navigate]);

    // 3. Load Teacher's Courses (Realtime)
    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "courses"), where("createdBy", "==", currentUser.uid));

        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => {
                const data = d.data();
                // Normalize timestamp
                let createdAtDate = data.createdAt;
                if (createdAtDate && typeof createdAtDate.toDate === 'function') {
                    createdAtDate = createdAtDate.toDate();
                } else if (typeof createdAtDate === 'number') {
                    createdAtDate = new Date(createdAtDate);
                }
                return { id: d.id, ...data, createdAt: createdAtDate };
            });
            setCourses(list);
        });
        return () => unsub();
    }, [currentUser]);

    // 4. Load Teacher's Relevant Events (Realtime)
    useEffect(() => {
        if (!currentUser) return;
        // Fetches all events to filter on client side (for simpler querying)
        const q = query(collection(db, "events"));

        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Filter: Events created by teacher OR system-wide events targetting teachers/both
            const filtered = list.filter(ev =>
                ev.createdBy === currentUser.uid || ["teacher", "both"].includes(ev.targetAudience)
            );
            // Sort by date
            setEvents(filtered.sort((a, b) => (a.date || "").localeCompare(b.date || "")));
        });
        return () => unsub();
    }, [currentUser]);

    // --- Handlers ---
    const handleViewCourse = (course) => {
        setSelectedCourse(course);
        setView("manage");
    };

    const handleQuickCreateEvent = (course = null) => {
        setSelectedCourseForEvent(course);
        setEventToEdit(null); // Ensure we are in create mode
        setShowCreateEvent(true);
    };

    const handleEditEvent = (event) => {
        setEventToEdit(event);
        setSelectedCourseForEvent(null);
        setShowCreateEvent(true);
    }
    
    // --- Render Loading/Error ---
    if (loading || !roleLoaded || !currentUser) {
        return <div className="loading-state">Loading Dashboard...</div>;
    }

    // --- Dynamic Content Rendering ---

    let ComponentToRender;
    switch (view) {
        case "calendar":
            ComponentToRender = <TeacherCalendar events={events} onEditEvent={handleEditEvent} />;
            break;
        case "courses":
            ComponentToRender = <TeacherCourses courses={courses} onManageCourse={handleViewCourse} onQuickCreateEvent={handleQuickCreateEvent} />;
            break;
        case "profile":
            ComponentToRender = <TeacherProfile teacher={currentUser} courses={courses} role={role} />;
            break;
        case "manage":
            if (selectedCourse) {
                // Pass necessary props to ManageCourses which handles its own modals
                return (
                    <div className="teacher-dashboard">
                        <ManageCourses
                            course={selectedCourse}
                            teacher={currentUser}
                            onClose={() => setView("courses")}
                        />
                    </div>
                );
            }
            ComponentToRender = <TeacherCourses courses={courses} onManageCourse={handleViewCourse} onQuickCreateEvent={handleQuickCreateEvent} />;
            setView("courses"); // Redirect back if somehow manage view is hit without a course
            break;
        default:
            ComponentToRender = <TeacherCalendar events={events} onEditEvent={handleEditEvent} />;
            setView("calendar"); // Default to calendar
    }

    // --- Main Dashboard Structure ---
    return (
        <div className="teacher-dashboard">
            <div className="teacher-container">
                <div className="teacher-header">
                    <div>
                        <h2 className="teacher-title">Teacher Dashboard </h2>
                        <div className="teacher-meta-info">
                            Welcome, {currentUser.email.split('@')[0]} ({role})
                        </div>
                    </div>
                    <div className="teacher-actions">
                        <button className={`btn ${view === "calendar" ? "btn-primary" : "btn-secondary"}`} onClick={() => setView("calendar")}>View Calendar</button>
                        <button className={`btn ${view === "courses" ? "btn-primary" : "btn-secondary"}`} onClick={() => setView("courses")}>My Courses</button>
                        <button className={`btn ${view === "profile" ? "btn-primary" : "btn-secondary"}`} onClick={() => setView("profile")}>My Profile</button>
                        <button className="btn" onClick={() => setShowCreateCourse(true)}>+ Create Course</button>
                        <button className="btn" onClick={() => handleQuickCreateEvent()}>+ Create Event</button>
                    </div>
                </div>

                <div className="dashboard-content">
                    {ComponentToRender}
                </div>

                {/* --- Modals (Global) --- */}
                
                {/* 1. Create Course Modal */}
                {showCreateCourse && (
                    <CreateCourseModal
                        teacher={currentUser}
                        onClose={() => setShowCreateCourse(false)}
                    />
                )}

                {/* 2. Create/Edit Event Modal */}
                {showCreateEvent && (
                    <CreateCourseEventModal
                        teacher={currentUser}
                        courses={courses}
                        preselectedCourse={selectedCourseForEvent}
                        eventData={eventToEdit} // Pass event data if editing
                        onClose={() => { 
                            setShowCreateEvent(false); 
                            setSelectedCourseForEvent(null); 
                            setEventToEdit(null); 
                        }}
                    />
                )}
            </div>
        </div>
    );
}