import { $, $$ } from '@wdio/globals'

class HomePage {
    get requestServiceButton () { return $('button.action-card:first-child') }
    get publishedServicesHeading () { return $('h2=Meus serviços ativos recentes') }
    get publishedServiceTitles () { return $$('app-ticket-card .ticket-title') }

    async countServicesWithTitle (title) {
        const titles = await this.publishedServiceTitles
        let count = 0
        for (const element of titles) {
            if ((await element.getText()).trim() === title) count++
        }
        return count
    }
}

export default new HomePage()
