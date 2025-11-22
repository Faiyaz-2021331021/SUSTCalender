import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoleSelection from "./components/RoleSelection";
import Login from "./components/Login";
import Signup from "./components/Signup";

import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import StudentCalendar from "./pages/StudentDashboard/StudentCalendar";
import StudentEvents from "./pages/StudentDashboard/StudentEvents";
import StudentCourses from "./pages/StudentDashboard/StudentCourses";
import StudentProfile from "./pages/StudentDashboard/StudentProfile";

import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard/TeacherDashboard";

import backgroundImage from "./sust-saheed-minar.jpg";
import { AuthProvider } from "./context/AuthContext";
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
      <AuthProvider>
        <div className="app-background" style={appBackground}>
          <Router>
            <Routes>
              {/* Public pages */}
              <Route path="/" element={<RoleSelection />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />

              {/* Student pages */}
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              <Route path="/student-calendar" element={<StudentCalendar />} />
              <Route path="/student-events" element={<StudentEvents />} />
              <Route path="/student-courses" element={<StudentCourses />} />
              <Route path="/student-profile" element={<StudentProfile />} />

              {/* Admin */}
              <Route path="/admin-dashboard" element={<AdminDashboard db={db} />} />

              {/* Teacher */}
              <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
            </Routes>
          </Router>
        </div>
      </AuthProvider>
  );
}

export default App;
