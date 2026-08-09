let selectedRow = null;

function openReschedule(button) {

    selectedRow = button.closest("tr");

    const client = selectedRow.dataset.client;
    const artist = selectedRow.dataset.artist;
    const date = selectedRow.dataset.date;
    const time = selectedRow.dataset.time;

    document.getElementById("modalClient").textContent = client;
    document.getElementById("modalArtist").textContent = artist;

    document.getElementById("newDate").value = date;
    document.getElementById("newTime").value = time;

    document.getElementById("conflictMessage").style.display = "none";

    document.getElementById("rescheduleModal").style.display = "flex";
}

function closeReschedule() {

    document.getElementById("rescheduleModal").style.display = "none";

    selectedRow = null;
}

function checkConflict() {

    if (!selectedRow) {
        return false;
    }

    const newDate =
        document.getElementById("newDate").value;

    const newTime =
        document.getElementById("newTime").value;

    const artist =
        selectedRow.dataset.artist;

    const rows =
        document.querySelectorAll("#appointmentTable tr");

    for (let row of rows) {

        if (row === selectedRow) {
            continue;
        }

        if (row.style.display === "none") {
            continue;
        }

        const rowStatus =
            row.dataset.status;

        if (rowStatus === "Cancelled") {
            continue;
        }

        const rowArtist =
            row.dataset.artist;

        const rowDate =
            row.dataset.date;

        const rowTime =
            row.dataset.time;

        if (
            rowArtist === artist &&
            rowDate === newDate &&
            rowTime === newTime
        ) {

            return true;
        }
    }

    return false;
}

document
    .getElementById("rescheduleForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        if (!selectedRow) {
            return;
        }

        const conflictMessage =
            document.getElementById("conflictMessage");

        const conflict = checkConflict();

        if (conflict) {

            conflictMessage.textContent =
                "Schedule Conflict: " +
                selectedRow.dataset.artist +
                " already has an appointment at the selected date and time.";

            conflictMessage.style.display = "block";

            return;
        }

        const newDate =
            document.getElementById("newDate").value;

        const newTime =
            document.getElementById("newTime").value;

        selectedRow.dataset.date = newDate;
        selectedRow.dataset.time = newTime;
        selectedRow.dataset.status = "Rescheduled";

        const dateCell =
            selectedRow.cells[3];

        const timeCell =
            selectedRow.cells[4];

        dateCell.textContent =
            formatDate(newDate);

        timeCell.textContent =
            formatTime(newTime);

        const statusCell =
            selectedRow.cells[6];

        statusCell.innerHTML =
            '<span class="status rescheduled">Rescheduled</span>';

        closeReschedule();

        showMessage(
            "Appointment Rescheduled",
            "The client's appointment has been successfully rescheduled."
        );
    });

function confirmAppointment(button) {

    const row = button.closest("tr");

    row.dataset.status = "Confirmed";

    row.cells[6].innerHTML =
        '<span class="status confirmed">Confirmed</span>';

    button.remove();

    showMessage(
        "Appointment Confirmed",
        "The client's appointment has been confirmed successfully."
    );
}

function cancelAppointment(button) {

    const row = button.closest("tr");

    const client =
        row.dataset.client;

    const confirmation =
        confirm(
            "Are you sure you want to cancel " +
            client +
            "'s appointment?"
        );

    if (!confirmation) {
        return;
    }

    row.dataset.status = "Cancelled";

    row.cells[6].innerHTML =
        '<span class="status cancelled">Cancelled</span>';

    row.querySelectorAll(".actions button")
        .forEach(button => {
            button.remove();
        });

    showMessage(
        "Appointment Cancelled",
        "The client's appointment has been cancelled."
    );
}

function searchAppointments() {

    const search =
        document
            .getElementById("searchInput")
            .value
            .toLowerCase();

    const rows =
        document.querySelectorAll("#appointmentTable tr");

    let visible = 0;

    rows.forEach(row => {

        const client =
            row.dataset.client.toLowerCase();

        const contact =
            row.cells[1].textContent.toLowerCase();

        if (
            client.includes(search) ||
            contact.includes(search)
        ) {

            row.style.display = "";
            visible++;

        } else {

            row.style.display = "none";
        }
    });

    updateNoAppointments(visible);
}

function filterAppointments() {

    const status =
        document.getElementById("statusFilter").value;

    const date =
        document.getElementById("dateFilter").value;

    const rows =
        document.querySelectorAll("#appointmentTable tr");

    let visible = 0;

    rows.forEach(row => {

        const rowStatus =
            row.dataset.status;

        const rowDate =
            row.dataset.date;

        const statusMatch =
            status === "all" ||
            rowStatus === status;

        const dateMatch =
            date === "" ||
            rowDate === date;

        if (statusMatch && dateMatch) {

            row.style.display = "";
            visible++;

        } else {

            row.style.display = "none";
        }
    });

    updateNoAppointments(visible);
}

function updateNoAppointments(count) {

    const noAppointments =
        document.getElementById("noAppointments");

    if (count === 0) {
        noAppointments.style.display = "block";
    } else {
        noAppointments.style.display = "none";
    }
}

function formatDate(date) {

    const parts =
        date.split("-");

    const year =
        parts[0];

    const month =
        parseInt(parts[1]);

    const day =
        parseInt(parts[2]);

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    return (
        monthNames[month - 1] +
        " " +
        day +
        ", " +
        year
    );
}

function formatTime(time) {

    const parts =
        time.split(":");

    let hour =
        parseInt(parts[0]);

    const minute =
        parts[1];

    const period =
        hour >= 12 ? "PM" : "AM";

    if (hour === 0) {
        hour = 12;
    } else if (hour > 12) {
        hour -= 12;
    }

    return hour + ":" + minute + " " + period;
}

function showMessage(title, text) {

    document.getElementById("messageTitle")
        .textContent = title;

    document.getElementById("messageText")
        .textContent = text;

    document.getElementById("messageModal")
        .style.display = "flex";
}

function closeMessage() {

    document.getElementById("messageModal")
        .style.display = "none";
}

document
    .getElementById("searchInput")
    .addEventListener(
        "keyup",
        searchAppointments
    );

document
    .getElementById("statusFilter")
    .addEventListener(
        "change",
        filterAppointments
    );

document
    .getElementById("dateFilter")
    .addEventListener(
        "change",
        filterAppointments
    );

window.addEventListener("click", function(event) {

    const rescheduleModal =
        document.getElementById("rescheduleModal");

    const messageModal =
        document.getElementById("messageModal");

    if (event.target === rescheduleModal) {
        closeReschedule();
    }

    if (event.target === messageModal) {
        closeMessage();
    }
});

