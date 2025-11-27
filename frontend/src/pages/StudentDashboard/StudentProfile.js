import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import "../StudentDashboard/StudentDashboard.css";

const fallbackProfile = {
    name: "Student",
    email: "student@example.com",
    studentId: "N/A",
    department: "Department",
    year: "Year",
    phone: "N/A",
    address: "N/A",
    bloodGroup: "N/A",
    photoURL: ""
};

export default function StudentProfile() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState(fallbackProfile);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            if (!currentUser) {
                setLoading(false);
                return;
            }
            try {
                const ref = doc(db, "users", currentUser.uid);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    setProfile({
                        ...fallbackProfile,
                        ...snap.data()
                    });
                }
            } catch (err) {
                console.error("Profile load error", err);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [currentUser]);

    const initials = (profile.name || fallbackProfile.name)
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="student-section">
            <div className="section-header">
                <div style={{ flex: 1 }}>
                    <h1>My Profile</h1>
                    <p>Review your student details.</p>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button className="close-btn" onClick={() => navigate("/student-dashboard")}>✕</button>
                </div>
            </div>
            {loading ? (
                <p style={{ textAlign: "center", color: "#475569" }}>Loading profile...</p>
            ) : (
                <>
                    <div className="profile-hero">
                        <div className="avatar-wrap">
                            {profile.photoURL ? (
                                <img src={profile.photoURL} alt="Profile" />
                            ) : (
                                <span className="avatar-initials">{initials}</span>
                            )}
                        </div>
                        <div className="profile-name">{profile.name || fallbackProfile.name}</div>
                        <div className="profile-email">{profile.email || fallbackProfile.email}</div>
                    </div>

                    <div className="profile-grid vertical">
                        <div className="profile-item vibrant"><strong>Student ID</strong><span>{profile.studentId || "N/A"}</span></div>
                        <div className="profile-item vibrant"><strong>Department</strong><span>{profile.department || "N/A"}</span></div>
                        <div className="profile-item vibrant"><strong>Year</strong><span>{profile.year || "N/A"}</span></div>
                        <div className="profile-item vibrant"><strong>Phone</strong><span>{profile.phone || "N/A"}</span></div>
                        <div className="profile-item vibrant"><strong>Address</strong><span>{profile.address || "N/A"}</span></div>
                        <div className="profile-item vibrant"><strong>Blood Group</strong><span>{profile.bloodGroup || "N/A"}</span></div>
                    </div>
                </>
            )}

            <div style={{ marginTop: "20px", textAlign: "center" }}>
                <button className="dashboard-home" onClick={() => navigate("/student-profile-edit")}>Edit Profile</button>
            </div>
        </div>
    );
}
