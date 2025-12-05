// assets/js/dashboard.js
// Created by Hiro

import { db, auth } from './firebase-config.js';
import { ref, onValue, query, orderByChild, limitToLast } from "firebase/database";

const totalBalanceEl = document.getElementById('total-balance');
const monthlyIncomeEl = document.getElementById('monthly-income');
const monthlyExpenseEl = document.getElementById('monthly-expense');
const recentFinanceList = document.getElementById('recent-finance-list');
const nextEventNameEl = document.getElementById('next-event-name');
const nextEventDateEl = document.getElementById('next-event-date');
const nextEventBudgetEl = document.getElementById('next-event-budget');

const formatCurrency = (amount) => {
    return 'IDR ' + new Intl.NumberFormat('id-ID').format(amount);
};

const financeRef = ref(db, 'finance');
const financeQuery = query(financeRef, limitToLast(5));

onValue(financeRef, (snapshot) => {
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let transactions = [];
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

    snapshot.forEach(childSnapshot => {
        transactions.push(childSnapshot.val());
    });
    
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    recentFinanceList.innerHTML = '';
    transactions.slice(0, 5).forEach(item => {
        const amountDisplay = item.type === 'income' 
            ? `<span class="income-tag">+${formatCurrency(item.amount)}</span>`
            : `<span class="expense-tag">-${formatCurrency(item.amount)}</span>`;

        recentFinanceList.innerHTML += `
            <li class="finance-item">
                <span>${item.description} (${item.type})</span>
                <span>${amountDisplay}</span>
            </li>
        `;
    });

    transactions.forEach(item => {
        const itemDate = new Date(item.date).getTime();
        if (itemDate >= startOfMonth) {
            if (item.type === 'income') {
                monthlyIncome += item.amount;
            } else {
                monthlyExpense += item.amount;
            }
        }
    });

    totalBalanceEl.textContent = "Please check finance.html"; 
    monthlyIncomeEl.textContent = formatCurrency(monthlyIncome);
    monthlyExpenseEl.textContent = formatCurrency(monthlyExpense);
});

const eventsRef = ref(db, 'events');
const nextEventQuery = query(eventsRef, orderByChild('date'));

onValue(nextEventQuery, (snapshot) => {
    let nextEvent = null;
    const now = new Date().getTime();

    snapshot.forEach(childSnapshot => {
        const event = childSnapshot.val();
        if (event.status === 'scheduled' && new Date(event.date).getTime() >= now) {
            if (!nextEvent || new Date(event.date).getTime() < new Date(nextEvent.date).getTime()) {
                nextEvent = event;
            }
        }
    });

    if (!nextEvent) {
        nextEventNameEl.textContent = "No Upcoming Events Scheduled.";
        nextEventDateEl.textContent = "Date: TBD";
        nextEventBudgetEl.textContent = "Budget Used: N/A";
        return;
    }
    
    const nextEventDate = new Date(nextEvent.date).toLocaleDateString('id-ID');
    
    nextEventNameEl.textContent = nextEvent.name;
    nextEventDateEl.textContent = `Date: ${nextEventDate}`;
    nextEventBudgetEl.textContent = `Budget Used: ${formatCurrency(nextEvent.currentExpense || 0)}`;
});
