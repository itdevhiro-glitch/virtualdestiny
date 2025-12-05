// assets/js/finance.js
// Created by Hiro

import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

const financeForm = document.getElementById('finance-form');
const transactionTableBody = document.getElementById('transaction-table-body');
const financeMessage = document.getElementById('finance-message');
const currentBalanceEl = document.getElementById('current-balance');
const totalIncomeYTDEl = document.getElementById('total-income-ytd');
const totalExpenseYTDEl = document.getElementById('total-expense-ytd');

const formatCurrency = (amount) => {
    return 'IDR ' + new Intl.NumberFormat('id-ID').format(amount);
};

const showFinanceMessage = (msg, isError = false) => {
    financeMessage.textContent = msg;
    financeMessage.className = isError ? 'message error' : 'message success';
};

financeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const description = document.getElementById('trans-description').value;
    const amount = parseInt(document.getElementById('trans-amount').value);
    const type = document.getElementById('trans-type').value;
    const notes = document.getElementById('trans-notes').value;
    const moderatorEmail = auth.currentUser.email;

    if (!description || !amount || !type) {
        showFinanceMessage('All fields (except notes) must be filled.', true);
        return;
    }

    try {
        await addDoc(collection(db, "finance"), {
            description,
            amount,
            type,
            notes,
            date: serverTimestamp(),
            moderator: moderatorEmail
        });
        showFinanceMessage('Transaction recorded successfully!', false);
        financeForm.reset();
    } catch (error) {
        console.error("Error adding document: ", error);
        showFinanceMessage('Failed to record transaction: ' + error.message, true);
    }
});

const financeQuery = query(collection(db, "finance"), orderBy("date", "desc"));

onSnapshot(financeQuery, (snapshot) => {
    let currentBalance = 0;
    let totalIncomeYTD = 0;
    let totalExpenseYTD = 0;
    const currentYear = new Date().getFullYear();
    transactionTableBody.innerHTML = '';
    
    snapshot.docs.forEach(docSnap => {
        const item = docSnap.data();
        const date = item.date?.toDate().toLocaleDateString('id-ID') || 'N/A';
        const amountDisplay = item.type === 'income' 
            ? `<span class="income-tag">+${formatCurrency(item.amount)}</span>`
            : `<span class="expense-tag">-${formatCurrency(item.amount)}</span>`;

        if (item.type === 'income') {
            currentBalance += item.amount;
        } else {
            currentBalance -= item.amount;
        }

        if (item.date && item.date.toDate().getFullYear() === currentYear) {
            if (item.type === 'income') {
                totalIncomeYTD += item.amount;
            } else {
                totalExpenseYTD += item.amount;
            }
        }

        transactionTableBody.innerHTML += `
            <tr>
                <td>${date}</td>
                <td>${item.description}</td>
                <td>${item.type}</td>
                <td>${amountDisplay}</td>
                <td>${item.moderator}</td>
            </tr>
        `;
    });

    currentBalanceEl.textContent = formatCurrency(currentBalance);
    totalIncomeYTDEl.textContent = formatCurrency(totalIncomeYTD);
    totalExpenseYTDEl.textContent = formatCurrency(totalExpenseYTD);

    if (snapshot.empty) {
        transactionTableBody.innerHTML = '<tr><td colspan="5">No transactions recorded yet.</td></tr>';
    }
});