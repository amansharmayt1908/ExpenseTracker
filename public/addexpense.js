async function addExpense() {
    const date = new Date();
    const reason = document.getElementById('reason').value;
    const amount = document.getElementById('amount').value;
    
    // console.log(amount);
    // if (isNaN(amount)) {
    //     alert('Amount must be a number');
    //     return;
    // }
    const response = await fetch('/addExpense', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date : date, reason : reason, amount : amount })
    })
    .then(response => response.json())
    .then(data => {
        // console.log(data);
    })
    .catch(error => {
        console.error('Error adding expense:', error);
    });
}   