import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "student";
  const navigate = useNavigate();

  const login = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const uid = userCredential.user.uid;

      const userRef = doc(db, "users", uid);
      const snapshot = await getDoc(userRef);

      let targetRole = role; // default to the query param (teacher/admin/student)
      if (snapshot.exists()) {
        const data = snapshot.data();
        const storedRole = data.role;
        if (storedRole && storedRole !== role) {
          // If the stored role differs from the current context, honor the current context and update Firestore
          targetRole = role;
          await setDoc(userRef, { role: targetRole }, { merge: true });
        } else if (storedRole) {
          targetRole = storedRole;
        } else {
          await setDoc(userRef, { role: targetRole }, { merge: true });
        }
      } else {
        // If no user doc, create a minimal one using the current context
        await setDoc(userRef, { email, role: targetRole, createdAt: new Date() }, { merge: true });
      }

      navigate(`/${targetRole}-dashboard`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">{role?.toUpperCase()} Login</h1>
        <p className="login-subtitle">Access your {role} dashboard</p>

        <input
          type="email"
          className="login-input"
          placeholder="University Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="login-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="btn-group">
          <button className="btn login" onClick={login}>
            Login
          </button>
        </div>

        <div className="secondary-action">
          <span>Need an account?</span>
          <button className="btn red-signup-btn" onClick={() => navigate(`/signup?role=${role}`)}>
            Sign up here
          </button>
        </div>
      </div>
    </div>
  );
}
