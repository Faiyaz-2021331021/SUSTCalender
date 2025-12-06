// import React, { useEffect, useState } from "react";
// import Calendar from "react-calendar";
// import "react-calendar/dist/Calendar.css";
// import { db } from "../../firebase";
// import {
//     collection,
//     query,
//     where,
//     orderBy,
//     onSnapshot,
//     addDoc,
//     updateDoc,
//     deleteDoc,
//     doc,
//     serverTimestamp,
//     arrayUnion
// } from "firebase/firestore";

// export default function ManageCourses({ course, teacher, onClose }) {
//     const [events, setEvents] = useState([]);
//     const [selectedDate, setSelectedDate] = useState(new Date());
//     const [selectedDayEvents, setSelectedDayEvents] = useState([]);
//     const [showCreateEvent, setShowCreateEvent] = useState(false);
//     const [eventToEdit, setEventToEdit] = useState(null);

//     const [attendanceSessions, setAttendanceSessions] = useState([]);
//     const [newSessionDate, setNewSessionDate] = useState("");
//     const [sessionEdits, setSessionEdits] = useState({});

//     useEffect(() => {
//         if (!course) return;

//         const q = query(collection(db, "events"), where("courseId", "==", course.id));
//         const unsub = onSnapshot(q, snap => {
//             const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//             setEvents(list.sort((a, b) => (a.date || "").localeCompare(b.date || "")));
//         });

//         return () => unsub();
//     }, [course]);

//     useEffect(() => {
//         if (!course) return;
//         const q = query(
//             collection(db, "courses", course.id, "attendance"),
//             orderBy("date", "desc")
//         );
//         const unsub = onSnapshot(q, snap => {
//             const list = snap.docs.map(doc => ({
//                 id: doc.id,
//                 ...doc.data(),
//                 entries: doc.data().entries || []
//             }));
//             setAttendanceSessions(list);
//             // sync edits state with latest data
//             const next = {};
//             list.forEach(sess => {
//                 next[sess.id] = sess.entries || [];
//             });
//             setSessionEdits(next);
//         });
//         return () => unsub();
//     }, [course]);

//     useEffect(() => {
//         const formatted = selectedDate.toISOString().split("T")[0];
//         setSelectedDayEvents(events.filter(ev => ev.date === formatted));
//     }, [selectedDate, events]);

//     const tileClassName = ({ date, view }) => {
//         if (view === "month") {
//             const formatted = date.toISOString().split("T")[0];
//             return events.some(ev => ev.date === formatted) ? "event-day" : null;
//         }
//         return null;
//     };

//     const createAttendanceSession = async () => {
//         if (!newSessionDate) return alert("Pick a session date.");
//         if (!teacher) return alert("No teacher auth.");
//         await addDoc(collection(db, "courses", course.id, "attendance"), {
//             date: newSessionDate,
//             entries: [],
//             createdBy: teacher.uid,
//             createdAt: serverTimestamp()
//         });
//         setNewSessionDate("");
//     };

//     const updateSessionEntry = (sessionId, index, field, value) => {
//         setSessionEdits(prev => {
//             const copy = [...(prev[sessionId] || [])];
//             copy[index] = { ...(copy[index] || { student: "", status: "present" }), [field]: value };
//             return { ...prev, [sessionId]: copy };
//         });
//     };

//     const addSessionRow = (sessionId) => {
//         setSessionEdits(prev => {
//             const copy = [...(prev[sessionId] || [])];
//             copy.push({ student: "", status: "present" });
//             return { ...prev, [sessionId]: copy };
//         });
//     };

//     const saveSessionSheet = async (sessionId) => {
//         const rows = (sessionEdits[sessionId] || []).filter(r => r.student?.trim());
//         try {
//             await updateDoc(doc(db, "courses", course.id, "attendance", sessionId), {
//                 entries: rows
//             });
//             alert("Attendance saved.");
//         } catch (err) {
//             console.error(err);
//             alert("Failed to save attendance.");
//         }
//     };

//     if (!course) return null;

//     return (
//         <div className="manage-wrapper">
//             <div className="manage-card">
//                 <div className="manage-header">
//                     <h2>Manage Course: {course.title}</h2>
//                     <button className="btn btn-secondary" onClick={onClose}>Back to Dashboard</button>
//                 </div>

//                 <div className="manage-grid">
//                     <div className="manage-card-inner">
//                         <h3>Course Info</h3>
//                         <p className="course-meta">Code: {course.code || "N/A"}</p>
//                         <p className="course-meta">Created: {new Date(course.createdAt?.toDate?.() || course.createdAt || "").toLocaleDateString()}</p>

//                         <h3>Calendar</h3>
//                         <Calendar value={selectedDate} onChange={setSelectedDate} tileClassName={tileClassName} />
//                         <div style={{ marginTop: 10 }}>
//                             <h4>Events on {selectedDate.toDateString()}</h4>
//                             {selectedDayEvents.length === 0 ? (
//                                 <p className="no-items">No events for this date.</p>
//                             ) : (
//                                 <ul className="event-list">
//                                     {selectedDayEvents.map(ev => (
//                                         <li key={ev.id} className="event-card">
//                                             <strong>{ev.name}</strong> - {ev.time || "All day"}
//                                             <button
//                                                 className="btn btn-secondary"
//                                                 style={{ padding: "6px 10px", fontSize: 13, marginLeft: 10 }}
//                                                 onClick={() => setEventToEdit(ev)}
//                                             >
//                                                 Edit
//                                             </button>
//                                         </li>
//                                     ))}
//                                 </ul>
//                             )}
//                         </div>
//                     </div>

//                     <div className="manage-card-inner">
//                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                             <h3>All Events</h3>
//                             <button className="btn btn-secondary" onClick={() => setShowCreateEvent(true)}>+ Create Event</button>
//                         </div>
//                         {events.length === 0 ? <p className="no-items">No events yet.</p> : (
//                             <ul className="event-list">
//                                 {events.map(ev => (
//                                     <li key={ev.id} className="event-card">
//                                         <strong>{ev.name}</strong> - {ev.date} {ev.time || ""}
//                                         <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
//                                             <button className="btn btn-secondary" onClick={() => setEventToEdit(ev)}>Edit</button>
//                                             <button
//                                                 className="btn"
//                                                 style={{ background: "#dc2626" }}
//                                                 onClick={async () => {
//                                                     if (!window.confirm("Delete this event?")) return;
//                                                     await deleteDoc(doc(db, "events", ev.id));
//                                                 }}
//                                             >
//                                                 Delete
//                                             </button>
//                                         </div>
//                                     </li>
//                                 ))}
//                             </ul>
//                         )}
//                     </div>
//                 </div>

//                 <div className="manage-card-inner attendance-card">
//                     <div className="attendance-header">
//                         <h3>Attendance</h3>
//                         <div className="attendance-create">
//                             <input type="date" value={newSessionDate} onChange={(e) => setNewSessionDate(e.target.value)} />
//                             <button className="btn btn-secondary" onClick={createAttendanceSession}>+ Create Session</button>
//                         </div>
//                     </div>

//                     {attendanceSessions.length === 0 ? (
//                         <p className="no-items">No attendance sessions yet. Create one to start tracking.</p>
//                     ) : (
//                         attendanceSessions.map(session => {
//                             const rows = sessionEdits[session.id] || [];
//                             return (
//                                 <div key={session.id} className="attendance-session">
//                                     <div className="session-title">Session: {session.date}</div>
//                                     <div className="attendance-inputs">
//                                         <button className="btn btn-secondary" onClick={() => addSessionRow(session.id)}>+ Row</button>
//                                         <button className="btn btn-secondary" onClick={() => saveSessionSheet(session.id)}>Save Sheet</button>
//                                     </div>
//                                     <table className="attendance-table">
//                                         <thead>
//                                             <tr>
//                                                 <th>Student</th>
//                                                 <th>Status</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {rows.length === 0 && (
//                                                 <tr>
//                                                     <td colSpan={2} className="empty-cell">No entries yet.</td>
//                                                 </tr>
//                                             )}
//                                             {rows.map((entry, idx) => (
//                                                 <tr key={idx}>
//                                                     <td>
//                                                         <input
//                                                             type="text"
//                                                             className="input-field"
//                                                             value={entry.student || ""}
//                                                             onChange={(e) => updateSessionEntry(session.id, idx, "student", e.target.value)}
//                                                             placeholder="Name or email"
//                                                         />
//                                                     </td>
//                                                     <td>
//                                                         <select
//                                                             className="input-field"
//                                                             value={entry.status || "present"}
//                                                             onChange={(e) => updateSessionEntry(session.id, idx, "status", e.target.value)}
//                                                         >
//                                                             <option value="present">Present</option>
//                                                             <option value="absent">Absent</option>
//                                                         </select>
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             );
//                         })
//                     )}
//                 </div>

//                 {showCreateEvent && (
//                     <CreateOrEditEvent
//                         teacher={teacher}
//                         course={course}
//                         onClose={() => setShowCreateEvent(false)}
//                     />
//                 )}

//                 {eventToEdit && (
//                     <CreateOrEditEvent
//                         teacher={teacher}
//                         course={course}
//                         eventData={eventToEdit}
//                         onClose={() => setEventToEdit(null)}
//                     />
//                 )}
//             </div>
//         </div>
//     );
// }

// function CreateOrEditEvent({ teacher, course, eventData, onClose }) {
//     const [name, setName] = useState(eventData?.name || "");
//     const [date, setDate] = useState(eventData?.date || "");
//     const [time, setTime] = useState(eventData?.time || "");
//     const [targetAudience, setTargetAudience] = useState(eventData?.targetAudience || "students");
//     const [loading, setLoading] = useState(false);

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (!name || !date) return alert("Name and date required");
//         setLoading(true);

//         try {
//             if (eventData) {
//                 const ref = doc(db, "events", eventData.id);
//                 await updateDoc(ref, { name, date, time, targetAudience });
//             } else {
//                 await addDoc(collection(db, "events"), {
//                     name,
//                     date,
//                     time,
//                     targetAudience,
//                     courseId: course.id,
//                     courseTitle: course.title,
//                     createdBy: teacher.uid,
//                     createdAt: serverTimestamp()
//                 });
//             }
//             onClose();
//         } catch (err) {
//             console.error(err);
//             alert("Failed to save event");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div style={{
//             position: "fixed", inset: 0, display: "flex",
//             justifyContent: "center", alignItems: "center",
//             background: "rgba(0,0,0,0.4)", zIndex: 1200
//         }}>
//             <div style={{ background: "#fff", padding: 20, borderRadius: 10, width: 400 }}>
//                 <h3>{eventData ? "Edit Event" : "Create Event"}</h3>
//                 <form onSubmit={handleSubmit}>
//                     <div style={{ marginBottom: 10 }}>
//                         <label>Event Name</label>
//                         <input value={name} onChange={e => setName(e.target.value)} required />
//                     </div>
//                     <div style={{ marginBottom: 10 }}>
//                         <label>Date</label>
//                         <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
//                     </div>
//                     <div style={{ marginBottom: 10 }}>
//                         <label>Time</label>
//                         <input type="time" value={time} onChange={e => setTime(e.target.value)} />
//                     </div>
//                     <div style={{ marginBottom: 10 }}>
//                         <label>Audience</label>
//                         <select value={targetAudience} onChange={e => setTargetAudience(e.target.value)}>
//                             <option value="students">Students</option>
//                             <option value="both">Both (Students & Teachers)</option>
//                         </select>
//                     </div>
//                     <div style={{ display: "flex", gap: 10 }}>
//                         <button className="btn" type="submit" disabled={loading}>
//                             {loading ? "Saving..." : eventData ? "Save" : "Create"}
//                         </button>
//                         <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }
