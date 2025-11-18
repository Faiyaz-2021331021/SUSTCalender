require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); // allow requests from frontend

// Firebase Admin setup
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
});

const db = admin.firestore();

// ---- Root route ----
app.get("/", (req, res) => {
  res.send("Backend server is running! Use /signup and /login.");
});

// ---- SIGNUP ----
app.post("/signup", async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !role) return res.status(400).send("Missing fields");

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Save user info + role in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      name,
      email,
      role, // student / teacher / admin
      createdAt: new Date()
    });

    res.send({ message: "User signed up successfully", uid: userRecord.uid });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ---- LOGIN ----
app.post("/login", async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).send("Missing UID");

  try {
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) return res.status(404).send("User not found");
    res.send({ role: userDoc.data().role, name: userDoc.data().name, uid });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
