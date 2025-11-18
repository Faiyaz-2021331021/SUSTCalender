import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const signup = async () => {
  try {
    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = userCredential.user.uid;

    // Save user details in Firestore
    await setDoc(doc(db, "users", uid), {
      name,
      email,
      role,
      createdAt: new Date()
    });

    alert("Signed up successfully!");
    navigate(`/${role}-dashboard`);
  } catch (err) {
    alert(err.message);
  }
};
