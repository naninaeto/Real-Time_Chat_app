// src/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyAQvUB02iWa-0JDOFMSvJCqZdt3FFVQsgo",
    authDomain: "community-23225.firebaseapp.com",
    projectId: "community-23225",
    storageBucket: "community-23225.firebasestorage.app",
    messagingSenderId: "748396084379",
    appId: "1:748396084379:web:e9e65f66b46ac9c8761a3e",
    measurementId: "G-JXHWFCLTMF"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
