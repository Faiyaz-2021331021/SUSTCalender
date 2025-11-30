import React from 'react';

export default function TeacherCourses({ courses, onManageCourse, onQuickCreateEvent }) {
    return (
        <div className="main-grid">
            <div className="side-panel" style={{gridColumn: 'span 2'}}>
                <div className="panel">
                    <h4>My Courses Taught 📚</h4>
                    {courses.length === 0 ? (
                        <p className="no-items">No courses have been created yet. Use the "+ Create Course" button.</p>
                    ) : (
                        <div className="course-list-grid">
                            {courses.map(c => (
                                <div key={c.id} className="course-item">
                                    <div>
                                        <div className="course-name">{c.title}</div>
                                        <div className="course-meta">
                                            {c.code || "No Code"} • Created: {c.createdAt ? c.createdAt.toLocaleDateString() : "N/A"}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 100 }}>
                                        <button 
                                            className="btn btn-secondary btn-small" 
                                            onClick={() => onQuickCreateEvent(c)}>
                                            + Event
                                        </button>
                                        <button 
                                            className="btn btn-primary btn-small" 
                                            onClick={() => onManageCourse(c)}>
                                            Manage Course
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}