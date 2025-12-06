// Returns the base Firestore user document shape for a given role.
export function buildProfileDefaults(role = "student", { email = "", name = "" } = {}) {
  const base = {
    role,
    email,
    name,
    photoURL: "",
    phone: "",
    address: "",
    bloodGroup: "O+",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (role === "teacher") {
    return {
      ...base,
      teacherId: "",
      department: "",
      coursesTaught: 0
    };
  }

  // default to student
  return {
    ...base,
    studentId: "",
    department: "",
    year: "",
    courses: []
  };
}
