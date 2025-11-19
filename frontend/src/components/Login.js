import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "student";
  const navigate = useNavigate();

  const login = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const snapshot = await getDoc(doc(db, "users", uid));

      if (!snapshot.exists()) {
        alert("User profile not found!");
        return;
      }

      const data = snapshot.data();
      navigate(`/${data.role}-dashboard`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <button className="home-btn" onClick={() => navigate("/")}>🏠 Home</button>
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
          <button className="btn signup" onClick={() => navigate(`/signup?role=${role}`)}>
            Need an account?
          </button>
        </div>
      </div>
    </div>
  );
}
