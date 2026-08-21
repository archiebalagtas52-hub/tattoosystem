// public/js/dashboard.js

(function () {

    function imageUrl(value) {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(value)
            ? '/images/' + value
            : '/images/' + value + '.jpg';
    }

    function swap(selectId, imageId) {
        var select = document.getElementById(selectId);
        var image = document.getElementById(imageId);

        if (!select || !image || !select.value) return;

        image.src = imageUrl(select.value);
    }

    var pairs = [
        { select: 'categorySelect', image: 'tattooImage', handler: 'changeImage' },
        { select: 'minimalistSelect', image: 'minimalistImage', handler: 'changeMinimalistImage' },
        { select: 'legsSelect', image: 'legsImage', handler: 'changeLegsImage' },
        { select: 'backPieceSelect', image: 'backPieceImage', handler: 'changeBackPieceImage' }
    ];

    pairs.forEach(function (pair) {
        window[pair.handler] = function () {
            swap(pair.select, pair.image);
        };
    });

    var REFRESH_MS = 30000;

    function peso(value) {
        return '₱' + Number(value || 0).toLocaleString('en-PH');
    }

    function setText(id, text) {
        var element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    function escapeHtml(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatDate(value) {
        var date = new Date(value);

        if (isNaN(date.getTime())) {
            return 'N/A';
        }

        return date.toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function statusClass(status) {
        if (status === 'Confirmed') return 'status-badge status-confirmed';
        if (status === 'Completed') return 'status-badge status-completed';
        if (status === 'Cancelled') return 'status-badge status-cancelled';

        return 'status-badge status-pending';
    }

    function summarize(rows) {
        var revenue = rows.reduce(function (sum, a) {
            return sum + (Number(a.amount) || 0);
        }, 0);

        var noShows = rows.filter(function (a) {
            return a.status === 'Cancelled';
        }).length;

        return {
            count: rows.length,
            revenue: revenue,
            average: rows.length
                ? Math.round(revenue / rows.length)
                : 0,
            noShowRate: rows.length
                ? Math.round((noShows / rows.length) * 100)
                : 0
        };
    }

    function renderStats(stats) {
        setText(
            'totalAppointments',
            Number(stats.count || 0).toLocaleString()
        );

        setText(
            'totalRevenue',
            peso(stats.revenue)
        );

        setText(
            'avgBookingValue',
            peso(stats.average)
        );

        setText(
            'noShowRate',
            (stats.noShowRate || 0) + '%'
        );
    }

    // FIX: Booking Insight
    function renderBookingInsight(rows) {
        var element = document.getElementById('bookingInsight');

        if (!element) {
            return;
        }

        if (!rows.length) {
            element.textContent = 'No booking data available.';
            return;
        }

        var confirmed = rows.filter(function (a) {
            return a.status === 'Confirmed';
        }).length;

        var completed = rows.filter(function (a) {
            return a.status === 'Completed';
        }).length;

        var cancelled = rows.filter(function (a) {
            return a.status === 'Cancelled';
        }).length;

        var pending = rows.filter(function (a) {
            return a.status === 'Pending';
        }).length;

        element.innerHTML =
            '<div class="insight-item">' +
                '<strong>Total Bookings</strong>' +
                '<span>' + rows.length + '</span>' +
            '</div>' +

            '<div class="insight-item">' +
                '<strong>Confirmed</strong>' +
                '<span>' + confirmed + '</span>' +
            '</div>' +

            '<div class="insight-item">' +
                '<strong>Completed</strong>' +
                '<span>' + completed + '</span>' +
            '</div>' +

            '<div class="insight-item">' +
                '<strong>Pending</strong>' +
                '<span>' + pending + '</span>' +
            '</div>' +

            '<div class="insight-item">' +
                '<strong>Cancelled</strong>' +
                '<span>' + cancelled + '</span>' +
            '</div>';
    }

    function renderUpcoming(rows) {
        var tbody = document.querySelector('.appointments-table tbody');

        if (!tbody) return;

        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var upcoming = rows
            .filter(function (a) {
                var appointmentDate = new Date(a.date);

                return appointmentDate >= today &&
                    a.status !== 'Cancelled';
            })
            .sort(function (a, b) {
                return new Date(a.date) - new Date(b.date);
            })
            .slice(0, 5);

        if (!upcoming.length) {
            tbody.innerHTML =
                '<tr>' +
                    '<td colspan="5" class="no-records">' +
                        'No upcoming appointments' +
                    '</td>' +
                '</tr>';

            return;
        }

        tbody.innerHTML = upcoming.map(function (a) {
            var cls = statusClass(a.status);

            return '<tr>' +
                '<td>' +
                    escapeHtml(a.clientName || 'N/A') +
                '</td>' +

                '<td>' +
                    formatDate(a.date) +
                '</td>' +

                '<td>' +
                    escapeHtml(a.time || 'N/A') +
                '</td>' +

                '<td>' +
                    escapeHtml(a.tattooType || 'N/A') +
                '</td>' +

                '<td>' +
                    '<span class="' + cls + '">' +
                        escapeHtml(a.status || 'Pending') +
                    '</span>' +
                '</td>' +

            '</tr>';
        }).join('');
    }

    function refreshDashboard() {
        fetch('/api/appointments/admin/all', {
            credentials: 'same-origin'
        })
        .then(function (response) {
            if (!response.ok) {
                throw new Error(
                    'Failed to fetch appointments: ' +
                    response.status
                );
            }

            return response.json();
        })
        .then(function (payload) {

            if (!payload || !Array.isArray(payload.appointments)) {
                console.error(
                    'Invalid API response:',
                    payload
                );
                return;
            }

            var rows = payload.appointments;

            var stats = summarize(rows);

            renderStats(stats);

            renderUpcoming(rows);

            // IMPORTANT FIX
            renderBookingInsight(rows);
        })
        .catch(function (error) {
            console.error(
                'Dashboard refresh error:',
                error
            );
        });
    }

    document.addEventListener('DOMContentLoaded', function () {

        if (document.getElementById('totalAppointments')) {
            refreshDashboard();

            setInterval(
                refreshDashboard,
                REFRESH_MS
            );
        }

        pairs.forEach(function (pair) {
            var select = document.getElementById(pair.select);

            if (select) {
                select.addEventListener(
                    'change',
                    window[pair.handler]
                );
            }
        });

        var gallerySelects =
            document.querySelectorAll('.gallery-select');

        Array.prototype.forEach.call(
            gallerySelects,
            function (select) {

                var figure =
                    select.closest('.gallery-item');

                var image =
                    figure
                        ? figure.querySelector('.gallery-image')
                        : null;

                if (!image) return;

                function updateImage() {
                    if (select.value) {
                        image.src =
                            imageUrl(select.value);
                    }
                }

                select.addEventListener(
                    'change',
                    updateImage
                );

                updateImage();
            }
        );

    });

})();