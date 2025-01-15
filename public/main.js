document.addEventListener('DOMContentLoaded', () => {
    const display = document.querySelector('.calc-display');
    const firstNumberDisplay = document.querySelector('.first-number');
    const secondNumberDisplay = document.querySelector('.second-number');
    const operatorDisplay = document.querySelector('.operator-display');
    const keys = document.querySelectorAll('.key');
    const addExpenseBtn = document.querySelector('.add-expense-btn');
    const showAllBtn = document.querySelector('.show-all-btn');
    const recentExpenses = document.querySelector('.recent-expenses');
    const expenseReason = document.querySelector('.expense-reason');
    // const finalAmount = document.getElementById('finalamount');

    let currentOperation = '';
    let firstNumber = null;
    let operator = null;
    let shouldResetDisplay = false;
    let isSubmitting = false; // Flag to prevent duplicate submissions

    // Load expenses when page loads
    fetchAndDisplayExpenses();

    // Prevent keyboard from showing up on mobile for calculator display
    display.addEventListener('focus', (e) => {
        e.preventDefault();
        display.blur();
    });

    display.addEventListener('click', (e) => {
        e.preventDefault();
        display.blur();
    });

    // Handle expense reason input submission
    expenseReason.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && display.value !== '0' && display.value !== 'Error' && !isSubmitting) {
            e.preventDefault();
            submitExpense();
        }
    });

    // Add expense button functionality - single event listener
    let lastClickTime = 0;
    addExpenseBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Prevent rapid double clicks
        const currentTime = new Date().getTime();
        if (currentTime - lastClickTime < 1000) { // 1 second cooldown
            return;
        }
        lastClickTime = currentTime;

        if (!isSubmitting) {
            // If there's a pending operation, calculate it first
            if (operator && !shouldResetDisplay) {
                calculateResult();
                display.value = firstNumber;
            }
            
            // Remove the onclick handler from HTML to prevent double submission
            addExpenseBtn.removeAttribute('onclick');
            
            await submitExpense();
            
            // Re-add onclick handler after submission
            addExpenseBtn.setAttribute('onclick', 'void(0)');
        }
    });

    // Show all expenses functionality
    showAllBtn.addEventListener('click', () => {
        
        if (showAllBtn.textContent === 'Show All') {
            // showAllBtn.textContent = 'Show Recent';
            recentExpenses.style.maxHeight = '100%';
        } else {
            showAllBtn.textContent = 'Show All';
            recentExpenses.style.maxHeight = '';
        }
    });

    async function submitExpense() {
        const amount = display.value;
        const reason = expenseReason.value.trim();
        if (!reason) {
            alert('Please enter a reason for the expense');
            return;
        }

        if (isSubmitting) return; // Prevent duplicate submissions
        isSubmitting = true;

        // Disable the add expense button and input while submitting
        addExpenseBtn.disabled = true;
        expenseReason.disabled = true;

        try {
            const response = await fetch('/addExpense', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: new Date(),
                    reason: reason,
                    amount: amount
                })
            });

            if (response.ok) {
                // Clear inputs
                display.value = '0';
                expenseReason.value = '';
                
                // Fetch and display updated expenses
                await fetchAndDisplayExpenses();
            } else {
                alert('Failed to add expense');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to add expense');
        } finally {
            // Re-enable inputs
            addExpenseBtn.disabled = false;
            expenseReason.disabled = false;
            isSubmitting = false;
        }
    }

    async function fetchAndDisplayExpenses() {
        try {
            const response = await fetch('/getAllExpenses');
            const expenses = await response.json();
            
            // Clear existing expenses
            recentExpenses.innerHTML = '';

            // Add each expense to the list
            expenses.forEach(expense => {
                const date = new Date(expense.date).toLocaleDateString();
                const expenseElement = document.createElement('div');
                expenseElement.className = 'expense-item';
                expenseElement.innerHTML = `
                    <span class="expense-date">${date}</span>
                    <span class="expense-reason">${expense.reason}</span>
                    <span class="expense-amount">₹${expense.amount}</span>
                    <span class="delete-expense" title="Delete expense">×</span>
                `;

                // Add delete functionality
                let isDeleting = true;
                const deleteBtn = expenseElement.querySelector('.delete-expense');
                deleteBtn.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to delete this expense?')) {
                        try {
                            const response = await fetch(`/deleteExpense/${expense._id}`, {
                                method: 'DELETE'
                            });
                            
                            if (response.ok) {
                                expenseElement.remove();
                            } else {
                                alert('Failed to delete expense');
                            }
                        } catch (error) {
                            console.error('Error:', error);
                            alert('Failed to delete expense');
                        }
                    }
                });

                recentExpenses.appendChild(expenseElement);
            });
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
    }

    // Calculator functionality
    keys.forEach(key => {
        key.addEventListener('click', () => {
            const keyValue = key.textContent;

            if (key.classList.contains('clear')) {
                clearCalculator();
            } else if (key.classList.contains('operator')) {
                handleOperator(keyValue, key);
            } else if (key.classList.contains('equal')) {
                calculateResult();
                // Update the display with the result
                display.value = firstNumber;
            } else {
                handleNumber(keyValue);
            }
        });
    });

    function clearCalculator() {
        display.value = '0';
        firstNumber = null;
        operator = null;
        shouldResetDisplay = false;
        firstNumberDisplay.textContent = '';
        secondNumberDisplay.textContent = '';
        operatorDisplay.textContent = '';
        document.querySelectorAll('.operator').forEach(op => {
            op.classList.remove('active');
        });
    }

    function handleNumber(num) {
        if (shouldResetDisplay) {
            display.value = '';
            shouldResetDisplay = false;
        }

        if (display.value === '0' && num !== '.') {
            display.value = num;
        } else {
            display.value += num;
        }

        if (operator) {
            secondNumberDisplay.textContent = display.value;
        }
    }

    function handleOperator(op, key) {
        document.querySelectorAll('.operator').forEach(op => {
            op.classList.remove('active');
        });

        if (operator && !shouldResetDisplay) {
            calculateResult();
            // Update the display with the result
            display.value = firstNumber;
        }

        firstNumber = parseFloat(display.value);
        operator = op;
        shouldResetDisplay = true;
        
        firstNumberDisplay.textContent = display.value;
        operatorDisplay.textContent = op;
        secondNumberDisplay.textContent = '';
        
        key.classList.add('active');
    }

    function calculateResult() {
        if (operator === null || shouldResetDisplay) {
            return;
        }

        const secondNumber = parseFloat(display.value);
        let result;

        switch (operator) {
            case '+':
                result = firstNumber + secondNumber;
                break;
            case '-':
                result = firstNumber - secondNumber;
                break;
            case '×':
                result = firstNumber * secondNumber;
                break;
            case '÷':
                if (secondNumber === 0) {
                    display.value = 'Error';
                    firstNumber = null;
                    operator = null;
                    shouldResetDisplay = true;
                    firstNumberDisplay.textContent = '';
                    secondNumberDisplay.textContent = '';
                    operatorDisplay.textContent = '';
                    return;
                }
                result = firstNumber / secondNumber;
                break;
        }

        result = Math.round(result * 1000) / 1000;
        firstNumber = result;
        operator = null;
        shouldResetDisplay = true;

        // Clear the history display
        firstNumberDisplay.textContent = '';
        secondNumberDisplay.textContent = '';
        operatorDisplay.textContent = '';

        document.querySelectorAll('.operator').forEach(op => {
            op.classList.remove('active');
        });
    }
}); 
