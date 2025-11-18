import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoleSelection from "./components/RoleSelection";
import Login from "./components/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";

// Import the database connection from your firebase.js file
import { db } from "./firebase";
<Route path="/admin-dashboard" element={<AdminDashboard db={db} />} />

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<RoleSelection />} />
                <Route path="/login" element={<Login />} />

                {/* Pass the 'db' prop to the dashboards */}
                <Route path="/student-dashboard" element={<StudentDashboard db={db} />} />
                <Route path="/admin-dashboard" element={<AdminDashboard db={db} />} />
            </Routes>
        </Router>
    );
}

export default App;