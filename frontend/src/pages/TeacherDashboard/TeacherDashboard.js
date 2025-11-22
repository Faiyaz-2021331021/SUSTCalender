import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

import "./TeacherDashboard.css";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  const [role, setRole] = useState(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedCourseForEvent, setSelectedCourseForEvent] = useState(null);

  // Fetch teacher role
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

  // Redirect if not teacher
  useEffect(() => {
    if (!loading && roleLoaded) {
      if (!currentUser || role !== "teacher") {
        navigate("/");
      }
    }
  }, [currentUser, role, roleLoaded, loading, navigate]);

  // Load courses (realtime)
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
        collection(db, "courses"),
        where("createdBy", "==", currentUser.uid)
    );

    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, createdAt: data.createdAt || serverTimestamp() };
      });
      setCourses(list);
    });

    return () => unsub();
  }, [currentUser]);

  // Load events (realtime)
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

  // Update selected day events
  useEffect(() => {
    const formatted = selectedDate.toISOString().split("T")[0];
    setSelectedDayEvents(events.filter(ev => ev.date === formatted));
  }, [selectedDate, events]);

  // Calendar tile class for coloring events
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const formatted = date.toISOString().split("T")[0];
      const dayEvents = events.filter(ev => ev.date === formatted);

      if (dayEvents.length === 0) return null;

      // Priority: teacher's own event first, then admin
      if (dayEvents.some(ev => ev.createdBy === currentUser.uid)) {
        return "teacher-event";
      }

      if (dayEvents.some(ev => ev.createdBy !== currentUser.uid)) {
        return "admin-event";
      }

      return null;
    }
    return null;
  };

  if (loading || !roleLoaded) return <div>Loading...</div>;

  return (
      <div className="teacher-dashboard">
        <div className="teacher-container">
          <div className="teacher-header">
            <div>
              <h2 className="teacher-title">Teacher Dashboard</h2>
              <div style={{ color: "#475569", fontSize: 14 }}>
                Welcome, {currentUser?.email || "Teacher"}
              </div>
            </div>
            <div className="teacher-actions">
              <button className="btn" onClick={() => setShowCreateCourse(true)}>+ Create Course</button>
              <button className="btn" onClick={() => { setShowCreateEvent(true); setSelectedCourseForEvent(null); }}>+ Create Event</button>
              <button className="btn btn-secondary" onClick={() => navigate("/")}>Home</button>
            </div>
          </div>

          <div className="main-grid">
            {/* Calendar */}
            <div className="calendar-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <strong>Calendar</strong>
                <small>
                  <span style={{ color: "#90ee90" }}>■ Admin</span> &nbsp; <span style={{ color: "#ffeb3b" }}>■ You</span>
                </small>
              </div>
              <Calendar value={selectedDate} onChange={setSelectedDate} tileClassName={tileClassName} />
              <div style={{ marginTop: 18 }} className="panel">
                <h4 style={{ margin: 0 }}>Events on {selectedDate.toDateString()}</h4>
                <div style={{ marginTop: 10 }}>
                  {selectedDayEvents.length === 0 ? (
                      <p className="no-items">No events for this date.</p>
                  ) : (
                      <ul className="event-list">
                        {selectedDayEvents.map(ev => (
                            <li key={ev.id} className={`event-card ${ev.createdBy === currentUser?.uid ? "teacher-event" : "admin-event"}`}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <strong>{ev.name}</strong>
                                <span className="event-meta">{ev.time || "All day"}</span>
                              </div>
                              <div style={{ marginTop: 6 }}>
                                <small className="event-meta">
                                  {ev.courseTitle ? `Course: ${ev.courseTitle}` : `Type: ${ev.eventType || "general"}`}
                                </small>
                              </div>
                            </li>
                        ))}
                      </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="side-panel">
              <div className="panel">
                <h4>My Courses</h4>
                {courses.length === 0 ? (
                    <p className="no-items">No courses. Create one to get started.</p>
                ) : (
                    courses.map(c => (
                        <div key={c.id} className="course-item">
                          <div>
                            <div className="course-name">{c.title}</div>
                            <div className="course-meta">{c.code || ""} • created {new Date(c.createdAt?.toDate?.() || c.createdAt || "").toLocaleDateString()}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <button className="btn btn-secondary" onClick={() => { setSelectedCourseForEvent(c); setShowCreateEvent(true); }}>+ Event</button>
                            <button className="btn" onClick={() => navigate(`/course/${c.id}`)}>Manage</button>
                          </div>
                        </div>
                    ))
                )}
              </div>

              <div className="panel">
                <h4>Recent Events</h4>
                {events.length === 0 ? <p className="no-items">No events yet.</p> : (
                    <ul className="event-list">
                      {events.slice(0, 6).map(ev => (
                          <li key={ev.id} className={`event-card ${ev.createdBy === currentUser?.uid ? "teacher-event" : "admin-event"}`}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <strong>{ev.name}</strong>
                              <span className="event-meta">{ev.date} {ev.time || ""}</span>
                            </div>
                            <div style={{ marginTop: 6 }}>
                              <small className="event-meta">
                                {ev.courseTitle ? `Course: ${ev.courseTitle}` : `Admin event • ${ev.targetAudience}`}
                              </small>
                            </div>
                          </li>
                      ))}
                    </ul>
                )}
              </div>
            </div>
          </div>

          {showCreateCourse && (
              <CreateCourse onClose={() => setShowCreateCourse(false)} onCreated={() => setShowCreateCourse(false)} />
          )}

          {showCreateEvent && (
              <CreateCourseEvent
                  teacher={currentUser}
                  courses={courses}
                  preselectedCourse={selectedCourseForEvent}
                  onClose={() => { setShowCreateEvent(false); setSelectedCourseForEvent(null); }}
              />
          )}
        </div>
      </div>
  );
}

/* -------------------- CreateCourse -------------------- */
function CreateCourse({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !currentUser) return alert("Missing required info.");
    setLoading(true);
    try {
      await addDoc(collection(db, "courses"), {
        title,
        code,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });
      setTitle(""); setCode("");
      if (onCreated) onCreated();
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
          <h3>Create Course</h3>
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
              <button className="btn" type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</button>
              <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
  );
}

/* -------------------- CreateCourseEvent -------------------- */
function CreateCourseEvent({ teacher, courses, preselectedCourse, onClose }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [courseId, setCourseId] = useState(preselectedCourse?.id || "");
  const [targetAudience, setTargetAudience] = useState("students");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preselectedCourse) setCourseId(preselectedCourse.id);
  }, [preselectedCourse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacher) return alert("No teacher auth.");
    if (!name || !date) return alert("Please fill name and date.");
    if (!courseId) return alert("Select a course.");

    setLoading(true);
    try {
      await addDoc(collection(db, "events"), {
        name,
        date,
        time,
        courseId,
        courseTitle: courses.find(c => c.id === courseId)?.title || "",
        targetAudience,
        createdBy: teacher.uid,
        createdAt: serverTimestamp()
      });
      setName(""); setDate(""); setTime("");
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert("Failed creating event.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div style={modalStyle}>
        <div style={modalCardStyle}>
          <h3>Create Course Event</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Event Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Course</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                <option value="">-- Select course --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title} {c.code ? `(${c.code})` : ""}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Audience</label>
              <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
                <option value="students">Students</option>
                <option value="both">Both (Students & Teachers)</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" type="submit" disabled={loading}>{loading ? "Creating..." : "Create Event"}</button>
              <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
  );
}

/* -------------------- modal styles -------------------- */
const modalStyle = {
  position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "center",
  background: "rgba(2,6,23,0.45)", zIndex: 1200
};
const modalCardStyle = {
  width: 520, maxWidth: "94%", background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 20px 60px rgba(2,6,23,0.4)"
};
