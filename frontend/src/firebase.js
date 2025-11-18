import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCGeFtxTZQPLvqsX_lAqhOC_sZN_JCbhqk",
  authDomain: "calender-ca7d9.firebaseapp.com",
  projectId: "calender-ca7d9",
  storageBucket: "calender-ca7d9.appspot.com",
  messagingSenderId: "118754639611",
  appId: "1:118754639611:web:0e653eaf5c5a553408fa5e"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
