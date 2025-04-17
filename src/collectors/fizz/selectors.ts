export const FizzSelectors = {
   
  // Login page 
    FIELD_EMAIL: {
        selector: 'input[name="identifier"]',
        info: 'email input field'
    },
    FIELD_PASSWORD: {
        selector: 'input[name="credentials.passcode"]',
        info: 'password input field'
    },
    BUTTON_SUBMIT: {
        selector: 'input[type="submit"]',
        info: 'submit login button'
    },
    // ToDo
    /* 
    CONTAINER_LOGIN_ALERT: {
        selector: '.login-alert-email',
        info: 'email login alert container'
    },
    CONTAINER_PASSWORD_ALERT: {
        selector: '.login-alert-password',
        info: 'password login alert container'
    },
    */


    BUTTON_DOWNLOAD: {
        selector: '.download-print',
        info: 'download button for invoice'
    },
    BUTTON_CLOSE: {
        selector: '.modal-content > app-receipt:nth-of-type(1) > #summary > .d-flex > button[aria-label="Close"] > .fi',
        info: 'close modal button'
    },
    CONTAINER_INVOICE: {
        selector: 'tr.fs-14',
        info: 'invoice row container'
    },
    INVOICE_DATE: {
        selector: 'td.font-weight-bold.text-black',
        info: 'invoice date field'
    },
    INVOICE_AMOUNT: {
        selector: 'td.d-flex.justify-content-end > div.font-weight-bold',
        info: 'invoice amount field'
    },
    INVOICE_ID: {
        selector: 'div:nth-of-type(4) > .col-print-5 > .pl-2 > div:nth-of-type(3)',
        info: 'receipt number field'
    }
};
