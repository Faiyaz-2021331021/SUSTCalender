import React, { useState } from 'react';

// Basic Modal Styles (reused for consistency)
const modalStyle = {
    padding: 20, 
    borderRadius: 12, 
    background: '#f8fafc', 
    boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
    border: '1px solid #e2e8f0'
};

export default function TeacherProfile({ teacher, courses, role }) {
    const [isEditing, setIsEditing] = useState(false);
    
    const profileData = {
        name: teacher?.email.split('@')[0] || "Teacher",
        email: teacher?.email || "N/A",
        role: role,
        coursesTaught: courses.length,
    };

    return (
        <div className="main-grid" style={{gridTemplateColumns: '1fr'}}>
            <div className="panel" style={modalStyle}>
                <h4>My Profile Details 👤</h4>
                <div style={{ marginBottom: 15 }}>
                    <p><strong>Name:</strong> {profileData.name}</p>
                    <p><strong>Email:</strong> {profileData.email}</p>
                    <p><strong>Role:</strong> {profileData.role}</p>
                    <p><strong>Courses Taught:</strong> {profileData.coursesTaught}</p>
                    
                    {isEditing && (
                        <div style={{ marginTop: 20 }}>
                            <h5>Edit Account Information</h5>
                            <div className="form-group">
                                <label>New Name</label>
                                <input placeholder="Enter new name" />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input type="password" placeholder="Leave blank to keep current" />
                            </div>
                            <button className="btn" style={{ marginRight: 10 }}>Save Profile</button>
                        </div>
                    )}
                </div>

                <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? "Cancel Edit" : "Edit Profile"}
                </button>
            </div>
        </div>
    );
}