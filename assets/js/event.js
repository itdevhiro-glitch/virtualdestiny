// assets/js/event.js
// Created by Hiro

import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, where } from "firebase/firestore";

const eventForm = document.getElementById('event-form');
const activeEventTableBody = document.getElementById('active-event-table-body');
const eventMessage = document.getElementById('event-message');

const formatCurrency = (amount) => {
    return 'IDR ' + new Intl.NumberFormat('id-ID').format(amount);
};

const showEventMessage = (msg, isError = false) => {
    eventMessage.textContent = msg;
    eventMessage.className = isError ? 'message error' : 'message success';
};

eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('event-name').value;
    const dateStr = document.getElementById('event-date').value;
    const budget = parseInt(document.getElementById('event-budget').value);
    const details = document.getElementById('event-details').value;

    if (!name || !dateStr || !budget) {
        showEventMessage('Event Name, Date, and Budget are required.', true);
        return;
    }

    try {
        await addDoc(collection(db, "events"), {
            name,
            date: new Date(dateStr),
            initialBudget: budget,
            currentExpense: 0,
            status: 'scheduled',
            details,
            createdAt: serverTimestamp(),
            moderator: auth.currentUser.email
        });
        showEventMessage(`Event "${name}" scheduled successfully!`, false);
        eventForm.reset();
    } catch (error) {
        console.error("Error scheduling event: ", error);
        showEventMessage('Failed to schedule event: ' + error.message, true);
    }
});

const activeEventsQuery = query(
    collection(db, "events"), 
    where("status", "!=", "completed"), 
    orderBy("status", "asc"), 
    orderBy("date", "asc")
);

onSnapshot(activeEventsQuery, (snapshot) => {
    activeEventTableBody.innerHTML = '';
    
    snapshot.docs.forEach(docSnap => {
        const event = docSnap.data();
        const eventId = docSnap.id;
        const date = event.date?.toDate().toLocaleDateString('id-ID') || 'N/A';
        const budgetLeft = event.initialBudget - (event.currentExpense || 0);

        activeEventTableBody.innerHTML += `
            <tr>
                <td>${event.name}</td>
                <td>${date}</td>
                <td>${formatCurrency(budgetLeft)}</td>
                <td>${event.status.toUpperCase()}</td>
                <td>
                    <button class="btn primary-btn update-status-btn" data-id="${eventId}" data-status="ongoing">Start</button>
                    <button class="btn danger-btn update-status-btn" data-id="${eventId}" data-status="completed">Finish</button>
                </td>
            </tr>
        `;
    });

    document.querySelectorAll('.update-status-btn').forEach(btn => {
        btn.addEventListener('click', handleUpdateStatus);
    });

    if (snapshot.empty) {
        activeEventTableBody.innerHTML = '<tr><td colspan="5">No active or upcoming events found.</td></tr>';
    }
});

async function handleUpdateStatus(e) {
    const eventId = e.target.dataset.id;
    const newStatus = e.target.dataset.status;

    if (confirm(`Are you sure you want to change the status of this event to ${newStatus.toUpperCase()}?`)) {
        try {
            await updateDoc(doc(db, "events", eventId), {
                status: newStatus
            });
            showEventMessage(`Event status updated to ${newStatus}.`, false);
        } catch (error) {
            console.error("Error updating event status:", error);
            showEventMessage('Failed to update event status.', true);
        }
    }
}