// ==UserScript==
// @name         Traxia Modular Barcode Handler
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Handle barcode-triggered actions like discounts and checkout
// @match        https://user.traxia.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const scanInputSelector = '#sellInput';
    const discountInputSelector = 'input[name="transactionDiscountPercent"]';

    /** Map barcodes to handler functions */
    const barcodeActions = {
        'DISCOUNT20': () => applyDiscount(20),
        'CHECKOUTCC': checkoutWithCreditCard,
        // Add more barcodes here as needed
    };

    /** Utility: safely click a button */
    function safeClick(selector, delay = 0) {
        const button = document.querySelector(selector);
        if (button) {
            setTimeout(() => button.click(), delay);
        } else {
            console.warn(`Button not found: ${selector}`);
        }
    }

    /** Action: apply a percent discount */
    function applyDiscount(percent) {
        const discountInput = document.querySelector(discountInputSelector);
        if (discountInput) {
            discountInput.value = percent.toString();
            discountInput.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            console.warn("Discount input not found");
        }
    }

    /** Action: click Complete Transaction and select Credit Card */
    function checkoutWithCreditCard() {
        // Step 1: Click "Complete Transaction"
        safeClick('#checkout_complete_transaction_button');

        // Step 2: Wait for dialog and click "Add Credit Card"
        const tryClickAddCard = () => {
            const addCardBtn = document.querySelector('button.gwt-Button-Icon-Credit-Card');
            if (addCardBtn) {
                addCardBtn.click();
            } else {
                // Retry after a short delay if not ready yet
                setTimeout(tryClickAddCard, 300);
            }
        };

        // Start checking for the credit card button shortly after clicking Complete
        setTimeout(tryClickAddCard, 800);
    }

    /** Set up scan listener */
    function setupBarcodeListener() {
        const scanInput = document.querySelector(scanInputSelector);
        if (!scanInput) return;

        scanInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                const scannedValue = scanInput.value.trim();
                if (barcodeActions[scannedValue]) {
                    event.preventDefault();
                    event.stopPropagation();

                    // Run the associated action
                    barcodeActions[scannedValue]();

                    // Clear input field after handling
                    scanInput.value = '';
                }
            }
        }, true); // Use capture to beat native handlers
    }

    /** Wait until required DOM elements exist */
    const waitForElements = setInterval(() => {
        if (document.querySelector(scanInputSelector)) {
            clearInterval(waitForElements);
            setupBarcodeListener();
        }
    }, 500);
})();
