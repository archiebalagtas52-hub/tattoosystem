// public/js/dashboard.js
// Gallery category dropdowns: each <select class="gallery-select"> swaps the
// <img class="gallery-image"> inside the same <figure>, so the same markup can
// be repeated for as many gallery items as needed.

document.addEventListener('DOMContentLoaded', function () {

    // =============================================
    // FIX FOR INLINE ONCHANGE ATTRIBUTES
    // These functions are called from the HTML's onchange
    // =============================================

    // Function for categorySelect dropdowns (Back Piece and Forearm)
    window.changeImage = function() {
        // Get all categorySelect elements
        var selects = document.querySelectorAll('#categorySelect');
        var images = document.querySelectorAll('#tattooImage');
        
        // Loop through all selects and update corresponding images
        selects.forEach(function(select, index) {
            if (images[index]) {
                var value = select.value;
                if (!value) return;
                
                // Check if value has extension
                if (/\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
                    images[index].src = '/images/' + value;
                } else {
                    images[index].src = '/images/' + value + '.jpg';
                }
            }
        });
    };

    // Function for minimalistSelect dropdowns
    window.changeMinimalistImage = function() {
        // Get all minimalistSelect elements
        var selects = document.querySelectorAll('#minimalistSelect');
        var images = document.querySelectorAll('#minimalistImage');
        
        // Loop through all selects and update corresponding images
        selects.forEach(function(select, index) {
            if (images[index]) {
                var value = select.value;
                if (!value) return;
                
                // Check if value has extension
                if (/\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
                    images[index].src = '/images/' + value;
                } else {
                    images[index].src = '/images/' + value + '.jpg';
                }
            }
        });
    };

    // =============================================
    // ORIGINAL FUNCTIONALITY FOR .gallery-select
    // =============================================

    var selects = document.querySelectorAll('.gallery-select');

    Array.prototype.forEach.call(selects, function (select) {
        var figure = select.closest('.gallery-item');
        var image = figure ? figure.querySelector('.gallery-image') : null;

        if (!image) {
            return;
        }

        function updateImage() {
            var value = select.value;
            if (!value) {
                return;
            }
            image.src = /\.(jpg|jpeg|png|gif|webp)$/i.test(value)
                ? '/images/' + value
                : '/images/' + value + '.jpg';
        }

        select.addEventListener('change', updateImage);
        updateImage();
    });

    // =============================================
    // ADDITIONAL SETUP FOR DROPDOWNS WITH UNIQUE IDs
    // For better control, we also set up event listeners
    // =============================================

    // Setup Back Piece dropdown (first categorySelect)
    var backPieceSelect = document.getElementById('categorySelect');
    var backPieceImage = document.getElementById('tattooImage');
    if (backPieceSelect && backPieceImage) {
        backPieceSelect.addEventListener('change', function() {
            var value = this.value;
            if (!value) return;
            if (/\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
                backPieceImage.src = '/images/' + value;
            } else {
                backPieceImage.src = '/images/' + value + '.jpg';
            }
        });
        // Trigger initial update
        backPieceSelect.dispatchEvent(new Event('change'));
    }

    // Setup Forearm dropdown (second categorySelect)
    // Find the forearm gallery item
    var forearmFigure = null;
    var figures = document.querySelectorAll('.gallery-item');
    figures.forEach(function(figure) {
        var figcaption = figure.querySelector('figcaption');
        if (figcaption && figcaption.textContent.includes('Fore Arm')) {
            forearmFigure = figure;
        }
    });
    
    if (forearmFigure) {
        var forearmSelect = forearmFigure.querySelector('#categorySelect');
        var forearmImage = forearmFigure.querySelector('#tattooImage');
        if (forearmSelect && forearmImage) {
            forearmSelect.addEventListener('change', function() {
                var value = this.value;
                if (!value) return;
                if (/\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
                    forearmImage.src = '/images/' + value;
                } else {
                    forearmImage.src = '/images/' + value + '.jpg';
                }
            });
            // Trigger initial update
            forearmSelect.dispatchEvent(new Event('change'));
        }
    }

    // Setup Minimalist dropdowns
    var minimalistSelects = document.querySelectorAll('#minimalistSelect');
    var minimalistImages = document.querySelectorAll('#minimalistImage');
    minimalistSelects.forEach(function(select, index) {
        if (minimalistImages[index]) {
            select.addEventListener('change', function() {
                var value = this.value;
                if (!value) return;
                if (/\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
                    minimalistImages[index].src = '/images/' + value;
                } else {
                    minimalistImages[index].src = '/images/' + value + '.jpg';
                }
            });
            // Trigger initial update
            select.dispatchEvent(new Event('change'));
        }
    });

});