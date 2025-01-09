async function handleLogin() {
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('message');
    // console.log(username, password);
    // Validate password is a number
    if (isNaN(password)) {
        alert('Password must be a number');
        return;
    }
    const response = await fetch('/verifyuser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username : username, password : password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = data.redirect;
            message.innerHTML = "";
        } else {
            // alert(data.message);
            message.innerHTML = "Invalid username or password";
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    });
}

// document.getElementById('loginForm').addEventListener('submit', handleLogin);