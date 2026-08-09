// ======================================================
// APPOINTMENTS - loaded from MongoDB via /api/appointments
// ======================================================

let appointments = [];
let rescheduleId = null;

const tableBody = document.getElementById('appointmentTable');
const totalBox = document.getElementById('totalAppointments');
const noAppointments = document.getElementById('noAppointments');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const dateFilter = document.getElementById('dateFilter');


// ======================================================
// HELPERS
// ======================================================

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatDate(value) {

    if (!value) {
        return '';
    }

    const parts = value.split('-');
    const date = new Date(parts[0], Number(parts[1]) - 1, parts[2]);

    if (isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(value) {

    if (!value) {
        return '';
    }

    const parts = value.split(':');
    let hour = Number(parts[0]);
    const minute = parts[1];
    const suffix = hour >= 12 ? 'PM' : 'AM';

    hour = hour % 12;

    if (hour === 0) {
        hour = 12;
    }

    return hour + ':' + minute + ' ' + suffix;
}

function showMessage(title, text, isError) {

    document.getElementById('messageIcon').textContent = isError ? '!' : '✓';
    document.getElementById('messageTitle').textContent = title;
    document.getElementById('messageText').textContent = text;
    document.getElementById('messageModal').classList.add('show');
    document.getElementById('messageModal').style.display = 'flex';
}

function closeMessage() {
    document.getElementById('messageModal').classList.remove('show');
    document.getElementById('messageModal').style.display = 'none';
}


// ======================================================
// LOAD FROM DATABASE
// ======================================================

async function loadAppointments() {

    try {

        const response = await fetch('/api/appointments');
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to load appointments');
        }

        appointments = data.appointments;

        renderAppointments();

    } catch (error) {

        console.error('Load appointments error:', error);

        tableBody.innerHTML = '';
        noAppointments.textContent = 'Could not load appointments from the server.';
        noAppointments.style.display = 'block';
    }
}


// ======================================================
// RENDER
// ======================================================

function getFiltered() {

    const search = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    const date = dateFilter.value;

    return appointments.filter(function (item) {

        if (search && item.client.toLowerCase().indexOf(search) === -1) {
            return false;
        }

        if (status !== 'all' && item.status !== status) {
            return false;
        }

        if (date && item.date !== date) {
            return false;
        }

        return true;
    });
}

function renderAppointments() {

    const rows = getFiltered();

    totalBox.textContent = rows.length;

    if (rows.length === 0) {
        tableBody.innerHTML = '';
        noAppointments.textContent = 'No appointments found.';
        noAppointments.style.display = 'block';
        return;
    }

    noAppointments.style.display = 'none';

    tableBody.innerHTML = rows.map(function (item) {

        const statusClass = item.status.toLowerCase();

        let actions = '';

        if (item.status === 'Pending') {
            actions += '<button class="confirm-btn" onclick="confirmAppointment(this)">Confirm</button>';
        }

        if (item.status !== 'Cancelled') {
            actions += '<button class="reschedule-btn" onclick="openReschedule(this)">Reschedule</button>';
            actions += '<button class="cancel-btn" onclick="cancelAppointment(this)">Cancel</button>';
        }

        return '' +
            '<tr data-id="' + item._id + '"' +
            ' data-client="' + escapeHtml(item.client) + '"' +
            ' data-artist="' + escapeHtml(item.artist) + '"' +
            ' data-date="' + escapeHtml(item.date) + '"' +
            ' data-time="' + escapeHtml(item.time) + '"' +
            ' data-status="' + escapeHtml(item.status) + '">' +
                '<td><strong>' + escapeHtml(item.client) + '</strong></td>' +
                '<td>' + escapeHtml(item.contact) + '</td>' +
                '<td>' + escapeHtml(item.artist) + '</td>' +
                '<td>' + formatDate(item.date) + '</td>' +
                '<td>' + formatTime(item.time) + '</td>' +
                '<td>' + escapeHtml(item.service) + '</td>' +
                '<td><span class="status ' + statusClass + '">' + escapeHtml(item.status) + '</span></td>' +
                '<td class="actions">' + actions + '</td>' +
            '</tr>';

    }).join('');
}


// ======================================================
// ACTIONS
// ======================================================

function rowId(button) {
    return button.closest('tr').dataset.id;
}

async function updateStatus(id, status) {

    const response = await fetch('/api/appointments/' + id + '/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Update failed');
    }

    return data.appointment;
}

async function confirmAppointment(button) {

    try {
        await updateStatus(rowId(button), 'Confirmed');
        await loadAppointments();
        showMessage('Appointment Confirmed', 'The appointment has been confirmed.', false);
    } catch (error) {
        showMessage('Update Failed', error.message, true);
    }
}

async function cancelAppointment(button) {

    if (!confirm('Cancel this appointment?')) {
        return;
    }

    try {
        await updateStatus(rowId(button), 'Cancelled');
        await loadAppointments();
        showMessage('Appointment Cancelled', 'The appointment has been cancelled.', false);
    } catch (error) {
        showMessage('Update Failed', error.message, true);
    }
}


// ======================================================
// RESCHEDULE MODAL
// ======================================================

function openReschedule(button) {

    const row = button.closest('tr');

    rescheduleId = row.dataset.id;

    document.getElementById('modalClient').textContent = row.dataset.client;
    document.getElementById('modalArtist').textContent = row.dataset.artist;
    document.getElementById('newDate').value = row.dataset.date;
    document.getElementById('newTime').value = row.dataset.time;
    document.getElementById('conflictMessage').textContent = '';

    const modal = document.getElementById('rescheduleModal');
    modal.classList.add('show');
    modal.style.display = 'flex';
}

function closeReschedule() {

    rescheduleId = null;

    const modal = document.getElementById('rescheduleModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
}

document.getElementById('rescheduleForm').addEventListener('submit', async function (e) {

    e.preventDefault();

    const conflictMessage = document.getElementById('conflictMessage');
    conflictMessage.textContent = '';

    try {

        const response = await fetch('/api/clientappointment/' + rescheduleId + '/reschedule', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: document.getElementById('newDate').value,
                time: document.getElementById('newTime').value
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            conflictMessage.textContent = data.message || 'Reschedule failed.';
            return;
        }

        closeReschedule();
        await loadAppointments();
        showMessage('Appointment Updated', 'The appointment has been rescheduled.', false);

    } catch (error) {
        conflictMessage.textContent = 'Something went wrong. Please try again.';
    }
});


// ======================================================
// FILTERS + INITIAL LOAD
// ======================================================

searchInput.addEventListener('input', renderAppointments);
statusFilter.addEventListener('change', renderAppointments);
dateFilter.addEventListener('change', renderAppointments);

loadAppointments();
