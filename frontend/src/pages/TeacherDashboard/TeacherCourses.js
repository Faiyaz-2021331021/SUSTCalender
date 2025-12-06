import React from 'react';

export default function TeacherCourses({ courses, onSelectCourse }) {
    return (
        <div className="main-grid">
            <div className="side-panel" style={{ gridColumn: 'span 2' }}>
                <div className="panel">
                    <h4>Assigned Courses</h4>
                    {courses.length === 0 ? (
                        <p className="no-items">No courses have been assigned yet. Please contact admin.</p>
                    ) : (
                        <div className="course-list-grid">
                            {courses.map(c => (
                                <div key={c.id} className="course-item">
                                    <div>
                                        <div className="course-name">{c.title}</div>
                                        <div className="course-meta">
                                            {c.code || "No Code"}  Assigned: {c.createdAt ? c.createdAt.toLocaleDateString() : "N/A"}
                                        </div>
                                        {c.description && <div className="course-meta">{c.description}</div>}
                                    </div>
                                    <div style={{ marginTop: 8 }}>
                                        <button className="btn btn-secondary btn-small" onClick={() => onSelectCourse?.(c)}>
                                            Open
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
