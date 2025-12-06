import React from "react";
import { useNavigate } from "react-router-dom";
import "../StudentDashboard/StudentDashboard.css";

const mockCourses = [
    { code: "CSE 201", title: "Data Structures", instructor: "Dr. Rahman", schedule: "Sun/Tue 10:00 AM" },
    { code: "MAT 210", title: "Discrete Mathematics", instructor: "Prof. Ahmed", schedule: "Mon/Wed 11:30 AM" },
    { code: "EEE 150", title: "Digital Logic Design", instructor: "Dr. Chowdhury", schedule: "Thu 2:00 PM" }
];

export default function StudentCourses() {
    const navigate = useNavigate();

    return (
        <div className="student-section">
            <div className="section-header">
                <div style={{ flex: 1 }}>
                    <h1>My Courses</h1>
                    <p>Keep track of your enrolled classes.</p>
                </div>

            </div>
            <div className="section-grid">
                {mockCourses.map(course => (
                    <div key={course.code} className="section-card">
                        <div className="pill">{course.code}</div>
                        <h3>{course.title}</h3>
                        <small>{course.instructor}</small>
                        <small>{course.schedule}</small>
                    </div>
                ))}
            </div>
        </div>
    );
}
