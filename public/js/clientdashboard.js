// clientdashboard.js

document.addEventListener('DOMContentLoaded', function() {
    
    // ==================================================
    // GET USER INFORMATION FROM COOKIES
    // ==================================================
    
    function getCookie(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length === 2) {
            return parts.pop().split(";").shift();
        }
        return null;
    }
    
    var username = getCookie("username");
    var userId = getCookie("userId");
    var role = getCookie("role");
    
    // Display username in welcome message
    var welcomeElement = document.getElementById("usernameDisplay");
    if (welcomeElement && username) {
        welcomeElement.textContent = username;
    }
    
    // ==================================================
    // FETCH USER APPOINTMENTS FROM MONGODB
    // ==================================================
    
    function fetchAppointments() {
        var appointmentsTable = document.getElementById("appointmentsBody");
        
        if (!appointmentsTable) {
            return;
        }
        
        // Show loading state
        appointmentsTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading appointments...</td></tr>';
        
        fetch('/api/appointments', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            return response.json();
        })
        .then(function(data) {
            if (data && data.success) {
                displayAppointments(data.appointments);
            } else if (data && data.message) {
                appointmentsTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">' + data.message + '</td></tr>';
            }
        })
        .catch(function(error) {
            console.error('Error fetching appointments:', error);
            appointmentsTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error loading appointments. Please try again.</td></tr>';
        });
    }
    
    // ==================================================
    // DISPLAY APPOINTMENTS IN TABLE
    // ==================================================
    
    function displayAppointments(appointments) {
        var appointmentsTable = document.getElementById("appointmentsBody");
        
        if (!appointmentsTable) {
            return;
        }
        
        if (!appointments || appointments.length === 0) {
            appointmentsTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">No appointments found.</td></tr>';
            return;
        }
        
        var html = '';
        
        appointments.forEach(function(appointment) {
            var statusClass = '';
            var statusText = appointment.status || 'Pending';
            
            // Add status class for styling
            if (statusText.toLowerCase() === 'pending') {
                statusClass = 'status-pending';
            } else if (statusText.toLowerCase() === 'approved') {
                statusClass = 'status-approved';
            } else if (statusText.toLowerCase() === 'completed') {
                statusClass = 'status-completed';
            } else if (statusText.toLowerCase() === 'cancelled') {
                statusClass = 'status-cancelled';
            }
            
            // Format date
            var appointmentDate = appointment.date ? new Date(appointment.date) : new Date();
            var formattedDate = appointmentDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Format time
            var formattedTime = appointment.time || 'N/A';
            
            html += '<tr>';
            html += '<td>' + (appointment.artist || 'N/A') + '</td>';
            html += '<td>' + formattedDate + '</td>';
            html += '<td>' + formattedTime + '</td>';
            html += '<td>' + (appointment.tattooType || 'N/A') + '</td>';
            html += '<td class="' + statusClass + '">' + statusText + '</td>';
            html += '</tr>';
        });
        
        appointmentsTable.innerHTML = html;
    }
    
    // ==================================================
    // BOOK APPOINTMENT
    // ==================================================
    
    var appointmentForm = document.getElementById("appointmentForm");
    
    if (appointmentForm) {
        appointmentForm.addEventListener("submit", function(event) {
            event.preventDefault();
            
            var clientName = document.getElementById("clientName").value;
            var phone = document.getElementById("phone").value;
            var artist = document.getElementById("artist").value;
            var date = document.getElementById("date").value;
            var time = document.getElementById("time").value;
            var tattooType = document.getElementById("tattooType").value;
            var description = document.getElementById("description").value;
            
            // Client-side validation
            if (!clientName || !phone || !artist || !date || !time || !tattooType) {
                alert("Please complete all required fields.");
                return;
            }
            
            var appointmentData = {
                clientName: clientName,
                phone: phone,
                artist: artist,
                date: date,
                time: time,
                tattooType: tattooType,
                description: description,
                username: username,
                userId: userId,
                status: "Pending"
            };
            
            fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.success) {
                    alert("Appointment booked successfully!");
                    closeAppointmentModal();
                    fetchAppointments(); // Refresh appointments
                } else {
                    alert(data.message || "Failed to book appointment.");
                }
            })
            .catch(function(error) {
                console.error('Error:', error);
                alert("An error occurred. Please try again.");
            });
        });
    }
    
    // ==================================================
    // CANCEL APPOINTMENT
    // ==================================================
    
    function cancelAppointment(appointmentId) {
        if (!confirm("Are you sure you want to cancel this appointment?")) {
            return;
        }
        
        fetch('/api/appointments/' + appointmentId, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.success) {
                alert("Appointment cancelled successfully.");
                fetchAppointments(); // Refresh appointments
            } else {
                alert(data.message || "Failed to cancel appointment.");
            }
        })
        .catch(function(error) {
            console.error('Error:', error);
            alert("An error occurred. Please try again.");
        });
    }
    
    // ==================================================
    // MODAL FUNCTIONS
    // ==================================================
    
    function openAppointmentModal() {
        var modal = document.getElementById("appointmentModal");
        if (modal) {
            modal.style.display = "flex";
            // Pre-fill client name
            var clientNameInput = document.getElementById("clientName");
            if (clientNameInput && username) {
                clientNameInput.value = username;
            }
        }
    }
    
    function closeAppointmentModal() {
        var modal = document.getElementById("appointmentModal");
        if (modal) {
            modal.style.display = "none";
            // Reset form
            var form = document.getElementById("appointmentForm");
            if (form) {
                form.reset();
            }
        }
    }
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        var modal = document.getElementById("appointmentModal");
        if (event.target === modal) {
            closeAppointmentModal();
        }
    };
    
    // Make functions globally accessible
    window.openAppointmentModal = openAppointmentModal;
    window.closeAppointmentModal = closeAppointmentModal;
    window.cancelAppointment = cancelAppointment;
    
    // ==================================================
    // LOGOUT FUNCTION
    // ==================================================
    
    function logout() {
        if (confirm("Are you sure you want to logout?")) {
            window.location.href = "/logout";
        }
    }
    
    window.logout = logout;
    
    // ==================================================
    // INITIALIZE - FETCH APPOINTMENTS ON LOAD
    // ==================================================
    
    fetchAppointments();
});