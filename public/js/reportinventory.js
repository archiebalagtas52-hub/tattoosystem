// public/js/reportInventory.js
//
// Inventory Management section ng Reports & Records page - read only.
// Hiwalay na file para walang away sa /js/report.js.
//
//     GET /api/inventory

document.addEventListener('DOMContentLoaded', function () {

    var API = '/api/inventory';

    var items = [];

    var tableBody = document.getElementById('inventoryTable');
    var noInventory = document.getElementById('noInventory');

    if (!tableBody) {
        return;
    }

    // ==================================================
    // HELPERS - kapareho ng nasa report.js
    // ==================================================

    function escapeHtml(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function setText(id, value) {
        var el = document.getElementById(id);

        if (el) {
            el.textContent = value;
        }
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

    function stockStatus(item) {
        var qty = Number(item.quantity) || 0;
        var reorder = Number(item.reorderLevel) || 0;

        if (qty <= 0) {
            return 'Out of Stock';
        }

        if (qty <= reorder) {
            return 'Low Stock';
        }

        return 'In Stock';
    }

    function statusClass(status) {
        if (status === 'Out of Stock') {
            return 'status-out';
        }

        if (status === 'Low Stock') {
            return 'status-low';
        }

        return 'status-in';
    }

    // ==================================================
    // RENDER
    // ==================================================

    function renderSummary() {
        var inStock = 0;
        var lowStock = 0;
        var outOfStock = 0;

        items.forEach(function (item) {
            var status = stockStatus(item);

            if (status === 'In Stock') {
                inStock += 1;
            } else if (status === 'Low Stock') {
                lowStock += 1;
            } else {
                outOfStock += 1;
            }
        });

        setText('totalItems', items.length);
        setText('inStockItems', inStock);
        setText('lowStockItems', lowStock);
        setText('outOfStockItems', outOfStock);
    }

    function renderItems() {
        if (noInventory) {
            noInventory.style.display = items.length ? 'none' : 'block';
        }

        tableBody.innerHTML = items.map(function (item) {
            var status = stockStatus(item);

            return '<tr>' +
                '<td>' + escapeHtml(item.name) + '</td>' +
                '<td>' + escapeHtml(item.category) + '</td>' +
                '<td>' + (Number(item.quantity) || 0) + '</td>' +
                '<td>' + escapeHtml(item.unit || 'pcs') + '</td>' +
                '<td>' + (Number(item.reorderLevel) || 0) + '</td>' +
                '<td><span class="stock-badge ' + statusClass(status) + '">' +
                    status + '</span></td>' +
            '</tr>';
        }).join('');
    }

    function renderAll() {
        renderSummary();
        renderItems();
    }

    // ==================================================
    // LOAD
    // ==================================================

    function load() {
        return request(API)
            .then(function (data) {
                if (!data) {
                    return;
                }

                if (data.success === false) {
                    console.error(data.message);

                    if (noInventory) {
                        noInventory.textContent = data.message ||
                            'Failed to load inventory.';
                        noInventory.style.display = 'block';
                    }

                    return;
                }

                items = data.items || data.inventory ||
                    (Array.isArray(data) ? data : []);

                renderAll();
            })
            .catch(function (error) {
                console.error('Error loading inventory:', error);
            });
    }

    // Kapag na-Completed ang appointment, nagbawas ng stock ang server -
    // i-refresh ang table at counters.
    document.addEventListener('appointment:completed', load);

    // ==================================================
    // INIT
    // ==================================================

    load();
});
