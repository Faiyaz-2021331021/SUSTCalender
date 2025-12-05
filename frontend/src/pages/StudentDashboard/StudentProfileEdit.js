// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { doc, getDoc, setDoc } from "firebase/firestore";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { useAuth } from "../../context/AuthContext";
// import { db, storage } from "../../firebase";
// import "../StudentDashboard/StudentDashboard.css";

// const fallbackProfile = {
//     phone: "",
//     address: "",
//     bloodGroup: "O+",
//     photoURL: ""
// };

// export default function StudentProfileEdit() {
//     const navigate = useNavigate();
//     const { currentUser } = useAuth();
//     const [form, setForm] = useState(fallbackProfile);
//     const [photoFile, setPhotoFile] = useState(null);
//     const [saving, setSaving] = useState(false);
//     const [message, setMessage] = useState("");

//     useEffect(() => {
//         async function load() {
//             if (!currentUser) return;
//             try {
//                 const snap = await getDoc(doc(db, "users", currentUser.uid));
//                 if (snap.exists()) {
//                     const data = snap.data();
//                     setForm({
//                         phone: data.phone || "",
//                         address: data.address || "",
//                         bloodGroup: data.bloodGroup || "O+",
//                         photoURL: data.photoURL || ""
//                     });
//                 }
//             } catch (err) {
//                 console.error("Profile fetch failed", err);
//             }
//         }
//         load();
//     }, [currentUser]);

//     const handleChange = (e) => {
//         const { name, value, files } = e.target;
//         if (files) {
//             setPhotoFile(files[0]);
//         } else {
//             setForm(prev => ({ ...prev, [name]: value }));
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (!currentUser) {
//             setMessage("Please log in to update your profile.");
//             return;
//         }

//         setSaving(true);
//         setMessage("");
//         let photoURL = form.photoURL;

//         try {
//             if (photoFile) {
//                 const storageRef = ref(storage, `profilePhotos/${currentUser.uid}/${photoFile.name}`);
//                 await uploadBytes(storageRef, photoFile);
//                 photoURL = await getDownloadURL(storageRef);
//             }

//             await setDoc(doc(db, "users", currentUser.uid), {
//                 ...form,
//                 photoURL
//             }, { merge: true });

//             setForm(prev => ({ ...prev, photoURL }));
//             setMessage("Profile saved!");
//         } catch (err) {
//             console.error("Save failed", err);
//             setMessage("Could not save profile. Try again.");
//         } finally {
//             setSaving(false);
//         }
//     };

//     return (
//         <div className="student-section">
//             <div className="section-header">
//                 <div style={{ flex: 1 }}>
//                     <h1>Edit Profile</h1>
//                     <p>Update contact, address, blood group, and photo.</p>
//                 </div>
//                 <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
//                     <button type="button" className="close-btn" onClick={() => navigate("/student-dashboard")}>✕</button>
//                 </div>
//             </div>

//             <form className="section-grid" onSubmit={handleSubmit}>
//                 <div className="section-card">
//                     <label><strong>Contact Number</strong></label>
//                     <input
//                         type="tel"
//                         name="phone"
//                         value={form.phone}
//                         onChange={handleChange}
//                         className="input-field"
//                         required
//                     />
//                 </div>

//                 <div className="section-card">
//                     <label><strong>Address</strong></label>
//                     <textarea
//                         name="address"
//                         value={form.address}
//                         onChange={handleChange}
//                         className="input-field"
//                         rows="3"
//                         required
//                     />
//                 </div>

//                 <div className="section-card">
//                     <label><strong>Blood Group</strong></label>
//                     <select
//                         name="bloodGroup"
//                         value={form.bloodGroup}
//                         onChange={handleChange}
//                         className="input-field"
//                     >
//                         {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => (
//                             <option key={bg} value={bg}>{bg}</option>
//                         ))}
//                     </select>
//                 </div>

//                 <div className="section-card">
//                     <label><strong>Upload Photo</strong></label>
//                     <input
//                         type="file"
//                         accept="image/*"
//                         name="photo"
//                         onChange={handleChange}
//                         className="input-field"
//                     />
//                     {photoFile && <small>Selected: {photoFile.name}</small>}
//                     {form.photoURL && !photoFile && <small>Current photo on file.</small>}
//                 </div>

//                 <div className="section-card" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
//                     <button type="submit" className="dashboard-home" disabled={saving}>
//                         {saving ? "Saving..." : "Save Changes"}
//                     </button>
//                     {message && <p style={{ marginTop: "8px", color: "#0f172a", fontWeight: 600 }}>{message}</p>}
//                 </div>
//             </form>
//         </div>
//     );
// }
