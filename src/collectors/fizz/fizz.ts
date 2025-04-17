import { ScrapperCollector } from '../scrapperCollector';
import { FizzSelectors } from './selectors';  // Fizz-specific selectors
import { Driver } from '../../driver/driver';
import { DownloadedInvoice, Invoice } from '../abstractCollector';
import { timeStamp } from 'console';


export class FizzCollector extends ScrapperCollector {

    static CONFIG = {
        name: "Fizz",
        description: "i18n.collectors.fizz.description",
        version: "1",
        website: "https://zone.fizz.ca",
        logo: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Fizz_logo.svg",
        params: {
            id: {
                name: "i18n.collectors.all.email_or_number",
                placeholder: "i18n.collectors.all.email_or_number.placeholder",
                mandatory: true
            },
            password: {
                name: "i18n.collectors.all.password",
                placeholder: "i18n.collectors.all.password.placeholder",
                mandatory: true,
            }
        },
        entryUrl: "https://zone.fizz.ca/dce/customer-ui-prod/wallet/payment-history",
        useProxy: false
    }

    constructor() {
        super(FizzCollector.CONFIG);
    }

    async login(driver: Driver, params: any): Promise<string | void> {
        await driver.wait_for_element(FizzSelectors.FIELD_EMAIL, true);
        await driver.input_text(FizzSelectors.FIELD_EMAIL, params.id);
        await driver.input_text(FizzSelectors.FIELD_PASSWORD, params.password);
        await driver.left_click(FizzSelectors.BUTTON_SUBMIT);
    
        // ToDo: Check if the password is incorrect
        /*
        const password_alert = await driver.wait_for_element(FizzSelectors.CONTAINER_PASSWORD_ALERT, false, 2000);
        if (password_alert) {
            return await password_alert.evaluate(e => e.textContent) || "i18n.collectors.all.password.error";
        }
        */
        
    }

 async collect(driver: Driver, params: any): Promise<Invoice[]> {
         const invoiceElements  = await driver.get_all_elements(FizzSelectors.CONTAINER_INVOICE, false, 5000);
         const invoices: Invoice[] = []; // Initialize an empty array to collect results


         for (const invoice of invoiceElements) {
            const date_string = await invoice.get_attribute(FizzSelectors.INVOICE_DATE, "textContent");
            const amountText = await invoice.get_attribute(FizzSelectors.INVOICE_AMOUNT, "textContent");
            const amount = amountText.replace(/[^\d.,]/g, '');
            
            const dynamicDateSelector = {
                selector: `::-p-text(${date_string})`,
                info: 'dynamic date click selector'
            };
            console.log(dynamicDateSelector.selector);
            // Click the date link
            await driver.left_click(dynamicDateSelector, { raise_exception: false, timeout: 5000 });
        
            // Get the ID
            const ID = await driver.get_all_attributes(FizzSelectors.INVOICE_ID, "textContent", false, 5000);
        
            // Click the close button
            await driver.left_click(FizzSelectors.BUTTON_CLOSE, { raise_exception: false, timeout: 5000 });
        
            // Process the date for timestamp
            const year = parseInt(date_string.slice(0, 4));
            const month = parseInt(date_string.slice(4, 6)) - 1; // Months in JavaScript are indexed from 0 to 11
            const timestamp = Date.UTC(year, month);
        
            // Log values
            console.log(ID[0]);
            console.log(timestamp);
            console.log(date_string);
            console.log(amount);
        
            // Return the result for each invoice
            invoices.push({
                id: ID[0],
                timestamp,
                link: date_string,
                amount
            });
            
        }
        return invoices;


         /*
         for (const invoiceElement of invoiceElements) {

            const { date, amount } = await invoiceElement.element.evaluate((row) => {
                const cells = row.querySelectorAll('td');
                const dateText = cells[0]?.textContent?.trim() || '';
                const amountText = cells[5]?.textContent?.trim() || '';
                return {
                  date: dateText,
                  amount: amountText.replace(/[^\d.,]/g, '') // Removes currency symbols and spaces
                };
            });
            console.log(date);
            console.log(amount);
            await driver.left_click(`::-p-text(${date})`, { raise_exception: false, timeout: 5000 });
            //await driver.left_click(FizzSelectors.BUTTON_DOWNLOAD, { raise_exception: false, timeout: 5000 });
            await driver.left_click(FizzSelectors.BUTTON_CLOSE, { raise_exception: false, timeout: 5000 });
            
          }
          */
         
        /* return await Promise.all(invoiceElements.map(async invoice => {
             const date_string = await invoice.get_attribute(FizzSelectors.INVOICE_DATE, "textContent");
             const amountText = await invoice.get_attribute(FizzSelectors.INVOICE_AMOUNT, "textContent");
             const amount = amountText.replace(/[^\d.,]/g, '')
             

             await driver.left_click(`::-p-text(${date_string})`, { raise_exception: false, timeout: 5000 });
             
             const ID =  await driver.get_all_attributes(FizzSelectors.INVOICE_ID, "textContent", false, 5000);

             await driver.left_click(FizzSelectors.BUTTON_CLOSE, { raise_exception: false, timeout: 5000 });
             
             //const amount = await invoice.get_attribute(FizzSelectors.CONTAINER_AMOUNT, "textContent");
             const year = parseInt(date_string.slice(0, 4));
             const month = parseInt(date_string.slice(4, 6)) - 1; // Months in JavaScript are indexed from 0 to 11
             const timestamp = Date.UTC(year, month);

            console.log(ID[0]);
             console.log(timestamp);
                console.log(date_string);
                console.log(amount);
             return {
                 id: ID[0],
                 timestamp,
                 link: date_string,
                 amount
             };
         }));*/
     }
    

    async download(driver: Driver, invoice: Invoice): Promise<DownloadedInvoice> {
        
        const dynamicDateSelector = {
            selector: `::-p-text(${invoice.link})`,
            info: 'dynamic date click selector'
        };

        await driver.left_click(dynamicDateSelector, { raise_exception: false, timeout: 5000 });
        await driver.left_click(FizzSelectors.BUTTON_DOWNLOAD, { raise_exception: false, timeout: 5000 })
        await driver.left_click(FizzSelectors.BUTTON_CLOSE, { raise_exception: false, timeout: 5000 });
        return await this.download_from_file(driver, invoice);
        
    }
}
