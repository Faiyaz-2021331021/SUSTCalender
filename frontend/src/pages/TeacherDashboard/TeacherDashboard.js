import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";


import TeacherEvents from "./TeacherEvents";
import TeacherProfile from "./TeacherProfile";
import TeacherCourses from "./TeacherCourses";
import TeacherCalendar from "./TeacherCalendar";
import ManageCourses from "./ManageCourses";
import CreateCourseModal from "./CreateCourseModal";
import CreateCourseEventModal from "./CreateCourseEventModal";

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
    const [modalView, setModalView] = useState(null);
    const [eventToEdit, setEventToEdit] = useState(null);
    const [selectedCourseForEvent, setSelectedCourseForEvent] = useState(null);

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
        const q = query(collection(db, "courses"), where("createdBy", "==", currentUser.uid));

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

    const handleViewCourse = (course) => {
        setSelectedCourse(course);
        setView("manage");
    };

    const handleQuickCreateEvent = (course = null) => {
        setSelectedCourseForEvent(course);
        setEventToEdit(null);
        setModalView("create-event");
        window.scrollTo(0, 0);
    };

    const handleEditEvent = (event) => {
        setEventToEdit(event);
        setSelectedCourseForEvent(null);
        setModalView("create-event");
        window.scrollTo(0, 0);
    }

    const handleCreateCourse = () => {
        setModalView("create-course");
        window.scrollTo(0, 0);
    }

    const closeModal = () => {
        setModalView(null);
        setEventToEdit(null);
        setSelectedCourseForEvent(null);
    };

    if (loading || !roleLoaded || !currentUser) {
        return <div className="loading-state">Loading Dashboard...</div>;
    }


    let ComponentToRender;
    switch (view) {
        case "calendar":
            ComponentToRender = <TeacherCalendar events={events} onEditEvent={handleEditEvent} />;
            break;
        case "courses":
            ComponentToRender = <TeacherCourses courses={courses} onManageCourse={handleViewCourse} onQuickCreateEvent={handleQuickCreateEvent} />;
            break;
        case "events":
            ComponentToRender = <TeacherEvents events={events} onEditEvent={handleEditEvent} />;
            break;
        case "profile":
            ComponentToRender = <TeacherProfile teacher={currentUser} courses={courses} role={role} />;
            break;
        case "manage":
            if (selectedCourse) {
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
            setView("courses");
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
                        <button className="btn" onClick={handleCreateCourse}>Create Course</button>
                        <button className="btn" onClick={() => handleQuickCreateEvent()}>Create Event</button>
                        <button className={`btn ${view === "profile" ? "btn-active" : ""}`} onClick={() => setView("profile")}>My Profile</button>
                    </div>
                </div>

                <div className="dashboard-content">
                    {ComponentToRender}
                </div>

                {modalView === "create-course" && (
                    <CreateCourseModal
                        teacher={currentUser}
                        onClose={closeModal}
                    />
                )}
                {modalView === "create-event" && (
                    <CreateCourseEventModal
                        teacher={currentUser}
                        courses={courses}
                        preselectedCourse={selectedCourseForEvent}
                        eventData={eventToEdit}
                        onClose={closeModal}
                    />
                )}
            </div>
        </div>
    );
}