import React, { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../firebase";
import "../StudentDashboard/StudentDashboard.css";

// --- FALLBACKS & STYLES ---

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
    const { currentUser } = useAuth();

    // Initial name calculation based on email (for fallback)
    const initialName = currentUser?.email?.split('@')[0] || "Student";

    // STATES FOR DISPLAY AND EDITING
    const [profile, setProfile] = useState(fallbackProfile);
    const [form, setForm] = useState(fallbackProfile);
    const [nameOverride, setNameOverride] = useState(initialName); // For editing the name
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    // STATES FOR FILE AND MESSAGE
    const [photoFile, setPhotoFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    // --- 1. FETCH DATA ON LOAD ---
    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const refDoc = doc(db, "users", currentUser.uid);

        // Live subscription keeps the profile view in sync after edits
        const unsub = onSnapshot(refDoc, (snap) => {
            const role = "Student"; // Fixed role for display

            if (snap.exists()) {
                const data = snap.data();
                const currentName = data.name || initialName;

                // Set Profile State (for display)
                setProfile({
                    ...fallbackProfile,
                    ...data,
                    email: currentUser.email || data.email,
                    name: currentName,
                    role
                });

                // Set Form State (for editing)
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
                    role // Added role
                });
                setForm({
                    studentId: "",
                    department: "",
                    year: "",
                    phone: "",
                    address: "",
                    bloodGroup: "O+",
                    photoURL: ""
                });
                setNameOverride(initialName);
            }

            setLoading(false);
        }, (err) => {
            console.error("Profile load error", err);
            setLoading(false);
        });

        return () => unsub();
    }, [currentUser, initialName]);

    // Calculate initials for avatar fallback
    const initials = (profile.name || fallbackProfile.name)
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // --- 2. HANDLE CHANGE FOR FORM INPUTS ---
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "photo" && files) {
            setPhotoFile(files[0]);
        } else if (name === "name") {
            setNameOverride(value);
        } else {
            // This handles studentId, department, year, phone, address, bloodGroup
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };


    // --- 3. SUBMIT LOGIC ---
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
            // --- A. Handle Photo Upload ---
            if (photoFile) {
                const storageRef = ref(storage, `studentProfilePhotos/${currentUser.uid}/${photoFile.name}`);
                await uploadBytes(storageRef, photoFile, { contentType: photoFile.type || "application/octet-stream" });
                updatedPhotoURL = await getDownloadURL(storageRef);
            }

            // --- B. Save Data to Firestore (Profile change) ---
            await setDoc(doc(db, "users", currentUser.uid), {
                ...form,
                name: nameOverride, // Save the updated name
                email: currentUser.email || profile.email,
                role: profile.role || "student",
                photoURL: updatedPhotoURL,
                updatedAt: new Date()
            }, { merge: true });

            // 4. Update local state and UI (onSnapshot will also refresh)
            setForm(prev => ({ ...prev, photoURL: updatedPhotoURL }));

            setProfile(prev => ({
                ...prev,
                ...form,
                name: nameOverride,
                photoURL: updatedPhotoURL,
                email: currentUser.email || prev.email,
                role: prev.role || "student"
            }));

            setPhotoFile(null);
            setMessage("Profile and photo updated successfully!");
            setIsEditing(false); // Switch back to display mode

        } catch (err) {
            console.error("Profile save failed:", err);
            setMessage(`Could not save profile: ${err.message || "Unknown error"}`);
        } finally {
            setSaving(false);
        }
    };


    // --- 4. RENDER LOGIC ---

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
                <div className="profile-role" style={{ fontSize: "0.9em", color: "#64748b" }}>Role: {profile.role || "Student"}</div>
            </div>

            {/* --- DISPLAY MODE --- */}
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
                                // Pre-fill the name field for editing
                                setNameOverride(profile.name);
                                // Pre-fill other form fields
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

            {/* --- EDITING MODE --- */}
            {isEditing && (
                <form className="section-grid" onSubmit={handleSubmit} style={{ marginTop: 20 }}>

                    {/* NAME FIELD */}
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

                    {/* Other Editable Fields */}
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
                            style={{ backgroundColor: "#f1f5f9" }}
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

                    {/* Save/Cancel Buttons */}
                    <div className="section-card" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
                        <button type="submit" className="dashboard-home" disabled={saving} style={{ marginRight: 10 }}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            className="dashboard-home"
                            onClick={() => {
                                setIsEditing(false);
                                setMessage("");
                            }}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        {message && <p style={{ marginTop: "8px", color: saving ? "orange" : "#0f172a", fontWeight: 600 }}>{message}</p>}
                    </div>
                </form>
            )}
        </div>
    );
}
