import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoleSelection from "./components/RoleSelection";
import Login from "./components/Login";
import Signup from "./components/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import backgroundImage from "./sust-saheed-minar.jpg";

import { db } from "./firebase";

function App() {
    const appBackground = {
        minHeight: "100vh",
        backgroundImage: `linear-gradient(120deg, rgba(14, 32, 64, 0.45), rgba(5, 11, 26, 0.35)), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
    };

    return (
        <div className="app-background" style={appBackground}>
            <Router>
                <Routes>
                    <Route path="/" element={<RoleSelection />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/student-dashboard" element={<StudentDashboard db={db} />} />
                    <Route path="/admin-dashboard" element={<AdminDashboard db={db} />} />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
