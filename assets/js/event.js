// assets/js/event.js
// Created by Hiro

import { db, auth } from './firebase-config.js';
import { ref, push, onValue, query, orderByChild, update } from "firebase/database";

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
        await push(ref(db, 'events'), {
            name,
            date: new Date(dateStr).toISOString(),
            initialBudget: budget,
            currentExpense: 0,
            status: 'scheduled',
            details,
            createdAt: new Date().toISOString(),
            moderator: auth.currentUser.email
        });
        showEventMessage(`Event "${name}" scheduled successfully!`, false);
        eventForm.reset();
    } catch (error) {
        console.error("Error scheduling event: ", error);
        showEventMessage('Failed to schedule event: ' + error.message, true);
    }
});

const eventsRef = ref(db, 'events');
const activeEventsQuery = query(eventsRef, orderByChild('date'));

onValue(activeEventsQuery, (snapshot) => {
    activeEventTableBody.innerHTML = '';
    
    let activeEvents = [];
    snapshot.forEach(childSnapshot => {
        const event = childSnapshot.val();
        if (event.status !== 'completed' && event.status !== 'cancelled') {
            activeEvents.push({ key: childSnapshot.key, ...event });
        }
    });

    activeEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    activeEvents.forEach(event => {
        const eventId = event.key;
        const date = new Date(event.date).toLocaleDateString('id-ID');
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

    if (activeEvents.length === 0) {
        activeEventTableBody.innerHTML = '<tr><td colspan="5">No active or upcoming events found.</td></tr>';
    }
});

async function handleUpdateStatus(e) {
    const eventId = e.target.dataset.id;
    const newStatus = e.target.dataset.status;

    if (confirm(`Are you sure you want to change the status of this event to ${newStatus.toUpperCase()}?`)) {
        try {
            await update(ref(db, `events/${eventId}`), {
                status: newStatus
            });
            showEventMessage(`Event status updated to ${newStatus}.`, false);
        } catch (error) {
            console.error("Error updating event status:", error);
            showEventMessage('Failed to update event status.', true);
        }
    }
}
