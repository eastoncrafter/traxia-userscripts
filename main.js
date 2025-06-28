// ==UserScript==
// @name         Traxia Intercept Discount Barcode
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Intercept discount barcode before it's processed as a product
// @match        https://user.traxia.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const DISCOUNT_BARCODE = "DISCOUNT20";   // Replace with your actual barcode
    const DISCOUNT_PERCENT = 20;             // Adjust your discount percent here

    const scanInputSelector = '#sellInput';
    const discountInputSelector = 'input[name="transactionDiscountPercent"]';

    function setupInterception() {
        const scanInput = document.querySelector(scanInputSelector);
        const discountInput = document.querySelector(discountInputSelector);

        if (!scanInput || !discountInput) return;

        scanInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                const scannedValue = scanInput.value.trim();

                if (scannedValue === DISCOUNT_BARCODE) {
                    event.preventDefault(); // Block Traxia from processing the scan
                    event.stopPropagation();

                    // Apply the discount
                    discountInput.value = DISCOUNT_PERCENT.toString();
                    discountInput.dispatchEvent(new Event('change', { bubbles: true }));

                    // Clear the scan field
                    scanInput.value = '';
                }
            }
        }, true); // Use capture to intercept before default behavior
    }

    const interval = setInterval(() => {
        if (document.querySelector(scanInputSelector) && document.querySelector(discountInputSelector)) {
            clearInterval(interval);
            setupInterception();
        }
    }, 500);
})();
