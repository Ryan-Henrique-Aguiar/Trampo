import { $, browser } from '@wdio/globals'
import Page from './page.js'

class TicketPage extends Page {
    get heading () { return $('h2=Solicitar serviço') }
    get titleInput () { return $('input[formcontrolname="title"]') }
    get descriptionInput () { return $('textarea[formcontrolname="description"]') }
    get categorySelect () { return $('select[formcontrolname="categoryId"]') }
    get zipCodeInput () { return $('input[formcontrolname="zipCode"]') }
    get stateSelect () { return $('select[formcontrolname="state"]') }
    get citySelect () { return $('select[formcontrolname="city"]') }
    get neighborhoodInput () { return $('input[formcontrolname="neighborhood"]') }
    get streetInput () { return $('input[formcontrolname="street"]') }
    get numberInput () { return $('input[formcontrolname="number"]') }
    get cepLoadingHint () { return $('span.field-hint=Buscando endereço...') }
    get complementInput () { return $('input[formcontrolname="complement"]') }
    get priceInput () { return $('input[formcontrolname="priceMax"]') }
    get imageInput () { return $('#ticket-images') }
    get nextButton () { return $('button.btn-next') }
    get backButton () { return $('button.btn-back') }
    get submitButton () { return $('button.btn-submit') }
    get modal () { return $('.modal') }
    get titleError () { return $('.field-error') }
    get basicErrors () { return $$('.field-error') }
    get cepError () { return $('.field-error=CEP deve ter 8 dígitos') }
    get zipCodeError () { return $('.field-error=CEP deve ter 8 dígitos') }
    get numberRequiredError () { return $('.field-error=Número é obrigatório.') }
    get priceMinimumError () { return $('.field-error=O orçamento máximo deve ser maior que zero.') }
    get selectedImages () { return $$('.selected-image') }
    get stepLabel () { return $('.step-label.active') }

    async openHome () {
        await browser.url('/home')
        await $('button.action-card:first-child').waitForDisplayed()
    }

    async openForNewTicket () {
        await $('button.action-card:first-child').click()
        await this.heading.waitForDisplayed()
    }

    async fillBasic (title = `Teste automatizado ${Date.now()}`) {
        await this.titleInput.setValue(title)
        await this.descriptionInput.setValue('Descrição detalhada para validar a solicitação de serviço pelo fluxo automatizado.')
        await this.waitForCategories()
        await this.categorySelect.selectByIndex(1)
        await browser.keys('Escape')
        return title
    }

    async waitForCategories () {
        await this.categorySelect.waitForExist()
        await browser.waitUntil(async () => (await this.categorySelect.$$('option')).length > 1)
    }

    async fillAddressFromCep () {
        await this.zipCodeInput.setValue('123')
        await this.zipCodeInput.click()
        await this.nextButton.click()
        await this.cepError.waitForDisplayed().catch(() => {})
        await this.zipCodeInput.setValue('37540000')
        await this.zipCodeInput.click()
        await browser.keys('ESCAPE')
        await this.citySelect.waitForEnabled()
        await this.streetInput.waitForEnabled()
        await this.neighborhoodInput.waitForEnabled()
    }

    async fillAddressManually () {
        await this.fillAddressFieldsManually()
        await this.zipCodeInput.setValue('0')
        await this.zipCodeInput.clearValue()
    }

    async fillAddressFieldsManually () {
        if ((await this.stateSelect.getValue()) === 'MG' && !(await this.citySelect.isEnabled())) {
            await this.stateSelect.selectByAttribute('value', 'SP')
            await this.citySelect.waitForEnabled()
        }
        await this.stateSelect.selectByAttribute('value', 'MG')
        await this.citySelect.waitForEnabled()
        const cities = await this.citySelect.$$('option')
        for (const city of cities) {
            const name = await city.getText()
            if (name.trim() && !name.includes('Selecione')) {
                await this.citySelect.selectByVisibleText(name)
                break
            }
        }
        await this.neighborhoodInput.setValue('Centro')
        await this.streetInput.setValue('Rua de Teste')
        await this.numberInput.setValue('123')
    }

    async fillValidCep (cep = '37540000') {
        await this.zipCodeInput.setValue(cep)
        await this.numberInput.click()
    }

    async selectState (state) {
        await this.stateSelect.selectByAttribute('value', state)
        await this.citySelect.waitForEnabled()
    }

    async waitForStates () {
        await browser.waitUntil(async () => (await this.stateSelect.$$('option')).length > 1)
    }

    async selectCity (city) {
        await this.citySelect.selectByVisibleText(city)
    }

    async errorTexts () {
        return $$('.field-error').map(error => error.getText())
    }

    async continueToAddress () { await this.nextButton.click() }
    async continueToDetails () {
        await this.nextButton.scrollIntoView()
        await this.nextButton.click()
    }
    async continueToPhotos () {
        await this.nextButton.scrollIntoView()
        await this.nextButton.click()
        await this.imageInput.waitForExist()
    }

    async fillDetails () {
        await this.priceInput.setValue('250')
        await $('button.chip=Pix').click()
        const daySelect = $('ng-select[formcontrolname="availableDays"]')
        await daySelect.click()
        const dayOption = $('div.ng-option=Segunda')
        await dayOption.waitForDisplayed()
        await browser.execute(option => option.click(), await dayOption)
        await browser.keys('Escape')
        const hourSelect = $('ng-select[formcontrolname="availableHours"]')
        await hourSelect.click()
        const hourOption = $('div.ng-option=06:00')
        await hourOption.waitForDisplayed()
        await browser.execute(option => option.click(), await hourOption)
        await browser.keys('Escape')
    }

    async detailControlClasses () {
        const paymentClass = await $('button.chip=Pix').getAttribute('class')
        const daysClass = await $('ng-select[formcontrolname="availableDays"]').getAttribute('class')
        const hoursClass = await $('ng-select[formcontrolname="availableHours"]').getAttribute('class')
        const formClass = await $('form').getAttribute('class')
        return { paymentClass, daysClass, hoursClass, formClass }
    }

    async revealImageInput () {
        await this.imageInput.waitForExist()
        await browser.execute(input => {
            input.style.display = 'block'
        }, await this.imageInput)
    }

    async submit () {
        await this.submitButton.scrollIntoView()
        await this.submitButton.click()
    }
}

export default new TicketPage()
