import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { db } from "../../firebase";

import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export default function ManageCourses({ course, teacher, onClose }) {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

  // Load course events
  useEffect(() => {
    if (!course) return;

    const q = query(collection(db, "events"), where("courseId", "==", course.id));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(list.sort((a, b) => (a.date || "").localeCompare(b.date || "")));
    });

    return () => unsub();
  }, [course]);

  // Update selected day events
  useEffect(() => {
    const formatted = selectedDate.toISOString().split("T")[0];
    setSelectedDayEvents(events.filter(ev => ev.date === formatted));
  }, [selectedDate, events]);

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const formatted = date.toISOString().split("T")[0];
      return events.some(ev => ev.date === formatted) ? "event-day" : null;
    }
    return null;
  };

  if (!course) return null;

  return (
    <div style={{ padding: 20 }}>
      <h2>Manage Course: {course.title}</h2>
      <button onClick={onClose} style={{ marginBottom: 20 }}>Back to Dashboard</button>

      <h3>Course Info</h3>
      <p>Code: {course.code || "N/A"}</p>
      <p>Created: {new Date(course.createdAt?.toDate?.() || course.createdAt || "").toLocaleDateString()}</p>

      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        <div style={{ flex: 1 }}>
          <h3>Calendar</h3>
          <Calendar value={selectedDate} onChange={setSelectedDate} tileClassName={tileClassName} />
          <div style={{ marginTop: 10 }}>
            <h4>Events on {selectedDate.toDateString()}</h4>
            {selectedDayEvents.length === 0 ? (
              <p>No events for this date.</p>
            ) : (
              <ul>
                {selectedDayEvents.map(ev => (
                  <li key={ev.id} style={{ marginBottom: 6 }}>
                    <strong>{ev.name}</strong> — {ev.time || "All day"}
                    <button
                      style={{ marginLeft: 10 }}
                      onClick={() => setEventToEdit(ev)}
                    >
                      Edit
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3>All Events</h3>
          <button onClick={() => setShowCreateEvent(true)}>+ Create Event</button>
          <ul>
            {events.map(ev => (
              <li key={ev.id} style={{ marginBottom: 6 }}>
                <strong>{ev.name}</strong> — {ev.date} {ev.time || ""}
                <button style={{ marginLeft: 10 }} onClick={() => setEventToEdit(ev)}>Edit</button>
                <button
                  style={{ marginLeft: 5, background: "#dc2626", color: "#fff" }}
                  onClick={async () => {
                    if (!window.confirm("Delete this event?")) return;
                    await deleteDoc(doc(db, "events", ev.id));
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateEvent && (
        <CreateOrEditEvent
          teacher={teacher}
          course={course}
          onClose={() => setShowCreateEvent(false)}
        />
      )}

      {/* Edit Event Modal */}
      {eventToEdit && (
        <CreateOrEditEvent
          teacher={teacher}
          course={course}
          eventData={eventToEdit}
          onClose={() => setEventToEdit(null)}
        />
      )}
    </div>
  );
}

/* -------------------- Create/Edit Event -------------------- */
function CreateOrEditEvent({ teacher, course, eventData, onClose }) {
  const [name, setName] = useState(eventData?.name || "");
  const [date, setDate] = useState(eventData?.date || "");
  const [time, setTime] = useState(eventData?.time || "");
  const [targetAudience, setTargetAudience] = useState(eventData?.targetAudience || "students");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !date) return alert("Name and date required");
    setLoading(true);

    try {
      if (eventData) {
        // Update
        const ref = doc(db, "events", eventData.id);
        await updateDoc(ref, { name, date, time, targetAudience });
      } else {
        // Create
        await addDoc(collection(db, "events"), {
          name,
          date,
          time,
          targetAudience,
          courseId: course.id,
          courseTitle: course.title,
          createdBy: teacher.uid,
          createdAt: serverTimestamp()
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3>{eventData ? "Edit Event" : "Create Event"}</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Event Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="form-row">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div className="form-row">
            <label>Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>

          <div className="form-row">
            <label>Audience</label>
            <select value={targetAudience} onChange={e => setTargetAudience(e.target.value)}>
              <option value="students">Students</option>
              <option value="both">Both (Students & Teachers)</option>
            </select>
          </div>

          <div className="button-row">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Saving..." : eventData ? "Save" : "Create"}
            </button>

            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
