import React, { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp, where, setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

export default function TeacherCourseDetail({ course, onBack }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [courseEvents, setCourseEvents] = useState([]);

  const [chatText, setChatText] = useState("");
  const [attDate, setAttDate] = useState("");
  const [attRows, setAttRows] = useState([]); // stored overrides for statuses by student
  const [markStudent, setMarkStudent] = useState("");
  const [markTerm, setMarkTerm] = useState("");
  const [markFinal, setMarkFinal] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [planClassStart, setPlanClassStart] = useState(course?.classStart || "");
  const [planClassEnd, setPlanClassEnd] = useState(course?.classEnd || "");
  const [planMaterials, setPlanMaterials] = useState(course?.materials || "");
  const [planSyllabus, setPlanSyllabus] = useState(course?.syllabus || "");
  const [planSaving, setPlanSaving] = useState(false);
  const [planMsg, setPlanMsg] = useState("");

  useEffect(() => {
    if (!course) return;
    setPlanClassStart(course.classStart || "");
    setPlanClassEnd(course.classEnd || "");
    setPlanMaterials(course.materials || "");
    setPlanSyllabus(course.syllabus || "");
  }, [course]);

  useEffect(() => {
    if (!course) return;
    const mq = query(
      collection(db, "courses", course.id, "discussions"),
      orderBy("createdAt", "desc")
    );
    const unsubMsg = onSnapshot(mq, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const aq = query(
      collection(db, "courses", course.id, "attendance"),
      orderBy("createdAt", "desc")
    );
    const unsubAtt = onSnapshot(aq, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        const entries = data.entries || (data.student ? [{ student: data.student, status: data.status || "present" }] : []);
        return { id: d.id, date: data.date, entries };
      });
      setAttendanceSessions(list);
    });

    const mqMarks = query(
      collection(db, "courses", course.id, "marks"),
      orderBy("createdAt", "desc")
    );
    const unsubMarks = onSnapshot(mqMarks, (snap) => {
      setMarks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // registrations for this course (enrolled students)
    const rq = query(
      collection(db, "registrations"),
      where("courseId", "==", course.id)
    );
    const unsubRegs = onSnapshot(rq, (snap) => {
      const list = snap.docs.map(d => ({
        uid: d.data().studentId,
        email: d.data().studentEmail
      }));
      setRegisteredStudents(list);
    });

    const eq = query(
      collection(db, "events"),
      where("courseId", "==", course.id)
    );
    const unsubEvents = onSnapshot(eq, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCourseEvents(list.sort((a, b) => (a.date || "").localeCompare(b.date || "")));
    });

    return () => {
      unsubMsg();
      unsubAtt();
      unsubMarks();
      unsubRegs();
      unsubEvents();
    };
  }, [course]);

  // Fetch student profiles
  const [studentProfiles, setStudentProfiles] = useState({});

  useEffect(() => {
    if (registeredStudents.length === 0) return;

    const fetchProfiles = async () => {
      const profiles = {};
      for (const student of registeredStudents) {
        if (student.uid) {
          try {
            const userDoc = await getDoc(doc(db, "users", student.uid));
            if (userDoc.exists()) {
              profiles[student.email] = userDoc.data();
            }
          } catch (err) {
            console.error("Error fetching profile for", student.email, err);
          }
        }
      }
      setStudentProfiles(profiles);
    };

    fetchProfiles();
  }, [registeredStudents]);

  const postMessage = async (e) => {
    e.preventDefault();
    if (!chatText.trim() || !currentUser) return;
    await addDoc(collection(db, "courses", course.id, "discussions"), {
      text: chatText.trim(),
      author: currentUser.email,
      createdAt: serverTimestamp()
    });
    setChatText("");
  };

  const addAttendanceSession = async (e) => {
    e.preventDefault();
    if (!attDate) return;
    const cleaned = displayRows().filter(r => r.student.trim());
    if (cleaned.length === 0) return;
    await addDoc(collection(db, "courses", course.id, "attendance"), {
      date: attDate,
      entries: cleaned,
      createdAt: serverTimestamp()
    });
    setAttRows([{ student: "", status: "present" }]);
  };

  const addMark = async (e) => {
    e.preventDefault();
    if (!markStudent.trim()) return;

    // Check if mark entry already exists for this student
    const existingMark = marks.find(m => m.student === markStudent.trim());

    if (existingMark) {
      // Update existing
      const updates = {};
      if (markTerm) updates.termTest = markTerm;
      if (markFinal) updates.finalExam = markFinal;

      await setDoc(doc(db, "courses", course.id, "marks", existingMark.id), updates, { merge: true });
    } else {
      // Create new
      await addDoc(collection(db, "courses", course.id, "marks"), {
        student: markStudent.trim(),
        termTest: markTerm || "",
        finalExam: markFinal || "",
        createdAt: serverTimestamp()
      });
    }

    setMarkStudent("");
    setMarkTerm("");
    setMarkFinal("");
  };

  const addCourseEvent = async (e) => {
    e.preventDefault();
    if (!eventName || !eventDate) return;
    await addDoc(collection(db, "events"), {
      name: eventName,
      date: eventDate,
      time: eventTime,
      notes: eventNotes,
      courseId: course.id,
      courseTitle: course.title,
      targetAudience: "course",
      teacherId: currentUser?.uid,
      createdAt: serverTimestamp()
    });
    setEventName("");
    setEventDate("");
    setEventTime("");
    setEventNotes("");
  };

  const displayRows = () => {
    return registeredStudents.map(s => {
      const email = s.email;
      const found = attRows.find(r => r.student === email);
      return found || { student: email, status: "present" };
    });
  };

  const updateRow = (email, status) => {
    setAttRows(prev => {
      const filtered = prev.filter(r => r.student !== email);
      return [...filtered, { student: email, status }];
    });
  };

  const savePlan = async (e) => {
    e.preventDefault();
    if (!course) return;
    setPlanSaving(true);
    setPlanMsg("");
    try {
      await setDoc(
        doc(db, "courses", course.id),
        {
          classStart: planClassStart,
          classEnd: planClassEnd,
          materials: planMaterials,
          syllabus: planSyllabus
        },
        { merge: true }
      );
      setPlanMsg("Course plan saved.");
    } catch (err) {
      setPlanMsg("Could not save course plan.");
      console.error(err);
    } finally {
      setPlanSaving(false);
      setTimeout(() => setPlanMsg(""), 2500);
    }
  };

  const getStudentLabel = (email) => {
    const profile = studentProfiles[email];
    if (profile) {
      return profile.studentId || profile.name || email;
    }
    return email;
  };

  if (!course) return null;

  return (
    <div className="section-grid" style={{ marginTop: 20 }}>
      <div className="section-card" style={{ gridColumn: "1 / -1" }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: 10 }}>
          Back to courses
        </button>
        <h2>{course.title}</h2>
        <p>{course.description || "No description"}</p>
        {course.plan && <p><strong>Plan: </strong>{course.plan}</p>}
        <p><strong>Code:</strong> {course.code || "N/A"}</p>
      </div>

      <div className="section-card">
        <h3>Course Events</h3>
        <form onSubmit={addCourseEvent} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input type="text" className="input-field" placeholder="Event name" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
          <input type="date" className="input-field" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
          <input type="time" className="input-field" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
          <textarea className="input-field" rows={2} placeholder="Notes (optional)" value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} />
          <button className="btn" type="submit">Create event</button>
        </form>
        <div style={{ marginTop: 10, maxHeight: 200, overflowY: "auto" }}>
          {courseEvents.length === 0 ? <p>No course events yet.</p> : courseEvents.map(ev => (
            <div key={ev.id} style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>
              <strong>{ev.name}</strong> — {ev.date} {ev.time || ""}<br />
              <small>{ev.notes}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card">
        <h3>Course Plan</h3>
        <form onSubmit={savePlan} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label>Class start date</label>
          <input type="date" className="input-field" value={planClassStart} onChange={(e) => setPlanClassStart(e.target.value)} />
          <label>Class end date</label>
          <input type="date" className="input-field" value={planClassEnd} onChange={(e) => setPlanClassEnd(e.target.value)} />
          <label>Course materials</label>
          <textarea className="input-field" rows={2} placeholder="List drive links, textbooks, notes" value={planMaterials} onChange={(e) => setPlanMaterials(e.target.value)} />
          <label>Syllabus</label>
          <textarea className="input-field" rows={3} placeholder="Paste syllabus or outline" value={planSyllabus} onChange={(e) => setPlanSyllabus(e.target.value)} />
          <button className="btn" type="submit" disabled={planSaving}>{planSaving ? "Saving..." : "Save plan"}</button>
          {planMsg && <p style={{ marginTop: 6, color: planMsg.includes("saved") ? "#15803d" : "#b91c1c" }}>{planMsg}</p>}
        </form>
      </div>

      <div className="section-card">
        <h3>Discussion</h3>
        <form onSubmit={postMessage} style={{ display: "flex", gap: 8, flexDirection: "column" }}>
          <textarea
            className="input-field"
            rows={3}
            placeholder="Post a message to students"
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
          />
          <button className="btn" type="submit">Post</button>
        </form>
        <div style={{ marginTop: 10, maxHeight: 200, overflowY: "auto" }}>
          {messages.length === 0 ? <p>No messages yet.</p> : messages.map(m => (
            <div key={m.id} style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>
              <strong>{m.author}</strong> <small>{m.createdAt?.toDate?.().toLocaleString?.() || ""}</small>
              <div>{m.text}</div>
            </div>
          ))}
        </div>
      </div>


      <div className="section-card">
        <h3>Marks</h3>
        <form onSubmit={addMark} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <select
            className="input-field"
            value={markStudent}
            onChange={(e) => setMarkStudent(e.target.value)}
          >
            <option value="">Select student</option>
            {registeredStudents.map(s => (
              <option key={s.email} value={s.email}>{getStudentLabel(s.email)}</option>
            ))}
          </select>
          <input type="text" className="input-field" placeholder="Term Test mark" value={markTerm} onChange={(e) => setMarkTerm(e.target.value)} />
          <input type="text" className="input-field" placeholder="Final Exam mark" value={markFinal} onChange={(e) => setMarkFinal(e.target.value)} />
          <button className="btn" type="submit">Save marks</button>
        </form>
        <div style={{ marginTop: 10, maxHeight: 200, overflowY: "auto" }}>
          {marks.length === 0 ? <p>No marks yet.</p> : marks.map(m => (
            <div key={m.id} style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>
              <strong>{getStudentLabel(m.student)}</strong> — Term: {m.termTest || "-"}, Final: {m.finalExam || "-"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
