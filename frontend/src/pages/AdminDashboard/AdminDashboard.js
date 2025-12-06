import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    collection,
    addDoc,
    Timestamp,
    onSnapshot,
    getDocs,
    query,
    where,
    doc,
    getDoc
} from "firebase/firestore";

import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

import AdminEvents from "./AdminEvents";
import AdminProfile from "./AdminProfile";
import AdminCalendar from "./AdminCalendar";
import CreateAdminEventModal from "./CreateAdminEventModal";

import "./AdminDashboard.css";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { currentUser, loading } = useAuth();

    const [role, setRole] = useState(null);
    const [adminName, setAdminName] = useState("");
    const [roleLoaded, setRoleLoaded] = useState(false);
    const [events, setEvents] = useState([]);

    const [view, setView] = useState("calendar");
    const [modalView, setModalView] = useState(null);
    const [eventToEdit, setEventToEdit] = useState(null);

    useEffect(() => {
        if (!loading && currentUser) {
            const userRef = doc(db, "users", currentUser.uid);
            getDoc(userRef)
                .then(docSnap => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setRole(data.role);
                        setAdminName(data.name || currentUser.email.split('@')[0]);
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
        if (!loading && roleLoaded && (!currentUser || role !== "admin")) {
            if (roleLoaded) navigate("/");
        }
    }, [currentUser, role, roleLoaded, loading, navigate]);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "events"));

        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const filtered = list.filter(ev =>
                ev.createdByRole === 'admin' || ev.createdBy === currentUser.uid
            );
            setEvents(filtered.sort((a, b) => (a.date || "").localeCompare(b.date || "")));
        });
        return () => unsub();
    }, [currentUser]);

    const handleQuickCreateEvent = () => {
        setEventToEdit(null);
        setModalView("create-event");
        window.scrollTo(0, 0);
    };

    const handleEditEvent = (event) => {
        setEventToEdit(event);
        setModalView("create-event");
        window.scrollTo(0, 0);
    };

    const closeModal = () => {
        setModalView(null);
        setEventToEdit(null);
    };

    if (loading || !roleLoaded || !currentUser) {
        return <div className="loading-state">Loading Dashboard...</div>;
    }

    let ComponentToRender;
    switch (view) {
        case "calendar":
            ComponentToRender = <AdminCalendar events={events} onEditEvent={handleEditEvent} />;
            break;
        case "events":
            ComponentToRender = <AdminEvents events={events} onEditEvent={handleEditEvent} />;
            break;
        case "courses":
            ComponentToRender = <ManageCourses db={db} />;
            break;
        case "profile":
            ComponentToRender = <AdminProfile admin={currentUser} role={role} />;
            break;
        default:
            ComponentToRender = <AdminCalendar events={events} onEditEvent={handleEditEvent} />;
            setView("calendar");
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h2 className="admin-title">Admin Dashboard</h2>
                        <div className="admin-meta-info" style={{ color: '#475569', fontWeight: 500 }}>
                            Welcome, {adminName}
                        </div>
                    </div>
                    <div className="admin-actions">
                        <button className={`btn ${view === "calendar" ? "btn-active" : ""}`} onClick={() => setView("calendar")}>View Calendar</button>
                        <button className={`btn ${view === "events" ? "btn-active" : ""}`} onClick={() => setView("events")}>Recent/Upcoming Events</button>
                        <button className="btn" onClick={handleQuickCreateEvent}>Create Event</button>
                        <button className={`btn ${view === "courses" ? "btn-active" : ""}`} onClick={() => setView("courses")}>Create Course</button>
                        <button className={`btn ${view === "profile" ? "btn-active" : ""}`} onClick={() => setView("profile")}>My Profile</button>
                    </div>
                </div>

                <div className="dashboard-content">
                    {ComponentToRender}
                </div>

                {modalView === "create-event" && (
                    <CreateAdminEventModal
                        admin={currentUser}
                        eventData={eventToEdit}
                        onClose={closeModal}
                    />
                )}
            </div>
        </div>
    );
}

function ManageCourses({ db }) {
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [title, setTitle] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [plan, setPlan] = useState("");
    const [teacherId, setTeacherId] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!db) return;
        const fetchTeachers = async () => {
            const snap = await getDocs(collection(db, "users"));
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(u => (u.role || "").toLowerCase() === "teacher");
            setTeachers(list);
        };
        fetchTeachers();
        return onSnapshot(collection(db, "courses"), snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCourses(list);
        });
    }, [db]);

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        if (!db) return;
        if (!title || !teacherId) {
            setMessage("Title and teacher are required.");
            return;
        }
        setLoading(true);
        try {
            const teacher = teachers.find(t => t.id === teacherId);
            await addDoc(collection(db, "courses"), {
                title,
                code,
                description,
                plan,
                syllabus: "",
                schedule: "",
                teacherId,
                teacherName: teacher?.name || teacher?.email || "Assigned Teacher",
                createdAt: Timestamp.now()
            });
            setTitle("");
            setCode("");
            setDescription("");
            setPlan("");
            setTeacherId("");
            setMessage("Course assigned successfully.");
        } catch (err) {
            console.error(err);
            setMessage("Failed to create course.");
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(""), 3000);
        }
    };

    return (
        <div>
            <h3>Assign Course to Teacher</h3>
            <form className="event-form" onSubmit={handleCreateCourse}>
                <div className="course-form-grid">
                    <input
                        type="text"
                        placeholder="Course Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Course Code (optional)"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <textarea
                        placeholder="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                    <textarea
                        placeholder="Course plan / outline (optional)"
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        rows={4}
                        style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                </div>
                <div className="course-actions">
                    <select
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        required
                        style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", minWidth: 220 }}
                    >
                        <option value="">Select Teacher</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name || t.email} ({t.email})
                            </option>
                        ))}
                    </select>
                    <button className="btn" disabled={loading}>
                        {loading ? "Saving..." : "Assign Course"}
                    </button>
                    {message && <p className="submit-message success" style={{ margin: 0 }}>{message}</p>}
                </div>
            </form>

            <h4 style={{ marginTop: 24 }}>All Courses</h4>
            {courses.length === 0 ? (
                <p>No courses assigned yet.</p>
            ) : (
                <div className="events-grid">
                    {courses.map(c => (
                        <div key={c.id} className="event-card-modern">
                            <div className="event-badge teacher">
                                {c.teacherName || "Teacher"}
                            </div>
                            <h4>{c.title}</h4>
                            <div className="event-meta">
                                <span>{c.code || "No code"}</span>
                            </div>
                            {c.description && <p style={{ marginTop: 6 }}>{c.description}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
