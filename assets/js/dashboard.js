// assets/js/dashboard.js
// Created by Hiro

import { db } from './firebase-config.js';
import { collection, query, limit, orderBy, onSnapshot, where } from "firebase/firestore";

const totalBalanceEl = document.getElementById('total-balance');
const monthlyIncomeEl = document.getElementById('monthly-income');
const monthlyExpenseEl = document.getElementById('monthly-expense');
const recentFinanceList = document.getElementById('recent-finance-list');

const formatCurrency = (amount) => {
    return 'IDR ' + new Intl.NumberFormat('id-ID').format(amount);
};

const financeQuery = query(collection(db, "finance"), orderBy("date", "desc"), limit(5));

onSnapshot(financeQuery, (snapshot) => {
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    recentFinanceList.innerHTML = '';
    
    snapshot.docs.forEach(docSnap => {
        const item = docSnap.data();
        const itemDate = item.date.toDate();
        const amountDisplay = item.type === 'income' 
            ? `<span class="income-tag">+${formatCurrency(item.amount)}</span>`
            : `<span class="expense-tag">-${formatCurrency(item.amount)}</span>`;

        recentFinanceList.innerHTML += `
            <li class="finance-item">
                <span>${item.description} (${item.type})</span>
                <span>${amountDisplay}</span>
            </li>
        `;
        
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

const nextEventQuery = query(collection(db, "events"), 
    where("status", "==", "scheduled"), 
    orderBy("date"), 
    limit(1)
);

onSnapshot(nextEventQuery, (snapshot) => {
    const eventNameEl = document.getElementById('next-event-name');
    const eventDateEl = document.getElementById('next-event-date');
    const eventBudgetEl = document.getElementById('next-event-budget');

    if (snapshot.empty) {
        eventNameEl.textContent = "No Upcoming Events Scheduled.";
        eventDateEl.textContent = "Date: TBD";
        eventBudgetEl.textContent = "Budget Used: N/A";
        return;
    }
    
    const nextEvent = snapshot.docs[0].data();
    
    eventNameEl.textContent = nextEvent.name;
    eventDateEl.textContent = `Date: ${nextEvent.date.toDate().toLocaleDateString('id-ID')}`;
    eventBudgetEl.textContent = `Budget Used: ${formatCurrency(nextEvent.currentExpense || 0)}`;
});

console.log("Dashboard monitoring started.");