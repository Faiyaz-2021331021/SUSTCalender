import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import "./Login.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "student";
  const navigate = useNavigate();

  const signup = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match. Please re-enter them.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        name,
        email,
        role,
        createdAt: new Date()
      });

      alert("Signed up successfully!");
      setConfirmPassword("");
      navigate(`/${role}-dashboard`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <button className="home-btn" onClick={() => navigate("/")}>🏠 Home</button>
        <h1 className="login-title">{role?.toUpperCase()} Sign Up</h1>
        <p className="login-subtitle">Create a new {role} account</p>

        {role !== "admin" && (
          <input
            type="text"
            className="login-input"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

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

        <input
          type="password"
          className="login-input"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <div className="btn-group">
          <button className="btn signup" onClick={signup}>
            Create Account
          </button>
          <button className="btn login" onClick={() => navigate(`/login?role=${role}`)}>
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}
