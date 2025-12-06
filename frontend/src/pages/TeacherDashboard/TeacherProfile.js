import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";

import { db, storage } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

const fallbackProfile = {
    teacherId: "",
    department: "",
    phone: "",
    address: "",
    bloodGroup: "O+",
    photoURL: ""
};

export default function TeacherProfile({ teacher, courses = [], role = "Teacher" }) {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const initialName = currentUser?.email.split('@')[0] || "Teacher";

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(fallbackProfile);
    const [nameOverride, setNameOverride] = useState(initialName);
    const [profile, setProfile] = useState({ name: initialName, email: teacher?.email || "N/A", ...fallbackProfile, role });

    const [photoFile, setPhotoFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfileData() {
            setLoading(true);
            if (!currentUser || !currentUser.uid) {
                setLoading(false);
                return;
            }

            try {
                const userRef = doc(db, "users", currentUser.uid);
                const snap = await getDoc(userRef);
                const email = currentUser.email || teacher?.email || "N/A";
                let currentName = initialName;
                let currentData = {};

                if (snap.exists()) {
                    currentData = snap.data();
                    currentName = currentData.name || initialName;

                    setForm({
                        teacherId: currentData.teacherId || "",
                        department: currentData.department || "",
                        phone: currentData.phone || "",
                        address: currentData.address || "",
                        bloodGroup: currentData.bloodGroup || "O+",
                        photoURL: currentData.photoURL || ""
                    });
                } else {
                    setForm(fallbackProfile);
                }

                setProfile({
                    name: currentName,
                    email: email,
                    role: currentData.role || role,
                    coursesTaught: courses.length,
                    teacherId: currentData.teacherId || "N/A",
                    department: currentData.department || "N/A",
                    phone: currentData.phone || "N/A",
                    address: currentData.address || "N/A",
                    bloodGroup: currentData.bloodGroup || "O+",
                    photoURL: currentData.photoURL || ""
                });

                setNameOverride(currentName);
            } catch (err) {
                console.error("Profile fetch failed:", err);
            } finally {
                setLoading(false);
            }
        }

        loadProfileData();
    }, [currentUser, initialName, role, courses.length, teacher?.email]);

    const initials = (profile.name || initialName)
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "photo" && files) {
            setPhotoFile(files[0]);
        } else if (name === "name") {
            setNameOverride(value);
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser || !currentUser.uid) {
            setMessage("Error: User not logged in. Cannot save.");
            return;
        }

        setSaving(true);
        setMessage("");
        let updatedPhotoURL = form.photoURL;

        try {
            if (photoFile) {
                const storageRef = ref(storage, `teacherProfilePhotos/${currentUser.uid}/${photoFile.name}`);
                await uploadBytes(storageRef, photoFile);
                updatedPhotoURL = await getDownloadURL(storageRef);
            }

            await setDoc(doc(db, "users", currentUser.uid), {
                ...form,
                name: nameOverride,
                email: currentUser.email,
                role: role,
                photoURL: updatedPhotoURL,
                updatedAt: new Date()
            }, { merge: true });

            setForm(prev => ({ ...prev, photoURL: updatedPhotoURL }));
            setProfile(prev => ({
                ...prev,
                ...form,
                name: nameOverride,
                photoURL: updatedPhotoURL,
            }));

            setPhotoFile(null);
            setMessage("Profile and photo updated successfully!");
            setIsEditing(false);

        } catch (err) {
            console.error("Profile save failed:", err);
            setMessage(`Could not save profile: ${err.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="student-section">
                <p style={{ textAlign: "center", color: "#475569" }}>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="student-section">
            <div className="section-header">
                <h1>{isEditing ? "Edit Profile" : "My Profile"}</h1>
            </div>

            <div className="profile-hero">
                <div className="avatar-wrap">
                    {profile.photoURL ? (
                        <img src={profile.photoURL} alt="Profile" />
                    ) : (
                        <span className="avatar-initials">{initials}</span>
                    )}
                </div>
                <div className="profile-name">{profile.name}</div>
                <div className="profile-email">{profile.email}</div>
                <div className="profile-role" style={{ fontSize: '0.9em', color: '#64748b' }}>Role: {profile.role}</div>
            </div>

            {!isEditing && (
                <>
                    <div className="profile-grid vertical">
                        <div className="profile-item vibrant"><strong>Teacher ID</strong><span>{profile.teacherId}</span></div>
                        <div className="profile-item vibrant"><strong>Department</strong><span>{profile.department}</span></div>
                        <div className="profile-item vibrant"><strong>Courses Taught</strong><span>{profile.coursesTaught}</span></div>
                        <div className="profile-item vibrant"><strong>Contact Number</strong><span>{profile.phone}</span></div>
                        <div className="profile-item vibrant"><strong>Address</strong><span>{profile.address}</span></div>
                        <div className="profile-item vibrant"><strong>Blood Group</strong><span>{profile.bloodGroup}</span></div>
                    </div>
                    <div style={{ marginTop: "20px", textAlign: "center" }}>
                        <button
                            className="dashboard-home"
                            onClick={() => {
                                setIsEditing(true);
                                setMessage("");
                                setNameOverride(profile.name);
                                setForm({
                                    teacherId: profile.teacherId === "N/A" ? "" : profile.teacherId,
                                    department: profile.department === "N/A" ? "" : profile.department,
                                    phone: profile.phone === "N/A" ? "" : profile.phone,
                                    address: profile.address === "N/A" ? "" : profile.address,
                                    bloodGroup: profile.bloodGroup || "O+",
                                    photoURL: profile.photoURL || ""
                                });
                            }}
                        >
                            Edit Profile
                        </button>
                    </div>
                </>
            )}

            {isEditing && (
                <form className="section-grid" onSubmit={handleSubmit} style={{ marginTop: 20 }}>

                    <div className="section-card" style={{ gridColumn: "1 / -1" }}>
                        <label><strong>Name</strong></label>
                        <input
                            type="text"
                            name="name"
                            value={nameOverride}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className="section-card">
                        <label><strong>Teacher ID</strong></label>
                        <input
                            type="text"
                            name="teacherId"
                            value={form.teacherId}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Enter Teacher ID"
                        />
                    </div>

                    <div className="section-card">
                        <label><strong>Department</strong></label>
                        <input
                            type="text"
                            name="department"
                            value={form.department}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Enter Department"
                        />
                    </div>

                    <div className="section-card">
                        <label><strong>Contact Number</strong></label>
                        <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Enter Contact Number"
                        />
                    </div>

                    <div className="section-card">
                        <label><strong>Address</strong></label>
                        <textarea
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            className="input-field"
                            rows="3"
                            placeholder="Enter Full Address"
                            style={{ backgroundColor: '#f1f5f9' }}
                        />
                    </div>

                    <div className="section-card">
                        <label><strong>Blood Group</strong></label>
                        <select
                            name="bloodGroup"
                            value={form.bloodGroup}
                            onChange={handleChange}
                            className="input-field"
                        >
                            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => (
                                <option key={bg} value={bg}>{bg}</option>
                            ))}
                        </select>
                    </div>

                    <div className="section-card">
                        <label><strong>Upload Photo</strong></label>
                        <input
                            type="file"
                            accept="image/*"
                            name="photo"
                            onChange={handleChange}
                            className="input-field"
                        />
                        {photoFile && <small>Selected: **{photoFile.name}**</small>}
                        {form.photoURL && !photoFile && <small>Current photo on file.</small>}
                    </div>

                    <div className="section-card" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
                        <button type="submit" className="dashboard-home" disabled={saving} style={{ marginRight: 10 }}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            className="dashboard-home"
                            onClick={() => {
                                setIsEditing(false);
                                setMessage('');
                            }}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        {message && <p style={{ marginTop: "8px", color: saving ? 'orange' : '#0f172a', fontWeight: 600 }}>{message}</p>}
                    </div>
                </form>
            )}
        </div>
    );
}
