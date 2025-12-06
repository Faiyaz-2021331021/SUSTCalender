import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

import { useAuth } from "../../context/AuthContext";

import { db, storage } from "../../firebase";
import "../StudentDashboard/StudentDashboard.css";




const fallbackProfile = {
    name: "Student",
    email: "student@example.com",
    studentId: "",
    department: "",
    year: "",
    phone: "",
    address: "",
    bloodGroup: "O+",
    photoURL: ""
};

export default function StudentProfile() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const initialName = currentUser?.email.split('@')[0] || "Student";

    const [profile, setProfile] = useState(fallbackProfile);
    const [form, setForm] = useState(fallbackProfile);
    const [nameOverride, setNameOverride] = useState(initialName);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [photoFile, setPhotoFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');


    useEffect(() => {
        async function loadProfile() {
            setLoading(true);
            if (!currentUser) {
                setLoading(false);
                return;
            }
            try {
                const ref = doc(db, "users", currentUser.uid);
                const snap = await getDoc(ref);
                const role = "Student";

                if (snap.exists()) {
                    const data = snap.data();
                    const currentName = data.name || initialName;

                    setProfile({
                        ...fallbackProfile,
                        ...data,
                        email: currentUser.email || data.email,
                        name: currentName,
                        role: role
                    });

                    setForm({
                        studentId: data.studentId || "",
                        department: data.department || "",
                        year: data.year || "",
                        phone: data.phone || "",
                        address: data.address || "",
                        bloodGroup: data.bloodGroup || "O+",
                        photoURL: data.photoURL || ""
                    });
                    setNameOverride(currentName);
                } else {
                    setProfile({
                        ...fallbackProfile,
                        email: currentUser.email,
                        name: initialName,
                        role: role
                    });
                    setNameOverride(initialName);
                }
            } catch (err) {
                console.error("Profile load error", err);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [currentUser, initialName]);

    const initials = (profile.name || fallbackProfile.name)
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
        } else if (name === "newPassword") {
            setNewPassword(value);
        } else if (name === "currentPassword") {
            setCurrentPassword(value);
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
            if (newPassword) {
                if (!currentPassword) {
                    throw new Error("You must enter your current password to set a new one.");
                }
                if (newPassword.length < 6) {
                    throw new Error("New password must be at least 6 characters long.");
                }

                const credential = EmailAuthProvider.credential(
                    currentUser.email,
                    currentPassword
                );

                await reauthenticateWithCredential(currentUser, credential);
                await updatePassword(currentUser, newPassword);
            }

            if (photoFile) {
                const storageRef = ref(storage, `studentProfilePhotos/${currentUser.uid}/${photoFile.name}`);
                await uploadBytes(storageRef, photoFile);
                updatedPhotoURL = await getDownloadURL(storageRef);
            }

            await setDoc(doc(db, "users", currentUser.uid), {
                ...form,
                name: nameOverride,
                photoURL: updatedPhotoURL
            }, { merge: true });

            setForm(prev => ({ ...prev, photoURL: updatedPhotoURL }));

            setProfile(prev => ({
                ...prev,
                ...form,
                name: nameOverride,
                photoURL: updatedPhotoURL,
            }));

            setPhotoFile(null);
            setCurrentPassword('');
            setNewPassword('');
            setMessage("Profile, photo, and password updated successfully!");
            setIsEditing(false);

        } catch (err) {
            console.error("Profile save failed:", err);
            if (err.code === 'auth/wrong-password') {
                setMessage("Incorrect current password. Please try again.");
            } else if (err.code === 'auth/user-mismatch') {
                setMessage("Error: User mismatch during re-authentication.");
            } else {
                setMessage(`Could not save profile: ${err.message || 'Unknown error'}`);
            }
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
                <div style={{ flex: 1 }}>
                    <h1>{isEditing ? "Edit Profile" : "My Profile"}</h1>
                </div>

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
                <div className="profile-role" style={{ fontSize: '0.9em', color: '#64748b' }}>Role: {profile.role || 'Student'}</div>
            </div>

            {!isEditing && (
                <>
                    <div className="profile-grid vertical">
                        <div className="profile-item vibrant"><strong>Student ID</strong><span>{profile.studentId || "N/A"}</span></div>
                        <div className="profile-item vibrant"><strong>Department</strong><span>{profile.department || "N/A"}</span></div>
                        <div className="profile-item vibrant"><strong>Year</strong><span>{profile.year || "N/A"}</span></div>
                        <div className="profile-item vibrant"><strong>Phone</strong><span>{profile.phone || "N/A"}</span></div>
                        <div className="profile-item vibrant"><strong>Address</strong><span>{profile.address || "N/A"}</span></div>
                        <div className="profile-item vibrant"><strong>Blood Group</strong><span>{profile.bloodGroup || "N/A"}</span></div>
                    </div>
                    <div style={{ marginTop: "20px", textAlign: "center" }}>
                        <button
                            className="dashboard-home"
                            onClick={() => {
                                setIsEditing(true);
                                setMessage("");
                                setNameOverride(profile.name);
                                setForm({
                                    studentId: profile.studentId || "",
                                    department: profile.department || "",
                                    year: profile.year || "",
                                    phone: profile.phone || "",
                                    address: profile.address || "",
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
                        <label><strong>Student ID</strong></label>
                        <input
                            type="text"
                            name="studentId"
                            value={form.studentId}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Enter Student ID"
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
                        <label><strong>Year</strong></label>
                        <input
                            type="text"
                            name="year"
                            value={form.year}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Enter Academic Year"
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

                    <div className="section-card" style={{ gridColumn: "1 / -1" }}>
                        <h5>Password Change 🔒</h5>
                        <label>Current Password (Required to save **any** changes)</label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={currentPassword}
                            onChange={handleChange}
                            placeholder="Enter current password"
                            autoComplete="current-password"
                            className="input-field"
                        />

                        <label style={{ marginTop: 15 }}>New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={newPassword}
                            onChange={handleChange}
                            placeholder="Leave blank to keep current (min 6 chars)"
                            autoComplete="new-password"
                            className="input-field"
                        />
                    </div>

                    <div className="section-card" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
                        <button type="submit" className="dashboard-home" disabled={saving} style={{ marginRight: 10 }}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button type="button" className="dashboard-home" onClick={() => {
                            setIsEditing(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setMessage('');
                        }} disabled={saving}>
                            Cancel
                        </button>
                        {message && <p style={{ marginTop: "8px", color: saving ? 'orange' : '#0f172a', fontWeight: 600 }}>{message}</p>}
                    </div>
                </form>
            )}
        </div>
    );
}