# 📅 University Calendar System

A full-stack calendar management platform designed for **students**, **teachers**, and **admins**.  
The system centralizes academic scheduling, course management, and event organization within a university.

---

## 🚀 Overview

This application provides a unified calendar where each user role has specific functionalities:

### 👤 Admin
- Create **global university events** such as:
  - Holidays
  - Meetings
  - Announcements
- Create events **for teachers**, **for students**, or **for both**.
- All admin-created events automatically appear in every affected user’s calendar.

### 👨‍🏫 Teacher
- Create and manage **courses**.
- Add course-specific events such as:
  - Assignments  
  - Quizzes  
  - Exams  
  - Class schedules  
- Access a personalized calendar showing:
  - All events related to their created courses
  - Admin-created global events
  - Upcoming event details

### 👨‍🎓 Student
- Register for any course created by teachers.
- View:
  - All events related to their registered courses
  - All admin-created events
  - Event details inside the calendar
- Calendar updates automatically as teachers add new course events.

---

## 🛠️ Technology Stack

### **Frontend** (`/frontend`)
- **React 19**
- **React Router 7**
- **React Calendar**
- **Firebase Client SDK**
- Custom UI components for dashboards, course views, and events

### **Backend** (`/backend`)
- **Express.js 5**
- **Firebase Admin SDK**
- **body-parser**
- **dotenv**

### 🔐 Authentication & Database
- **Firebase Authentication**  
  Used for secure login & role-based access.
- **Firestore NoSQL Database**  
  - Collections include:
    - `users`
    - `courses`
    - `events`
    - `registrations`
  - Uses Firestore methods such as:
    - `getFirestore`
    - `collection`
    - `addDoc`

---
📌 Future Improvements

Drag-and-drop event scheduling

Notification system (email or in-app)

Google Calendar export

Admin analytics dashboard

Dark/light mode

Classroom/section management

