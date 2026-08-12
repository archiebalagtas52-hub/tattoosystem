// public/js/clientdashboard.js
//
// Client page - booking + sariling appointments galing MongoDB.
//
// Reference Photo:
//   - Kapag pumili ang client ng design sa /photos, dadalhin siya sa
//     /clientdashboard?design=<title>&image=/uploads/photos/xxx.jpg
//   - KUSA nitong ginagawa ang preview sa tabi ng file input, kahit
//     hindi mo binago ang clientdashboard.ejs.
//
// Endpoints:
//     GET  /api/appointments        -> sariling appointments
//     POST /api/appointments        -> booking (multipart + referenceUrl)

document.addEventListener('DOMContentLoaded', function () {

    var REFRESH_MS = 15000;

    var ARTISTS = ['Totats'];

    var tableBody = document.getElementById('appointmentsBody');
    var form = document.getElementById('appointmentForm');
    var artistSelect = document.getElementById('artist');
    var dateInput = document.getElementById('date');
    var tattooTypeSelect = document.getElementById('tattooType');

    // Hinahanap ang file input kahit ano ang id
    var fileInput =
        document.getElementById('reference') ||
        (form ? form.querySelector('input[type="file"]') : null);

    // ==================================================
    // HELPERS
    // ==================================================

    function escapeHtml(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function toInputDate(value) {
        var parsed = new Date(value);

        if (isNaN(parsed.getTime())) {
            return '';
        }

        var month = String(parsed.getMonth() + 1).padStart(2, '0');
        var day = String(parsed.getDate()).padStart(2, '0');

        return parsed.getFullYear() + '-' + month + '-' + day;
    }

    function formatDate(value) {
        var parsed = new Date(value);

        return isNaN(parsed.getTime())
            ? 'N/A'
            : parsed.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
    }

    function request(url, options) {
        var opts = options || {};
        opts.credentials = 'same-origin';

        return fetch(url, opts).then(function (response) {
            if (response.status === 401 || response.status === 403) {
                window.location.href = '/login';
                return null;
            }

            return response.text().then(function (body) {
                try {
                    return JSON.parse(body);
                } catch (e) {
                    console.error('Non-JSON response from ' + url +
                        ' (HTTP ' + response.status + '):', body.slice(0, 500));

                    return {
                        success: false,
                        message: 'Server error (HTTP ' + response.status + ') on ' + url + '.'
                    };
                }
            });
        });
    }

    // ==================================================
    // ARTIST OPTIONS + MIN DATE
    // ==================================================

    if (artistSelect && !artistSelect.options.length) {
        artistSelect.innerHTML = ARTISTS.map(function (name) {
            return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
        }).join('');
    }

    if (dateInput) {
        dateInput.min = toInputDate(new Date());
    }

    // ==================================================
    // REFERENCE PHOTO - napiling design galing sa /photos
    // Kusang ginagawa ang UI, walang kailangang baguhin sa EJS.
    // ==================================================

    var chosenBox = null;
    var chosenImage = null;
    var chosenName = null;
    var referenceUrlInput = null;

    function injectStyles() {
        if (document.getElementById('chosenDesignStyles')) {
            return;
        }

        var style = document.createElement('style');
        style.id = 'chosenDesignStyles';

        style.textContent =
            '.chosen-design{display:flex;align-items:center;gap:12px;padding:10px;' +
            'margin-bottom:10px;border:1px solid #ddd;border-radius:8px;background:#fafafa}' +
            '.chosen-design img{width:64px;height:64px;object-fit:cover;border-radius:6px}' +
            '.chosen-design-info{display:flex;flex-direction:column;flex:1;font-size:13px}' +
            '.chosen-design-remove{border:none;background:transparent;font-size:22px;' +
            'line-height:1;cursor:pointer;color:#c0392b}';

        document.head.appendChild(style);
    }

    function buildChosenUi() {
        if (chosenBox || !form) {
            return;
        }

        injectStyles();

        // Hidden input na ipinapadala sa server
        referenceUrlInput = document.getElementById('referenceUrl');

        if (!referenceUrlInput) {
            referenceUrlInput = document.createElement('input');
            referenceUrlInput.type = 'hidden';
            referenceUrlInput.id = 'referenceUrl';
            referenceUrlInput.name = 'referenceUrl';
            form.appendChild(referenceUrlInput);
        }

        chosenBox = document.createElement('div');
        chosenBox.id = 'chosenDesign';
        chosenBox.className = 'chosen-design';
        chosenBox.style.display = 'none';

        chosenBox.innerHTML =
            '<img id="chosenDesignImage" src="" alt="Selected design">' +
            '<div class="chosen-design-info">' +
                '<strong id="chosenDesignName"></strong>' +
                '<small>Selected from Photos Gallery</small>' +
            '</div>' +
            '<button type="button" id="clearChosenDesign" class="chosen-design-remove">&times;</button>';

        // Ilalagay sa itaas mismo ng file input; kung wala, sa dulo ng form
        if (fileInput && fileInput.parentNode) {
            fileInput.parentNode.insertBefore(chosenBox, fileInput);
        } else {
            form.appendChild(chosenBox);
        }

        chosenImage = document.getElementById('chosenDesignImage');
        chosenName = document.getElementById('chosenDesignName');

        document.getElementById('clearChosenDesign')
            .addEventListener('click', clearChosenDesign);
    }

    function showChosenDesign(title, image) {
        buildChosenUi();

        if (!chosenBox) {
            return;
        }

        referenceUrlInput.value = image;
        chosenImage.src = image;
        chosenName.textContent = title || 'Selected design';
        chosenBox.style.display = 'flex';

        if (fileInput) {
            fileInput.value = '';
        }

        // Itugma ang service sa design kung may ganoong option
        if (tattooTypeSelect && title) {
            for (var i = 0; i < tattooTypeSelect.options.length; i++) {
                if (tattooTypeSelect.options[i].value.toLowerCase() === title.toLowerCase()) {
                    tattooTypeSelect.selectedIndex = i;
                    break;
                }
            }
        }
    }

    function clearChosenDesign() {
        if (referenceUrlInput) {
            referenceUrlInput.value = '';
        }

        if (chosenBox) {
            chosenBox.style.display = 'none';
        }

        if (chosenImage) {
            chosenImage.src = '';
        }
    }

    // Kung mag-a-upload ng sariling larawan, iyon ang mananaig
    if (fileInput) {
        fileInput.addEventListener('change', function () {
            if (fileInput.files && fileInput.files.length) {
                clearChosenDesign();
            }
        });
    }

    function openBookingModal() {
        if (typeof window.openAppointmentModal === 'function') {
            window.openAppointmentModal();
            return;
        }

        // Fallback: hanapin ang modal na naglalaman ng form
        var modal = document.getElementById('appointmentModal');

        if (!modal && form) {
            modal = form.closest('.modal');
        }

        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active', 'show');
        }
    }

    (function applyDesignFromUrl() {
        var params = new URLSearchParams(window.location.search);
        var image = params.get('image');

        if (!image) {
            return;
        }

        showChosenDesign(params.get('design') || '', image);
        openBookingModal();
    })();

    // ==================================================
    // MY APPOINTMENTS
    // ==================================================

    function render(appointments) {
        if (!tableBody) {
            return;
        }

        if (!appointments.length) {
            tableBody.innerHTML =
                '<tr><td colspan="5" style="text-align:center;">No appointments yet.</td></tr>';
            return;
        }

        tableBody.innerHTML = appointments.map(function (a) {
            var status = a.status || 'Pending';

            return '<tr>' +
                '<td>' + escapeHtml(a.artist) + '</td>' +
                '<td>' + formatDate(a.date) + '</td>' +
                '<td>' + escapeHtml(a.time) + '</td>' +
                '<td>' + escapeHtml(a.tattooType) + '</td>' +
                '<td><span class="status status-' + status.toLowerCase() + '">' +
                    escapeHtml(status) +
                '</span></td>' +
            '</tr>';
        }).join('');
    }

    function load() {
        return request('/api/appointments')
            .then(function (data) {
                if (!data) {
                    return;
                }

                if (data.success) {
                    render(data.appointments || []);
                } else {
                    console.error(data.message);
                }
            })
            .catch(function (error) {
                console.error('Error loading appointments:', error);
            });
    }

    // ==================================================
    // BOOKING
    // FormData - para talagang naipapadala ang reference photo.
    // Huwag maglagay ng Content-Type header, awtomatiko iyon.
    // ==================================================

    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var submitButton = form.querySelector('button[type="submit"]');

            if (submitButton) {
                submitButton.disabled = true;
            }

            fetch('/api/appointments', {
                method: 'POST',
                credentials: 'same-origin',
                body: new FormData(form)
            })
                .then(function (response) {
                    if (response.status === 401 || response.status === 403) {
                        window.location.href = '/login';
                        return null;
                    }

                    return response.json();
                })
                .then(function (data) {
                    if (submitButton) {
                        submitButton.disabled = false;
                    }

                    if (!data) {
                        return;
                    }

                    if (!data.success) {
                        alert(data.message || 'Booking failed. Please try again.');
                        return;
                    }

                    form.reset();
                    clearChosenDesign();

                    if (typeof window.closeAppointmentModal === 'function') {
                        window.closeAppointmentModal();
                    }

                    alert('Appointment booked! Please wait for the admin to confirm.');
                    load();
                })
                .catch(function (error) {
                    console.error('Error booking appointment:', error);

                    if (submitButton) {
                        submitButton.disabled = false;
                    }

                    alert('An error occurred. Please try again.');
                });
        });
    }

    // ==================================================
    // INIT
    // ==================================================

    load();
    setInterval(load, REFRESH_MS);

    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            load();
        }
    });
});
