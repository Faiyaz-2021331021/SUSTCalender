import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
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
    }

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
