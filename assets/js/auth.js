// assets/js/auth.js
// Created by Hiro

import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged 
} from "firebase/auth";
import { ref, set, get, child } from "firebase/database";

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toggleRegisterBtn = document.getElementById('toggle-register');
const authMessage = document.getElementById('auth-message');

const showMessage = (msg, isError = false) => {
    if(authMessage) {
        authMessage.textContent = msg;
        authMessage.className = isError ? 'message error' : 'message success';
    }
};

onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    if (user) {
        if (path.includes('login.html') || path.endsWith('/')) {
             window.location.href = 'dashboard.html';
        }
    } else {
        if (!path.includes('login.html') && !path.endsWith('/')) {
            window.location.href = 'login.html';
        }
    }
});

registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const username = document.getElementById('register-username').value;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await set(ref(db, 'users/' + userCredential.user.uid), {
            username: username,
            email: email,
            role: 'moderator',
            createdAt: new Date().toISOString()
        });

        showMessage("Registration successful! Redirecting...", false);
        setTimeout(() => window.location.href = 'dashboard.html', 2000);

    } catch (error) {
        const errorMessage = error.message.replace("Firebase: ", "");
        showMessage(`Registration Failed: ${errorMessage}`, true);
    }
});

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage("Login successful! Entering the Dashboard...", false);
        setTimeout(() => window.location.href = 'dashboard.html', 1500);

    } catch (error) {
        const errorMessage = error.message.replace("Firebase: ", "");
        showMessage(`Login Failed: ${errorMessage}`, true);
    }
});

const logout = async () => {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Logout Error:", error);
        alert("Failed to logout.");
    }
};

const checkAdminRole = async (user) => {
    if (!user) return false;
    const userSnapshot = await get(child(ref(db), `users/${user.uid}/role`));
    return userSnapshot.exists() && userSnapshot.val() === 'admin';
}

export { logout, auth, db, onAuthStateChanged, ref, get, child, set, checkAdminRole };
