// register.js with async/await

document.addEventListener('DOMContentLoaded', function() {
    
    var registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            var username = document.getElementById('username').value;
            var password = document.getElementById('password').value;
            
            // Basic validation
            if (!username || !password) {
                alert('Please complete all registration fields.');
                return;
            }
            
            if (username.length < 3) {
                alert('Username must be at least 3 characters.');
                return;
            }
            
            if (password.length < 6) {
                alert('Password must be at least 6 characters.');
                return;
            }
            
            try {
                var response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });
                
                var data = await response.json();
                
                if (data.success) {
                    alert('Registration successful! Please login.');
                    window.location.href = data.redirectUrl || '/login';
                } else {
                    alert(data.message || 'Registration failed. Please try again.');
                }
                
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during registration. Please try again.');
            }
        });
    }
});