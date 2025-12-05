// assets/js/moderator.js
// Created by Hiro

import { db } from './firebase-config.js';
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";

const moderatorTableBody = document.getElementById('moderator-table-body');
const modCountEl = document.getElementById('mod-count');
const modMessage = document.getElementById('mod-message');

const showModMessage = (msg, isError = false) => {
    modMessage.textContent = msg;
    modMessage.className = isError ? 'message error' : 'message success';
};

const usersQuery = query(collection(db, "users"));

onSnapshot(usersQuery, (snapshot) => {
    moderatorTableBody.innerHTML = '';
    modCountEl.textContent = snapshot.size;

    snapshot.docs.forEach(docSnap => {
        const user = docSnap.data();
        const userId = docSnap.id;
        
        const isAdminEmail = user.email === 'admin@vdcommunity.com';
        const selectDisabled = isAdminEmail ? 'disabled' : '';

        moderatorTableBody.innerHTML += `
            <tr>
                <td>${user.email}</td>
                <td>${user.username}</td>
                <td>
                    <select class="role-select" data-uid="${userId}" ${selectDisabled}>
                        <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="banned" ${user.role === 'banned' ? 'selected' : ''}>Banned</option>
                    </select>
                </td>
                <td>
                    <button class="btn danger-btn remove-btn" data-uid="${userId}" ${selectDisabled}>Remove Access</button>
                </td>
            </tr>
        `;
    });

    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', handleRoleChange);
    });

    if (snapshot.empty) {
        moderatorTableBody.innerHTML = '<tr><td colspan="4">No registered moderators found.</td></tr>';
    }
});

async function handleRoleChange(e) {
    const newRole = e.target.value;
    const userId = e.target.dataset.uid;
    
    if (confirm(`Are you sure you want to change role for ${userId} to ${newRole}?`)) {
        try {
            await updateDoc(doc(db, "users", userId), {
                role: newRole
            });
            showModMessage(`Role for user ${userId} updated to ${newRole}.`, false);
        } catch (error) {
            console.error("Error updating role:", error);
            showModMessage('Failed to update role. Check Firebase Rules.', true);
        }
    } else {
        e.target.value = e.target.getAttribute('data-initial-role');
    }
}