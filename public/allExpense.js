document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/getAllExpenses');
        if (!response.ok) {
            throw new Error('Failed to fetch expenses');
        }
        
        const expenses = await response.json();
        const expenseList = document.getElementById('expenseList');
        
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            const date = new Date(expense.date).toLocaleDateString();
            const expenseElement = document.createElement('div');
            row.innerHTML = `
                <td>${date}</td>
                <td>${expense.reason}</td>
                <td>₹${expense.amount}</td>
                <span class="delete-expense" title="Delete expense">×</span>
            `;
            
            
            const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0).toFixed(2);
            document.getElementById('totalAmount').textContent = totalAmount;
            
            expenseList.appendChild(row);
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load expenses. Please try again later.');
    }
        // Calculate total expense
        
        // Update total amount display
    });
