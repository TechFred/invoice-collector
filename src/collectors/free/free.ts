import { ScrapperCollector } from '../scrapperCollector';
import { FreeSelectors } from './selectors';
import { Driver } from '../../driver';

export class FreeCollector extends ScrapperCollector {

    static CONFIG = {
        name: "Free",
        description: "i18n.collectors.free.description",
        version: "1",
        website: "https://www.free.fr",
        logo: "https://www.free.fr/assets/img/freebox/home/cards/logos/free-app-logo.svg",
        params: {
            username: {
                name: "i18n.collectors.all.identifier",
                placeholder: "i18n.collectors.free.identifier.placeholder",
                mandatory: true
            },
            password: {
                name: "i18n.collectors.all.password",
                placeholder: "i18n.collectors.all.password.placeholder",
                mandatory: true,
            }
        },
        entry_url: "https://subscribe.free.fr/login/"
    }

    constructor() {
        super(FreeCollector.CONFIG);
    }

    async login(driver: Driver, params: any): Promise<string | void> {
        await driver.input_text(FreeSelectors.FIELD_USERNAME, params.username);
        await driver.input_text(FreeSelectors.FIELD_PASSWORD, params.password);
        await driver.left_click(FreeSelectors.BUTTON_SUBMIT);

        // Check if login alert exists
        const login_alert = await driver.wait_for_element(FreeSelectors.CONTAINER_LOGIN_ALERT, false, 2000)
        if (login_alert) {
            return await login_alert.evaluate(el => el.textContent || "i18n.collectors.all.identifier.error");
        }
    }

    async run(driver: Driver, params: any): Promise<any[]> {
        //Go to invoices
        await driver.left_click(FreeSelectors.BUTTON_INVOICES);

        //Get invoices
        const links = await driver.get_all_attributes(FreeSelectors.BUTTON_DOWNLOAD, "href", false, 5000);

        //Build return array
        return links.map(link => {
            let search_params = new URLSearchParams(link);
            const no_facture = search_params.get("no_facture");
            const date_string = search_params.get("mois");

            let timestamp;
            if (date_string) {
                const year = parseInt(date_string.slice(0, 4));
                const month = parseInt(date_string.slice(4, 6)) - 1; // Months in JavaScript are indexed from 0 to 11
                timestamp = Date.UTC(year, month)
            }
            return {
                id: no_facture,
                type: "link",
                mime: 'application/pdf',
                timestamp: timestamp || null,
                link: link
            };
        });
    }
}
