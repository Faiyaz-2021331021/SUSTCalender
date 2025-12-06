import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { buildProfileDefaults } from "../utils/profileDefaults";
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
    const requestedRole = role.toLowerCase();

    if (!trimmedEmail || !trimmedPassword) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const uid = userCredential.user.uid;

      const userRef = doc(db, "users", uid);
      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        alert(`No ${role} profile found for this account. Please sign up for a ${role} account first.`);
        return;
      }

      const data = snapshot.data();
      const storedRole = (data.role || "").toLowerCase();

      if (!storedRole) {
        alert("This account is missing a role. Please contact admin.");
        return;
      }

      if (storedRole !== requestedRole) {
        alert(`This account is a ${storedRole} account. Please log in via the ${storedRole} portal.`);
        return;
      }

      navigate(`/${storedRole}-dashboard`);
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
