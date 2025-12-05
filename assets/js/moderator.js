// assets/js/moderator.js
// Created by Hiro

import { db } from './firebase-config.js';
import { ref, onValue, update } from "firebase/database";

const moderatorTableBody = document.getElementById('moderator-table-body');
const modCountEl = document.getElementById('mod-count');
const modMessage = document.getElementById('mod-message');

const showModMessage = (msg, isError = false) => {
    modMessage.textContent = msg;
    modMessage.className = isError ? 'message error' : 'message success';
};

const usersRef = ref(db, 'users');

onValue(usersRef, (snapshot) => {
    moderatorTableBody.innerHTML = '';
    let userCount = 0;

    snapshot.forEach(childSnapshot => {
        const userId = childSnapshot.key;
        const user = childSnapshot.val();
        
        const isAdminEmail = user.email === 'admin@vdcommunity.com';
        const selectDisabled = isAdminEmail ? 'disabled' : '';
        userCount++;

        moderatorTableBody.innerHTML += `
            <tr>
                <td>${user.email}</td>
                <td>${user.username}</td>
                <td>
                    <select class="role-select" data-uid="${userId}" data-initial-role="${user.role}" ${selectDisabled}>
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
    
    modCountEl.textContent = userCount;

    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', handleRoleChange);
    });

    if (userCount === 0) {
        moderatorTableBody.innerHTML = '<tr><td colspan="4">No registered moderators found.</td></tr>';
    }
});

async function handleRoleChange(e) {
    const newRole = e.target.value;
    const userId = e.target.dataset.uid;
    const initialRole = e.target.dataset.initialRole;
    
    if (confirm(`Are you sure you want to change role for user with ID ${userId} to ${newRole}?`)) {
        try {
            await update(ref(db, `users/${userId}`), {
                role: newRole
            });
            e.target.dataset.initialRole = newRole;
            showModMessage(`Role for user ${userId} updated to ${newRole}.`, false);
        } catch (error) {
            console.error("Error updating role:", error);
            showModMessage('Failed to update role. Check Firebase Rules.', true);
            e.target.value = initialRole;
        }
    } else {
        e.target.value = initialRole;
    }
}
