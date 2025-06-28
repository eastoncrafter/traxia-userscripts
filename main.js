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

/** Action: complete checkout and send to EMV device */
    function checkoutWithCreditCard() {
        // Step 1: Click "Complete Transaction"
        safeClick('#checkout_complete_transaction_button');
    
        // Step 2: Wait for "Add Credit Card" button in dialog
        const tryClickAddCard = () => {
            const addCardBtn = document.querySelector('button.gwt-Button-Icon-Credit-Card');
            if (addCardBtn) {
                addCardBtn.click();
    
                // Step 3: After clicking "Add Credit Card", wait for "Send to EMV Device"
                setTimeout(() => {
                    const tryClickSendToEMV = () => {
                        const sendBtn = document.querySelector('button.gwt-Button-Icon-Cloud-Upload');
                        if (sendBtn) {
                            sendBtn.click();
                        } else {
                            setTimeout(tryClickSendToEMV, 300);
                        }
                    };
                    tryClickSendToEMV();
                }, 800); // Slight delay to allow EMV dialog to appear
            } else {
                setTimeout(tryClickAddCard, 300);
            }
        };
    
        // Start checking for Add Credit Card shortly after pressing "Complete Transaction"
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
