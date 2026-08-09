document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Login failed. Please check your credentials.');
            return;
        }

        // Redirect to the destination the server decided from the role in the DB
        window.location.href = data.redirectUrl || '/clientdashboard';

    } catch (err) {
        console.error('Login error:', err);
        alert('Something went wrong. Please try again.');
    }
});
