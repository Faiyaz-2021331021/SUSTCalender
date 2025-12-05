import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// 🔑 IMPORTANT: We need these for re-authentication
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"; 

import { db, storage } from "../../firebase"; 
import { useAuth } from "../../context/AuthContext"; 


const modalStyle = {
    padding: 20,
    borderRadius: 12,
    background: '#f8fafc',
    boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
    border: '1px solid #e2e8f0'
};

const fallbackProfile = {
    phone: "",
    address: "",
    bloodGroup: "O+",
    photoURL: ""
};

export default function TeacherProfile({ teacher, courses, role }) {
    const { currentUser } = useAuth(); // Assume this provides the user object
    
    const initialName = teacher?.email.split('@')[0] || "Teacher";

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(fallbackProfile);
    const [nameOverride, setNameOverride] = useState(initialName); 
    const [photoFile, setPhotoFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    
    // 🔑 NEW STATES FOR PASSWORD HANDLING
    const [newPassword, setNewPassword] = useState(''); 
    const [currentPassword, setCurrentPassword] = useState(''); // To capture old password for re-auth

    // --- 1. FETCH DATA ON LOAD ---
    useEffect(() => {
        // ... (existing loadProfileData logic remains the same)
        async function loadProfileData() {
            if (!currentUser || !currentUser.uid) {
                console.log("No authenticated user found for data fetch.");
                return;
            }
            
            try {
                const userRef = doc(db, "users", currentUser.uid);
                const snap = await getDoc(userRef);

                if (snap.exists()) {
                    const data = snap.data();
                    
                    setForm({
                        phone: data.phone || "",
                        address: data.address || "",
                        bloodGroup: data.bloodGroup || "O+",
                        photoURL: data.photoURL || ""
                    });
                    setNameOverride(data.name || initialName);
                } else {
                    setNameOverride(initialName);
                    setForm(fallbackProfile);
                }
            } catch (err) {
                console.error("Profile fetch failed:", err);
            }
        }
        
        loadProfileData();
    }, [currentUser, teacher, initialName]); 
    

    const profileData = {
        name: nameOverride,
        email: teacher?.email || "N/A",
        role: role,
        coursesTaught: courses.length,
        phone: form.phone || "N/A",
        address: form.address || "N/A",
        bloodGroup: form.bloodGroup,
        photoURL: form.photoURL
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "photo" && files) {
            setPhotoFile(files[0]);
        } else if (name === "name") {
            setNameOverride(value); 
        } else if (name === "newPassword") { // 🔑 Use a distinct name for the new password input
            setNewPassword(value);
        } else if (name === "currentPassword") { // 🔑 Handle current password
            setCurrentPassword(value);
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    // --- 2. SAVE DATA TO FIREBASE (Updated for Re-authentication) ---
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
            // --- A. Handle Password Update (Auth change) ---
            if (newPassword) {
                if (!currentPassword) {
                    throw new Error("You must enter your current password to set a new one.");
                }
                if (newPassword.length < 6) {
                     throw new Error("New password must be at least 6 characters long.");
                }

                // 🔑 STEP 1: Create a credential with the user's email and CURRENT password
                const credential = EmailAuthProvider.credential(
                    currentUser.email,
                    currentPassword
                );

                // 🔑 STEP 2: Re-authenticate the user immediately before the sensitive action
                await reauthenticateWithCredential(currentUser, credential);
                
                // 🔑 STEP 3: Now the session is fresh, update the password
                await updatePassword(currentUser, newPassword);
            }
            
            // --- B. Handle Photo Upload ---
            if (photoFile) {
                const storageRef = ref(storage, `teacherProfilePhotos/${currentUser.uid}/${photoFile.name}`);
                await uploadBytes(storageRef, photoFile);
                updatedPhotoURL = await getDownloadURL(storageRef);
            }
            
            // --- C. Save Data to Firestore (Profile change) ---
            await setDoc(doc(db, "users", currentUser.uid), {
                ...form, 
                name: nameOverride,
                email: teacher?.email, 
                role: role,
                photoURL: updatedPhotoURL 
            }, { merge: true });

            // 4. Update local state and UI
            setForm(prev => ({ ...prev, photoURL: updatedPhotoURL }));
            setPhotoFile(null); 
            setCurrentPassword(''); // Clear sensitive inputs
            setNewPassword(''); 
            setMessage("Profile and password updated successfully!");
            setIsEditing(false);

        } catch (err) {
            console.error("Profile save failed:", err);
            // Handle common re-auth errors (e.g., wrong current password)
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

    return (
        <div className="main-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="panel" style={modalStyle}>
                <h4>My Profile Details 👤</h4>
                <div style={{ marginBottom: 15 }}>
                    {/* ... (Display details section remains the same) ... */}
                    <p><strong>Name:</strong> {profileData.name}</p>
                    <p><strong>Email:</strong> {profileData.email}</p>
                    <p><strong>Role:</strong> {profileData.role}</p>
                    <p><strong>Courses Taught:</strong> {profileData.coursesTaught}</p>
                    <p><strong>Contact Number:</strong> {profileData.phone}</p>
                    <p><strong>Address:</strong> {profileData.address}</p>
                    <p><strong>Blood Group:</strong> {profileData.bloodGroup}</p>
                    <p><strong>Photo:</strong> {profileData.photoURL ? 
                        <a href={profileData.photoURL} target="_blank" rel="noopener noreferrer">View Photo</a> : "None"}
                    </p>
                    
                    {isEditing && (
                        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
                            <h5>Edit Account Information</h5>

                            <div className="form-group">
                                <label>Name</label>
                                <input 
                                    name="name"
                                    placeholder="Enter new name"
                                    value={nameOverride} 
                                    onChange={handleChange}
                                />
                            </div>
                            
                            {/* 🔑 NEW FIELD: Current Password */}
                            <div className="form-group">
                                <label>Current Password (Required for any changes)</label>
                                <input 
                                    type="password" 
                                    name="currentPassword" 
                                    value={currentPassword}
                                    onChange={handleChange}
                                    placeholder="Enter current password" 
                                    autoComplete="current-password"
                                />
                            </div>

                            {/* 🔑 Modified Field: New Password */}
                            <div className="form-group">
                                <label>New Password</label>
                                <input 
                                    type="password" 
                                    name="newPassword" 
                                    value={newPassword}
                                    onChange={handleChange}
                                    placeholder="Leave blank to keep current (min 6 chars)" 
                                    autoComplete="new-password"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Contact Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="Enter contact number"
                                />
                            </div>

                            <div className="form-group">
                                <label>Address</label>
                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Enter full address"
                                />
                            </div>

                            <div className="form-group">
                                <label>Blood Group</label>
                                <select
                                    name="bloodGroup"
                                    value={form.bloodGroup}
                                    onChange={handleChange}
                                >
                                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Upload Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    name="photo"
                                    onChange={handleChange}
                                />
                                {photoFile && <small>Selected: **{photoFile.name}**</small>}
                                {form.photoURL && !photoFile && <small>Current photo on file.</small>}
                            </div>

                            <button type="submit" className="btn" disabled={saving} style={{ marginRight: 10 }}>
                                {saving ? "Saving..." : "Save Profile"}
                            </button>
                            {message && <p style={{ marginTop: "10px", color: saving ? 'orange' : '#0f172a', fontWeight: 600 }}>{message}</p>}
                        </form>
                    )}
                </div>

                <button className="btn btn-secondary" onClick={() => {
                    setIsEditing(!isEditing);
                    setMessage(""); 
                    setSaving(false);
                    setCurrentPassword(''); // Clear on cancel
                    setNewPassword(''); // Clear on cancel
                }}>
                    {isEditing ? "Cancel Edit" : "Edit Profile"}
                </button>
            </div>
        </div>
    );
}