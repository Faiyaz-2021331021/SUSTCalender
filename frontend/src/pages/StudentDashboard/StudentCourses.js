import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, addDoc, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import "../StudentDashboard/StudentDashboard.css";

export default function StudentCourses({ mode }) {
    const { currentUser } = useAuth();
    const [courses, setCourses] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [message, setMessage] = useState("");
    const [enrollingId, setEnrollingId] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);

    useEffect(() => {
        if (!db) return;
        return onSnapshot(collection(db, "courses"), (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCourses(list);
        });
    }, []);

    useEffect(() => {
        if (!db || !currentUser) return;
        const q = query(collection(db, "registrations"), where("studentId", "==", currentUser.uid));
        return onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setRegistrations(list);
        });
    }, [currentUser]);

    const enrolledIds = useMemo(() => new Set(registrations.map(r => r.courseId)), [registrations]);
    const myCourses = useMemo(
        () => courses.filter(c => enrolledIds.has(c.id)),
        [courses, enrolledIds]
    );

    const handleEnroll = async (course) => {
        if (!currentUser) {
            setMessage("Please log in to enroll.");
            return;
        }
        if (enrolledIds.has(course.id)) {
            setMessage("You are already enrolled in this course.");
            return;
        }
        setEnrollingId(course.id);
        try {
            await addDoc(collection(db, "registrations"), {
                courseId: course.id,
                courseTitle: course.title,
                teacherId: course.teacherId,
                studentId: currentUser.uid,
                studentEmail: currentUser.email,
                createdAt: new Date()
            });
            setMessage("Enrolled successfully.");
        } catch (err) {
            console.error(err);
            setMessage("Could not enroll. Try again.");
        } finally {
            setEnrollingId(null);
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const showAvailable = !mode || mode === "available";
    const showMy = !mode || mode === "my";

    return (
        <div className="student-section">
            <div className="section-header">
                <div style={{ flex: 1 }}>
                    <h1>Courses</h1>
                    <p>Browse available courses and review your enrollments.</p>
                </div>
            </div>
            {message && <p style={{ marginBottom: 10, color: "#0f172a", fontWeight: 600 }}>{message}</p>}

            {showAvailable && (
                <>
                    <h3 style={{ marginTop: 10, marginBottom: 10 }}>Available Courses (Not Enrolled)</h3>
                    <div className="section-grid">
                        {courses.filter(c => !enrolledIds.has(c.id)).length === 0 ? (
                            <div className="section-card">
                                <p>No new courses available.</p>
                            </div>
                        ) : (
                            courses.filter(c => !enrolledIds.has(c.id)).map(course => (
                                <div key={course.id} className="section-card">
                                    <div className="pill">{course.code || "Course"}</div>
                                    <h3>{course.title}</h3>
                                    <small>{course.teacherName || "Assigned Teacher"}</small>
                                    {course.description && <p style={{ marginTop: 6 }}>{course.description}</p>}
                                    {course.plan && <p style={{ marginTop: 4, fontSize: 13, color: "#475569" }}><strong>Plan:</strong> {course.plan}</p>}
                                    {course.syllabus && <p style={{ marginTop: 4, fontSize: 13, color: "#475569" }}><strong>Syllabus:</strong> {course.syllabus}</p>}
                                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                        <button
                                            className="dashboard-home"
                                            onClick={() => setSelectedCourse(course)}
                                        >
                                            View details
                                        </button>
                                        <button
                                            className="dashboard-home"
                                            onClick={() => handleEnroll(course)}
                                            disabled={enrollingId === course.id}
                                        >
                                            {enrollingId === course.id ? "Enrolling..." : "Enroll"}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {showMy && (
                <>
                    <h3 style={{ marginTop: 30, marginBottom: 10 }}>My Courses</h3>
                    <div className="section-grid">
                        {myCourses.length === 0 ? (
                            <div className="section-card">
                                <p>You are not enrolled in any courses yet.</p>
                            </div>
                        ) : (
                            myCourses.map(course => (
                                <div key={course.id} className="section-card">
                                    <div className="pill">{course.code || "Course"}</div>
                                    <h3>{course.title}</h3>
                                    <small>{course.teacherName || "Assigned Teacher"}</small>
                                    {course.description && <p style={{ marginTop: 6 }}>{course.description}</p>}
                                    {course.plan && <p style={{ marginTop: 4, fontSize: 13, color: "#475569" }}><strong>Plan:</strong> {course.plan}</p>}
                                    <div style={{ marginTop: 10 }}>
                                        <button className="dashboard-home" onClick={() => setSelectedCourse(course)}>
                                            View details
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {selectedCourse && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200
                }}>
                    <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 640, width: "90%", boxShadow: "0 20px 40px rgba(15,23,42,0.2)" }}>
                        <h2>{selectedCourse.title}</h2>
                        <p style={{ color: "#64748b" }}>{selectedCourse.teacherName || "Assigned Teacher"}</p>
                        <p><strong>Code:</strong> {selectedCourse.code || "N/A"}</p>
                        {selectedCourse.description && <p style={{ marginTop: 8 }}><strong>Description:</strong> {selectedCourse.description}</p>}
                        {selectedCourse.plan && <p style={{ marginTop: 8 }}><strong>Plan:</strong> {selectedCourse.plan}</p>}
                        {selectedCourse.syllabus && <p style={{ marginTop: 8 }}><strong>Syllabus:</strong> {selectedCourse.syllabus}</p>}
                        {selectedCourse.classStart && <p style={{ marginTop: 8 }}><strong>Class starts:</strong> {selectedCourse.classStart}</p>}
                        {selectedCourse.classEnd && <p style={{ marginTop: 4 }}><strong>Class ends:</strong> {selectedCourse.classEnd}</p>}
                        {selectedCourse.materials && <p style={{ marginTop: 4 }}><strong>Materials:</strong> {selectedCourse.materials}</p>}
                        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                            <button className="dashboard-home" onClick={() => handleEnroll(selectedCourse)} disabled={enrollingId === selectedCourse.id || enrolledIds.has(selectedCourse.id)}>
                                {enrolledIds.has(selectedCourse.id)
                                    ? "Enrolled"
                                    : enrollingId === selectedCourse.id
                                        ? "Enrolling..."
                                        : "Enroll"}
                            </button>
                            <button className="dashboard-home" style={{ background: "#e2e8f0", color: "#0f172a" }} onClick={() => setSelectedCourse(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
