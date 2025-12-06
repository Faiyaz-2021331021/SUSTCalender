import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";


import TeacherEvents from "./TeacherEvents";
import TeacherProfile from "./TeacherProfile";
import TeacherCourses from "./TeacherCourses";
import TeacherCalendar from "./TeacherCalendar";
import TeacherCourseDetail from "./TeacherCourseDetail";

import "./TeacherDashboard.css";

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const { currentUser, loading } = useAuth();

    const [role, setRole] = useState(null);
    const [teacherName, setTeacherName] = useState("");
    const [roleLoaded, setRoleLoaded] = useState(false);
    const [courses, setCourses] = useState([]);
    const [events, setEvents] = useState([]);

    const [view, setView] = useState("calendar");
    const [eventToEdit, setEventToEdit] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);


    useEffect(() => {
        if (!loading && currentUser) {
            const userRef = doc(db, "users", currentUser.uid);
            getDoc(userRef)
                .then(docSnap => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setRole(data.role);
                        setTeacherName(data.name || currentUser.email.split('@')[0]);
                    } else {
                        setRole(null);
                    }
                })
                .finally(() => setRoleLoaded(true));
        } else if (!loading && !currentUser) {
            setRoleLoaded(true);
        }
    }, [currentUser, loading]);

    useEffect(() => {
        if (!loading && roleLoaded && (!currentUser || role !== "teacher")) {
            if (roleLoaded) navigate("/");
        }
    }, [currentUser, role, roleLoaded, loading, navigate]);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "courses"), where("teacherId", "==", currentUser.uid));

        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => {
                const data = d.data();
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

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "events"));

        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const filtered = list.filter(ev =>
                ev.createdBy === currentUser.uid || ["teacher", "both"].includes(ev.targetAudience)
            );
            setEvents(filtered.sort((a, b) => (a.date || "").localeCompare(b.date || "")));
        });
        return () => unsub();
    }, [currentUser]);

    const handleEditEvent = (event) => {
        setEventToEdit(event);
        window.scrollTo(0, 0);
    }

    if (loading || !roleLoaded || !currentUser) {
        return <div className="loading-state">Loading Dashboard...</div>;
    }


    let ComponentToRender;
    switch (view) {
        case "calendar":
            ComponentToRender = <TeacherCalendar events={events} onEditEvent={handleEditEvent} />;
            break;
        case "courses":
            ComponentToRender = <TeacherCourses courses={courses} onSelectCourse={(c) => { setSelectedCourse(c); setView("course-detail"); }} />;
            break;
        case "events":
            ComponentToRender = <TeacherEvents events={events} onEditEvent={handleEditEvent} />;
            break;
        case "profile":
            ComponentToRender = <TeacherProfile teacher={currentUser} courses={courses} role={role} />;
            break;
        case "course-detail":
            if (selectedCourse) {
                ComponentToRender = <TeacherCourseDetail course={selectedCourse} onBack={() => setView("courses")} />;
            } else {
                setView("courses");
                ComponentToRender = <TeacherCourses courses={courses} onSelectCourse={(c) => { setSelectedCourse(c); setView("course-detail"); }} />;
            }
            break;
        default:
            ComponentToRender = <TeacherCalendar events={events} onEditEvent={handleEditEvent} />;
            setView("calendar");
    }

    return (
        <div className="teacher-dashboard">
            <div className="teacher-container">
                <div className="teacher-header">
                    <div>
                        <h2 className="teacher-title">Teacher Dashboard </h2>
                        <div className="teacher-meta-info">
                            Welcome, {teacherName}
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
